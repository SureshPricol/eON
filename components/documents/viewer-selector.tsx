"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { storage, type User } from "@/lib/storage"
import { Plus, X } from "lucide-react"

interface ViewerSelectorProps {
  viewers: User[]
  onChange: (viewers: User[]) => void
}

export function ViewerSelector({ viewers, onChange }: ViewerSelectorProps) {
  const [users, setUsers] = useState<User[]>([])
  const [searchEmail, setSearchEmail] = useState("")

  useEffect(() => {
    setUsers(storage.getAll<User>("users").filter((user) => user.status === "active"))
  }, [])

  const addViewer = () => {
    if (!searchEmail) return

    const user = users.find((u) => u.email.toLowerCase() === searchEmail.toLowerCase())
    if (!user) {
      alert("User not found. Please enter a valid email address.")
      return
    }

    if (viewers.some((v) => v.id === user.id)) {
      alert("This user is already in the viewers list.")
      return
    }

    onChange([...viewers, user])
    setSearchEmail("")
  }

  const removeViewer = (userId: string) => {
    onChange(viewers.filter((v) => v.id !== userId))
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
        <CardTitle className="text-base">Viewers (Optional)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Viewer */}
        <div className="flex gap-2">
          <Input
            placeholder="Add viewer..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addViewer()}
          />
          <Button onClick={addViewer} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Viewers List */}
        <div className="space-y-2">
          {viewers.map((viewer) => (
            <div key={viewer.id} className="flex items-center gap-3 p-3 border rounded-lg bg-background">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs">{getInitials(viewer.name)}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="font-medium text-sm">{viewer.name}</div>
                <div className="text-xs text-muted-foreground">{viewer.email}</div>
              </div>

              <Button variant="ghost" size="sm" onClick={() => removeViewer(viewer.id)} className="h-8 w-8 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {viewers.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">No viewers added.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
