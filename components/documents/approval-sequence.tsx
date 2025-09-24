"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { storage, type EON, type EONApprover, type User } from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import { CheckCircle, Clock, XCircle, MessageCircle, Trash2 } from "lucide-react"

interface ApprovalSequenceProps {
  eon: EON
  onUpdate: () => void
}

export function ApprovalSequence({ eon, onUpdate }: ApprovalSequenceProps) {
  const { user } = useAuth()
  const [approvers, setApprovers] = useState<(EONApprover & { user: User })[]>([])
  const isCreator = eon.creator_id === user?.id

  useEffect(() => {
    const loadApprovers = () => {
      const eonApprovers = storage
        .getAll<EONApprover>("eon_approvers")
        .filter((a) => a.eon_id === eon.id)
        .sort((a, b) => a.order_index - b.order_index)

      const approversWithUsers = eonApprovers
        .map((approver) => {
          const approverUser = storage.getById<User>("users", approver.approver_user_id)
          return {
            ...approver,
            user: approverUser!,
          }
        })
        .filter((a) => a.user) // Filter out any approvers where user wasn't found

      setApprovers(approversWithUsers)
    }

    loadApprovers()
  }, [eon.id])

  const handleToggleFinalApprover = (approverId: string) => {
    if (!isCreator || eon.state !== "DRAFT") return

    // Update the approver
    const approver = approvers.find((a) => a.id === approverId)
    if (!approver) return

    // If making this approver final, remove final status from others
    if (!approver.is_final) {
      approvers.forEach((a) => {
        if (a.is_final) {
          storage.update("eon_approvers", a.id, { is_final: false })
        }
      })
    }

    storage.update("eon_approvers", approverId, { is_final: !approver.is_final })
    onUpdate()
  }

  const handleRemoveApprover = (approverId: string) => {
    if (!isCreator || eon.state !== "DRAFT") return

    storage.delete("eon_approvers", approverId)

    // Reorder remaining approvers
    const remainingApprovers = approvers.filter((a) => a.id !== approverId)
    remainingApprovers.forEach((approver, index) => {
      storage.update("eon_approvers", approver.id, { order_index: index })
    })

    onUpdate()
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "APPROVE":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "REJECT":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "ASK_CLARIFICATION":
        return <MessageCircle className="w-4 h-4 text-orange-600" />
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getActionText = (action: string) => {
    switch (action) {
      case "APPROVE":
        return "Approved"
      case "REJECT":
        return "Rejected"
      case "ASK_CLARIFICATION":
        return "Asked Clarification"
      default:
        return "Pending"
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "APPROVE":
        return "bg-green-100 text-green-800 border-green-200"
      case "REJECT":
        return "bg-red-100 text-red-800 border-red-200"
      case "ASK_CLARIFICATION":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Approval Sequence</CardTitle>
      </CardHeader>
      <CardContent>
        {approvers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No approvers assigned</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvers.map((approver, index) => (
              <div key={approver.id} className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                {/* Order Number */}
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>

                {/* Avatar */}
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">{getInitials(approver.user.name)}</AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{approver.user.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{approver.user.email}</div>
                </div>

                {/* Status and Badges */}
                <div className="flex items-center gap-2">
                  {/* Final Approver Badge */}
                  {approver.is_final && (
                    <Badge variant="secondary" className="text-xs">
                      Final Approver
                    </Badge>
                  )}

                  {/* Action Status */}
                  <div className="flex items-center gap-1">
                    {getActionIcon(approver.action)}
                    <Badge className={`text-xs ${getActionColor(approver.action)}`}>
                      {getActionText(approver.action)}
                    </Badge>
                  </div>

                  {/* Action Date */}
                  {approver.acted_at && (
                    <div className="text-xs text-muted-foreground">
                      {new Date(approver.acted_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Controls for Creator in Draft Mode */}
                {isCreator && eon.state === "DRAFT" && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`final-${approver.id}`}
                        checked={approver.is_final}
                        onCheckedChange={() => handleToggleFinalApprover(approver.id)}
                        size="sm"
                      />
                      <Label htmlFor={`final-${approver.id}`} className="text-xs">
                        Final
                      </Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveApprover(approver.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Progress Indicator */}
        {approvers.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {approvers.filter((a) => a.action !== "NONE").length} of {approvers.length} completed
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(approvers.filter((a) => a.action !== "NONE").length / approvers.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
