/**
 * API client for the Agentic Run Tracker backend
 * 
 * This module provides functions to interact with the backend API endpoints.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

/**
 * Get common headers including user role for role-based database access
 */
function getHeaders(): HeadersInit {
    const headers: HeadersInit = {
        'Content-Type': 'application/json'
    }

    // Get user from localStorage
    if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('user')
        if (userStr) {
            try {
                const user = JSON.parse(userStr)
                if (user && user.role) {
                    headers['x-user-role'] = user.role
                }
            } catch (e) {
                console.error('Error parsing user from localStorage:', e)
            }
        }
    }

    return headers
}

/**
 * List all available tables in the database
 */
export async function listTables(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/api/meta/tables`)
    if (!response.ok) {
        throw new Error(`Failed to fetch tables: ${response.statusText}`)
    }
    const data = await response.json()
    // Convert table names to lowercase to match backend API expectations
    return (data.tables || []).map((t: string) => t.toLowerCase())
}

/**
 * Fetch paginated data from a specific table
 */
export async function fetchTable(
    table: string,
    page: number = 1,
    limit: number = 20
): Promise<{ data: any[]; meta: { total: number; page: number; limit: number } }> {
    const response = await fetch(
        `${API_BASE_URL}/api/${table}?page=${page}&limit=${limit}`,
        {
            headers: getHeaders()
        }
    )
    if (!response.ok) {
        throw new Error(`Failed to fetch ${table}: ${response.statusText}`)
    }
    return response.json()
}

/**
 * Parse and format database error messages for better user experience
 */
function formatErrorMessage(errorMsg: string): string {
    // Foreign key constraint violations
    if (errorMsg.includes('foreign key constraint')) {
        const match = errorMsg.match(/`([^`]+)`/)
        const fieldName = match ? match[1] : 'field'
        return `❌ Invalid reference: The ${fieldName} doesn't exist in the related table. Please check your foreign key values.`
    }

    // Primary key violations (check for PRIMARY or primary key specific errors)
    if (errorMsg.includes('PRIMARY') ||
        errorMsg.includes('Primary key') ||
        errorMsg.toLowerCase().includes('primary key constraint') ||
        (errorMsg.includes('Unique constraint') && errorMsg.includes('PRIMARY'))) {
        // Extract field name if available
        const match = errorMsg.match(/`([^`]+)`/) || errorMsg.match(/on fields: \(`([^`]+)`\)/)
        const fieldName = match ? match[1] : 'ID'
        return `❌ Primary key violation: A record with this ${fieldName} already exists. Each ${fieldName} must be unique.`
    }

    // Duplicate key errors (for non-primary unique constraints)
    if (errorMsg.includes('Unique constraint') || errorMsg.includes('duplicate')) {
        // Try to extract all field names
        const fieldsMatch = errorMsg.match(/on fields?: \(`([^)]+)`\)/) || errorMsg.match(/fields?: \(`([^)]+)`\)/)
        if (fieldsMatch && fieldsMatch[1]) {
            // Handle multiple fields (e.g., "Email", "Username")
            const fields = fieldsMatch[1].split(',').map((f: string) => f.trim().replace(/`/g, ''))
            if (fields.length > 1) {
                return `❌ Duplicate entry: A record with these values (${fields.join(', ')}) already exists. These fields must be unique.`
            } else {
                return `❌ Duplicate entry: A record with this ${fields[0]} already exists. The ${fields[0]} must be unique.`
            }
        }
        // Fallback: single field name
        const match = errorMsg.match(/`([^`]+)`/)
        const fieldName = match ? match[1] : 'field'
        return `❌ Duplicate entry: A record with this ${fieldName} already exists. The ${fieldName} must be unique.`
    }

    // NULL constraint violations
    if (errorMsg.includes('null') || errorMsg.includes('NULL')) {
        const match = errorMsg.match(/`([^`]+)`/)
        const fieldName = match ? match[1] : 'field'
        return `❌ Missing required field: ${fieldName} cannot be empty.`
    }

    // Default: return original message
    return errorMsg
}

/**
 * Create a new row in a table
 */
export async function createRow(
    table: string,
    data: Record<string, any>
): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/${table}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        })
        const result = await response.json()
        if (!response.ok) {
            const errorMsg = result.error || response.statusText
            return { ok: false, error: formatErrorMessage(errorMsg) }
        }
        return { ok: true, data: result }
    } catch (error) {
        return { ok: false, error: formatErrorMessage(String(error)) }
    }
}

/**
 * Update an existing row in a table
 */
export async function updateRow(
    table: string,
    id: string | number,
    data: Record<string, any>
): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/${table}/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        })
        const result = await response.json()
        if (!response.ok) {
            const errorMsg = result.error || response.statusText
            return { ok: false, error: formatErrorMessage(errorMsg) }
        }
        return { ok: true, data: result }
    } catch (error) {
        return { ok: false, error: formatErrorMessage(String(error)) }
    }
}

/**
 * Delete a row from a table
 */
export async function deleteRow(
    table: string,
    id: string | number
): Promise<{ ok: boolean; error?: string }> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/${table}/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        })
        if (!response.ok) {
            const result = await response.json()
            const errorMsg = result.error || response.statusText
            // Special message for foreign key constraint on delete
            if (errorMsg.includes('foreign key constraint')) {
                return {
                    ok: false,
                    error: '❌ Cannot delete: This record is referenced by other records. Delete the related records first.'
                }
            }
            return { ok: false, error: formatErrorMessage(errorMsg) }
        }
        return { ok: true }
    } catch (error) {
        return { ok: false, error: formatErrorMessage(String(error)) }
    }
}

/**
 * Fetch a single row by ID
 */
export async function fetchRow(
    table: string,
    id: string | number
): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/${table}/${id}`)
    if (!response.ok) {
        throw new Error(`Failed to fetch ${table}/${id}: ${response.statusText}`)
    }
    return response.json()
}

/**
 * Get count of active runs (status = 'running' or 'in_progress')
 */
export async function getActiveRunsCount(): Promise<number> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/run?limit=1000`)
        if (!response.ok) {
            throw new Error(`Failed to fetch runs: ${response.statusText}`)
        }
        const result = await response.json()
        // Count runs with active status
        const activeRuns = (result.data || []).filter((run: any) =>
            run.Status && ['running', 'in_progress', 'active', 'RUNNING', 'IN_PROGRESS', 'ACTIVE'].includes(run.Status)
        )
        return activeRuns.length
    } catch (error) {
        console.error('Error fetching active runs:', error)
        return 0
    }
}

/**
 * Get total count of projects
 */
export async function getProjectsCount(): Promise<number> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/project?limit=1`)
        if (!response.ok) {
            throw new Error(`Failed to fetch projects: ${response.statusText}`)
        }
        const result = await response.json()
        return result.meta?.total || 0
    } catch (error) {
        console.error('Error fetching projects count:', error)
        return 0
    }
}

/**
 * Get total count of runs
 */
export async function getTotalRunsCount(): Promise<number> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/run?limit=1`)
        if (!response.ok) {
            throw new Error(`Failed to fetch runs: ${response.statusText}`)
        }
        const result = await response.json()
        return result.meta?.total || 0
    } catch (error) {
        console.error('Error fetching runs count:', error)
        return 0
    }
}
