"use client"
import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import { Toaster } from 'sonner'
import { Menu, X } from 'lucide-react'

export default function ClientShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // Don't show sidebar on login page
  if (pathname === '/login') {
    return <Toaster position="top-right" />
  }

  return (
    <>
      <Toaster position="top-right" />

      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - responsive */}
      <aside className={`
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        fixed md:relative
        top-0 left-0
        w-72 h-full
        p-4 
        border-r bg-white
        z-40
        transition-transform duration-300 ease-in-out
        overflow-y-auto
      `}>
        <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
      </aside>
    </>
  )
}
