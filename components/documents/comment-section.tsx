"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { storage, type EONComment, type User } from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import { MessageSquare, Send, Clock } from "lucide-react"
import { format } from "date-fns"

interface CommentSectionProps {
  eonId: string
  canComment: boolean
}

export function CommentSection({ eonId, canComment }: CommentSectionProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<EONComment[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadComments()
    setUsers(storage.getAll<User>("users"))
  }, [eonId])

  const loadComments = () => {
    const allComments = storage.getAll<EONComment>("eon_comments")
    const eonComments = allComments
      .filter((comment) => comment.eon_id === eonId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setComments(eonComments)
  }

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return

    setIsSubmitting(true)

    try {
      const commentData: Omit<EONComment, "id" | "created_at" | "updated_at"> = {
        eon_id: eonId,
        author_user_id: user.id,
        body_rich: newComment.trim(),
        visibility: "all",
        type: "GENERAL",
      }

      storage.create<EONComment>("eon_comments", commentData)
      storage.logAction("ADD_COMMENT", user.id, eonId, { comment: newComment.trim() })

      setNewComment("")
      loadComments()
    } catch (error) {
      console.error("Error adding comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    return user ? user.name : "Unknown User"
  }

  const getUserInitials = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    return user
      ? user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
      : "?"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Comment */}
        {canComment && user && (
          <div className="space-y-3">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button onClick={handleSubmitComment} disabled={!newComment.trim() || isSubmitting} size="sm">
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? "Adding..." : "Add Comment"}
              </Button>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs">{getUserInitials(comment.author_user_id)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{getUserName(comment.author_user_id)}</span>
                  {comment.type === "CLARIFICATION" && <Badge variant="outline">Clarification</Badge>}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {format(new Date(comment.created_at), "MMM dd, yyyy HH:mm")}
                  </div>
                </div>
                <div className="text-sm text-foreground bg-muted p-3 rounded-md">{comment.body_rich}</div>
              </div>
            </div>
          ))}

          {comments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No comments yet</p>
              {canComment && <p className="text-xs">Be the first to add a comment</p>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
