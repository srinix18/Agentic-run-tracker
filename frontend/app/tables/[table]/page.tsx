"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from '../../../contexts/AuthContext'
import { useTable } from '../../../hooks/useTable'
import TableView from '../../../components/TableView'
import RecordModal from '../../../components/RecordModal'
import ConfirmDialog from '../../../components/ConfirmDialog'
import Topbar from '../../../components/Topbar'
import { Toaster, toast } from 'sonner'

const queryClient = new QueryClient()

function TablePageContent({ params }: any) {
  const table = params.table
  const { isAdmin } = useAuth()
  const [page, setPage] = useState(1)
  const { query, create, update, remove } = useTable(table, page, 20)
  const [selected, setSelected] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [lastDeleted, setLastDeleted] = useState<any>(null) // Store deleted record for undo

  function onEdit(row: any) {
    setSelected(row)
    setOpen(true)
  }

  function onDelete(row: any) {
    setSelected(row)
    setConfirmOpen(true)
  }

  async function handleSave(form: any) {
    // Check if we're editing: selected has a non-empty ID field value (not just empty string)
    const firstValue = selected ? Object.values(selected)[0] : null
    const isEditing = firstValue && String(firstValue).trim() !== ''

    try {
      // Filter out auto-generated fields when creating new records
      const cleanedForm = { ...form }
      if (!isEditing) {
        // Remove fields with default values (like CreatedAt, UpdatedAt)
        Object.keys(cleanedForm).forEach(key => {
          const isAutoField = key.toLowerCase().includes('createdat') ||
            key.toLowerCase().includes('updatedat') ||
            key.toLowerCase().includes('timestamp')
          if (isAutoField || cleanedForm[key] === '' || cleanedForm[key] === null) {
            delete cleanedForm[key]
          }
        })
      }

      if (isEditing) {
        const id = Object.values(selected)[0]
        const result = await update.mutateAsync({ id: String(id), payload: cleanedForm })
        if (result && !result.ok) {
          toast.error(result.error || 'Failed to update record')
          return
        }
        toast.success('✅ Record updated successfully!')
      } else {
        const result = await create.mutateAsync(cleanedForm)
        if (result && !result.ok) {
          toast.error(result.error || 'Failed to create record')
          return
        }
        toast.success('✅ Record created successfully!')
      }
      setOpen(false)
      setSelected(null)
    } catch (e: any) {
      const errorMsg = e?.error || e?.message || (isEditing ? 'Failed to update record' : 'Failed to create record')
      toast.error(errorMsg)
      console.error('Save error:', e)
    }
  }

  async function handleConfirmDelete() {
    try {
      const id = Object.values(selected)[0]
      // Store the deleted record for undo functionality
      const deletedRecord = { ...selected }

      const result = await remove.mutateAsync(String(id))
      if (result && !result.ok) {
        toast.error(result.error || 'Delete failed')
        setConfirmOpen(false)
        return
      }

      // Store deleted record and show undo option
      setLastDeleted(deletedRecord)
      setConfirmOpen(false)

      // Show success toast with undo button
      toast.success('✅ Record deleted successfully', {
        duration: 5000,
        action: {
          label: 'Undo',
          onClick: () => handleUndo(deletedRecord)
        }
      })
    } catch (e: any) {
      const errorMsg = e?.error || e?.message || 'Delete failed'
      toast.error(errorMsg)
      setConfirmOpen(false)
      console.error('Delete error:', e)
    }
  }

  async function handleUndo(deletedRecord: any) {
    try {
      // Recreate the deleted record
      const result = await create.mutateAsync(deletedRecord)
      if (result && !result.ok) {
        toast.error(result.error || 'Failed to restore record')
        return
      }
      toast.success('✅ Record restored successfully!')
      setLastDeleted(null)
    } catch (e: any) {
      const errorMsg = e?.error || e?.message || 'Failed to restore record'
      toast.error(errorMsg)
      console.error('Undo error:', e)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <Toaster position="top-right" />
      <Topbar />
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold capitalize">{table}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {query.data?.data?.length || 0} records
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {isAdmin() ? (
            <button
              onClick={() => {
                // Create empty form with all field names from the schema
                const emptyForm = query.data?.data?.[0]
                  ? Object.keys(query.data.data[0]).reduce((acc: any, key) => ({ ...acc, [key]: '' }), {})
                  : {}
                setSelected(emptyForm); // Set to empty form, not null
                setOpen(true)
              }}
              className="flex-1 sm:flex-initial px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              + New Record
            </button>
          ) : (
            <div className="flex-1 sm:flex-initial px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed font-medium text-center">
              🔒 View Only (Admin access required)
            </div>
          )}
        </div>
      </div>
      {query.isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <TableView table={table} data={query.data?.data ?? []} onEdit={onEdit} onDelete={onDelete} />

          {/* Pagination Controls */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">
              Page {page}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!query.data?.data || query.data.data.length < 20}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      <RecordModal open={open} onClose={() => setOpen(false)} onSave={handleSave} initial={selected} table={table} />
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Delete"
        body="Are you sure you want to delete this record? This action cannot be undone."
      />
    </div>
  )
}

export default function TablePage({ params }: any) {
  return (
    <QueryClientProvider client={queryClient}>
      <TablePageContent params={params} />
    </QueryClientProvider>
  )
}
