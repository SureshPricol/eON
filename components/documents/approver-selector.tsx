"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { storage, type User } from "@/lib/storage"
import { Plus, X, GripVertical } from "lucide-react"

interface Approver {
  id: string
  user: User
  is_final: boolean
  order: number
}

interface ApproverSelectorProps {
  approvers: Approver[]
  onChange: (approvers: Approver[]) => void
}

export function ApproverSelector({ approvers, onChange }: ApproverSelectorProps) {
  const [users, setUsers] = useState<User[]>([])
  const [searchEmail, setSearchEmail] = useState("")
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  useEffect(() => {
    setUsers(storage.getAll<User>("users").filter((user) => user.status === "active"))
  }, [])

  const addApprover = () => {
    if (!searchEmail) return

    const user = users.find((u) => u.email.toLowerCase() === searchEmail.toLowerCase())
    if (!user) {
      alert("User not found. Please enter a valid email address.")
      return
    }

    if (approvers.some((a) => a.user.id === user.id)) {
      alert("This user is already in the approval sequence.")
      return
    }

    const newApprover: Approver = {
      id: Date.now().toString(),
      user,
      is_final: false,
      order: approvers.length,
    }

    onChange([...approvers, newApprover])
    setSearchEmail("")
  }

  const removeApprover = (id: string) => {
    const filtered = approvers.filter((a) => a.id !== id)
    // Reorder
    const reordered = filtered.map((a, index) => ({ ...a, order: index }))
    onChange(reordered)
  }

  const toggleFinalApprover = (id: string) => {
    const updated = approvers.map((a) => ({
      ...a,
      is_final: a.id === id ? !a.is_final : false, // Only one final approver allowed
    }))
    onChange(updated)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null) return

    const newApprovers = [...approvers]
    const draggedItem = newApprovers[draggedIndex]
    newApprovers.splice(draggedIndex, 1)
    newApprovers.splice(index, 0, draggedItem)

    // Update order
    const reordered = newApprovers.map((a, i) => ({ ...a, order: i }))
    onChange(reordered)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
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
      <CardContent className="space-y-4">
        {/* Add Approver */}
        <div className="flex gap-2">
          <Input
            placeholder="Add approver by email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addApprover()}
          />
          <Button onClick={addApprover} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Approvers List */}
        <div className="space-y-2">
          {approvers
            .sort((a, b) => a.order - b.order)
            .map((approver, index) => (
              <div
                key={approver.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className="flex items-center gap-3 p-3 border rounded-lg bg-background cursor-move hover:bg-muted/50 transition-colors"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground" />

                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">{getInitials(approver.user.name)}</AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="font-medium text-sm">{approver.user.name}</div>
                  <div className="text-xs text-muted-foreground">{approver.user.email}</div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`final-${approver.id}`}
                      checked={approver.is_final}
                      onCheckedChange={() => toggleFinalApprover(approver.id)}
                    />
                    <Label htmlFor={`final-${approver.id}`} className="text-xs">
                      Final Approver
                    </Label>
                  </div>

                  {approver.is_final && (
                    <Badge variant="secondary" className="text-xs">
                      Final
                    </Badge>
                  )}
                </div>

                <Button variant="ghost" size="sm" onClick={() => removeApprover(approver.id)} className="h-8 w-8 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}

          {approvers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No approvers added yet.</p>
              <p className="text-xs">Add approvers by entering their email addresses above.</p>
            </div>
          )}
        </div>

        {approvers.length > 0 && !approvers.some((a) => a.is_final) && (
          <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
            Please designate at least one final approver.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
