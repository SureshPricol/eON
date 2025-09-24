"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { DataTable } from "@/components/masters/data-table"
import { CategoryForm } from "@/components/masters/category-form"
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
import { storage, type Category } from "@/lib/storage"
import { useAuth } from "@/lib/auth"

export default function CategoriesPage() {
  const { user: currentUser } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

  const loadData = () => {
    setCategories(storage.getAll<Category>("categories"))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAdd = () => {
    setSelectedCategory(null)
    setShowForm(true)
  }

  const handleEdit = (category: Category) => {
    setSelectedCategory(category)
    setShowForm(true)
  }

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (categoryToDelete) {
      storage.delete("categories", categoryToDelete.id)
      if (currentUser) {
        storage.logAction("DELETE_CATEGORY", currentUser.id, undefined, { deletedCategory: categoryToDelete.name })
      }
      loadData()
      setShowDeleteDialog(false)
      setCategoryToDelete(null)
    }
  }

  const columns = [
    { key: "name", label: "Category Name" },
    {
      key: "is_active",
      label: "Status",
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"}>{value ? "Active" : "Inactive"}</Badge>
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
          <Header title="Category Management" />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <DataTable
                data={categories}
                columns={columns}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                searchPlaceholder="Search categories..."
                title="Categories"
              />
            </div>
          </main>
        </div>
      </div>

      <CategoryForm category={selectedCategory} open={showForm} onOpenChange={setShowForm} onSave={loadData} />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category "{categoryToDelete?.name}". This action cannot be undone.
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
