"use client"
import React from 'react'
import Link from 'next/link'
import { Home, Table2, Settings, Code, FileCode, Zap, Blocks, LogOut, User, Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface SidebarProps {
  onNavigate?: () => void
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const { user, logout, isAdmin } = useAuth()

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg md:text-xl font-bold mb-6 mt-2 md:mt-0">Agentic</h2>

      {/* User Info */}
      {user && (
        <div className="mb-6 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            {isAdmin() ? (
              <Shield size={16} className="text-purple-600" />
            ) : (
              <User size={16} className="text-blue-600" />
            )}
            <span className="font-semibold text-sm text-gray-900">
              {user.fname} {user.lname}
            </span>
          </div>
          <div className="text-xs text-gray-600">{user.email}</div>
          <div className="mt-2">
            <span className={`text-xs px-2 py-1 rounded-full ${isAdmin()
                ? 'bg-purple-100 text-purple-700'
                : 'bg-blue-100 text-blue-700'
              }`}>
              {isAdmin() ? '👑 Admin' : '👤 User'}
            </span>
          </div>
        </div>
      )}

      <nav className="flex-1">
        <ul className="space-y-2">
          <li>
            <Link
              href="/"
              onClick={onNavigate}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Home size={20} />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link
              href="/tables"
              onClick={onNavigate}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Table2 size={20} />
              <span>Tables</span>
            </Link>
          </li>
          <li>
            <Link
              href="/sql-query"
              onClick={onNavigate}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Code size={20} />
              <span>SQL Query</span>
            </Link>
          </li>
          <li>
            <Link
              href="/query-builder"
              onClick={onNavigate}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Blocks size={20} />
              <span>Query Builder</span>
            </Link>
          </li>
          <li>
            <Link
              href="/functions"
              onClick={onNavigate}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FileCode size={20} />
              <span>Functions & Procedures</span>
            </Link>
          </li>
          <li>
            <Link
              href="/triggers"
              onClick={onNavigate}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Zap size={20} />
              <span>Triggers</span>
            </Link>
          </li>
          <li>
            <Link
              href="/settings"
              onClick={onNavigate}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Settings size={20} />
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Logout Button */}
      {user && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              logout()
              onNavigate?.()
            }}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  )
}
