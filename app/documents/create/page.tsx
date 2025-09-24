"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { RichTextEditor } from "@/components/documents/rich-text-editor"
import { ApproverSelector } from "@/components/documents/approver-selector"
import { ViewerSelector } from "@/components/documents/viewer-selector"
import { AttachmentUploader } from "@/components/documents/attachment-uploader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { storage, type EON, type Category, type Department, type User, type EONAttachment } from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import { Save, Send, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Approver {
  id: string
  user: User
  is_final: boolean
  order: number
}

export default function CreateDocumentPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Form data
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [approvers, setApprovers] = useState<Approver[]>([])
  const [viewers, setViewers] = useState<User[]>([])
  const [attachments, setAttachments] = useState<EONAttachment[]>([])

  useEffect(() => {
    console.log("[v0] Create eON page loading...")
    console.log("[v0] Current user:", user?.email)

    try {
      const loadedCategories = storage.getAll<Category>("categories").filter((c) => c.is_active)
      const loadedDepartments = storage.getAll<Department>("departments")

      console.log("[v0] Loaded categories:", loadedCategories.length)
      console.log("[v0] Loaded departments:", loadedDepartments.length)

      setCategories(loadedCategories)
      setDepartments(loadedDepartments)
    } catch (error) {
      console.error("[v0] Error loading data:", error)
    }
  }, [user])

  const handleSaveDraft = async () => {
    console.log("[v0] Saving draft...")
    console.log("[v0] Subject:", subject)
    console.log("[v0] User:", user?.email)

    if (!user || !subject.trim()) {
      alert("Please enter a subject.")
      return
    }

    setIsLoading(true)

    try {
      const department = departments.find((d) => d.id === user.department_id)
      console.log("[v0] User department:", department?.name)

      const eonNumber = storage.generateEONNumber(department?.code || "GEN")
      console.log("[v0] Generated eON number:", eonNumber)

      const eonData: Omit<EON, "id" | "created_at" | "updated_at"> = {
        number: eonNumber,
        subject: subject.trim(),
        description_rich: description,
        category_id: categoryId,
        creator_id: user.id,
        department_id: user.department_id,
        submitted_at: undefined,
        final_approver_id: approvers.find((a) => a.is_final)?.user.id,
        state: "DRAFT",
        version: 1,
      }

      console.log("[v0] Creating eON with data:", eonData)
      const newEon = storage.create<EON>("eons", eonData)
      console.log("[v0] Created eON:", newEon.id)

      // Save approvers
      approvers.forEach((approver) => {
        storage.create("eon_approvers", {
          eon_id: newEon.id,
          order_index: approver.order,
          approver_user_id: approver.user.id,
          is_final: approver.is_final,
          action: "NONE",
        })
      })

      // Save viewers
      viewers.forEach((viewer) => {
        storage.create("eon_viewers", {
          eon_id: newEon.id,
          user_id: viewer.id,
          added_by_user_id: user.id,
          added_at: new Date().toISOString(),
        })
      })

      // Save attachments
      attachments.forEach((attachment) => {
        storage.create("eon_attachments", {
          ...attachment,
          eon_id: newEon.id,
        })
      })

      storage.logAction("CREATE_EON_DRAFT", user.id, newEon.id, { subject: newEon.subject })
      console.log("[v0] Draft saved successfully, redirecting to:", `/documents/${newEon.id}`)

      router.push(`/documents/${newEon.id}`)
    } catch (error) {
      console.error("[v0] Error saving draft:", error)
      alert("Error saving draft. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitForApproval = async () => {
    console.log("[v0] Submitting for approval...")
    console.log("[v0] Validation - Subject:", !!subject.trim())
    console.log("[v0] Validation - Category:", !!categoryId)
    console.log("[v0] Validation - Approvers:", approvers.length)
    console.log(
      "[v0] Validation - Final approver:",
      approvers.some((a) => a.is_final),
    )

    if (!user || !subject.trim() || !categoryId || approvers.length === 0) {
      alert("Please fill in all required fields and add at least one approver.")
      return
    }

    if (!approvers.some((a) => a.is_final)) {
      alert("Please designate at least one final approver.")
      return
    }

    setIsLoading(true)

    try {
      const department = departments.find((d) => d.id === user.department_id)
      const eonNumber = storage.generateEONNumber(department?.code || "GEN")

      const eonData: Omit<EON, "id" | "created_at" | "updated_at"> = {
        number: eonNumber,
        subject: subject.trim(),
        description_rich: description,
        category_id: categoryId,
        creator_id: user.id,
        department_id: user.department_id,
        submitted_at: new Date().toISOString(),
        final_approver_id: approvers.find((a) => a.is_final)?.user.id,
        state: "IN_PROCESS",
        version: 1,
      }

      const newEon = storage.create<EON>("eons", eonData)

      // Save approvers
      approvers.forEach((approver) => {
        storage.create("eon_approvers", {
          eon_id: newEon.id,
          order_index: approver.order,
          approver_user_id: approver.user.id,
          is_final: approver.is_final,
          action: "NONE",
        })
      })

      // Save viewers
      viewers.forEach((viewer) => {
        storage.create("eon_viewers", {
          eon_id: newEon.id,
          user_id: viewer.id,
          added_by_user_id: user.id,
          added_at: new Date().toISOString(),
        })
      })

      // Save attachments
      attachments.forEach((attachment) => {
        storage.create("eon_attachments", {
          ...attachment,
          eon_id: newEon.id,
        })
      })

      storage.logAction("SUBMIT_EON_FOR_APPROVAL", user.id, newEon.id, { subject: newEon.subject })
      console.log("[v0] Submitted for approval successfully, redirecting to:", `/documents/${newEon.id}`)

      router.push(`/documents/${newEon.id}`)
    } catch (error) {
      console.error("[v0] Error submitting for approval:", error)
      alert("Error submitting for approval. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const selectedCategory = categories.find((c) => c.id === categoryId)
  const userDepartment = departments.find((d) => d.id === user?.department_id)

  if (!user) {
    return (
      <AuthGuard>
        <div className="flex h-screen bg-background items-center justify-center">
          <div className="text-center">
            <p>Loading user data...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Create eON (Draft)">
            <Link href="/documents/created">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </Header>
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Basic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Document Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="subject">Subject *</Label>
                        <Input
                          id="subject"
                          placeholder="Brief title of the note"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Description *</Label>
                        <div className="mt-1">
                          <RichTextEditor
                            value={description}
                            onChange={setDescription}
                            placeholder="Detailed explanation... Detailed Add fina thwit sn atna ate jont allied pens your stile os titrs tingrds."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="category">Category *</Label>
                          <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="department">Department</Label>
                          <div className="mt-1">
                            <Input
                              value={`Auto-populated: ${userDepartment?.name || "Unknown"}`}
                              disabled
                              className="bg-muted"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Attachments */}
                  <AttachmentUploader attachments={attachments} onChange={setAttachments} userId={user?.id || ""} />

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <Button variant="outline" onClick={handleSaveDraft} disabled={isLoading}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Draft
                    </Button>
                    <Button onClick={handleSubmitForApproval} disabled={isLoading}>
                      <Send className="w-4 h-4 mr-2" />
                      Submit for Approval
                    </Button>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Approval Sequence */}
                  <ApproverSelector approvers={approvers} onChange={setApprovers} />

                  {/* Viewers */}
                  <ViewerSelector viewers={viewers} onChange={setViewers} />

                  {/* Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Category:</span>
                        <span>{selectedCategory?.name || "Not selected"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Department:</span>
                        <span>{userDepartment?.name || "Unknown"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Approvers:</span>
                        <span>{approvers.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Viewers:</span>
                        <span>{viewers.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Attachments:</span>
                        <span>{attachments.length}</span>
                      </div>
                      {approvers.some((a) => a.is_final) && (
                        <div className="pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              Final Approver
                            </Badge>
                            <span className="text-sm">{approvers.find((a) => a.is_final)?.user.name}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
