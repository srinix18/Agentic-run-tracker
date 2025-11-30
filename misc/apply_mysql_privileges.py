"""
Apply MySQL privileges for role-based access control
Run: python apply_mysql_privileges.py
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import mysql.connector

BASE = Path(__file__).resolve().parent
SQL_FILE = BASE / 'setup_mysql_privileges.sql'

def load_env():
    env_path = BASE / '.env'
    if not env_path.exists():
        env_path = BASE / 'backend' / '.env'
    if not env_path.exists():
        print(f"No .env file found.")
        sys.exit(1)
    load_dotenv(env_path)
    
    # Try to get root connection details
    root_url = os.getenv('DATABASE_URL_ROOT') or os.getenv('DATABASE_URL')
    if not root_url:
        print('No DATABASE_URL or DATABASE_URL_ROOT found in .env')
        sys.exit(1)
    
    # Parse MySQL URL: mysql://user:password@host:port/database
    import re
    match = re.match(r'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', root_url)
    if not match:
        print(f'Invalid DATABASE_URL format: {root_url}')
        sys.exit(1)
    
    user, password, host, port, database = match.groups()
    
    cfg = {
        'host': host,
        'port': int(port),
        'user': user,
        'password': password,
        'database': database
    }
    return cfg

def apply_privileges():
    cfg = load_env()
    
    print(f"🔧 Connecting to MySQL as {cfg['user']}@{cfg['host']}:{cfg['port']}")
    print(f"📊 Database: {cfg['database']}")
    print()
    
    try:
        conn = mysql.connector.connect(**cfg)
        cursor = conn.cursor()
        
        # Read SQL file
        with open(SQL_FILE, 'r') as f:
            sql_content = f.read()
        
        # Split by semicolons and execute each statement
        statements = []
        current_statement = []
        
        for line in sql_content.split('\n'):
            line = line.strip()
            if not line or line.startswith('--'):
                continue
            current_statement.append(line)
            if line.endswith(';'):
                statements.append(' '.join(current_statement))
                current_statement = []
        
        for statement in statements:
            if not statement.strip():
                continue
            
            try:
                cursor.execute(statement)
                
                # Fetch and display results for SELECT and SHOW statements
                if statement.upper().startswith(('SELECT', 'SHOW')):
                    results = cursor.fetchall()
                    if results:
                        for row in results:
                            if len(row) == 1 and isinstance(row[0], str) and '\n' in row[0]:
                                # Multi-line string result
                                print(row[0])
                            else:
                                print(row)
                else:
                    print(f"✓ Executed: {statement[:80]}...")
                    
            except mysql.connector.Error as err:
                # Ignore certain errors
                if err.errno == 1396:  # Operation CREATE USER failed
                    print(f"⚠ User already exists, continuing...")
                elif 'already exists' in str(err).lower():
                    print(f"⚠ Already exists, skipping...")
                else:
                    print(f"❌ Error: {err}")
                    print(f"   Statement: {statement[:100]}...")
        
        conn.commit()
        print("\n✅ MySQL privileges setup complete!")
        print()
        print("📝 Summary:")
        print("  - admin_user: Full CRUD access (SELECT, INSERT, UPDATE, DELETE)")
        print("  - read_user: Read-only access (SELECT only)")
        print()
        print("🔐 Connection strings:")
        print(f'  Admin:     DATABASE_URL="mysql://admin_user:admin_password_123@{cfg["host"]}:{cfg["port"]}/{cfg["database"]}"')
        print(f'  Read-only: DATABASE_URL_READONLY="mysql://read_user:read_password_123@{cfg["host"]}:{cfg["port"]}/{cfg["database"]}"')
        print()
        print("⚠️  IMPORTANT: Update your backend/.env file with these connection strings!")
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as err:
        print(f"❌ Database error: {err}")
        sys.exit(1)

if __name__ == '__main__':
    print("=" * 70)
    print("MySQL Role-Based Access Control Setup")
    print("=" * 70)
    print()
    apply_privileges()
