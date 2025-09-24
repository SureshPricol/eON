"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { storage, type AuditLog, type User, type EONComment, type EONAttachment } from "@/lib/storage"
import { Clock, FileText, MessageSquare, Paperclip, UserCheck, UserX, Send, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"

interface ActivityTimelineProps {
  eonId: string
}

interface TimelineItem {
  id: string
  type: "audit" | "comment" | "attachment"
  timestamp: string
  user_id: string
  action: string
  details?: string
  icon: React.ComponentType<{ className?: string }>
  variant: "default" | "success" | "destructive" | "secondary"
}

export function ActivityTimeline({ eonId }: ActivityTimelineProps) {
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([])
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    loadTimelineData()
    setUsers(storage.getAll<User>("users"))
  }, [eonId])

  const loadTimelineData = () => {
    const auditLogs = storage.getAll<AuditLog>("audit_logs").filter((log) => log.eon_id === eonId)
    const comments = storage.getAll<EONComment>("eon_comments").filter((comment) => comment.eon_id === eonId)
    const attachments = storage.getAll<EONAttachment>("eon_attachments").filter((att) => att.eon_id === eonId)

    const items: TimelineItem[] = []

    // Add audit log items
    auditLogs.forEach((log) => {
      let icon = FileText
      let variant: TimelineItem["variant"] = "default"
      let action = log.action

      switch (log.action) {
        case "CREATE_EON_DRAFT":
          icon = FileText
          action = "created the eON draft"
          break
        case "SUBMIT_EON_FOR_APPROVAL":
          icon = Send
          action = "submitted the eON for approval"
          variant = "secondary"
          break
        case "APPROVE_EON":
          icon = CheckCircle
          action = "approved the eON"
          variant = "success"
          break
        case "REJECT_EON":
          icon = XCircle
          action = "rejected the eON"
          variant = "destructive"
          break
        case "ADD_APPROVER":
          icon = UserCheck
          action = "added an approver"
          break
        case "REMOVE_APPROVER":
          icon = UserX
          action = "removed an approver"
          break
        default:
          action = log.action.toLowerCase().replace(/_/g, " ")
      }

      items.push({
        id: log.id,
        type: "audit",
        timestamp: log.created_at,
        user_id: log.actor_user_id,
        action,
        details: log.payload_json !== "{}" ? JSON.parse(log.payload_json) : undefined,
        icon,
        variant,
      })
    })

    // Add comment items
    comments.forEach((comment) => {
      items.push({
        id: comment.id,
        type: "comment",
        timestamp: comment.created_at,
        user_id: comment.author_user_id,
        action: comment.type === "CLARIFICATION" ? "asked for clarification" : "added a comment",
        details: comment.body_rich,
        icon: MessageSquare,
        variant: comment.type === "CLARIFICATION" ? "secondary" : "default",
      })
    })

    // Add attachment items
    attachments.forEach((attachment) => {
      items.push({
        id: attachment.id,
        type: "attachment",
        timestamp: attachment.added_at,
        user_id: attachment.added_by_user_id,
        action: "attached a file",
        details: attachment.filename,
        icon: Paperclip,
        variant: "default",
      })
    })

    // Sort by timestamp (newest first)
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    setTimelineItems(items)
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

  const getBadgeVariant = (variant: TimelineItem["variant"]) => {
    switch (variant) {
      case "success":
        return "default"
      case "destructive":
        return "destructive"
      case "secondary":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timelineItems.map((item, index) => (
            <div key={item.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    item.variant === "success"
                      ? "bg-green-100 text-green-600"
                      : item.variant === "destructive"
                        ? "bg-red-100 text-red-600"
                        : item.variant === "secondary"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                </div>
                {index < timelineItems.length - 1 && <div className="w-px h-8 bg-border mt-2" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{getUserName(item.user_id)}</span>
                  <span className="text-sm text-muted-foreground">{item.action}</span>
                  <Badge variant={getBadgeVariant(item.variant)} className="text-xs">
                    {item.type}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {format(new Date(item.timestamp), "MMM dd, yyyy HH:mm")}
                </div>
                {item.details && (
                  <div className="text-sm bg-muted p-2 rounded text-muted-foreground">
                    {typeof item.details === "string" ? item.details : JSON.stringify(item.details, null, 2)}
                  </div>
                )}
              </div>
            </div>
          ))}

          {timelineItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No activity yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
