# MySQL Privilege Setup - Manual Instructions

## Overview
This guide will help you set up two MySQL database users with different privilege levels:
- **admin_user**: Full CRUD access (for admin users of your application)
- **read_user**: Read-only access (for regular users of your application)

## Step 1: Connect to MySQL as root

Open your terminal and connect to MySQL:

```bash
mysql -u root -p
```

Enter your root password when prompted.

## Step 2: Select your database

```sql
USE agentic_run_tracker;
-- or USE agentic_tracker; depending on your database name
```

## Step 3: Create the admin user

```sql
-- Drop if exists (for clean setup)
DROP USER IF EXISTS 'admin_user'@'localhost';
DROP USER IF EXISTS 'admin_user'@'127.0.0.1';

-- Create admin user
CREATE USER 'admin_user'@'localhost' IDENTIFIED BY 'admin_password_123';
CREATE USER 'admin_user'@'127.0.0.1' IDENTIFIED BY 'admin_password_123';

-- Grant full privileges
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE 
ON agentic_run_tracker.* TO 'admin_user'@'localhost';

GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE 
ON agentic_run_tracker.* TO 'admin_user'@'127.0.0.1';
```

**Note:** Replace `agentic_run_tracker` with your actual database name if different.

## Step 4: Create the read-only user

```sql
-- Drop if exists (for clean setup)
DROP USER IF EXISTS 'read_user'@'localhost';
DROP USER IF EXISTS 'read_user'@'127.0.0.1';

-- Create read-only user
CREATE USER 'read_user'@'localhost' IDENTIFIED BY 'read_password_123';
CREATE USER 'read_user'@'127.0.0.1' IDENTIFIED BY 'read_password_123';

-- Grant only SELECT privilege (read-only)
GRANT SELECT, EXECUTE 
ON agentic_run_tracker.* TO 'read_user'@'localhost';

GRANT SELECT, EXECUTE 
ON agentic_run_tracker.* TO 'read_user'@'127.0.0.1';
```

## Step 5: Apply privileges

```sql
FLUSH PRIVILEGES;
```

## Step 6: Verify privileges

```sql
SHOW GRANTS FOR 'admin_user'@'localhost';
SHOW GRANTS FOR 'read_user'@'localhost';
```

You should see:
- **admin_user**: SELECT, INSERT, UPDATE, DELETE, EXECUTE
- **read_user**: SELECT, EXECUTE only

## Step 7: Update your .env file

Edit `backend/.env` and add/update these lines:

```bash
# Admin database connection (full CRUD access)
DATABASE_URL="mysql://admin_user:admin_password_123@127.0.0.1:3306/agentic_run_tracker"

# Read-only database connection (SELECT only)
DATABASE_URL_READONLY="mysql://read_user:read_password_123@127.0.0.1:3306/agentic_run_tracker"
```

**Important:** Replace `agentic_run_tracker` with your actual database name.

## Step 8: Test the connections

You can test the connections from the command line:

### Test admin user (should succeed):
```bash
mysql -u admin_user -padmin_password_123 agentic_run_tracker -e "SELECT COUNT(*) FROM user;"
mysql -u admin_user -padmin_password_123 agentic_run_tracker -e "INSERT INTO user (Fname, Lname, Email, Password, Role) VALUES ('Test', 'User', 'test@test.com', 'pass', 'user');"
```

### Test read-only user (SELECT should succeed, INSERT should fail):
```bash
mysql -u read_user -pread_password_123 agentic_run_tracker -e "SELECT COUNT(*) FROM user;"
mysql -u read_user -pread_password_123 agentic_run_tracker -e "INSERT INTO user (Fname, Lname, Email, Password, Role) VALUES ('Bad', 'Test', 'bad@test.com', 'pass', 'user');"
```

The second command should fail with "INSERT command denied" - this is expected and correct!

## Step 9: Restart your backend

After updating the .env file:

```bash
cd backend
npm run dev
```

## Security Notes

⚠️ **Change these default passwords in production!**

For production:
1. Use strong, randomly generated passwords
2. Store passwords securely (e.g., using environment variables or secrets manager)
3. Enable SSL/TLS for database connections
4. Limit host access (don't use '%' wildcard)
5. Regularly audit user privileges
6. Rotate passwords periodically

## Troubleshooting

### Error: Access denied for user 'admin_user'
- Check that you created the user correctly
- Verify the password
- Make sure you ran `FLUSH PRIVILEGES;`

### Error: INSERT command denied
- For read_user, this is **expected** - they should only be able to SELECT
- For admin_user, check that you granted INSERT privilege

### Connection refused
- Check that MySQL is running
- Verify the host and port in your connection string
- Ensure firewall allows connections

## What This Does

When a user logs into your application:
- **Admin users** (`role: 'admin'`) will connect to the database using `admin_user` credentials
  - Can create, read, update, and delete records
  - Has full access to all tables
  
- **Regular users** (`role: 'user'`) will connect using `read_user` credentials
  - Can only read (SELECT) data
  - Any attempt to INSERT, UPDATE, or DELETE will be denied by MySQL itself
  - Provides database-level security enforcement

This adds an extra layer of security beyond the application-level checks!
