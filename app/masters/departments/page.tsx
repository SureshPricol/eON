"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { DataTable } from "@/components/masters/data-table"
import { DepartmentForm } from "@/components/masters/department-form"
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
import { storage, type Department } from "@/lib/storage"
import { useAuth } from "@/lib/auth"

export default function DepartmentsPage() {
  const { user: currentUser } = useAuth()
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null)

  const loadData = () => {
    setDepartments(storage.getAll<Department>("departments"))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAdd = () => {
    setSelectedDepartment(null)
    setShowForm(true)
  }

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department)
    setShowForm(true)
  }

  const handleDelete = (department: Department) => {
    setDepartmentToDelete(department)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (departmentToDelete) {
      storage.delete("departments", departmentToDelete.id)
      if (currentUser) {
        storage.logAction("DELETE_DEPARTMENT", currentUser.id, undefined, {
          deletedDepartment: departmentToDelete.name,
        })
      }
      loadData()
      setShowDeleteDialog(false)
      setDepartmentToDelete(null)
    }
  }

  const columns = [
    { key: "name", label: "Department Name" },
    {
      key: "code",
      label: "Code",
      render: (value: string) => (
        <Badge variant="outline" className="font-mono">
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
          <Header title="Department Management" />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <DataTable
                data={departments}
                columns={columns}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                searchPlaceholder="Search departments..."
                title="Departments"
              />
            </div>
          </main>
        </div>
      </div>

      <DepartmentForm department={selectedDepartment} open={showForm} onOpenChange={setShowForm} onSave={loadData} />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the department "{departmentToDelete?.name}". This action cannot be undone.
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
