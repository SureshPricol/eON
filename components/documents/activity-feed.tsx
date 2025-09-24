"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { storage, type EON, type AuditLog, type User } from "@/lib/storage"
import { Activity, Clock, FileText, MessageSquare, CheckCircle, XCircle, AlertCircle, Archive } from "lucide-react"

interface ActivityFeedProps {
  eon: EON
  limit?: number
}

export function ActivityFeed({ eon, limit = 10 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<AuditLog[]>([])

  useEffect(() => {
    const allLogs = storage.getAll<AuditLog>("audit_logs")
    const eonLogs = allLogs
      .filter((log) => log.eon_id === eon.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)

    setActivities(eonLogs)
  }, [eon.id, limit])

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

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "CREATE_EON_DRAFT":
      case "CREATE_EON":
        return <FileText className="w-4 h-4 text-blue-600" />
      case "SUBMIT_EON_FOR_APPROVAL":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "APPROVE_EON":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "REJECT_EON":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "ASK_CLARIFICATION_EON":
      case "REQUEST_CLARIFICATION":
        return <AlertCircle className="w-4 h-4 text-orange-600" />
      case "ADD_COMMENT":
      case "RESPOND_TO_CLARIFICATION":
        return <MessageSquare className="w-4 h-4 text-blue-600" />
      case "ARCHIVE_EON":
        return <Archive className="w-4 h-4 text-gray-600" />
      default:
        return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  const getActivityDescription = (action: string, payload: any) => {
    switch (action) {
      case "CREATE_EON_DRAFT":
        return "created a draft"
      case "CREATE_EON":
        return "created the document"
      case "SUBMIT_EON_FOR_APPROVAL":
        return "submitted for approval"
      case "APPROVE_EON":
        return "approved the document"
      case "REJECT_EON":
        return "rejected the document"
      case "ASK_CLARIFICATION_EON":
      case "REQUEST_CLARIFICATION":
        return "requested clarification"
      case "ADD_COMMENT":
        return "added a comment"
      case "RESPOND_TO_CLARIFICATION":
        return "responded to clarification request"
      case "ARCHIVE_EON":
        return "archived the document"
      default:
        return action.toLowerCase().replace(/_/g, " ")
    }
  }

  const getActivityColor = (action: string) => {
    switch (action) {
      case "APPROVE_EON":
        return "text-green-700"
      case "REJECT_EON":
        return "text-red-700"
      case "ASK_CLARIFICATION_EON":
      case "REQUEST_CLARIFICATION":
        return "text-orange-700"
      default:
        return "text-foreground"
    }
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No activity yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Activity ({activities.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const actor = storage.getById<User>("users", activity.actor_user_id)
            const payload = activity.payload_json ? JSON.parse(activity.payload_json) : {}

            return (
              <div key={activity.id}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.action)}</div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">{actor ? getInitials(actor.name) : "?"}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{actor?.name || "Unknown User"}</span>
                      <span className={`text-sm ${getActivityColor(activity.action)}`}>
                        {getActivityDescription(activity.action, payload)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(activity.created_at)}</span>
                    </div>

                    {payload.comment && (
                      <div className="bg-muted/50 rounded p-2 text-sm text-muted-foreground">"{payload.comment}"</div>
                    )}
                  </div>
                </div>

                {index < activities.length - 1 && <Separator className="mt-4" />}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
