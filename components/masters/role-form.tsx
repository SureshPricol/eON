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
import { Checkbox } from "@/components/ui/checkbox"
import { storage, type Role, type Permission } from "@/lib/storage"

interface RoleFormProps {
  role?: Role | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export function RoleForm({ role, open, onOpenChange, onSave }: RoleFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    permissions: [] as string[],
  })
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setPermissions(storage.getAll<Permission>("permissions"))
  }, [])

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        permissions: role.permissions,
      })
    } else {
      setFormData({
        name: "",
        permissions: [],
      })
    }
  }, [role])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (role) {
        storage.update<Role>("roles", role.id, formData)
      } else {
        storage.create<Role>("roles", formData)
      }
      onSave()
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving role:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePermissionChange = (permissionName: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permissionName]
        : prev.permissions.filter((p) => p !== permissionName),
    }))
  }

  const groupedPermissions = permissions.reduce(
    (acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = []
      }
      acc[permission.module].push(permission)
      return acc
    },
    {} as Record<string, Permission[]>,
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{role ? "Edit Role" : "Add New Role"}</DialogTitle>
          <DialogDescription>
            {role ? "Update role information and permissions." : "Create a new role with specific permissions."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Permissions</Label>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                  <div key={module} className="space-y-2">
                    <h4 className="font-medium text-sm capitalize">{module}</h4>
                    <div className="space-y-2 pl-4">
                      {modulePermissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission.id}
                            checked={formData.permissions.includes(permission.name)}
                            onCheckedChange={(checked) => handlePermissionChange(permission.name, checked as boolean)}
                          />
                          <div className="flex-1">
                            <Label htmlFor={permission.id} className="text-sm">
                              {permission.name}
                            </Label>
                            <p className="text-xs text-muted-foreground">{permission.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
