'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function QueryBuilderPage() {
    const [selectedTable, setSelectedTable] = useState('')
    const [selectedColumns, setSelectedColumns] = useState<string[]>([])
    const [whereConditions, setWhereConditions] = useState<{ column: string, operator: string, value: string }[]>([])
    const [orderBy, setOrderBy] = useState('')
    const [orderDirection, setOrderDirection] = useState<'ASC' | 'DESC'>('ASC')
    const [limit, setLimit] = useState('')
    const [joinTable, setJoinTable] = useState('')
    const [joinType, setJoinType] = useState<'INNER' | 'LEFT' | 'RIGHT'>('INNER')
    const [joinCondition, setJoinCondition] = useState('')
    const [groupBy, setGroupBy] = useState('')
    const [havingCondition, setHavingCondition] = useState('')
    const [aggregateFunction, setAggregateFunction] = useState('')
    const [aggregateColumn, setAggregateColumn] = useState('')

    const [generatedQuery, setGeneratedQuery] = useState('')
    const [results, setResults] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const tables = [
        { name: 'User', columns: ['userID', 'Fname', 'Lname', 'Email', 'CreatedAt'], color: 'from-blue-500 to-blue-600' },
        { name: 'Project', columns: ['ProjectID', 'name', 'status', 'created_at', 'userID'], color: 'from-purple-500 to-purple-600' },
        { name: 'Agent', columns: ['AgentID', 'name', 'version', 'model', 'goal', 'ProjectID'], color: 'from-green-500 to-green-600' },
        { name: 'Run', columns: ['RunID', 'Status', 'time', 'notes', 'Parent_RunID', 'AgentID'], color: 'from-orange-500 to-orange-600' },
        { name: 'RunStep', columns: ['RunID', 'Step_No', 'Name', 'Status', 'Step_Type', 'Time'], color: 'from-pink-500 to-pink-600' },
        { name: 'RunMetric', columns: ['ID', 'RunID', 'Name', 'Value_Text', 'DataType', 'Value_Numeric'], color: 'from-teal-500 to-teal-600' },
        { name: 'Artifact', columns: ['ArtifactID', 'Type', 'URI', 'Checksum', 'Created_at', 'RunID'], color: 'from-yellow-500 to-yellow-600' },
        { name: 'Dataset', columns: ['DatasetID', 'name', 'version', 'URL', 'type', 'ProjectID'], color: 'from-indigo-500 to-indigo-600' },
        { name: 'Environment', columns: ['EnvironmentID', 'Name', 'Framework', 'Python_Version', 'GPU_Cores', 'CPU_Cores', 'RunID'], color: 'from-red-500 to-red-600' }
    ]

    const operators = ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN', 'IS NULL', 'IS NOT NULL']
    const aggregateFunctions = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX']

    const getTableColumns = (tableName: string) => {
        return tables.find(t => t.name === tableName)?.columns || []
    }

    const addWhereCondition = () => {
        setWhereConditions([...whereConditions, { column: '', operator: '=', value: '' }])
    }

    const updateWhereCondition = (index: number, field: string, value: string) => {
        const updated = [...whereConditions]
        updated[index] = { ...updated[index], [field]: value }
        setWhereConditions(updated)
    }

    const removeWhereCondition = (index: number) => {
        setWhereConditions(whereConditions.filter((_, i) => i !== index))
    }

    useEffect(() => {
        generateQuery()
    }, [selectedTable, selectedColumns, whereConditions, orderBy, orderDirection, limit, joinTable, joinType, joinCondition, groupBy, havingCondition, aggregateFunction, aggregateColumn])

    const generateQuery = () => {
        if (!selectedTable) {
            setGeneratedQuery('')
            return
        }

        let query = 'SELECT '

        if (aggregateFunction && aggregateColumn) {
            query += `${aggregateFunction}(${aggregateColumn}) AS ${aggregateFunction}_${aggregateColumn}`
            if (selectedColumns.length > 0) {
                query += ', ' + selectedColumns.join(', ')
            }
        } else if (selectedColumns.length > 0) {
            query += selectedColumns.join(', ')
        } else {
            query += '*'
        }

        query += ` FROM \`${selectedTable}\``

        if (joinTable && joinCondition) {
            query += ` ${joinType} JOIN \`${joinTable}\` ON ${joinCondition}`
        }

        if (whereConditions.length > 0) {
            const conditions = whereConditions
                .filter(c => c.column)
                .map(c => {
                    if (c.operator === 'IS NULL' || c.operator === 'IS NOT NULL') {
                        return `${c.column} ${c.operator}`
                    }
                    if (c.operator === 'LIKE') {
                        return `${c.column} ${c.operator} '%${c.value}%'`
                    }
                    if (c.operator === 'IN') {
                        return `${c.column} ${c.operator} (${c.value})`
                    }
                    return `${c.column} ${c.operator} '${c.value}'`
                })
            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ')
            }
        }

        if (groupBy) {
            query += ` GROUP BY ${groupBy}`
        }

        if (havingCondition && groupBy) {
            query += ` HAVING ${havingCondition}`
        }

        if (orderBy) {
            query += ` ORDER BY ${orderBy} ${orderDirection}`
        }

        if (limit) {
            query += ` LIMIT ${limit}`
        }

        query += ';'
        setGeneratedQuery(query)
    }

    const executeQuery = async () => {
        if (!generatedQuery) {
            toast.error('No query to execute')
            return
        }

        setLoading(true)
        setResults(null)

        try {
            const response = await fetch(`${API_URL}/api/query/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: generatedQuery })
            })

            const data = await response.json()

            if (!response.ok) {
                toast.error(data.error || 'Query execution failed')
                setResults({ error: data.error, details: data.details })
                return
            }

            setResults(data)
            toast.success('Query executed successfully!')
        } catch (err: any) {
            toast.error('Failed to execute query')
            setResults({ error: err.message })
        } finally {
            setLoading(false)
        }
    }

    const resetBuilder = () => {
        setSelectedTable('')
        setSelectedColumns([])
        setWhereConditions([])
        setOrderBy('')
        setOrderDirection('ASC')
        setLimit('')
        setJoinTable('')
        setJoinCondition('')
        setGroupBy('')
        setHavingCondition('')
        setAggregateFunction('')
        setAggregateColumn('')
        setResults(null)
    }

    const selectedTableInfo = tables.find(t => t.name === selectedTable)

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Compact Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4"
                >
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-4 border border-gray-200/50">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-md flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    Query Builder
                                </h1>
                                <p className="text-gray-600 text-xs">Visual SQL query constructor</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left Column - Builder Form */}
                    <div className="space-y-3">
                        {/* Table Selection */}
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-3 border border-gray-200/50"
                        >
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                                Table
                            </label>
                            <select
                                value={selectedTable}
                                onChange={(e) => {
                                    setSelectedTable(e.target.value)
                                    setSelectedColumns([])
                                    setJoinTable('')
                                    setJoinCondition('')
                                }}
                                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">Select table...</option>
                                {tables.map(table => (
                                    <option key={table.name} value={table.name}>{table.name}</option>
                                ))}
                            </select>
                            {selectedTableInfo && (
                                <div className={`mt-2 px-2 py-1 rounded bg-gradient-to-r ${selectedTableInfo.color} text-white text-xs flex items-center justify-between`}>
                                    <span className="font-medium">{selectedTableInfo.name}</span>
                                    <span className="opacity-90">{selectedTableInfo.columns.length} cols</span>
                                </div>
                            )}
                        </motion.div>

                        {/* Columns */}
                        <AnimatePresence>
                            {selectedTable && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-3 border border-gray-200/50"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                            Columns
                                        </label>
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                            {selectedColumns.length || 'All'}
                                        </span>
                                    </div>
                                    <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                        <label className="flex items-center gap-2 p-1.5 hover:bg-blue-50 rounded cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={selectedColumns.length === 0}
                                                onChange={() => setSelectedColumns([])}
                                                className="w-3.5 h-3.5 accent-blue-600"
                                            />
                                            <span className="text-xs font-medium text-gray-700 group-hover:text-blue-600">* (All)</span>
                                        </label>
                                        {getTableColumns(selectedTable).map(column => (
                                            <label key={column} className="flex items-center gap-2 p-1.5 hover:bg-blue-50 rounded cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedColumns.includes(column)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedColumns([...selectedColumns, column])
                                                        } else {
                                                            setSelectedColumns(selectedColumns.filter(c => c !== column))
                                                        }
                                                    }}
                                                    className="w-3.5 h-3.5 accent-blue-600"
                                                />
                                                <span className="text-xs text-gray-700 group-hover:text-blue-600">{column}</span>
                                            </label>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Aggregate */}
                        <AnimatePresence>
                            {selectedTable && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-3 border border-gray-200/50"
                                >
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                                        Aggregate <span className="text-gray-400 normal-case">(optional)</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <select
                                            value={aggregateFunction}
                                            onChange={(e) => setAggregateFunction(e.target.value)}
                                            className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                                        >
                                            <option value="">None</option>
                                            {aggregateFunctions.map(func => (
                                                <option key={func} value={func}>{func}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={aggregateColumn}
                                            onChange={(e) => setAggregateColumn(e.target.value)}
                                            className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:bg-gray-100"
                                            disabled={!aggregateFunction}
                                        >
                                            <option value="">Column...</option>
                                            {getTableColumns(selectedTable).map(column => (
                                                <option key={column} value={column}>{column}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {aggregateFunction && aggregateColumn && (
                                        <div className="mt-2 px-2 py-1 bg-purple-50 border border-purple-200 rounded text-xs text-purple-700 font-medium">
                                            {aggregateFunction}({aggregateColumn})
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* JOIN */}
                        <AnimatePresence>
                            {selectedTable && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: -10 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-3 border border-gray-200/50"
                                >
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                                        Join <span className="text-gray-400 normal-case">(optional)</span>
                                    </label>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <select
                                                value={joinType}
                                                onChange={(e) => setJoinType(e.target.value as any)}
                                                className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                            >
                                                <option value="INNER">INNER</option>
                                                <option value="LEFT">LEFT</option>
                                                <option value="RIGHT">RIGHT</option>
                                            </select>
                                            <select
                                                value={joinTable}
                                                onChange={(e) => setJoinTable(e.target.value)}
                                                className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                            >
                                                <option value="">Table...</option>
                                                {tables.filter(t => t.name !== selectedTable).map(table => (
                                                    <option key={table.name} value={table.name}>{table.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="ON condition (e.g., User.userID = Project.userID)"
                                            value={joinCondition}
                                            onChange={(e) => setJoinCondition(e.target.value)}
                                            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100"
                                            disabled={!joinTable}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* WHERE */}
                        <AnimatePresence>
                            {selectedTable && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-3 border border-gray-200/50"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                            Where
                                        </label>
                                        <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                                            {whereConditions.length}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {whereConditions.map((condition, index) => (
                                            <div key={index} className="flex gap-1.5">
                                                <select
                                                    value={condition.column}
                                                    onChange={(e) => updateWhereCondition(index, 'column', e.target.value)}
                                                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                                >
                                                    <option value="">Column...</option>
                                                    {getTableColumns(selectedTable).map(column => (
                                                        <option key={column} value={column}>{column}</option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={condition.operator}
                                                    onChange={(e) => updateWhereCondition(index, 'operator', e.target.value)}
                                                    className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                                >
                                                    {operators.map(op => (
                                                        <option key={op} value={op}>{op}</option>
                                                    ))}
                                                </select>
                                                {!['IS NULL', 'IS NOT NULL'].includes(condition.operator) && (
                                                    <input
                                                        type="text"
                                                        placeholder="Value"
                                                        value={condition.value}
                                                        onChange={(e) => updateWhereCondition(index, 'value', e.target.value)}
                                                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                                    />
                                                )}
                                                <button
                                                    onClick={() => removeWhereCondition(index)}
                                                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={addWhereCondition}
                                            className="w-full px-3 py-1.5 bg-teal-50 text-teal-700 rounded hover:bg-teal-100 text-xs font-medium"
                                        >
                                            + Add Condition
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* GROUP BY & HAVING */}
                        <AnimatePresence>
                            {selectedTable && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-3 border border-gray-200/50"
                                >
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                                        Group By <span className="text-gray-400 normal-case">(optional)</span>
                                    </label>
                                    <select
                                        value={groupBy}
                                        onChange={(e) => setGroupBy(e.target.value)}
                                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    >
                                        <option value="">None</option>
                                        {getTableColumns(selectedTable).map(column => (
                                            <option key={column} value={column}>{column}</option>
                                        ))}
                                    </select>
                                    {groupBy && (
                                        <input
                                            type="text"
                                            placeholder="HAVING condition (e.g., COUNT(*) > 5)"
                                            value={havingCondition}
                                            onChange={(e) => setHavingCondition(e.target.value)}
                                            className="w-full mt-2 px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                        />
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ORDER & LIMIT */}
                        <AnimatePresence>
                            {selectedTable && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-3 border border-gray-200/50"
                                >
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                                        Order & Limit
                                    </label>
                                    <div className="grid grid-cols-3 gap-2 mb-2">
                                        <select
                                            value={orderBy}
                                            onChange={(e) => setOrderBy(e.target.value)}
                                            className="col-span-2 px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                                        >
                                            <option value="">No order</option>
                                            {getTableColumns(selectedTable).map(column => (
                                                <option key={column} value={column}>{column}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={orderDirection}
                                            onChange={(e) => setOrderDirection(e.target.value as any)}
                                            className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:border-pink-500 focus:ring-1 focus:ring-pink-500 disabled:bg-gray-100"
                                            disabled={!orderBy}
                                        >
                                            <option value="ASC">ASC</option>
                                            <option value="DESC">DESC</option>
                                        </select>
                                    </div>
                                    <input
                                        type="number"
                                        placeholder="LIMIT (optional)"
                                        value={limit}
                                        onChange={(e) => setLimit(e.target.value)}
                                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Action Buttons */}
                        <AnimatePresence>
                            {selectedTable && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="flex gap-2"
                                >
                                    <button
                                        onClick={executeQuery}
                                        disabled={loading || !generatedQuery}
                                        className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed font-medium text-sm shadow-sm"
                                    >
                                        {loading ? 'Executing...' : 'Execute Query'}
                                    </button>
                                    <button
                                        onClick={resetBuilder}
                                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-medium text-sm shadow-sm"
                                    >
                                        Reset
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Column - Query & Results */}
                    <div className="space-y-3">
                        {/* Generated Query */}
                        <AnimatePresence>
                            {generatedQuery && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-3 border border-gray-200/50"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                            SQL Query
                                        </label>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(generatedQuery)
                                                toast.success('Copied!')
                                            }}
                                            className="px-2 py-1 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <pre className="bg-gray-900 text-green-400 p-3 rounded-md overflow-x-auto text-xs font-mono border border-gray-700">
                                        {generatedQuery}
                                    </pre>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Results */}
                        <AnimatePresence>
                            {results && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-3 border border-gray-200/50"
                                >
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                                        Results
                                    </label>
                                    {results.error ? (
                                        <div className="bg-red-50 border border-red-200 rounded p-3">
                                            <p className="text-red-800 font-medium text-sm">Error:</p>
                                            <p className="text-red-600 text-xs mt-1">{results.error}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mb-2 px-2 py-1 bg-blue-50 rounded text-xs">
                                                <span className="text-gray-700 font-medium">
                                                    Rows: <span className="font-bold text-blue-600">{results.rowCount || 0}</span>
                                                </span>
                                            </div>
                                            {results.data && Array.isArray(results.data) && results.data.length > 0 ? (
                                                <div className="overflow-auto max-h-96 border border-gray-200 rounded custom-scrollbar">
                                                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                                                        <thead className="bg-gray-50 sticky top-0">
                                                            <tr>
                                                                {Object.keys(results.data[0]).map((key) => (
                                                                    <th key={key} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                                        {key}
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {results.data.map((row: any, idx: number) => (
                                                                <tr key={idx} className="hover:bg-blue-50">
                                                                    {Object.values(row).map((val: any, cellIdx: number) => (
                                                                        <td key={cellIdx} className="px-3 py-2 text-gray-900 whitespace-nowrap">
                                                                            {val === null ? (
                                                                                <span className="text-gray-400 italic">null</span>
                                                                            ) : typeof val === 'object' ? (
                                                                                <span className="text-purple-600 font-mono">{JSON.stringify(val)}</span>
                                                                            ) : (
                                                                                String(val)
                                                                            )}
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-center">
                                                    <p className="text-blue-800 text-sm">No results found</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Custom Scrollbar */}
                <style jsx global>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 6px;
                        height: 6px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: #f1f5f9;
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: linear-gradient(to bottom, #3b82f6, #6366f1);
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: linear-gradient(to bottom, #2563eb, #4f46e5);
                    }
                `}</style>
            </div>
        </div>
    )
}
