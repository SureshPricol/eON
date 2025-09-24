"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  storage,
  type EON,
  type Category,
  type Department,
  type User,
  type EONAttachment,
  type EONApprover,
  type EONViewer,
} from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import { Save, Send, ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"

interface Approver {
  id: string
  user: User
  is_final: boolean
  order: number
}

export default function EditDocumentPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const eonId = params.id as string

  const [eon, setEon] = useState<EON | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form data
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [approvers, setApprovers] = useState<Approver[]>([])
  const [viewers, setViewers] = useState<User[]>([])
  const [attachments, setAttachments] = useState<EONAttachment[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const eonData = storage.getById<EON>("eons", eonId)
        if (!eonData) {
          router.push("/documents/created")
          return
        }

        // Check if user can edit this document
        if (eonData.creator_id !== user?.id) {
          router.push("/documents/created")
          return
        }

        // Check if document is still editable
        if (eonData.state !== "DRAFT") {
          router.push(`/documents/${eonId}`)
          return
        }

        setEon(eonData)
        setSubject(eonData.subject)
        setDescription(eonData.description_rich)
        setCategoryId(eonData.category_id)

        // Load approvers
        const eonApprovers = storage.getAll<EONApprover>("eon_approvers").filter((a) => a.eon_id === eonId)
        const approverUsers = eonApprovers.map((a) => {
          const user = storage.getById<User>("users", a.approver_user_id)
          return {
            id: a.id,
            user: user!,
            is_final: a.is_final,
            order: a.order_index,
          }
        })
        setApprovers(approverUsers.sort((a, b) => a.order - b.order))

        // Load viewers
        const eonViewers = storage.getAll<EONViewer>("eon_viewers").filter((v) => v.eon_id === eonId)
        const viewerUsers = eonViewers.map((v) => storage.getById<User>("users", v.user_id)).filter(Boolean) as User[]
        setViewers(viewerUsers)

        // Load attachments
        const eonAttachments = storage.getAll<EONAttachment>("eon_attachments").filter((a) => a.eon_id === eonId)
        setAttachments(eonAttachments)

        setCategories(storage.getAll<Category>("categories").filter((c) => c.is_active))
        setDepartments(storage.getAll<Department>("departments"))
      } catch (error) {
        console.error("Error loading document:", error)
        router.push("/documents/created")
      } finally {
        setLoading(false)
      }
    }

    if (user && eonId) {
      loadData()
    }
  }, [user, eonId, router])

  const handleSaveDraft = async () => {
    if (!user || !eon || !subject.trim()) {
      alert("Please enter a subject.")
      return
    }

    setIsLoading(true)

    try {
      // Update eON
      storage.update<EON>("eons", eon.id, {
        subject: subject.trim(),
        description_rich: description,
        category_id: categoryId,
        final_approver_id: approvers.find((a) => a.is_final)?.user.id,
      })

      // Update approvers - remove old ones and add new ones
      const existingApprovers = storage.getAll<EONApprover>("eon_approvers").filter((a) => a.eon_id === eon.id)
      existingApprovers.forEach((a) => storage.delete("eon_approvers", a.id))

      approvers.forEach((approver) => {
        storage.create("eon_approvers", {
          eon_id: eon.id,
          order_index: approver.order,
          approver_user_id: approver.user.id,
          is_final: approver.is_final,
          action: "NONE",
        })
      })

      // Update viewers
      const existingViewers = storage.getAll<EONViewer>("eon_viewers").filter((v) => v.eon_id === eon.id)
      existingViewers.forEach((v) => storage.delete("eon_viewers", v.id))

      viewers.forEach((viewer) => {
        storage.create("eon_viewers", {
          eon_id: eon.id,
          user_id: viewer.id,
          added_by_user_id: user.id,
          added_at: new Date().toISOString(),
        })
      })

      // Update attachments - remove old ones and add new ones
      const existingAttachments = storage.getAll<EONAttachment>("eon_attachments").filter((a) => a.eon_id === eon.id)
      existingAttachments.forEach((a) => storage.delete("eon_attachments", a.id))

      attachments.forEach((attachment) => {
        storage.create("eon_attachments", {
          ...attachment,
          eon_id: eon.id,
        })
      })

      storage.logAction("UPDATE_EON_DRAFT", user.id, eon.id, { subject })

      router.push(`/documents/${eon.id}`)
    } catch (error) {
      console.error("Error saving draft:", error)
      alert("Error saving draft. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitForApproval = async () => {
    if (!user || !eon || !subject.trim() || !categoryId || approvers.length === 0) {
      alert("Please fill in all required fields and add at least one approver.")
      return
    }

    if (!approvers.some((a) => a.is_final)) {
      alert("Please designate at least one final approver.")
      return
    }

    setIsLoading(true)

    try {
      // Update eON and submit
      storage.update<EON>("eons", eon.id, {
        subject: subject.trim(),
        description_rich: description,
        category_id: categoryId,
        submitted_at: new Date().toISOString(),
        final_approver_id: approvers.find((a) => a.is_final)?.user.id,
        state: "IN_PROCESS",
      })

      // Update approvers
      const existingApprovers = storage.getAll<EONApprover>("eon_approvers").filter((a) => a.eon_id === eon.id)
      existingApprovers.forEach((a) => storage.delete("eon_approvers", a.id))

      approvers.forEach((approver) => {
        storage.create("eon_approvers", {
          eon_id: eon.id,
          order_index: approver.order,
          approver_user_id: approver.user.id,
          is_final: approver.is_final,
          action: "NONE",
        })
      })

      // Update viewers
      const existingViewers = storage.getAll<EONViewer>("eon_viewers").filter((v) => v.eon_id === eon.id)
      existingViewers.forEach((v) => storage.delete("eon_viewers", v.id))

      viewers.forEach((viewer) => {
        storage.create("eon_viewers", {
          eon_id: eon.id,
          user_id: viewer.id,
          added_by_user_id: user.id,
          added_at: new Date().toISOString(),
        })
      })

      // Update attachments
      const existingAttachments = storage.getAll<EONAttachment>("eon_attachments").filter((a) => a.eon_id === eon.id)
      existingAttachments.forEach((a) => storage.delete("eon_attachments", a.id))

      attachments.forEach((attachment) => {
        storage.create("eon_attachments", {
          ...attachment,
          eon_id: eon.id,
        })
      })

      storage.logAction("SUBMIT_EON_FOR_APPROVAL", user.id, eon.id, { subject })

      router.push(`/documents/${eon.id}`)
    } catch (error) {
      console.error("Error submitting for approval:", error)
      alert("Error submitting for approval. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading document...</p>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!eon) {
    return null
  }

  const selectedCategory = categories.find((c) => c.id === categoryId)
  const userDepartment = departments.find((d) => d.id === user?.department_id)

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title={`Edit eON - ${eon.number}`}>
            <Link href={`/documents/${eon.id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </Header>
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              {/* Warning for non-draft documents */}
              {eon.state !== "DRAFT" && (
                <Alert className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This document has been submitted and can no longer be edited. You can only view its details.
                  </AlertDescription>
                </Alert>
              )}

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
                          disabled={eon.state !== "DRAFT"}
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Description *</Label>
                        <div className="mt-1">
                          <RichTextEditor
                            value={description}
                            onChange={setDescription}
                            placeholder="Detailed explanation..."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="category">Category *</Label>
                          <Select value={categoryId} onValueChange={setCategoryId} disabled={eon.state !== "DRAFT"}>
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
                  <AttachmentUploader
                    attachments={attachments}
                    onChange={setAttachments}
                    eonId={eon.id}
                    userId={user?.id || ""}
                  />

                  {/* Action Buttons */}
                  {eon.state === "DRAFT" && (
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
                  )}
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
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant="secondary">{eon.state.replace("_", " ")}</Badge>
                      </div>
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
