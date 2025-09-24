// Simple authentication context for demo purposes
"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type User, type Role, storage } from "./storage"

interface AuthContextType {
  user: User | null
  login: (email: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  hasPermission: (permission: string) => boolean
  isAdmin: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      console.log("[v0] Initializing auth...")

      // Ensure storage is initialized first
      storage.initializeDefaultData()

      // Check for stored session
      const storedUserId = localStorage.getItem("eon_current_user_id")
      console.log("[v0] Stored user ID:", storedUserId)

      if (storedUserId) {
        const foundUser = storage.getById<User>("users", storedUserId)
        console.log("[v0] Found stored user:", foundUser?.email)
        if (foundUser) {
          setUser(foundUser)
        }
      }

      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string): Promise<boolean> => {
    console.log("[v0] Attempting login for:", email)

    // Ensure storage is initialized
    storage.initializeDefaultData()

    const users = storage.getAll<User>("users")
    console.log(
      "[v0] Available users:",
      users.map((u) => u.email),
    )

    const foundUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.status === "active")
    console.log("[v0] Found user:", foundUser?.email)

    if (foundUser) {
      setUser(foundUser)
      localStorage.setItem("eon_current_user_id", foundUser.id)
      storage.logAction("LOGIN", foundUser.id)
      console.log("[v0] Login successful for:", foundUser.email)
      return true
    }

    console.log("[v0] Login failed for:", email)
    return false
  }

  const logout = () => {
    if (user) {
      storage.logAction("LOGOUT", user.id)
    }
    setUser(null)
    localStorage.removeItem("eon_current_user_id")
    console.log("[v0] User logged out, localStorage cleared")
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false

    const roles = storage.getAll<Role>("roles")
    const userRoles = roles.filter((role) => user.roles.includes(role.name))

    return userRoles.some((role) => role.permissions.includes(permission))
  }

  const isAdmin = (): boolean => {
    return user?.roles.includes("Admin") || false
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, hasPermission, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Helper function to check if a user is admin
export function isAdmin(user: User | null): boolean {
  return user?.roles.includes("Admin") || false
}
