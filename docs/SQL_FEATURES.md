# SQL Features Documentation

## Overview
This document describes the SQL query execution features and database functions/procedures available in the Agentic AI Run Tracker application.

## New Features Added

### 1. SQL Query Executor (`/sql-query`)
A dedicated page for executing custom SQL queries with the following features:

- **Custom Query Execution**: Run any SQL query (SELECT, INSERT, UPDATE, DELETE, etc.)
- **Function Support**: Execute custom database functions
- **Procedure Support**: Call stored procedures with parameters
- **Query History**: Automatically saves last 10 queries for quick reuse
- **Example Queries**: Pre-built queries for common operations
- **Results Display**: Formatted table view with result metadata
- **Error Handling**: User-friendly error messages for query failures

#### Example Queries Included:
- Count Agents per Project (using function)
- Get Runs by Agent (stored procedure)
- Get Run Metrics (stored procedure)
- Get Artifacts for Run (stored procedure)
- All Users
- Recent Runs

### 2. Functions & Procedures Documentation (`/functions`)
A comprehensive documentation page showing:

- **Function Definitions**: Complete list of custom database functions
- **Procedure Definitions**: All stored procedures with descriptions
- **Parameters**: Detailed parameter information with types
- **Return Values**: What each function/procedure returns
- **Example Usage**: Sample queries for each function/procedure
- **Full Definitions**: Expandable SQL code for each function/procedure

### 3. Backend API Endpoint

#### `POST /api/query/execute`
Executes custom SQL queries and returns results.

**Request Body:**
```json
{
  "query": "SELECT * FROM User LIMIT 5;"
}
```

**Response for SELECT queries:**
```json
{
  "ok": true,
  "data": [...],
  "rowCount": 5,
  "queryType": "SELECT"
}
```

**Response for PROCEDURE calls:**
```json
{
  "ok": true,
  "data": [...],
  "rowCount": 3,
  "queryType": "PROCEDURE"
}
```

**Response for mutations (INSERT/UPDATE/DELETE):**
```json
{
  "ok": true,
  "affectedRows": 1,
  "queryType": "MUTATION"
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "details": "Error code"
}
```

## Available Functions

### `count_agents_in_project(p_project_id)`
Counts the number of agents in a specific project.

**Parameters:**
- `p_project_id` (BIGINT UNSIGNED) - The project ID

**Returns:** INT - Count of agents

**Example:**
```sql
SELECT ProjectID, count_agents_in_project(ProjectID) AS agent_count FROM Project;
```

## Available Procedures

### `GetRunsByAgent(p_agent_id)`
Retrieves all runs for a specific agent, ordered by time (most recent first).

**Parameters:**
- `p_agent_id` (BIGINT UNSIGNED) - The agent ID

**Returns:** Result set with all Run table columns

**Example:**
```sql
CALL GetRunsByAgent(1);
```

### `GetRunMetrics(p_run_id)`
Retrieves all metrics for a specific run.

**Parameters:**
- `p_run_id` (BIGINT UNSIGNED) - The run ID

**Returns:** Result set with Name, DataType, Value_Numeric, Value_Text

**Example:**
```sql
CALL GetRunMetrics(1);
```

### `GetArtifactsForRun(p_run_id)`
Retrieves all artifacts associated with a specific run.

**Parameters:**
- `p_run_id` (BIGINT UNSIGNED) - The run ID

**Returns:** Result set with Type, URI, Checksum, Created_at

**Example:**
```sql
CALL GetArtifactsForRun(1);
```

## Navigation

The new features are accessible from the sidebar:

1. **SQL Query** - Execute custom SQL queries
2. **Functions & Procedures** - View documentation for all functions and procedures

## Security Notes

- SQL queries are executed using Prisma's `$queryRawUnsafe` and `$executeRawUnsafe`
- For production use, consider adding:
  - User authentication
  - Query rate limiting
  - Query logging
  - Query whitelisting for sensitive operations
  - Read-only mode for certain users

## Testing

All features have been tested with:
- SELECT queries ✅
- Custom functions ✅
- Stored procedures ✅
- Error handling ✅

## Files Modified/Created

### Backend:
- `/backend/src/index.ts` - Added `/api/query/execute` endpoint

### Frontend:
- `/frontend/app/sql-query/page.tsx` - SQL query executor page (NEW)
- `/frontend/app/functions/page.tsx` - Functions & procedures documentation (NEW)
- `/frontend/components/Sidebar.tsx` - Added menu items for new pages

## Usage Tips

1. **Testing Functions**: Use the SQL Query page to test functions with different parameters
2. **Viewing Results**: All results are displayed in a formatted table with proper date formatting
3. **Query History**: Recent queries are saved for quick reuse
4. **Copy Examples**: Click any example query to load it into the editor
5. **Error Messages**: Detailed error messages help debug query issues

## Future Enhancements

Potential improvements:
- Query export (CSV, JSON)
- Query sharing/saving
- Query performance analysis
- Syntax highlighting in query editor
- Auto-complete for table/column names
- Query templates
- Scheduled queries
