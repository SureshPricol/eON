"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { storage, type EON, type EONComment, type User } from "@/lib/storage"
import { MessageSquare, Send, Clock, Eye, Users, Lock } from "lucide-react"

interface CommentSystemProps {
  eon: EON
  currentUserId: string
  onCommentAdded?: () => void
}

export function CommentSystem({ eon, currentUserId, onCommentAdded }: CommentSystemProps) {
  const [comments, setComments] = useState<EONComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [visibility, setVisibility] = useState<"all" | "approvers" | "specific">("all")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadComments = () => {
    const allComments = storage.getEONComments(eon.id)
    // Filter comments based on user permissions
    const visibleComments = allComments.filter((comment) => {
      if (comment.visibility === "all") return true
      if (comment.visibility === "approvers") {
        // Check if user is an approver or creator
        const approvers = storage.getEONApprovers(eon.id)
        const isApprover = approvers.some((a) => a.approver_user_id === currentUserId)
        return isApprover || currentUserId === eon.creator_id
      }
      // For specific visibility, we'd need additional logic to check specific users
      return comment.author_user_id === currentUserId
    })
    setComments(visibleComments)
  }

  useEffect(() => {
    loadComments()
  }, [eon.id, currentUserId])

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const comment = storage.create<EONComment>("eon_comments", {
        eon_id: eon.id,
        author_user_id: currentUserId,
        body_rich: newComment.trim(),
        visibility,
        type: "GENERAL",
      })

      storage.logAction("ADD_COMMENT", currentUserId, eon.id, {
        comment_id: comment.id,
        visibility,
      })

      setNewComment("")
      loadComments()
      onCommentAdded?.()
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours)
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
        hour: "2-digit",
        minute: "2-digit",
      })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getVisibilityIcon = (visibility: EONComment["visibility"]) => {
    switch (visibility) {
      case "all":
        return <Eye className="w-3 h-3" />
      case "approvers":
        return <Users className="w-3 h-3" />
      case "specific":
        return <Lock className="w-3 h-3" />
    }
  }

  const getVisibilityLabel = (visibility: EONComment["visibility"]) => {
    switch (visibility) {
      case "all":
        return "Visible to all"
      case "approvers":
        return "Approvers only"
      case "specific":
        return "Specific users"
    }
  }

  const getCommentTypeColor = (type: EONComment["type"]) => {
    switch (type) {
      case "CLARIFICATION":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "GENERAL":
        return "bg-blue-100 text-blue-800 border-blue-200"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Comment Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="new-comment">Add a comment</Label>
            <Textarea
              id="new-comment"
              placeholder="Share your thoughts, ask questions, or provide feedback..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="mt-1 resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="visibility" className="text-sm">
                Visibility:
              </Label>
              <Select value={visibility} onValueChange={(value: any) => setVisibility(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  <SelectItem value="approvers">Approvers only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSubmitComment} disabled={!newComment.trim() || isSubmitting} size="sm">
              <Send className="w-4 h-4 mr-1" />
              {isSubmitting ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No comments yet. Be the first to add one!</p>
            </div>
          ) : (
            comments.map((comment) => {
              const author = storage.getById<User>("users", comment.author_user_id)

              return (
                <div key={comment.id} className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="text-sm">{author ? getInitials(author.name) : "?"}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{author?.name || "Unknown User"}</span>

                        {comment.type === "CLARIFICATION" && (
                          <Badge className={`text-xs ${getCommentTypeColor(comment.type)}`}>
                            Clarification Request
                          </Badge>
                        )}

                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {getVisibilityIcon(comment.visibility)}
                          <span>{getVisibilityLabel(comment.visibility)}</span>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(comment.created_at)}</span>
                        </div>
                      </div>

                      <div className="bg-muted/30 rounded-lg p-3">
                        <div
                          className="text-sm prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: comment.body_rich }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
