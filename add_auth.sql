-- Add authentication fields to user table

-- Add Password column to user table
ALTER TABLE user 
ADD COLUMN Password VARCHAR(255) NOT NULL DEFAULT 'password123';

-- Add Role column to user table
ALTER TABLE user 
ADD COLUMN Role ENUM('user', 'admin') NOT NULL DEFAULT 'user';

-- Insert sample users for testing
-- Password: 'admin123' for admin, 'user123' for regular user (plain text for demo - in production use hashed passwords)
INSERT INTO user (Fname, Lname, Email, Password, Role) 
VALUES 
('Admin', 'User', 'admin@example.com', 'admin123', 'admin'),
('Regular', 'User', 'user@example.com', 'user123', 'user')
ON DUPLICATE KEY UPDATE 
Password = 'admin123',
Role = 'admin';

SELECT 'Authentication schema updated successfully!' as Message;
SELECT userID, Fname, Lname, Email, Role FROM user;
