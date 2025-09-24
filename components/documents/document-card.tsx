"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { storage, type EON, type User, type Category, type Department } from "@/lib/storage"
import { MoreHorizontal, FileText, UserIcon, Calendar } from "lucide-react"
import { useState, useEffect } from "react"

interface DocumentCardProps {
  eon: EON
  onEdit?: (eon: EON) => void
  onDelete?: (eon: EON) => void
  onArchive?: (eon: EON) => void
  showActions?: boolean
}

export function DocumentCard({ eon, onEdit, onDelete, onArchive, showActions = true }: DocumentCardProps) {
  const [creator, setCreator] = useState<User | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [department, setDepartment] = useState<Department | null>(null)

  useEffect(() => {
    setCreator(storage.getById<User>("users", eon.creator_id))
    setCategory(storage.getById<Category>("categories", eon.category_id))
    setDepartment(storage.getById<Department>("departments", eon.department_id))
  }, [eon])

  const getStatusColor = (state: EON["state"]) => {
    switch (state) {
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "IN_PROCESS":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200"
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200"
      case "CLARIFICATION_SOUGHT":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/documents/${eon.id}`} className="block">
                <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2">
                  {eon.subject}
                </h3>
              </Link>
              <p className="text-sm text-muted-foreground mt-1">{eon.number}</p>
            </div>
          </div>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/documents/${eon.id}`}>View Details</Link>
                </DropdownMenuItem>
                {eon.state === "DRAFT" && onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(eon)}>Edit</DropdownMenuItem>
                )}
                {onArchive && eon.state !== "ARCHIVED" && (
                  <DropdownMenuItem onClick={() => onArchive(eon)}>Archive</DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={() => onDelete(eon)} className="text-destructive">
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Status and Category */}
          <div className="flex items-center justify-between">
            <Badge className={`text-xs ${getStatusColor(eon.state)}`}>{eon.state.replace("_", " ")}</Badge>
            {category && (
              <Badge variant="outline" className="text-xs">
                {category.name}
              </Badge>
            )}
          </div>

          {/* Description Preview */}
          <div className="text-sm text-muted-foreground line-clamp-2">
            {eon.description_rich.replace(/<[^>]*>/g, "") || "No description"}
          </div>

          {/* Footer Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              {creator && (
                <div className="flex items-center space-x-1">
                  <Avatar className="w-4 h-4">
                    <AvatarFallback className="text-xs">{getInitials(creator.name)}</AvatarFallback>
                  </Avatar>
                  <span>{creator.name}</span>
                </div>
              )}
              {department && (
                <div className="flex items-center space-x-1">
                  <UserIcon className="w-3 h-3" />
                  <span>{department.code}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(eon.created_at)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
