"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { storage, type EON, type EONApprover, type User } from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import { CheckCircle, XCircle, MessageCircle, UserPlus, Archive } from "lucide-react"

interface ApprovalActionsProps {
  eon: EON
  onUpdate: () => void
}

export function ApprovalActions({ eon, onUpdate }: ApprovalActionsProps) {
  const { user } = useAuth()
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showClarificationDialog, setShowClarificationDialog] = useState(false)
  const [showAddApproverDialog, setShowAddApproverDialog] = useState(false)
  const [comment, setComment] = useState("")
  const [selectedUser, setSelectedUser] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  if (!user) return null

  // Check if current user can take actions on this eON
  const approvers = storage.getAll<EONApprover>("eon_approvers").filter((a) => a.eon_id === eon.id)
  const currentUserApprover = approvers.find((a) => a.approver_user_id === user.id)
  const isCreator = eon.creator_id === user.id
  const canApprove =
    currentUserApprover &&
    currentUserApprover.action === "NONE" &&
    (eon.state === "IN_PROCESS" || eon.state === "CLARIFICATION_SOUGHT")

  // Get current approver in sequence
  const pendingApprovers = approvers.filter((a) => a.action === "NONE").sort((a, b) => a.order_index - b.order_index)
  const currentApprover = pendingApprovers[0]
  const isCurrentApprover = currentApprover && currentApprover.approver_user_id === user.id

  const handleApprove = async () => {
    if (!currentUserApprover) return

    setIsLoading(true)
    try {
      // Update approver action
      storage.update("eon_approvers", currentUserApprover.id, {
        action: "APPROVE",
        acted_at: new Date().toISOString(),
        comment_id: comment ? "comment_" + Date.now() : undefined,
      })

      // Add comment if provided
      if (comment) {
        storage.create("eon_comments", {
          eon_id: eon.id,
          author_user_id: user.id,
          body_rich: comment,
          visibility: "all",
          created_at: new Date().toISOString(),
          type: "GENERAL",
        })
      }

      // Check if this was the final approver or if all approvers have acted
      const updatedApprovers = storage.getAll<EONApprover>("eon_approvers").filter((a) => a.eon_id === eon.id)
      const remainingApprovers = updatedApprovers.filter((a) => a.action === "NONE")

      if (currentUserApprover.is_final || remainingApprovers.length === 0) {
        // All approvals complete
        storage.update("eons", eon.id, { state: "APPROVED" })
      }

      storage.logAction("APPROVE_EON", user.id, eon.id, { comment })

      setShowApproveDialog(false)
      setComment("")
      onUpdate()
    } catch (error) {
      console.error("Error approving eON:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    if (!currentUserApprover) return

    setIsLoading(true)
    try {
      // Update approver action
      storage.update("eon_approvers", currentUserApprover.id, {
        action: "REJECT",
        acted_at: new Date().toISOString(),
        comment_id: comment ? "comment_" + Date.now() : undefined,
      })

      // Add comment if provided
      if (comment) {
        storage.create("eon_comments", {
          eon_id: eon.id,
          author_user_id: user.id,
          body_rich: comment,
          visibility: "all",
          created_at: new Date().toISOString(),
          type: "GENERAL",
        })
      }

      // Update eON state to rejected
      storage.update("eons", eon.id, { state: "REJECTED" })

      storage.logAction("REJECT_EON", user.id, eon.id, { comment })

      setShowRejectDialog(false)
      setComment("")
      onUpdate()
    } catch (error) {
      console.error("Error rejecting eON:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAskClarification = async () => {
    if (!currentUserApprover || !comment.trim()) return

    setIsLoading(true)
    try {
      // Update approver action
      storage.update("eon_approvers", currentUserApprover.id, {
        action: "ASK_CLARIFICATION",
        acted_at: new Date().toISOString(),
        comment_id: "comment_" + Date.now(),
      })

      // Add clarification comment
      storage.create("eon_comments", {
        eon_id: eon.id,
        author_user_id: user.id,
        body_rich: comment,
        visibility: "all",
        created_at: new Date().toISOString(),
        type: "CLARIFICATION",
      })

      // Update eON state
      storage.update("eons", eon.id, { state: "CLARIFICATION_SOUGHT" })

      storage.logAction("ASK_CLARIFICATION", user.id, eon.id, { comment })

      setShowClarificationDialog(false)
      setComment("")
      onUpdate()
    } catch (error) {
      console.error("Error asking clarification:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddApprover = async () => {
    if (!selectedUser || !isCreator) return

    setIsLoading(true)
    try {
      const users = storage.getAll<User>("users")
      const userToAdd = users.find((u) => u.id === selectedUser)
      if (!userToAdd) return

      // Check if user is already an approver
      const existingApprover = approvers.find((a) => a.approver_user_id === selectedUser)
      if (existingApprover) {
        alert("This user is already in the approval sequence.")
        return
      }

      // Add new approver at the end of the sequence
      const maxOrder = Math.max(...approvers.map((a) => a.order_index), -1)
      storage.create("eon_approvers", {
        eon_id: eon.id,
        order_index: maxOrder + 1,
        approver_user_id: selectedUser,
        is_final: false,
        action: "NONE",
      })

      storage.logAction("ADD_APPROVER", user.id, eon.id, { addedUser: userToAdd.email })

      setShowAddApproverDialog(false)
      setSelectedUser("")
      onUpdate()
    } catch (error) {
      console.error("Error adding approver:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!isCreator) return

    setIsLoading(true)
    try {
      storage.update("eons", eon.id, { state: "ARCHIVED" })
      storage.logAction("ARCHIVE_EON", user.id, eon.id)
      onUpdate()
    } catch (error) {
      console.error("Error archiving eON:", error)
    } finally {
      setIsLoading(false)
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
        <CardTitle className="text-base">Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current Approver Info */}
        {currentApprover && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium mb-2">Current Approver</div>
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs">
                  {getInitials(storage.getById<User>("users", currentApprover.approver_user_id)?.name || "")}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{storage.getById<User>("users", currentApprover.approver_user_id)?.name}</span>
              {currentApprover.is_final && (
                <Badge variant="secondary" className="text-xs">
                  Final
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Approval Actions */}
        {canApprove && isCurrentApprover && (
          <div className="space-y-2">
            <Button onClick={() => setShowApproveDialog(true)} className="w-full justify-start" variant="default">
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>

            <Button onClick={() => setShowRejectDialog(true)} className="w-full justify-start" variant="destructive">
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>

            <Button onClick={() => setShowClarificationDialog(true)} className="w-full justify-start" variant="outline">
              <MessageCircle className="w-4 h-4 mr-2" />
              Ask Clarification
            </Button>
          </div>
        )}

        {/* Creator Actions */}
        {isCreator && eon.state === "IN_PROCESS" && (
          <div className="space-y-2">
            <Button onClick={() => setShowAddApproverDialog(true)} className="w-full justify-start" variant="outline">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Approver
            </Button>
          </div>
        )}

        {/* Archive Action */}
        {isCreator && (eon.state === "APPROVED" || eon.state === "REJECTED") && (
          <Button
            onClick={handleArchive}
            className="w-full justify-start bg-transparent"
            variant="outline"
            disabled={isLoading}
          >
            <Archive className="w-4 h-4 mr-2" />
            Archive
          </Button>
        )}

        {/* Status Info */}
        {!canApprove && !isCreator && (
          <div className="text-sm text-muted-foreground text-center py-4">
            {eon.state === "DRAFT" && "Document is still in draft"}
            {eon.state === "IN_PROCESS" && !isCurrentApprover && "Waiting for other approvers"}
            {eon.state === "APPROVED" && "Document has been approved"}
            {eon.state === "REJECTED" && "Document has been rejected"}
            {eon.state === "ARCHIVED" && "Document has been archived"}
          </div>
        )}
      </CardContent>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Document</DialogTitle>
            <DialogDescription>
              You are about to approve this document. Add an optional comment below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="approve-comment">Comment (Optional)</Label>
              <Textarea
                id="approve-comment"
                placeholder="Add your approval comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isLoading}>
              {isLoading ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription>
              You are about to reject this document. Please provide a reason for rejection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-comment">Reason for Rejection *</Label>
              <Textarea
                id="reject-comment"
                placeholder="Please explain why you are rejecting this document..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-1"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReject} disabled={isLoading || !comment.trim()} variant="destructive">
              {isLoading ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clarification Dialog */}
      <Dialog open={showClarificationDialog} onOpenChange={setShowClarificationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ask for Clarification</DialogTitle>
            <DialogDescription>
              Request clarification from the document creator. Please specify what needs to be clarified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="clarification-comment">Clarification Request *</Label>
              <Textarea
                id="clarification-comment"
                placeholder="Please specify what needs to be clarified..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-1"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClarificationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAskClarification} disabled={isLoading || !comment.trim()}>
              {isLoading ? "Sending..." : "Ask Clarification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Approver Dialog */}
      <Dialog open={showAddApproverDialog} onOpenChange={setShowAddApproverDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Approver</DialogTitle>
            <DialogDescription>
              Add a new approver to the approval sequence. They will be added at the end of the current sequence.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-approver">Select User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a user to add as approver" />
                </SelectTrigger>
                <SelectContent>
                  {storage
                    .getAll<User>("users")
                    .filter((u) => u.status === "active" && !approvers.some((a) => a.approver_user_id === u.id))
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddApproverDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddApprover} disabled={isLoading || !selectedUser}>
              {isLoading ? "Adding..." : "Add Approver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
