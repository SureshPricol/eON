"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { DocumentCard } from "@/components/documents/document-card"
import { DocumentFilters } from "@/components/documents/document-filters"
import { Button } from "@/components/ui/button"
import { storage, type EON, type Category, type Department } from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import { Archive, RotateCcw } from "lucide-react"

export default function ArchivedDocumentsPage() {
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

  const loadData = () => {
    if (user) {
      const allEons = storage.getAll<EON>("eons")
      const archivedEons = allEons.filter((eon) => eon.state === "ARCHIVED" && eon.creator_id === user.id)
      setEons(archivedEons)
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

    // Sort by created date (newest first)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setFilteredEons(filtered)
  }, [eons, searchTerm, selectedCategory, selectedDepartment, selectedStatus])

  const handleRestore = (eon: EON) => {
    if (user) {
      // Restore to previous state (for demo, we'll set to APPROVED)
      storage.update<EON>("eons", eon.id, { state: "APPROVED" })
      storage.logAction("RESTORE_EON", user.id, eon.id, { subject: eon.subject })
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
          <Header title="Archived Documents" />
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
                  <h2 className="text-lg font-semibold">Archived Documents ({filteredEons.length})</h2>
                </div>

                {filteredEons.length === 0 ? (
                  <div className="text-center py-12">
                    <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No archived documents</h3>
                    <p className="text-muted-foreground">
                      {eons.length === 0
                        ? "You haven't archived any documents yet."
                        : "No documents match your current filters."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEons.map((eon) => (
                      <div key={eon.id} className="relative">
                        <DocumentCard eon={eon} showActions={false} />
                        <div className="absolute top-4 right-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore(eon)}
                            className="bg-background/80 backdrop-blur-sm"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Restore
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
