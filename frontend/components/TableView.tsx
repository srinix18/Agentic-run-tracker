"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
const MotionTr: any = (motion as any).tr

export default function TableView({ table, data, onEdit, onDelete }: any) {
  const { isAdmin } = useAuth()
  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6 w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <h3 className="font-medium text-lg md:text-xl">{table}</h3>
        <div className="text-sm text-gray-500">{data?.length || 0} rows</div>
      </div>
      <div className="overflow-x-auto -mx-4 md:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full table-auto text-sm md:text-base">
            <thead className="text-left text-xs md:text-sm text-gray-500 uppercase bg-gray-50">
              <tr>
                {data && data.length > 0 ? Object.keys(data[0]).slice(0, 6).map((c: string) => (
                  <th key={c} className="px-3 md:px-4 py-3 font-medium whitespace-nowrap">{c}</th>
                )) : <th className="px-3 md:px-4 py-3">No columns</th>}
                <th className="px-3 md:px-4 py-3 font-medium whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data && data.length > 0 ? data.map((row: any, i: number) => (
                <MotionTr
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {Object.keys(row).slice(0, 6).map((c) => {
                    let displayValue = row[c]

                    // Format dates for display
                    if (displayValue && typeof displayValue === 'string' && displayValue.includes('T')) {
                      try {
                        const date = new Date(displayValue)
                        displayValue = date.toLocaleString()
                      } catch (e) {
                        // Keep original if parsing fails
                      }
                    }

                    return (
                      <td key={c} className="px-3 md:px-4 py-3 align-top max-w-xs truncate" title={String(displayValue)}>
                        {String(displayValue)}
                      </td>
                    )
                  })}
                  <td className="px-3 md:px-4 py-3 align-top whitespace-nowrap">
                    {isAdmin() ? (
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => onEdit(row)}
                          className="text-sm px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(row)}
                          className="text-sm px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">View only</span>
                    )}
                  </td>
                </MotionTr>
              )) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-500">No rows found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
