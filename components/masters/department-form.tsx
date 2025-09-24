"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { storage, type Department } from "@/lib/storage"

interface DepartmentFormProps {
  department?: Department | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export function DepartmentForm({ department, open, onOpenChange, onSave }: DepartmentFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
        code: department.code,
      })
    } else {
      setFormData({
        name: "",
        code: "",
      })
    }
  }, [department])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (department) {
        storage.update<Department>("departments", department.id, formData)
      } else {
        storage.create<Department>("departments", formData)
      }
      onSave()
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving department:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{department ? "Edit Department" : "Add New Department"}</DialogTitle>
          <DialogDescription>
            {department ? "Update department information." : "Create a new department."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Department Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code">Department Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., FIN, HR, IT"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
