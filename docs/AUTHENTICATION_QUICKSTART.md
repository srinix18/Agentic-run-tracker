# Quick Start: Authentication System

## 🎯 What Was Added

Your Agentic Run Tracker now has a complete authentication system with two user roles:

### 👑 Admin Users
- Can **create**, **edit**, and **delete** all records
- Full access to all features
- Test account: `admin@example.com` / `admin123`

### 👤 Regular Users
- Can **view** all data (read-only)
- Cannot create, edit, or delete records
- Test account: `user@example.com` / `user123`

## 🚀 How to Use

1. **Login Page**: 
   - Navigate to http://localhost:3000
   - You'll see a beautiful login page
   - Click the "👑 Admin" or "👤 User" button to auto-fill credentials
   - Or type credentials manually

2. **Admin Experience**:
   - Green "**+ New Record**" button to create records
   - **Edit** and **Delete** buttons on all table rows
   - Full CRUD operations enabled

3. **User Experience**:
   - "🔒 **View Only**" message instead of "New Record" button
   - "**View only**" text instead of Edit/Delete buttons
   - Read-only access to all data

4. **User Info Display**:
   - Sidebar shows your name, email, and role badge
   - Color-coded: Purple for Admin, Blue for User
   - **Logout** button at the bottom of sidebar

## 📁 Files Created/Modified

### New Files:
- `frontend/contexts/AuthContext.tsx` - Authentication state management
- `frontend/app/login/page.tsx` - Login page
- `add_auth.sql` - Database migration script
- `apply_auth_migration.py` - Python script to run migration
- `AUTH_SETUP.md` - Detailed documentation

### Modified Files:
- `backend/prisma/schema.prisma` - Added Role enum and auth fields
- `backend/src/index.ts` - Added login endpoints
- `frontend/app/layout.tsx` - Added AuthProvider
- `frontend/components/ClientShell.tsx` - Hide sidebar on login
- `frontend/components/Sidebar.tsx` - User info and logout
- `frontend/components/TableView.tsx` - Role-based button display
- `frontend/components/RecordModal.tsx` - Access restrictions
- `frontend/app/tables/[table]/page.tsx` - Conditional "New Record" button

## 🎨 Features

✅ Beautiful gradient login page with animations  
✅ Auto-redirect to login for unauthenticated users  
✅ Role-based UI rendering  
✅ User profile display in sidebar  
✅ Secure logout functionality  
✅ Access restriction messages for non-admin users  
✅ Mobile-responsive design  
✅ Demo account quick-login buttons  

## 🔐 Security Notice

⚠️ **This implementation uses plain-text passwords for demonstration purposes only.**

For production:
- Use bcrypt to hash passwords
- Implement JWT tokens for sessions
- Add HTTPS/TLS
- Add rate limiting
- Implement password reset

See `AUTH_SETUP.md` for production deployment guidelines.

## 📊 Test It Out

1. **Admin Test**:
   ```
   Email: admin@example.com
   Password: admin123
   ```
   - Create a new record in any table
   - Edit an existing record
   - Delete a record (with undo option)

2. **User Test**:
   ```
   Email: user@example.com
   Password: user123
   ```
   - Browse tables (view-only)
   - Notice Edit/Delete buttons are hidden
   - Try to create a record - access will be denied

## 🎉 That's It!

Your application now has working authentication! Open http://localhost:3000 and try logging in with the test accounts.

For detailed information, see `AUTH_SETUP.md`.
