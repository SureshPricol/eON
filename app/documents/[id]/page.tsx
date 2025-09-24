"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { ApprovalActions } from "@/components/documents/approval-actions"
import { ApprovalSequence } from "@/components/documents/approval-sequence"
import { CommentSection } from "@/components/documents/comment-section"
import { ActivityTimeline } from "@/components/documents/activity-timeline"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  storage,
  type EON,
  type User,
  type Category,
  type Department,
  type EONAttachment,
  type EONComment,
} from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import { ArrowLeft, FileText, Calendar, UserIcon, Tag, Building, Paperclip, Eye } from "lucide-react"
import Link from "next/link"

export default function DocumentDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const eonId = params.id as string

  const [eon, setEon] = useState<EON | null>(null)
  const [creator, setCreator] = useState<User | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [department, setDepartment] = useState<Department | null>(null)
  const [attachments, setAttachments] = useState<EONAttachment[]>([])
  const [comments, setComments] = useState<(EONComment & { author: User })[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = () => {
    try {
      const eonData = storage.getById<EON>("eons", eonId)
      if (!eonData) {
        return
      }

      setEon(eonData)
      setCreator(storage.getById<User>("users", eonData.creator_id))
      setCategory(storage.getById<Category>("categories", eonData.category_id))
      setDepartment(storage.getById<Department>("departments", eonData.department_id))

      // Load attachments
      const eonAttachments = storage.getAll<EONAttachment>("eon_attachments").filter((a) => a.eon_id === eonId)
      setAttachments(eonAttachments)

      // Load comments with authors
      const eonComments = storage
        .getAll<EONComment>("eon_comments")
        .filter((c) => c.eon_id === eonId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

      const commentsWithAuthors = eonComments
        .map((comment) => {
          const author = storage.getById<User>("users", comment.author_user_id)
          return {
            ...comment,
            author: author!,
          }
        })
        .filter((c) => c.author)

      setComments(commentsWithAuthors)
    } catch (error) {
      console.error("Error loading document:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (eonId) {
      loadData()
    }
  }, [eonId])

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
    return (
      <AuthGuard>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Document not found</h3>
              <p className="text-muted-foreground mb-4">The document you're looking for doesn't exist.</p>
              <Link href="/documents/created">
                <Button>Go Back</Button>
              </Link>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  const getStatusColor = (state: EON["state"]) => {
    switch (state) {
      case "DRAFT":
        return "status-draft"
      case "IN_PROCESS":
        return "status-in-process"
      case "APPROVED":
        return "status-approved"
      case "REJECTED":
        return "status-rejected"
      case "CLARIFICATION_SOUGHT":
        return "status-clarification"
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  // Check if user can comment (all participants can comment except in DRAFT state)
  const canComment = eon.state !== "DRAFT" && user !== null

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="E-Office Note (eON) Detail">
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
                  {/* Document Header */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <Badge className={`status-badge ${getStatusColor(eon.state)}`}>
                            STATUS: {eon.state.replace("_", " ")}
                          </Badge>
                          <h1 className="text-2xl font-bold text-foreground">{eon.subject}</h1>
                          <p className="text-muted-foreground">{eon.number}</p>
                        </div>
                        {eon.state === "DRAFT" && eon.creator_id === user?.id && (
                          <Link href={`/documents/edit/${eon.id}`}>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="text-muted-foreground">Creator</div>
                            <div className="font-medium">{creator?.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="text-muted-foreground">Category</div>
                            <div className="font-medium">{category?.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="text-muted-foreground">Department</div>
                            <div className="font-medium">{department?.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="text-muted-foreground">Created</div>
                            <div className="font-medium">{new Date(eon.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Document Content */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: eon.description_rich || "No description provided." }} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tabs */}
                  <Tabs defaultValue="timeline" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="timeline">Timeline</TabsTrigger>
                      <TabsTrigger value="approvals">Approvals</TabsTrigger>
                      <TabsTrigger value="comments">Comments</TabsTrigger>
                      <TabsTrigger value="files">Files</TabsTrigger>
                      <TabsTrigger value="audit">Audit</TabsTrigger>
                    </TabsList>

                    <TabsContent value="timeline" className="space-y-4">
                      <ActivityTimeline eonId={eonId} />
                    </TabsContent>

                    <TabsContent value="approvals">
                      <ApprovalSequence eon={eon} onUpdate={loadData} />
                    </TabsContent>

                    <TabsContent value="comments" className="space-y-4">
                      <CommentSection eonId={eonId} canComment={canComment} />
                    </TabsContent>

                    <TabsContent value="files" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Paperclip className="w-4 h-4" />
                            Files ({attachments.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {attachments.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Paperclip className="w-8 h-8 mx-auto mb-2" />
                              <p className="text-sm">No files attached</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {attachments.map((attachment) => (
                                <div key={attachment.id} className="flex items-center gap-3 p-3 border rounded-lg">
                                  <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">{attachment.filename}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatFileSize(attachment.size)} • Added{" "}
                                      {new Date(attachment.added_at).toLocaleDateString()}
                                    </div>
                                  </div>
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={attachment.file_url} target="_blank" rel="noopener noreferrer">
                                      <Eye className="w-4 h-4 mr-2" />
                                      View
                                    </a>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="audit" className="space-y-4">
                      <ActivityTimeline eonId={eonId} />
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Actions */}
                  <ApprovalActions eon={eon} onUpdate={loadData} />

                  {/* Document Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Document Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Number:</span>
                        <span className="font-mono">{eon.number}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Version:</span>
                        <span>{eon.version}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{new Date(eon.created_at).toLocaleDateString()}</span>
                      </div>
                      {eon.submitted_at && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Submitted:</span>
                          <span>{new Date(eon.submitted_at).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Attachments:</span>
                        <span>{attachments.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Comments:</span>
                        <span>{comments.length}</span>
                      </div>
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
