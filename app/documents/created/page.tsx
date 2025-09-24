"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { DocumentCard } from "@/components/documents/document-card"
import { DocumentFilters } from "@/components/documents/document-filters"
import { Button } from "@/components/ui/button"
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
import { storage, type EON, type Category, type Department } from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import { Plus, FileText } from "lucide-react"

export default function CreatedDocumentsPage() {
  const { user } = useAuth()
  const [eons, setEons] = useState<EON[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [filteredEons, setFilteredEons] = useState<EON[]>([])

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")

  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [eonToDelete, setEonToDelete] = useState<EON | null>(null)

  const loadData = () => {
    if (user) {
      const allEons = storage.getAll<EON>("eons")
      const userEons = allEons.filter((eon) => eon.creator_id === user.id && eon.state !== "DELETED")
      console.log("[v0] Loading data for user:", user.email)
      console.log("[v0] User ID:", user.id)
      console.log("[v0] All eONs:", allEons.length)
      console.log("[v0] User's eONs:", userEons.length)
      console.log(
        "[v0] User's eON details:",
        userEons.map((eon) => ({ id: eon.id, subject: eon.subject, creator_id: eon.creator_id })),
      )
      setEons(userEons)
    }
    setCategories(storage.getAll<Category>("categories"))
    setDepartments(storage.getAll<Department>("departments"))
  }

  useEffect(() => {
    loadData()
  }, [user])

  // Apply filters
  useEffect(() => {
    let filtered = eons

    if (searchTerm) {
      filtered = filtered.filter(
        (eon) =>
          eon.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          eon.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          eon.description_rich.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedCategory) {
      filtered = filtered.filter((eon) => eon.category_id === selectedCategory)
    }

    if (selectedDepartment) {
      filtered = filtered.filter((eon) => eon.department_id === selectedDepartment)
    }

    if (selectedStatus) {
      filtered = filtered.filter((eon) => eon.state === selectedStatus)
    }

    // Sort by created date (newest first)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setFilteredEons(filtered)
  }, [eons, searchTerm, selectedCategory, selectedDepartment, selectedStatus])

  const handleEdit = (eon: EON) => {
    // Navigate to edit page
    window.location.href = `/documents/edit/${eon.id}`
  }

  const handleDelete = (eon: EON) => {
    setEonToDelete(eon)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (eonToDelete && user) {
      storage.update<EON>("eons", eonToDelete.id, { state: "DELETED" })
      storage.logAction("DELETE_EON", user.id, eonToDelete.id, { subject: eonToDelete.subject })
      loadData()
      setShowDeleteDialog(false)
      setEonToDelete(null)
    }
  }

  const handleArchive = (eon: EON) => {
    if (user) {
      storage.update<EON>("eons", eon.id, { state: "ARCHIVED" })
      storage.logAction("ARCHIVE_EON", user.id, eon.id, { subject: eon.subject })
      loadData()
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCategory("")
    setSelectedDepartment("")
    setSelectedStatus("")
  }

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="My Documents">
            <Link href="/documents/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create eON
              </Button>
            </Link>
          </Header>
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Filters */}
              <DocumentFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedDepartment={selectedDepartment}
                onDepartmentChange={setSelectedDepartment}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                categories={categories}
                departments={departments}
                onClearFilters={clearFilters}
              />

              {/* Results */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Documents Created by Me ({filteredEons.length})</h2>
                </div>

                {filteredEons.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No documents found</h3>
                    <p className="text-muted-foreground mb-4">
                      {eons.length === 0
                        ? "You haven't created any documents yet."
                        : "No documents match your current filters."}
                    </p>
                    {eons.length === 0 && (
                      <Link href="/documents/create">
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Your First eON
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEons.map((eon) => (
                      <DocumentCard
                        key={eon.id}
                        eon={eon}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onArchive={handleArchive}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the document "{eonToDelete?.subject}". This action cannot be undone.
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
