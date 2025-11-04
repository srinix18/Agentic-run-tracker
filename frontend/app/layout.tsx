import './globals.css'
import React from 'react'
import ClientShell from '../components/ClientShell'
import { AuthProvider } from '../contexts/AuthContext'
import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata = {
  title: 'Agentic Run Tracker',
  description: 'Dashboard to browse and manage runs, agents, projects and datasets',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-gray-50 text-gray-900 font-sans">
        <AuthProvider>
          <div className="min-h-screen flex flex-col md:flex-row">
            <ClientShell />
            <main className="flex-1 p-4 md:p-6 w-full overflow-x-hidden">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
