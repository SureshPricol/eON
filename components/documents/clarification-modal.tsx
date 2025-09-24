"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { storage, type EON, type User } from "@/lib/storage"
import { MessageSquare, Users, AlertCircle } from "lucide-react"

interface ClarificationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eon: EON | null
  currentUserId: string
  onSubmit: (recipients: string[], comment: string, isUrgent: boolean) => void
}

export function ClarificationModal({ open, onOpenChange, eon, currentUserId, onSubmit }: ClarificationModalProps) {
  const [comment, setComment] = useState("")
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [isUrgent, setIsUrgent] = useState(false)
  const [recipientType, setRecipientType] = useState<"creator" | "approvers" | "custom">("creator")
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open && eon) {
      // Load available users for clarification
      const allUsers = storage.getAll<User>("users")
      const creator = allUsers.find((u) => u.id === eon.creator_id)
      const approvers = storage.getEONApprovers(eon.id)
      const approverUsers = approvers
        .map((a) => allUsers.find((u) => u.id === a.approver_user_id))
        .filter((u): u is User => u !== undefined)

      // Combine and deduplicate users
      const relevantUsers = [creator, ...approverUsers]
        .filter((u): u is User => u !== undefined && u.id !== currentUserId)
        .filter((user, index, self) => self.findIndex((u) => u.id === user.id) === index)

      setAvailableUsers(relevantUsers)

      // Set default recipients based on type
      if (recipientType === "creator" && creator) {
        setSelectedRecipients([creator.id])
      } else if (recipientType === "approvers") {
        setSelectedRecipients(approverUsers.map((u) => u.id))
      }
    }
  }, [open, eon, currentUserId, recipientType])

  const handleSubmit = async () => {
    if (!comment.trim() || selectedRecipients.length === 0) return

    setIsSubmitting(true)
    try {
      await onSubmit(selectedRecipients, comment.trim(), isUrgent)
      // Reset form
      setComment("")
      setSelectedRecipients([])
      setIsUrgent(false)
      setRecipientType("creator")
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRecipientToggle = (userId: string) => {
    setSelectedRecipients((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const selectedUsers = availableUsers.filter((u) => selectedRecipients.includes(u.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Request Clarification
          </DialogTitle>
          <DialogDescription>
            Ask for clarification on "{eon?.subject}". Your request will be sent to the selected recipients and the
            document status will be updated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recipient Selection */}
          <div className="space-y-4">
            <Label>Send clarification request to:</Label>

            <Select value={recipientType} onValueChange={(value: any) => setRecipientType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="creator">Document Creator</SelectItem>
                <SelectItem value="approvers">All Approvers</SelectItem>
                <SelectItem value="custom">Custom Selection</SelectItem>
              </SelectContent>
            </Select>

            {recipientType === "custom" && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Select Recipients:</Label>
                <div className="max-h-40 overflow-y-auto space-y-2 border rounded-lg p-3">
                  {availableUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={user.id}
                        checked={selectedRecipients.includes(user.id)}
                        onCheckedChange={() => handleRecipientToggle(user.id)}
                      />
                      <div className="flex items-center space-x-2 flex-1">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Recipients Preview */}
            {selectedUsers.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Will be sent to:</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                      <Avatar className="w-4 h-4">
                        <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      {user.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="clarification-comment">
              Clarification Request <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="clarification-comment"
              placeholder="Please provide more details about the budget allocation for Q3. Specifically, I need clarification on..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Be specific about what information you need. This will help recipients provide better responses.
            </p>
          </div>

          {/* Priority */}
          <div className="flex items-center space-x-2">
            <Checkbox id="urgent" checked={isUrgent} onCheckedChange={setIsUrgent} />
            <Label htmlFor="urgent" className="flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              Mark as urgent (requires immediate attention)
            </Label>
          </div>

          {/* Preview */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Summary</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                • Recipients: {selectedUsers.length} user{selectedUsers.length !== 1 ? "s" : ""}
              </p>
              <p>• Document will be marked as "Clarification Sought"</p>
              <p>• Recipients will be notified via the system</p>
              {isUrgent && <p>• Marked as urgent priority</p>}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!comment.trim() || selectedRecipients.length === 0 || isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Clarification Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
