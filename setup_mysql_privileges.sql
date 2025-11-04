-- ===================================================================
-- MySQL User Privilege Setup for Role-Based Access Control
-- ===================================================================
-- This script creates two MySQL database users with different privileges:
-- 1. admin_user: Full CRUD access (SELECT, INSERT, UPDATE, DELETE)
-- 2. read_user: Read-only access (SELECT only)
--
-- Run this script as root or a user with GRANT privileges
-- ===================================================================

-- Get the current database name
SET @db_name = DATABASE();

-- Display current database
SELECT CONCAT('Setting up privileges for database: ', @db_name) AS 'Info';

-- ===================================================================
-- 1. CREATE ADMIN USER (Full Access)
-- ===================================================================

-- Drop user if exists (for clean setup)
DROP USER IF EXISTS 'admin_user'@'localhost';
DROP USER IF EXISTS 'admin_user'@'127.0.0.1';
DROP USER IF EXISTS 'admin_user'@'%';

-- Create admin user with password
CREATE USER 'admin_user'@'localhost' IDENTIFIED BY 'admin_password_123';
CREATE USER 'admin_user'@'127.0.0.1' IDENTIFIED BY 'admin_password_123';

-- Grant full privileges to admin user
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX, REFERENCES 
ON agentic_run_tracker.* TO 'admin_user'@'localhost';

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX, REFERENCES 
ON agentic_run_tracker.* TO 'admin_user'@'127.0.0.1';

-- Grant EXECUTE privilege for stored procedures and functions
GRANT EXECUTE ON agentic_run_tracker.* TO 'admin_user'@'localhost';
GRANT EXECUTE ON agentic_run_tracker.* TO 'admin_user'@'127.0.0.1';

SELECT 'Admin user created with full privileges' AS 'Status';

-- ===================================================================
-- 2. CREATE READ-ONLY USER (View Access Only)
-- ===================================================================

-- Drop user if exists (for clean setup)
DROP USER IF EXISTS 'read_user'@'localhost';
DROP USER IF EXISTS 'read_user'@'127.0.0.1';
DROP USER IF EXISTS 'read_user'@'%';

-- Create read-only user with password
CREATE USER 'read_user'@'localhost' IDENTIFIED BY 'read_password_123';
CREATE USER 'read_user'@'127.0.0.1' IDENTIFIED BY 'read_password_123';

-- Grant only SELECT privilege (read-only)
GRANT SELECT ON agentic_run_tracker.* TO 'read_user'@'localhost';
GRANT SELECT ON agentic_run_tracker.* TO 'read_user'@'127.0.0.1';

-- Grant EXECUTE privilege for read-only stored procedures/functions
GRANT EXECUTE ON agentic_run_tracker.* TO 'read_user'@'localhost';
GRANT EXECUTE ON agentic_run_tracker.* TO 'read_user'@'127.0.0.1';

SELECT 'Read-only user created with SELECT privileges' AS 'Status';

-- ===================================================================
-- 3. APPLY PRIVILEGES
-- ===================================================================

FLUSH PRIVILEGES;

-- ===================================================================
-- 4. VERIFY USER PRIVILEGES
-- ===================================================================

SELECT 'Verifying privileges...' AS 'Info';

-- Show admin user privileges
SELECT 'Admin User Privileges:' AS '';
SHOW GRANTS FOR 'admin_user'@'localhost';

-- Show read-only user privileges
SELECT 'Read-Only User Privileges:' AS '';
SHOW GRANTS FOR 'read_user'@'localhost';

-- ===================================================================
-- 5. CONNECTION STRING EXAMPLES
-- ===================================================================

SELECT '
===================================================================
DATABASE CONNECTION STRINGS:
===================================================================

For Admin Users (Full Access):
DATABASE_URL="mysql://admin_user:admin_password_123@localhost:3306/agentic_run_tracker"

For Read-Only Users (View Only):
DATABASE_URL_READONLY="mysql://read_user:read_password_123@localhost:3306/agentic_run_tracker"

===================================================================
SECURITY NOTES:
===================================================================
1. Change these passwords in production!
2. Use environment variables to store credentials
3. Enable SSL for remote connections
4. Regularly audit user access logs
5. Rotate passwords periodically
===================================================================
' AS 'Connection Details';

-- ===================================================================
-- 6. TEST USER PRIVILEGES (Optional)
-- ===================================================================

-- You can uncomment these to test (requires switching users)
/*
-- Test admin user can INSERT
-- USE agentic_run_tracker;
-- INSERT INTO user (Fname, Lname, Email, Password, Role) 
-- VALUES ('Test', 'Admin', 'testadmin@example.com', 'test123', 'admin');

-- Test read user CANNOT INSERT (should fail)
-- This would need to be run as read_user to test properly
-- INSERT INTO user (Fname, Lname, Email, Password, Role) 
-- VALUES ('Test', 'User', 'testuser@example.com', 'test123', 'user');
*/

SELECT 'Setup complete! Users created successfully.' AS 'Final Status';
SELECT 'Please update your .env file with the appropriate connection strings.' AS 'Next Steps';
