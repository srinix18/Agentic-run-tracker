'use client'

import { useState } from 'react'
import { toast } from 'sonner'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function ProceduresPage() {
    const [results, setResults] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [selectedProcedure, setSelectedProcedure] = useState('')

    // Form states for different procedures
    const [projectId, setProjectId] = useState('')
    const [agentId, setAgentId] = useState('')
    const [userId, setUserId] = useState('')
    const [runId, setRunId] = useState('')
    const [daysOld, setDaysOld] = useState('30')
    const [limit, setLimit] = useState('10')

    const executeProcedure = async (procedureName: string, params: any) => {
        setLoading(true)
        setResults(null)
        setSelectedProcedure(procedureName)

        try {
            const response = await fetch(`${API_URL}/api/procedures/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-role': localStorage.getItem('userRole') || 'user',
                    'x-user-id': localStorage.getItem('userId') || '1'
                },
                body: JSON.stringify({ procedure: procedureName, params })
            })

            const data = await response.json()

            if (!response.ok) {
                toast.error(data.error || 'Failed to execute procedure')
                setResults({ error: data.error })
                return
            }

            setResults(data)
            toast.success(`${procedureName} executed successfully!`)
        } catch (err: any) {
            toast.error('Failed to execute procedure')
            setResults({ error: err.message })
        } finally {
            setLoading(false)
        }
    }

    const procedures = [
        {
            name: 'GetRunsByAgent',
            title: 'Get Runs by Agent',
            description: 'Retrieve all runs for a specific agent',
            color: 'from-blue-500 to-blue-600',
            icon: '🤖',
            params: [{ name: 'Agent ID', key: 'agentId', value: agentId, setter: setAgentId, type: 'number' }],
            execute: () => executeProcedure('GetRunsByAgent', { agentId: parseInt(agentId) })
        },
        {
            name: 'GetRunMetrics',
            title: 'Get Run Metrics',
            description: 'Get all metrics for a specific run',
            color: 'from-purple-500 to-purple-600',
            icon: '📊',
            params: [{ name: 'Run ID', key: 'runId', value: runId, setter: setRunId, type: 'number' }],
            execute: () => executeProcedure('GetRunMetrics', { runId: parseInt(runId) })
        },
        {
            name: 'GetArtifactsForRun',
            title: 'Get Artifacts for Run',
            description: 'Get all artifacts produced by a run',
            color: 'from-green-500 to-green-600',
            icon: '📦',
            params: [{ name: 'Run ID', key: 'runId', value: runId, setter: setRunId, type: 'number' }],
            execute: () => executeProcedure('GetArtifactsForRun', { runId: parseInt(runId) })
        },
        {
            name: 'GetProjectSummary',
            title: 'Get Project Summary',
            description: 'Get comprehensive project statistics including agents and runs',
            color: 'from-orange-500 to-orange-600',
            icon: '📋',
            params: [{ name: 'Project ID', key: 'projectId', value: projectId, setter: setProjectId, type: 'number' }],
            execute: () => executeProcedure('GetProjectSummary', { projectId: parseInt(projectId) })
        },
        {
            name: 'GetRunsWithStepsCount',
            title: 'Get Runs with Steps Count',
            description: 'Get all runs for an agent with step statistics',
            color: 'from-pink-500 to-pink-600',
            icon: '🔢',
            params: [{ name: 'Agent ID', key: 'agentId', value: agentId, setter: setAgentId, type: 'number' }],
            execute: () => executeProcedure('GetRunsWithStepsCount', { agentId: parseInt(agentId) })
        },
        {
            name: 'GetAgentPerformance',
            title: 'Get Agent Performance',
            description: 'Get detailed performance metrics for an agent',
            color: 'from-teal-500 to-teal-600',
            icon: '⚡',
            params: [{ name: 'Agent ID', key: 'agentId', value: agentId, setter: setAgentId, type: 'number' }],
            execute: () => executeProcedure('GetAgentPerformance', { agentId: parseInt(agentId) })
        },
        {
            name: 'GetUserProjectStats',
            title: 'Get User Project Statistics',
            description: 'Get all project statistics for a user',
            color: 'from-yellow-500 to-yellow-600',
            icon: '👤',
            params: [{ name: 'User ID', key: 'userId', value: userId, setter: setUserId, type: 'number' }],
            execute: () => executeProcedure('GetUserProjectStats', { userId: parseInt(userId) })
        },
        {
            name: 'GetProjectDatasets',
            title: 'Get Project Datasets',
            description: 'Get all datasets associated with a project',
            color: 'from-indigo-500 to-indigo-600',
            icon: '💾',
            params: [{ name: 'Project ID', key: 'projectId', value: projectId, setter: setProjectId, type: 'number' }],
            execute: () => executeProcedure('GetProjectDatasets', { projectId: parseInt(projectId) })
        },
        {
            name: 'GetRunTimeline',
            title: 'Get Run Timeline',
            description: 'Get execution timeline with step durations',
            color: 'from-red-500 to-red-600',
            icon: '⏱️',
            params: [{ name: 'Run ID', key: 'runId', value: runId, setter: setRunId, type: 'number' }],
            execute: () => executeProcedure('GetRunTimeline', { runId: parseInt(runId) })
        },
        {
            name: 'GetTopPerformingAgents',
            title: 'Get Top Performing Agents',
            description: 'Get top agents by success rate',
            color: 'from-cyan-500 to-cyan-600',
            icon: '🏆',
            params: [{ name: 'Limit', key: 'limit', value: limit, setter: setLimit, type: 'number' }],
            execute: () => executeProcedure('GetTopPerformingAgents', { limit: parseInt(limit) })
        },
        {
            name: 'ArchiveOldProjects',
            title: 'Archive Old Projects',
            description: 'Archive projects older than specified days',
            color: 'from-gray-500 to-gray-600',
            icon: '📁',
            params: [{ name: 'Days Old', key: 'daysOld', value: daysOld, setter: setDaysOld, type: 'number' }],
            execute: () => executeProcedure('ArchiveOldProjects', { daysOld: parseInt(daysOld) })
        }
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm p-6 border border-gray-200/50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                                    Stored Procedures
                                </h1>
                                <p className="text-gray-600 text-sm mt-1">
                                    Execute database procedures with interactive buttons • {procedures.length} procedures available
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Procedures Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {procedures.map((proc) => (
                        <div
                            key={proc.name}
                            className="bg-white rounded-lg shadow-sm border border-gray-200/50 p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start gap-3 mb-3">
                                <div className={`w-10 h-10 bg-gradient-to-br ${proc.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                                    {proc.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">{proc.title}</h3>
                                    <p className="text-xs text-gray-600 mt-1">{proc.description}</p>
                                </div>
                            </div>

                            {/* Parameters */}
                            <div className="space-y-2 mb-3">
                                {proc.params.map((param) => (
                                    <div key={param.key}>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            {param.name}
                                        </label>
                                        <input
                                            type={param.type}
                                            value={param.value}
                                            onChange={(e) => param.setter(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                            placeholder={`Enter ${param.name.toLowerCase()}`}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Execute Button */}
                            <button
                                onClick={proc.execute}
                                disabled={loading || !proc.params.every(p => p.value)}
                                className={`w-full bg-gradient-to-r ${proc.color} text-white py-2 px-4 rounded-md font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {loading && selectedProcedure === proc.name ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Executing...
                                    </span>
                                ) : (
                                    'Execute Procedure'
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Results Section */}
                {results && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200/50 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Results</h2>
                            <button
                                onClick={() => setResults(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {results.error ? (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-red-800 font-medium">Error</p>
                                <p className="text-red-600 text-sm mt-1">{results.error}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                {results.data && results.data.length > 0 ? (
                                    <div>
                                        <div className="mb-2 text-sm text-gray-600">
                                            {results.data.length} row{results.data.length !== 1 ? 's' : ''} returned
                                        </div>
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    {Object.keys(results.data[0]).map((key) => (
                                                        <th
                                                            key={key}
                                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                        >
                                                            {key}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {results.data.map((row: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        {Object.values(row).map((value: any, cellIdx: number) => (
                                                            <td key={cellIdx} className="px-4 py-3 text-sm text-gray-900">
                                                                {value === null ? (
                                                                    <span className="text-gray-400 italic">NULL</span>
                                                                ) : typeof value === 'object' ? (
                                                                    JSON.stringify(value)
                                                                ) : (
                                                                    String(value)
                                                                )}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        No data returned
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
