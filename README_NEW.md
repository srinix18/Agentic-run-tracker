# Agentic AI Run Tracker

A full-stack web application for tracking AI agent runs, experiments, and metrics with MySQL database backend.

## 🚀 Features

### Core Functionality
- **Database Management**: Full CRUD operations on 9 interconnected tables
- **Dynamic Table Views**: Browse and manage all database tables through a unified interface
- **SQL Query Executor**: Execute custom SQL queries, functions, and stored procedures
- **Functions & Procedures**: Built-in database functions and stored procedures with documentation
- **Real-time Updates**: Automatic data refresh with optimistic updates
- **Error Handling**: User-friendly error messages for database constraints

### User Experience
- **Responsive Design**: Mobile-friendly interface with TailwindCSS
- **Toast Notifications**: Real-time feedback for all operations
- **Confirmation Dialogs**: Safe delete operations with confirmation
- **Undo Feature**: 5-second window to undo delete operations
- **Auto-generated Fields**: Automatic handling of timestamps and default values
- **Date Formatting**: Human-readable date display throughout the app

## 📊 Database Schema

### Tables (9 Total)
1. **User** - User information
2. **Project** - Project management
3. **Agent** - AI agent configurations
4. **Environment** - Execution environments
5. **Dataset** - Training/testing datasets
6. **Run** - Agent execution runs
7. **RunStep** - Individual run steps
8. **RunMetric** - Run performance metrics
9. **Artifact** - Generated artifacts

### Custom Functions
- `count_agents_in_project(project_id)` - Count agents per project

### Stored Procedures
- `GetRunsByAgent(agent_id)` - Retrieve all runs for an agent
- `GetRunMetrics(run_id)` - Get metrics for a specific run
- `GetArtifactsForRun(run_id)` - List artifacts for a run

## 🛠️ Tech Stack

### Backend
- **Node.js** 25.1.0
- **Express** - REST API server
- **Prisma** - ORM for database access
- **TypeScript** - Type-safe development
- **MySQL** 9.4.0 - Database

### Frontend
- **Next.js** 14.2.33 - React framework
- **React** 18 - UI library
- **TailwindCSS** - Styling
- **TanStack Query** - Data fetching & caching
- **Sonner** - Toast notifications
- **Framer Motion** - Animations
- **Lucide React** - Icons

## 📁 Project Structure

```
Agentic-run-tracker/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── index.ts               # Express server
│   │   └── db.ts                  # Prisma client
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── page.tsx               # Dashboard
│   │   ├── tables/                # Table views
│   │   ├── sql-query/             # SQL executor
│   │   ├── functions/             # Functions docs
│   │   └── settings/              # Settings
│   ├── components/                # React components
│   ├── hooks/                     # Custom hooks
│   └── lib/
│       └── api.ts                 # API client
├── schema.sql                     # Database schema with data
├── run_queries.sql                # Example queries
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 25.1.0 or higher
- MySQL 9.4.0 or higher
- npm or yarn

### 1. Database Setup

```bash
# Start MySQL server
mysql.server start

# Create database and load schema
mysql -u root -p < schema.sql
```

### 2. Environment Configuration

Create `.env` file in the root directory:

```env
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/agentic_tracker"
PORT=4000
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

Backend will run on `http://localhost:4000`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:3000`

## 📡 API Endpoints

### Table Operations
- `GET /api/meta/tables` - List all tables
- `GET /api/:table` - Get table data (with pagination)
- `POST /api/:table` - Create new record
- `GET /api/:table/:id` - Get single record
- `PUT /api/:table/:id` - Update record
- `DELETE /api/:table/:id` - Delete record

### Query Execution
- `POST /api/query/execute` - Execute custom SQL query

Example:
```bash
curl -X POST http://localhost:4000/api/query/execute \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM User LIMIT 5;"}'
```

### Health Check
- `GET /health` - Server health status

## 🎯 Usage

### Browse Tables
1. Navigate to **Tables** from the sidebar
2. Click any table to view its data
3. Use **+ New Record** to add entries
4. Click any row to edit
5. Use delete button with confirmation

### Execute SQL Queries
1. Go to **SQL Query** page
2. Type your query or select an example
3. Click **Execute Query**
4. View results in formatted table

### View Documentation
1. Visit **Functions & Procedures** page
2. Browse available functions and procedures
3. Copy example queries
4. View full SQL definitions

## 🔒 Security Notes

⚠️ **Development Mode Only**

This application is designed for development/educational purposes. For production:

- [ ] Add authentication & authorization
- [ ] Implement rate limiting
- [ ] Add SQL injection protection
- [ ] Enable query logging
- [ ] Use parameterized queries
- [ ] Add API key authentication
- [ ] Enable CORS restrictions
- [ ] Use environment-specific configs
- [ ] Add input validation
- [ ] Implement user roles

## 📝 Sample Data

The database includes 10 sample records for each table:
- 10 Users
- 10 Projects
- 10 Agents
- 10 Environments
- 10 Datasets
- 10 Runs
- 10 Run Steps
- 10 Run Metrics
- 10 Artifacts

## 🧪 Testing

### Test Backend
```bash
curl http://localhost:4000/health
curl http://localhost:4000/api/meta/tables
```

### Test Frontend
Open browser to `http://localhost:3000`

### Test SQL Queries
```bash
curl -X POST http://localhost:4000/api/query/execute \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT COUNT(*) as total FROM User;"}'
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 4000
lsof -ti:4000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Prisma Client Issues
```bash
cd backend
npx prisma generate
```

### Database Connection Issues
- Check MySQL is running: `mysql.server status`
- Verify credentials in `.env`
- Check database exists: `SHOW DATABASES;`

## 📚 Additional Documentation

- [SQL Features Documentation](./SQL_FEATURES.md) - Detailed SQL features guide
- [Database Schema](./schema.sql) - Complete schema with functions/procedures
- [Example Queries](./run_queries.sql) - Sample queries

## 🎓 Academic Context

This project was developed for:
- **Course**: Database Management Systems (DBMS)
- **Semester**: 5
- **Institution**: PES University
- **Student IDs**: PES1UG23CS307, PES1UG23CS271

## 🤝 Contributing

This is an academic project. For improvements:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is for educational purposes.

## 👥 Authors

- Kireeti Reddy P (PES1UG23CS307)
- Contributor (PES1UG23CS271)

## 🙏 Acknowledgments

- PES University DBMS Faculty
- Next.js & React Documentation
- Prisma Documentation
- MySQL Documentation

---

**Built with ❤️ for DBMS Course, Semester 5**
