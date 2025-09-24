"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ClarificationResponseModal } from "./clarification-response-modal"
import { storage, type EON, type EONComment, type User } from "@/lib/storage"
import { MessageSquare, Clock, AlertCircle } from "lucide-react"

interface ClarificationStatusProps {
  eon: EON
  currentUserId: string
  onResponseSubmitted?: () => void
}

export function ClarificationStatus({ eon, currentUserId, onResponseSubmitted }: ClarificationStatusProps) {
  const [clarificationComments, setClarificationComments] = useState<EONComment[]>([])
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [selectedComment, setSelectedComment] = useState<EONComment | null>(null)

  useEffect(() => {
    if (eon.state === "CLARIFICATION_SOUGHT") {
      const comments = storage.getEONComments(eon.id)
      const clarifications = comments.filter((c) => c.type === "CLARIFICATION")
      setClarificationComments(clarifications)
    }
  }, [eon])

  const handleRespondToClarification = (comment: EONComment) => {
    setSelectedComment(comment)
    setShowResponseModal(true)
  }

  const handleResponseSubmit = (response: string) => {
    // Create response comment
    storage.create("eon_comments", {
      eon_id: eon.id,
      author_user_id: currentUserId,
      body_rich: response,
      visibility: "all" as const,
      type: "GENERAL" as const,
    })

    // Log the action
    storage.logAction("RESPOND_TO_CLARIFICATION", currentUserId, eon.id, {
      original_comment_id: selectedComment?.id,
      response: response,
    })

    onResponseSubmitted?.()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (eon.state !== "CLARIFICATION_SOUGHT" || clarificationComments.length === 0) {
    return null
  }

  return (
    <>
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertCircle className="w-5 h-5" />
            Clarification Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {clarificationComments.map((comment) => {
            const author = storage.getById<User>("users", comment.author_user_id)
            const canRespond = currentUserId === eon.creator_id || currentUserId !== comment.author_user_id

            return (
              <div key={comment.id} className="bg-white rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {author && (
                      <>
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">{getInitials(author.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{author.name}</span>
                      </>
                    )}
                    <Badge variant="outline" className="text-xs">
                      Clarification Request
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatDate(comment.created_at)}
                  </div>
                </div>

                <div className="text-sm">
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: comment.body_rich }} />
                </div>

                {canRespond && (
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => handleRespondToClarification(comment)}>
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Respond
                    </Button>
                  </div>
                )}
              </div>
            )
          })}

          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Action Required</p>
                <p>This document requires clarification before the approval process can continue.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ClarificationResponseModal
        open={showResponseModal}
        onOpenChange={setShowResponseModal}
        eon={eon}
        clarificationComment={selectedComment}
        currentUserId={currentUserId}
        onSubmit={handleResponseSubmit}
      />
    </>
  )
}
