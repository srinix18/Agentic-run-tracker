r"""
Python runner to apply schema and run verification queries against MySQL.
Usage (PowerShell):
  1. Copy `.env.example` to `.env` and set your credentials.
  2. Create a venv and install requirements:
      python -m venv venv
      .\venv\Scripts\Activate.ps1
      pip install -r requirements.txt
  3. Run:
      python run_sql.py --apply

This script uses the credentials from .env and executes the SQL in `schema.sql`.
It will not run unless you supply a valid `.env` file.
"""
import os
import sys
import argparse
from pathlib import Path
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import errorcode
import subprocess
import shutil
import re

BASE = Path(__file__).resolve().parent
SCHEMA_FILE = BASE / 'schema.sql'


def load_env():
    env_path = BASE / '.env'
    if not env_path.exists():
        print(f"No .env file found at {env_path}. Please copy .env.example -> .env and fill credentials.")
        sys.exit(1)
    load_dotenv(env_path)
    cfg = {
        'host': os.getenv('MYSQL_HOST', '127.0.0.1'),
        'port': int(os.getenv('MYSQL_PORT', '3306')),
        'user': os.getenv('MYSQL_USER'),
        'password': os.getenv('MYSQL_PASSWORD'),
        'database': os.getenv('MYSQL_DATABASE'),
        'reset_schema': os.getenv('RESET_SCHEMA', 'NO').upper() in ('1','YES','TRUE','Y')
    }
    if not (cfg['user'] and cfg['password'] and cfg['database']):
        print('Please set MYSQL_USER, MYSQL_PASSWORD and MYSQL_DATABASE in .env')
        sys.exit(1)
    return cfg


def read_sql_file(path: Path) -> str:
    if not path.exists():
        raise FileNotFoundError(f"SQL file not found: {path}")
    return path.read_text(encoding='utf-8')


def execute_sql_script(conn, script: str):
    """Execute a SQL script which may contain multiple statements.

    Tries to use the connector's multi-statement execution. If the
    installed DB driver does not support the ``multi`` kwarg (some
    installations expose a C-based cursor), fall back to calling the
    local `mysql` CLI binary (if available) as a best-effort.
    """
    cursor = conn.cursor()
    try:
        try:
            # Preferred: let the connector handle multi-statement execution
            for result in cursor.execute(script, multi=True):
                if result.with_rows:
                    _ = result.fetchall()
            conn.commit()
            return
        except TypeError:
            # Some cursor implementations (C-based) don't accept multi=True.
            # First fallback: attempt a safe statement-splitter that groups
            # CREATE PROCEDURE/FUNCTION/TRIGGER blocks into single statements
            # and executes them one-by-one.
            def split_statements_sql(script_text: str):
                statements = []
                pos = 0
                length = len(script_text)
                # regex to find routine starts
                routine_re = re.compile(r"\bCREATE\s+(?:PROCEDURE|FUNCTION|TRIGGER)\b", re.IGNORECASE)
                while pos < length:
                    m = routine_re.search(script_text, pos)
                    if not m:
                        # no more routines; split remaining by semicolon
                        tail = script_text[pos:]
                        parts = [p.strip() for p in tail.split(';')]
                        for p in parts:
                            if p:
                                statements.append(p + ';')
                        break
                    # split the non-routine prefix by semicolon
                    prefix = script_text[pos:m.start()]
                    parts = [p.strip() for p in prefix.split(';')]
                    for p in parts:
                        if p:
                            statements.append(p + ';')

                    # find the end of the routine: first occurrence of 'END;'
                    end_match = re.search(r"END\s*;", script_text[m.start():], re.IGNORECASE)
                    if not end_match:
                        # can't find matching END; fall back to appending rest
                        rest = script_text[m.start():].strip()
                        if rest:
                            statements.append(rest)
                        break
                    # end position relative to whole script
                    end_pos = m.start() + end_match.end()
                    routine_stmt = script_text[m.start():end_pos].strip()
                    if routine_stmt:
                        statements.append(routine_stmt)
                    pos = end_pos
                return statements

            stmts = split_statements_sql(script)
            # execute each statement separately
            try:
                for st in stmts:
                    try:
                        cursor.execute(st)
                    except mysql.connector.Error as e:
                        # If a "already exists" error (table/trigger/proc), skip to make re-runs idempotent
                        msg = (getattr(e, 'msg', '') or str(e)).lower()
                        if 'already exists' in msg or e.errno == errorcode.ER_TABLE_EXISTS_ERROR:
                            print(f"Warning: {getattr(e, 'msg', e)} — skipping statement")
                            continue
                        # otherwise try executing with no trailing semicolon
                        try:
                            cursor.execute(st.rstrip(';'))
                        except mysql.connector.Error as e2:
                            msg2 = (getattr(e2, 'msg', '') or str(e2)).lower()
                            if 'already exists' in msg2 or e2.errno == errorcode.ER_TABLE_EXISTS_ERROR:
                                print(f"Warning: {getattr(e2, 'msg', e2)} — skipping statement")
                                continue
                            raise
                    # consume any result rows to avoid "Unread result found"
                    try:
                        if getattr(cursor, 'with_rows', False):
                            _ = cursor.fetchall()
                    except Exception:
                        # ignore fetch errors for statements that don't return rows
                        pass
                conn.commit()
                return
            except Exception as e:
                # if this approach fails, try mysql CLI as a last resort
                mysql_bin = shutil.which('mysql')
                if mysql_bin is None:
                    raise RuntimeError("DB cursor does not support multi=True, and SQL-split fallback failed; mysql CLI not found.") from e

                cmd = [
                    mysql_bin,
                    f"-h{conn.server_host}",
                    f"-P{conn.server_port}",
                    f"-u{conn.user}",
                    conn.database
                ]
                env = os.environ.copy()
                env['MYSQL_PWD'] = conn.password or env.get('MYSQL_PWD', '')
                proc = subprocess.run(cmd, input=script.encode('utf-8'), env=env)
                if proc.returncode != 0:
                    raise RuntimeError(f"mysql CLI returned non-zero exit code: {proc.returncode}")
                return
    finally:
        cursor.close()


