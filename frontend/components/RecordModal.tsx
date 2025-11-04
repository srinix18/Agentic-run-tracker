"use client"
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
const MotionDiv: any = (motion as any).div

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function RecordModal({ open, onClose, onSave, initial, table }: any) {
  const [form, setForm] = useState<any>({})
  const [schema, setSchema] = useState<any[]>([])
  const { isAdmin } = useAuth()

  useEffect(() => {
    setForm(initial || {})
    // Fetch schema information when modal opens
    if (open && table) {
      fetchSchema()
    }
  }, [initial, open, table])

  async function fetchSchema() {
    try {
      const response = await fetch(`${API_URL}/api/meta/schema/${table}`)
      const data = await response.json()
      setSchema(data.columns || [])
    } catch (error) {
      console.error('Failed to fetch schema:', error)
    }
  }

  function handleChange(k: string, v: any) {
    setForm((s: any) => ({ ...s, [k]: v }))
  }

  function hasDefaultValue(columnName: string): boolean {
    const col = schema.find(c => c.name === columnName)
    return col && (col.defaultValue !== null || col.extra?.toLowerCase().includes('auto_increment'))
  }

  function getDefaultLabel(columnName: string): string {
    const col = schema.find(c => c.name === columnName)
    if (!col) return ''
    if (col.extra?.toLowerCase().includes('auto_increment')) return '(auto-increment)'
    if (col.defaultValue) {
      const defaultVal = col.defaultValue.toString()
      if (defaultVal.includes('CURRENT_TIMESTAMP')) return '(auto: current timestamp)'
      return `(default: ${defaultVal})`
    }
    return '(auto)'
  }

  // Check if we're editing: initial has a non-empty ID field value
  const firstValue = initial ? Object.values(initial)[0] : null
  const isEditing = firstValue && String(firstValue).trim() !== ''

  if (!open) return null

  // If user is not admin, show a message instead of the form
  if (!isAdmin()) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
        <MotionDiv
          layout
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 w-full max-w-md bg-white rounded-lg p-6 shadow-lg my-8 text-center"
        >
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-medium mb-2">Access Restricted</h3>
          <p className="text-gray-600 mb-6">
            Only administrators can create or edit records. Please contact your admin for assistance.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </MotionDiv>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <MotionDiv
        layout
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-full max-w-2xl bg-white rounded-lg p-4 md:p-6 shadow-lg my-8"
      >
        <h3 className="text-lg md:text-xl font-medium mb-4">
          {isEditing ? 'Edit Record' : 'Create New Record'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-auto">
          {Object.keys(form).slice(0, 20).map((k) => {
            // Check if field has default value
            const hasDefault = hasDefaultValue(k)
            const defaultLabel = getDefaultLabel(k)

            // Format value for display (handle dates)
            let displayValue = form[k] ?? ''
            if (displayValue && typeof displayValue === 'string' && displayValue.includes('T')) {
              // Format ISO date string to readable format
              try {
                const date = new Date(displayValue)
                displayValue = date.toLocaleString()
              } catch (e) {
                // Keep original if parsing fails
              }
            }

            return (
              <div key={k} className="flex flex-col">
                <label className="text-xs md:text-sm text-gray-600 mb-1 font-medium">
                  {k} {hasDefault && !isEditing && <span className="text-green-600 text-xs">{defaultLabel}</span>}
                </label>
                {hasDefault && !isEditing ? (
                  <input
                    value={defaultLabel}
                    disabled
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-green-50 text-gray-600 cursor-not-allowed"
                  />
                ) : (
                  <input
                    value={displayValue}
                    onChange={(e) => handleChange(k, e.target.value)}
                    disabled={!!(hasDefault && isEditing)}
                    className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${hasDefault && isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                      }`}
                  />
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            {isEditing ? 'Save Changes' : 'Create Record'}
          </button>
        </div>
      </MotionDiv>
    </div>
  )
}
