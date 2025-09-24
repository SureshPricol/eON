"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { storage, type EON, type EONComment, type User } from "@/lib/storage"
import { MessageSquare, Clock } from "lucide-react"

interface ClarificationResponseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eon: EON | null
  clarificationComment: EONComment | null
  currentUserId: string
  onSubmit: (response: string) => void
}

export function ClarificationResponseModal({
  open,
  onOpenChange,
  eon,
  clarificationComment,
  currentUserId,
  onSubmit,
}: ClarificationResponseModalProps) {
  const [response, setResponse] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!response.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit(response.trim())
      setResponse("")
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const requestAuthor = clarificationComment
    ? storage.getById<User>("users", clarificationComment.author_user_id)
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Respond to Clarification Request
          </DialogTitle>
          <DialogDescription>
            Provide clarification for "{eon?.subject}". Your response will be visible to all approvers and the document
            creator.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Original Request */}
          {clarificationComment && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                    Clarification Request
                  </Badge>
                  {requestAuthor && (
                    <div className="flex items-center gap-2">
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="text-xs">{getInitials(requestAuthor.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{requestAuthor.name}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatDate(clarificationComment.created_at)}
                </div>
              </div>
              <div className="text-sm">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: clarificationComment.body_rich }}
                />
              </div>
            </div>
          )}

          {/* Response */}
          <div className="space-y-2">
            <Label htmlFor="clarification-response">
              Your Response <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="clarification-response"
              placeholder="Thank you for the clarification request. Regarding the budget allocation for Q3..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Provide detailed information to address the clarification request. This will help move the approval
              process forward.
            </p>
          </div>

          {/* Info */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">What happens next?</span>
            </div>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Your response will be added as a comment to the document</p>
              <p>• The document status will remain "Clarification Sought" until further action</p>
              <p>• All approvers and the document creator will be able to see your response</p>
              <p>• The approval process can continue once clarification is provided</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!response.trim() || isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Response"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
