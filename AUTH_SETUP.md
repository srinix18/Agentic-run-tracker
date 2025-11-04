# Authentication Setup Guide

## 🔐 Overview

This application now includes role-based authentication with two user types:
- **Admin**: Full access to create, read, update, and delete all records
- **User**: Read-only access to view data

## 🚀 Quick Start

### 1. Database Migration

The authentication fields have been added to your database. If you need to run it again:

```bash
python apply_auth_migration.py
```

This script adds:
- `Password` field (VARCHAR 255) to the `user` table
- `Role` field (ENUM: 'user', 'admin') to the `user` table
- Two test accounts (see below)

### 2. Test Accounts

Two demo accounts have been created:

#### Admin Account
- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Access**: Full CRUD operations

#### Regular User Account
- **Email**: `user@example.com`
- **Password**: `user123`
- **Access**: Read-only

### 3. Starting the Application

1. **Start Backend** (Terminal 1):
   ```bash
   cd backend
   npm run dev
   ```
   Backend runs on: http://localhost:4000

2. **Start Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on: http://localhost:3000

3. **Access the Application**:
   - Open http://localhost:3000 in your browser
   - You'll be redirected to the login page
   - Use one of the test accounts above

## 🎨 Features

### Login Page
- Beautiful gradient design with animations
- Quick demo login buttons for testing
- Form validation and error handling
- Mobile-responsive

### User Experience

#### As an Admin:
- ✅ View all tables and data
- ✅ Create new records
- ✅ Edit existing records
- ✅ Delete records
- ✅ Execute SQL queries
- ✅ Access all features

#### As a User:
- ✅ View all tables and data
- ✅ Execute read-only SQL queries
- ❌ Cannot create records
- ❌ Cannot edit records
- ❌ Cannot delete records
- 🔒 "View Only" indicator on tables
- 🔒 Access restriction messages

### Sidebar Features
- Displays user information
- Shows role badge (👑 Admin or 👤 User)
- Color-coded user cards
- Logout button

## 🏗️ Architecture

### Backend (`/backend/src/index.ts`)

**New Endpoints:**
- `POST /api/auth/login` - Authenticate user
  ```json
  Request: { "email": "admin@example.com", "password": "admin123" }
  Response: { "ok": true, "user": { ...userInfo, "role": "admin" } }
  ```

- `POST /api/auth/me` - Validate session
  ```json
  Request: { "userId": "11" }
  Response: { "ok": true, "user": { ...userInfo } }
  ```

### Frontend

**New Files:**
- `/frontend/contexts/AuthContext.tsx` - Global auth state management
- `/frontend/app/login/page.tsx` - Login page component

**Modified Files:**
- `/frontend/app/layout.tsx` - Added AuthProvider wrapper
- `/frontend/components/ClientShell.tsx` - Hide sidebar on login page
- `/frontend/components/Sidebar.tsx` - User info display and logout
- `/frontend/components/TableView.tsx` - Conditional action buttons
- `/frontend/components/RecordModal.tsx` - Access restriction for non-admins
- `/frontend/app/tables/[table]/page.tsx` - Conditional "New Record" button

### Database Schema

**Updated `user` table:**
```sql
CREATE TABLE user (
  userID BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  Fname VARCHAR(100) NOT NULL,
  Lname VARCHAR(100) NOT NULL,
  Email VARCHAR(255) UNIQUE NOT NULL,
  Password VARCHAR(255) NOT NULL,
  Role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔒 Security Notes

⚠️ **IMPORTANT**: This implementation uses plain-text password storage for demonstration purposes only.

**For Production Use:**
1. Hash passwords using bcrypt:
   ```bash
   npm install bcrypt
   ```
2. Update login endpoint to use bcrypt.compare()
3. Hash passwords before storing in database
4. Implement proper session management (JWT tokens)
5. Add HTTPS/TLS encryption
6. Implement rate limiting
7. Add password strength requirements
8. Add password reset functionality

## 🧪 Testing

### Test the Authentication Flow:

1. **Admin Login Test:**
   - Go to http://localhost:3000
   - Login as admin@example.com / admin123
   - Verify you can create, edit, and delete records
   - Check that "New Record" button appears
   - Verify Edit/Delete buttons show in tables

2. **User Login Test:**
   - Logout
   - Login as user@example.com / user123
   - Verify "View Only" message appears instead of "New Record" button
   - Verify "View only" text shows instead of Edit/Delete buttons
   - Try clicking Edit button (if visible) - should show access restriction message

3. **Protected Routes Test:**
   - Logout
   - Try accessing http://localhost:3000/tables/user
   - Should redirect to login page

## 📝 Adding New Users

You can add users through the admin interface or directly in the database:

```sql
INSERT INTO user (Fname, Lname, Email, Password, Role) 
VALUES ('John', 'Doe', 'john@example.com', 'password123', 'user');
```

Or make an existing user an admin:

```sql
UPDATE user SET Role = 'admin' WHERE Email = 'john@example.com';
```

## 🎯 Customization

### Change Access Levels

Edit `frontend/contexts/AuthContext.tsx` to add more roles or customize permissions.

### Modify UI Elements

- Login page: `/frontend/app/login/page.tsx`
- Sidebar user info: `/frontend/components/Sidebar.tsx`
- Access restrictions: `/frontend/components/RecordModal.tsx`

### Add Additional Protection

To protect other routes or features, use the `useAuth()` hook:

```tsx
import { useAuth } from '../contexts/AuthContext'

function MyComponent() {
  const { isAdmin, user } = useAuth()
  
  if (!isAdmin()) {
    return <div>Access Denied</div>
  }
  
  return <div>Admin Content</div>
}
```

## 🐛 Troubleshooting

### Login doesn't work
- Check that backend is running on port 4000
- Verify database connection in `.env`
- Check browser console for errors
- Ensure test users exist in database

### User info not displaying
- Clear browser localStorage: `localStorage.clear()`
- Check that AuthProvider is wrapping the app in `layout.tsx`

### "View Only" not showing
- Verify user role in database: `SELECT * FROM user WHERE Email = 'user@example.com'`
- Check browser console for auth context errors

## 📚 Additional Resources

- [Next.js Authentication](https://nextjs.org/docs/authentication)
- [React Context API](https://react.dev/reference/react/useContext)
- [Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

## ✅ Checklist

- [x] Database schema updated
- [x] Backend authentication endpoints created
- [x] Frontend AuthContext implemented
- [x] Login page created
- [x] Role-based UI rendering
- [x] Test accounts created
- [x] Documentation complete

## 🎉 You're All Set!

Your application now has working authentication with role-based access control. Admin users have full access while regular users can only view data.

**Default Credentials:**
- Admin: admin@example.com / admin123
- User: user@example.com / user123

Happy coding! 🚀
