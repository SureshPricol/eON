"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/lib/auth"
import {
  FileText,
  Users,
  Settings,
  Home,
  Plus,
  Inbox,
  Send,
  CheckCircle,
  Archive,
  FolderOpen,
  UserCheck,
  Key,
  Tag,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ClipboardList,
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    name: "Documents",
    icon: FileText,
    children: [
      { name: "Created by Me", href: "/documents/created", icon: Send },
      { name: "Shared with Me", href: "/documents/shared", icon: Inbox },
      { name: "Approval Queue", href: "/documents/approvals", icon: CheckCircle },
      { name: "Archived", href: "/documents/archived", icon: Archive },
    ],
  },
  {
    name: "Masters",
    icon: Settings,
    adminOnly: true, // Added admin-only flag
    children: [
      { name: "Users", href: "/masters/users", icon: Users },
      { name: "Roles", href: "/masters/roles", icon: UserCheck },
      { name: "Permissions", href: "/masters/permissions", icon: Key },
      { name: "Categories", href: "/masters/categories", icon: Tag },
      { name: "Departments", href: "/masters/departments", icon: FolderOpen },
    ],
  },
  {
    name: "Audit Log",
    href: "/audit",
    icon: ClipboardList,
    adminOnly: true,
  },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { user, logout, isAdmin } = useAuth()

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-card border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">eON</span>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="p-2">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* User Info */}
      {!collapsed && user && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-2">
          {/* Quick Actions */}
          {!collapsed && (
            <div className="mb-6">
              <Link href="/documents/create">
                <Button className="w-full justify-start" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create eON
                </Button>
              </Link>
            </div>
          )}

          {navigation.map((item) => {
            if (item.adminOnly && !isAdmin()) {
              return null
            }

            return (
              <div key={item.name}>
                {item.children ? (
                  <div className="space-y-1">
                    {!collapsed && (
                      <div className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground">
                        <item.icon className="w-4 h-4 mr-2" />
                        {item.name}
                      </div>
                    )}
                    <div className={cn("space-y-1", collapsed && "space-y-2")}>
                      {item.children.map((child) => (
                        <Link key={child.href} href={child.href}>
                          <Button
                            variant={pathname === child.href ? "secondary" : "ghost"}
                            className={cn("w-full justify-start", collapsed ? "px-2" : "px-3 ml-6")}
                            size="sm"
                            title={collapsed ? child.name : undefined}
                          >
                            <child.icon className={cn("w-4 h-4", !collapsed && "mr-2")} />
                            {!collapsed && child.name}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link href={item.href}>
                    <Button
                      variant={pathname === item.href ? "secondary" : "ghost"}
                      className={cn("w-full justify-start", collapsed ? "px-2" : "px-3")}
                      size="sm"
                      title={collapsed ? item.name : undefined}
                    >
                      <item.icon className={cn("w-4 h-4", !collapsed && "mr-2")} />
                      {!collapsed && item.name}
                    </Button>
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-muted-foreground hover:text-foreground",
            collapsed ? "px-2" : "px-3",
          )}
          size="sm"
          onClick={logout}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className={cn("w-4 h-4", !collapsed && "mr-2")} />
          {!collapsed && "Logout"}
        </Button>
      </div>
    </div>
  )
}
