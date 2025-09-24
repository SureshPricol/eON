"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { DataTable } from "@/components/masters/data-table"
import { UserForm } from "@/components/masters/user-form"
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
import { storage, type User, type Department } from "@/lib/storage"
import { useAuth } from "@/lib/auth"

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  const loadData = () => {
    setUsers(storage.getAll<User>("users"))
    setDepartments(storage.getAll<Department>("departments"))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAdd = () => {
    setSelectedUser(null)
    setShowForm(true)
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setShowForm(true)
  }

  const handleDelete = (user: User) => {
    setUserToDelete(user)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (userToDelete) {
      storage.delete("users", userToDelete.id)
      if (currentUser) {
        storage.logAction("DELETE_USER", currentUser.id, undefined, { deletedUser: userToDelete.email })
      }
      loadData()
      setShowDeleteDialog(false)
      setUserToDelete(null)
    }
  }

  const getDepartmentName = (departmentId: string) => {
    const dept = departments.find((d) => d.id === departmentId)
    return dept?.name || "Unknown"
  }

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "department_id",
      label: "Department",
      render: (value: string) => getDepartmentName(value),
    },
    {
      key: "roles",
      label: "Roles",
      render: (value: string[]) => (
        <div className="flex flex-wrap gap-1">
          {value.map((role) => (
            <Badge key={role} variant="secondary" className="text-xs">
              {role}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => <Badge variant={value === "active" ? "default" : "secondary"}>{value}</Badge>,
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
          <Header title="User Management" />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <DataTable
                data={users}
                columns={columns}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                searchPlaceholder="Search users..."
                title="Users"
              />
            </div>
          </main>
        </div>
      </div>

      <UserForm user={selectedUser} open={showForm} onOpenChange={setShowForm} onSave={loadData} />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user "{userToDelete?.name}". This action cannot be undone.
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
