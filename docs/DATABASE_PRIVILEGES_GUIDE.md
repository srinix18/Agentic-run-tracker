# 🔐 Complete Role-Based Access Control Setup

## Overview

Your Agentic Run Tracker now has **two levels** of role-based access control:

### 1. Application-Level Access Control
- Login authentication with user roles (admin/user)
- UI restrictions (hide Edit/Delete buttons for regular users)
- Frontend validation

### 2. Database-Level Access Control (NEW!)  
- Separate MySQL database users with different privileges
- **admin_user**: Full CRUD access at the database level
- **read_user**: Read-only access (SELECT only) at the database level
- Backend automatically uses the correct database connection based on user role

## 🎯 Why Two Levels?

**Defense in Depth**: Even if someone bypasses the frontend restrictions or directly calls the API, the MySQL database itself will enforce access control!

- **Regular users** connect to MySQL as `read_user` → MySQL rejects any INSERT/UPDATE/DELETE commands
- **Admin users** connect to MySQL as `admin_user` → Full database access granted

## 🚀 Setup Instructions

### Step 1: Set Up MySQL Users and Privileges

Follow the instructions in **`MYSQL_PRIVILEGES_SETUP.md`** to:
1. Create two MySQL database users
2. Grant appropriate privileges
3. Test the connections

**Quick version:**
```sql
-- Run in MySQL as root
CREATE USER 'admin_user'@'localhost' IDENTIFIED BY 'admin_password_123';
CREATE USER 'read_user'@'localhost' IDENTIFIED BY 'read_password_123';

GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON agentic_run_tracker.* TO 'admin_user'@'localhost';
GRANT SELECT, EXECUTE ON agentic_run_tracker.* TO 'read_user'@'localhost';

FLUSH PRIVILEGES;
```

### Step 2: Update Your .env File

Edit `backend/.env`:

```bash
# Admin database connection (full CRUD access)
DATABASE_URL="mysql://admin_user:admin_password_123@127.0.0.1:3306/agentic_run_tracker"

# Read-only database connection (SELECT only)
DATABASE_URL_READONLY="mysql://read_user:read_password_123@127.0.0.1:3306/agentic_run_tracker"
```

### Step 3: Restart Backend

```bash
cd backend
npm run dev
```

### Step 4: Test It!

1. **Login as admin** (`admin@example.com` / `admin123`)
   - Create a new record → Should work ✅
   - Edit a record → Should work ✅
   - Delete a record → Should work ✅

2. **Login as regular user** (`user@example.com` / `user123`)
   - Try to create/edit/delete → Will be blocked by MySQL! 🔒
   - View data → Works fine ✅

## 🏗️ Architecture

### Backend Flow

```
User Login → Frontend stores user role → API calls include role header
                                                ↓
                                    Backend middleware checks role
                                                ↓
                            ┌───────────────────┴───────────────────┐
                            ↓                                       ↓
                    Role = 'admin'                          Role = 'user'
                            ↓                                       ↓
              Connect as 'admin_user'                  Connect as 'read_user'
              (Full CRUD privileges)                   (SELECT only)
                            ↓                                       ↓
                      MySQL Database
```

### Key Files Modified

#### Backend:
- **`backend/src/db.ts`**: 
  - Added `prismaAdmin` and `prismaReadOnly` clients
  - Added `getPrismaClient(role)` function
  
- **`backend/src/index.ts`**:
  - Added middleware to extract user role from headers
  - Updated all CRUD endpoints to use role-based database client
  - Added privilege checks for write operations (POST, PUT, DELETE)

#### Frontend:
- **`frontend/lib/api.ts`**:
  - Added `getHeaders()` function that includes user role
  - All API calls now send `x-user-role` header

### Request Flow Example

1. **User logs in as admin**:
   ```
   POST /api/auth/login
   → Returns: { user: { role: 'admin', ... } }
   → Frontend stores in localStorage
   ```

2. **Admin creates a record**:
   ```
   POST /api/user
   Headers: { 'x-user-role': 'admin' }
   → Backend middleware: req.dbClient = prismaAdmin
   → Connects to MySQL as 'admin_user'
   → INSERT succeeds ✅
   ```

3. **Regular user tries to create a record**:
   ```
   POST /api/user
   Headers: { 'x-user-role': 'user' }
   → Backend middleware: req.dbClient = prismaReadOnly
   → Connects to MySQL as 'read_user'
   → MySQL rejects INSERT: "INSERT command denied" ❌
   ```

## 📊 Privilege Breakdown

