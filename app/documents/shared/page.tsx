"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { DocumentFilters } from "@/components/documents/document-filters"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { storage, type EON, type EONViewer, type Category, type Department, type User } from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import { FileText, Share2, Calendar, UserIcon } from "lucide-react"
import Link from "next/link"

interface SharedDocument extends EON {
  sharedBy: User | null
  sharedAt: string
}

export default function SharedDocumentsPage() {
  const { user } = useAuth()
  const [eons, setEons] = useState<SharedDocument[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [filteredEons, setFilteredEons] = useState<SharedDocument[]>([])

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")

  const loadData = () => {
    if (user) {
      console.log("[v0] Loading shared documents for user:", user.email)
      const allEons = storage.getAll<EON>("eons")
      const allViewers = storage.getAll<EONViewer>("eon_viewers")
      const allUsers = storage.getAll<User>("users")

      console.log("[v0] Total eONs:", allEons.length)
      console.log("[v0] Total viewers:", allViewers.length)
      console.log("[v0] User ID:", user.id)

      // Get eONs where user is a viewer
      const userViewers = allViewers.filter((viewer) => viewer.user_id === user.id)
      console.log("[v0] User viewers:", userViewers.length)

      const sharedEons: SharedDocument[] = userViewers
        .map((viewer) => {
          const eon = allEons.find((e) => e.id === viewer.eon_id)
          const sharedBy = allUsers.find((u) => u.id === viewer.added_by_user_id)

          if (eon && eon.state !== "DELETED" && eon.state !== "DRAFT") {
            console.log("[v0] Found shared eON:", eon.subject, "shared by:", sharedBy?.name)
            return {
              ...eon,
              sharedBy,
              sharedAt: viewer.added_at,
            }
          }
          return null
        })
        .filter((eon): eon is SharedDocument => eon !== null)

      console.log("[v0] Final shared eONs:", sharedEons.length)
      setEons(sharedEons)
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
          eon.description_rich.toLowerCase().includes(searchTerm.toLowerCase()) ||
          eon.sharedBy?.name.toLowerCase().includes(searchTerm.toLowerCase()),
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

    // Sort by shared date (newest first)
    filtered.sort((a, b) => new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime())

    setFilteredEons(filtered)
  }, [eons, searchTerm, selectedCategory, selectedDepartment, selectedStatus])

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCategory("")
    setSelectedDepartment("")
    setSelectedStatus("")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getStatusColor = (state: EON["state"]) => {
    switch (state) {
      case "IN_PROCESS":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200"
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200"
      case "CLARIFICATION_SOUGHT":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Shared with Me" />
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
                  <h2 className="text-lg font-semibold">Documents Shared with Me ({filteredEons.length})</h2>
                </div>

                {filteredEons.length === 0 ? (
                  <div className="text-center py-12">
                    <Share2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No shared documents</h3>
                    <p className="text-muted-foreground">
                      {eons.length === 0
                        ? "No documents have been shared with you yet."
                        : "No documents match your current filters."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEons.map((eon) => {
                      const category = categories.find((c) => c.id === eon.category_id)
                      const department = departments.find((d) => d.id === eon.department_id)

                      return (
                        <Card key={eon.id} className="hover:shadow-md transition-shadow duration-200">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <Link href={`/documents/${eon.id}`} className="block">
                                    <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2">
                                      {eon.subject}
                                    </h3>
                                  </Link>
                                  <p className="text-sm text-muted-foreground mt-1">{eon.number}</p>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-3">
                              {/* Status and Category */}
                              <div className="flex items-center justify-between">
                                <Badge className={`text-xs ${getStatusColor(eon.state)}`}>
                                  {eon.state.replace("_", " ")}
                                </Badge>
                                {category && (
                                  <Badge variant="outline" className="text-xs">
                                    {category.name}
                                  </Badge>
                                )}
                              </div>

                              {/* Description Preview */}
                              <div className="text-sm text-muted-foreground line-clamp-2">
                                {eon.description_rich.replace(/<[^>]*>/g, "") || "No description"}
                              </div>

                              {/* Shared Info */}
                              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Shared by:</span>
                                  {eon.sharedBy && (
                                    <div className="flex items-center space-x-1">
                                      <Avatar className="w-4 h-4">
                                        <AvatarFallback className="text-xs">
                                          {getInitials(eon.sharedBy.name)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="font-medium">{eon.sharedBy.name}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Shared on:</span>
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{formatDate(eon.sharedAt)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Footer Info */}
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center space-x-4">
                                  {department && (
                                    <div className="flex items-center space-x-1">
                                      <UserIcon className="w-3 h-3" />
                                      <span>{department.code}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>Created {formatDate(eon.created_at)}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
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
