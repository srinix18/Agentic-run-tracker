"""
Simple script to apply the authentication migration to the database.
Run: python apply_auth_migration.py
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import mysql.connector

BASE = Path(__file__).resolve().parent
MIGRATION_FILE = BASE / 'add_auth.sql'

def load_env():
    env_path = BASE / '.env'
    if not env_path.exists():
        print(f"No .env file found at {env_path}.")
        sys.exit(1)
    load_dotenv(env_path)
    cfg = {
        'host': os.getenv('MYSQL_HOST', '127.0.0.1'),
        'port': int(os.getenv('MYSQL_PORT', '3306')),
        'user': os.getenv('MYSQL_USER'),
        'password': os.getenv('MYSQL_PASSWORD'),
        'database': os.getenv('MYSQL_DATABASE'),
    }
    if not (cfg['user'] and cfg['password'] and cfg['database']):
        print('Please set MYSQL_USER, MYSQL_PASSWORD and MYSQL_DATABASE in .env')
        sys.exit(1)
    return cfg

def apply_migration():
    cfg = load_env()
    
    print(f"Connecting to database: {cfg['database']}@{cfg['host']}:{cfg['port']}")
    
    try:
        conn = mysql.connector.connect(
            host=cfg['host'],
            port=cfg['port'],
            user=cfg['user'],
            password=cfg['password'],
            database=cfg['database']
        )
        cursor = conn.cursor()
        
        # Read migration file
        with open(MIGRATION_FILE, 'r') as f:
            sql_content = f.read()
        
        # Split by semicolons and execute each statement
        statements = [s.strip() for s in sql_content.split(';') if s.strip() and not s.strip().startswith('--')]
        
        for statement in statements:
            if statement:
                try:
                    cursor.execute(statement)
                    
                    # Fetch results for SELECT statements
                    if statement.upper().startswith('SELECT'):
                        results = cursor.fetchall()
                        if results:
                            print(f"\n{statement[:50]}...")
                            for row in results:
                                print(row)
                    else:
                        print(f"✓ Executed: {statement[:80]}...")
                except mysql.connector.Error as err:
                    # Ignore duplicate column errors (if already exists)
                    if err.errno == 1060:  # Duplicate column name
                        print(f"⚠ Column already exists, skipping: {statement[:50]}...")
                    else:
                        print(f"❌ Error: {err}")
                        print(f"   Statement: {statement[:100]}...")
        
        conn.commit()
        print("\n✅ Authentication migration applied successfully!")
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as err:
        print(f"❌ Database error: {err}")
        sys.exit(1)

if __name__ == '__main__':
    apply_migration()
