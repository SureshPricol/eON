"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { storage, type EONComment, type User } from "@/lib/storage"
import { Reply, Clock, ChevronDown, ChevronUp } from "lucide-react"

interface CommentThreadProps {
  comment: EONComment
  currentUserId: string
  onReply?: (parentId: string, reply: string) => void
  depth?: number
}

export function CommentThread({ comment, currentUserId, onReply, depth = 0 }: CommentThreadProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(depth < 2) // Auto-expand first 2 levels
  const [replies, setReplies] = useState<EONComment[]>([])

  const author = storage.getById<User>("users", comment.author_user_id)

  useEffect(() => {
    // In a real implementation, you'd have a parent_comment_id field
    // For now, we'll simulate this with a simple approach
    setReplies([])
  }, [comment.id])

  const handleSubmitReply = async () => {
    if (!replyText.trim() || !onReply) return

    setIsSubmitting(true)
    try {
      await onReply(comment.id, replyText.trim())
      setReplyText("")
      setShowReplyForm(false)
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
      return `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours)
      return `${hours}h ago`
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
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

  const maxDepth = 3
  const shouldShowReplies = depth < maxDepth

  return (
    <div className={`space-y-3 ${depth > 0 ? "ml-6 border-l-2 border-muted pl-4" : ""}`}>
      <Card className={`${depth > 0 ? "bg-muted/20" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="text-sm">{author ? getInitials(author.name) : "?"}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{author?.name || "Unknown User"}</span>

                {comment.type === "CLARIFICATION" && (
                  <Badge className="text-xs bg-orange-100 text-orange-800 border-orange-200">Clarification</Badge>
                )}

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(comment.created_at)}</span>
                </div>
              </div>

              <div className="text-sm">
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: comment.body_rich }} />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                {shouldShowReplies && onReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="h-7 px-2 text-xs"
                  >
                    <Reply className="w-3 h-3 mr-1" />
                    Reply
                  </Button>
                )}

                {replies.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-7 px-2 text-xs"
                  >
                    {isExpanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                    {replies.length} {replies.length === 1 ? "reply" : "replies"}
                  </Button>
                )}
              </div>

              {/* Reply Form */}
              {showReplyForm && (
                <div className="space-y-2 pt-2">
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={2}
                    className="resize-none text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSubmitReply} disabled={!replyText.trim() || isSubmitting}>
                      {isSubmitting ? "Posting..." : "Post Reply"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowReplyForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Replies */}
      {shouldShowReplies && isExpanded && replies.length > 0 && (
        <div className="space-y-3">
          {replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