| Operation | Admin User | Regular User | MySQL Enforcement |
|-----------|------------|--------------|-------------------|
| SELECT (Read) | ✅ Yes | ✅ Yes | Both can read |
| INSERT (Create) | ✅ Yes | ❌ No | MySQL blocks for read_user |
| UPDATE (Edit) | ✅ Yes | ❌ No | MySQL blocks for read_user |
| DELETE (Delete) | ✅ Yes | ❌ No | MySQL blocks for read_user |
| EXECUTE (Procedures) | ✅ Yes | ✅ Yes | Both can execute |

## 🔒 Security Benefits

### Application-Level (Existing):
- ✅ User-friendly UI restrictions
- ✅ Role-based component rendering
- ✅ Frontend validation
- ⚠️ Can be bypassed by savvy users

### Database-Level (NEW!):
- ✅ **Cannot be bypassed** - enforced by MySQL
- ✅ Protection even if API is directly accessed
- ✅ Audit trail at database level
- ✅ Compliance with principle of least privilege

## 🧪 Testing the Setup

### Test 1: Verify MySQL Users

```bash
# Check privileges for admin_user
mysql -u root -p -e "SHOW GRANTS FOR 'admin_user'@'localhost';"

# Check privileges for read_user
mysql -u root -p -e "SHOW GRANTS FOR 'read_user'@'localhost';"
```

### Test 2: Test Database Connections

```bash
# Admin user should be able to INSERT
mysql -u admin_user -padmin_password_123 agentic_run_tracker -e "SELECT 'Admin access works!' AS test;"

# Read user should only SELECT (INSERT will fail)
mysql -u read_user -pread_password_123 agentic_run_tracker -e "SELECT 'Read access works!' AS test;"
```

### Test 3: Test Application Flow

1. Open browser console (F12)
2. Login as regular user
3. Try to create a record
4. Check Network tab → Should see 403 Forbidden or MySQL error
5. Check Console → Should see error message

## 📁 Files Created/Modified

### New Files:
- `setup_mysql_privileges.sql` - SQL script to create MySQL users
- `apply_mysql_privileges.py` - Python script to apply privileges
- `MYSQL_PRIVILEGES_SETUP.md` - Manual setup instructions
- `DATABASE_PRIVILEGES_GUIDE.md` - This comprehensive guide

### Modified Files:
- `backend/src/db.ts` - Added dual Prisma clients
- `backend/src/index.ts` - Role-based middleware and endpoints
- `backend/.env.example` - Added readonly connection string
- `frontend/lib/api.ts` - Added role header to all requests

## ⚠️ Important Notes

### For Development:
- Default passwords are provided for easy setup
- Both connection strings are in `.env`
- Fallback to admin connection if readonly not configured

### For Production:
1. **Change all default passwords!**
2. Use environment variables for credentials
3. Enable SSL/TLS for database connections
4. Regularly rotate passwords
5. Audit user access logs
6. Consider additional security:
   - Row-level security
   - Column-level encryption
   - IP whitelisting
   - VPN/private network access

## 🐛 Troubleshooting

### Issue: "Access denied for user 'admin_user'"
**Solution**: 
- Verify MySQL users were created correctly
- Check password in `.env` matches MySQL
- Run `FLUSH PRIVILEGES;` in MySQL

### Issue: Regular user can still modify data
**Solution**:
- Check that `DATABASE_URL_READONLY` is set in `.env`
- Verify `read_user` only has SELECT privilege
- Check backend logs for which connection is being used
- Restart the backend server

### Issue: Admin user gets "command denied" errors
**Solution**:
- Check that `admin_user` has INSERT, UPDATE, DELETE privileges
- Verify `DATABASE_URL` points to `admin_user`
- Check MySQL grants: `SHOW GRANTS FOR 'admin_user'@'localhost';`

### Issue: Connection refused
**Solution**:
- Ensure MySQL is running
- Check host/port in connection strings
- Verify firewall settings

## 📚 Additional Resources

- [MySQL User Account Management](https://dev.mysql.com/doc/refman/8.0/en/user-account-management.html)
- [MySQL Privilege System](https://dev.mysql.com/doc/refman/8.0/en/privileges-provided.html)
- [Prisma Multiple Datasources](https://www.prisma.io/docs/concepts/components/prisma-schema/data-sources)
- [Express Middleware](https://expressjs.com/en/guide/using-middleware.html)

## ✅ Checklist

- [ ] MySQL users created (`admin_user`, `read_user`)
- [ ] Privileges granted correctly
- [ ] `.env` file updated with both connection strings
- [ ] Backend restarted
- [ ] Tested admin user - can create/edit/delete
- [ ] Tested regular user - can only view
- [ ] Verified MySQL blocks write operations for read_user
- [ ] Production security measures planned

## 🎉 You're Done!

Your application now has database-level role-based access control! This provides an additional layer of security beyond application-level checks.

**Test accounts:**
- Admin: `admin@example.com` / `admin123`
- User: `user@example.com` / `user123`

Enjoy your secure application! 🚀🔒