def verify(conn):
    cursor = conn.cursor(dictionary=True)
    print('\n-- Verification queries --')
    try:
        cursor.execute('SELECT COUNT(*) AS c FROM `User`')
        print('Users:', cursor.fetchone()['c'])
        cursor.execute('SELECT COUNT(*) AS c FROM `Project`')
        print('Projects:', cursor.fetchone()['c'])
        cursor.execute("SELECT COUNT(*) AS c FROM `Agent`")
        print('Agents:', cursor.fetchone()['c'])
        cursor.execute("SELECT COUNT(*) AS c FROM `Run`")
        print('Runs:', cursor.fetchone()['c'])

        # Example: call stored procedure GetRunsByAgent for agent 1
        try:
            cursor.callproc('GetRunsByAgent', (1,))
            # mysql-connector returns results per result set; we'll print first result set rows
            for res in cursor.stored_results():
                rows = res.fetchall()
                print(f'GetRunsByAgent(1) returned {len(rows)} rows')
                break
        except mysql.connector.Error as e:
            print('Warning: calling GetRunsByAgent failed (maybe procedures not created):', e)

    finally:
        cursor.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true', help='Apply schema.sql to the database')
    parser.add_argument('--dry-run', action='store_true', help='Print the SQL that would be executed')
    args = parser.parse_args()

    cfg = load_env()

    # Connect without specifying database first if RESET_SCHEMA is requested and DB may not exist
    try:
        conn = mysql.connector.connect(
            host=cfg['host'], port=cfg['port'], user=cfg['user'], password=cfg['password'], database=cfg['database']
        )
    except mysql.connector.errors.ProgrammingError as e:
        # database may not exist; try connecting without database to create it
        if 'Unknown database' in str(e) or args.apply:
            conn = mysql.connector.connect(host=cfg['host'], port=cfg['port'], user=cfg['user'], password=cfg['password'])
            cursor = conn.cursor()
            try:
                print(f"Creating database {cfg['database']} (if not exists)")
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{cfg['database']}` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
                conn.database = cfg['database']
            finally:
                cursor.close()
        else:
            raise

    try:
        sql = read_sql_file(SCHEMA_FILE)
    except FileNotFoundError as e:
        print(e)
        conn.close()
        sys.exit(1)

    if args.dry_run:
        print('\n-- schema.sql --')
        print(sql[:10000])
        print('\n-- (truncated)')
        conn.close()
        return

    if args.apply:
        print('Applying schema.sql to database', cfg['database'])
        try:
            execute_sql_script(conn, sql)
            print('Schema and data applied successfully.')
        except mysql.connector.Error as e:
            print('Error while applying SQL script:', e)
            conn.rollback()
            conn.close()
            sys.exit(1)

        # Run verification queries
        try:
            verify(conn)
        finally:
            conn.close()

    else:
        print('No action specified. Use --apply to apply schema.sql or --dry-run to preview the SQL.')
        conn.close()


if __name__ == '__main__':
    main()
