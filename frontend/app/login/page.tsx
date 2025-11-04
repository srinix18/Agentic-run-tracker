"use client"
import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { motion } from 'framer-motion'
import { LogIn, User, Lock, AlertCircle } from 'lucide-react'

const MotionDiv: any = (motion as any).div

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await login(email, password)
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.')
        } finally {
            setLoading(false)
        }
    }

    const handleDemoLogin = (userType: 'admin' | 'user') => {
        if (userType === 'admin') {
            setEmail('admin@example.com')
            setPassword('admin123')
        } else {
            setEmail('user@example.com')
            setPassword('user123')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
            <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <MotionDiv
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg"
                    >
                        <LogIn className="text-white" size={32} />
                    </MotionDiv>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                    <p className="text-gray-600">Sign in to Agentic Run Tracker</p>
                </div>

                {/* Login Form */}
                <MotionDiv
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl shadow-xl p-8"
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error Message */}
                        {error && (
                            <MotionDiv
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600"
                            >
                                <AlertCircle size={20} />
                                <span className="text-sm">{error}</span>
                            </MotionDiv>
                        )}

                        {/* Email Input */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="text-gray-400" size={20} />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="text-gray-400" size={20} />
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Demo Accounts */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-600 text-center mb-4">Demo Accounts</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => handleDemoLogin('admin')}
                                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all text-sm font-medium"
                            >
                                👑 Admin
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDemoLogin('user')}
                                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all text-sm font-medium"
                            >
                                👤 User
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 text-center mt-3">
                            Click to auto-fill credentials
                        </p>
                    </div>
                </MotionDiv>

                {/* Info Cards */}
                <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white rounded-lg p-4 shadow">
                        <div className="font-semibold text-purple-600 mb-1">Admin Access</div>
                        <div className="text-gray-600 text-xs">Full CRUD operations</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow">
                        <div className="font-semibold text-blue-600 mb-1">User Access</div>
                        <div className="text-gray-600 text-xs">View-only mode</div>
                    </div>
                </div>
            </MotionDiv>
        </div>
    )
}
