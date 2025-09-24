"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { DataTable } from "@/components/masters/data-table"
import { RoleForm } from "@/components/masters/role-form"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { storage, type Role } from "@/lib/storage"
import { useAuth } from "@/lib/auth"

export default function RolesPage() {
  const { user: currentUser } = useAuth()
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)

  const loadData = () => {
    setRoles(storage.getAll<Role>("roles"))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAdd = () => {
    setSelectedRole(null)
    setShowForm(true)
  }

  const handleEdit = (role: Role) => {
    setSelectedRole(role)
    setShowForm(true)
  }

  const handleDelete = (role: Role) => {
    setRoleToDelete(role)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (roleToDelete) {
      storage.delete("roles", roleToDelete.id)
      if (currentUser) {
        storage.logAction("DELETE_ROLE", currentUser.id, undefined, { deletedRole: roleToDelete.name })
      }
      loadData()
      setShowDeleteDialog(false)
      setRoleToDelete(null)
    }
  }

  const columns = [
    { key: "name", label: "Role Name" },
    {
      key: "permissions",
      label: "Permissions",
      render: (value: string[]) => (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 3).map((permission) => (
            <Badge key={permission} variant="outline" className="text-xs">
              {permission}
            </Badge>
          ))}
          {value.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{value.length - 3} more
            </Badge>
          )}
        </div>
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
          <Header title="Role Management" />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <DataTable
                data={roles}
                columns={columns}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                searchPlaceholder="Search roles..."
                title="Roles"
              />
            </div>
          </main>
        </div>
      </div>

      <RoleForm role={selectedRole} open={showForm} onOpenChange={setShowForm} onSave={loadData} />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the role "{roleToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthGuard>
  )
}
