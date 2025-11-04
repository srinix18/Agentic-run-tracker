"use client"
import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface User {
    userID: string
    fname: string
    lname: string
    email: string
    role: 'user' | 'admin'
    createdAt: string
}

interface AuthContextType {
    user: User | null
    loading: boolean
    login: (email: string, password: string) => Promise<void>
    logout: () => void
    isAdmin: () => boolean
    isAuthenticated: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // Check if user is logged in (from localStorage)
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            setUser(JSON.parse(storedUser))
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        // Redirect to login if not authenticated (except on login page)
        if (!loading && !user && pathname !== '/login') {
            router.push('/login')
        }
    }, [user, loading, pathname, router])

    const login = async (email: string, password: string) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Login failed')
            }

            const data = await response.json()
            setUser(data.user)
            localStorage.setItem('user', JSON.stringify(data.user))
            router.push('/')
        } catch (error: any) {
            throw error
        }
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('user')
        router.push('/login')
    }

    const isAdmin = () => {
        return user?.role === 'admin'
    }

    const isAuthenticated = () => {
        return !!user
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
