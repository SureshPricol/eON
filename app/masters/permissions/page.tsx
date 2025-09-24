"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { DataTable } from "@/components/masters/data-table"
import { Badge } from "@/components/ui/badge"
import { storage, type Permission } from "@/lib/storage"

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([])

  const loadData = () => {
    setPermissions(storage.getAll<Permission>("permissions"))
  }

  useEffect(() => {
    loadData()
  }, [])

  const columns = [
    { key: "name", label: "Permission Name" },
    { key: "description", label: "Description" },
    {
      key: "module",
      label: "Module",
      render: (value: string) => (
        <Badge variant="outline" className="capitalize">
          {value}
        </Badge>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ]

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Permission Management" />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <DataTable
                data={permissions}
                columns={columns}
                searchPlaceholder="Search permissions..."
                title="Permissions"
              />
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
