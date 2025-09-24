"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { storage, type AuditLog, type User, type EON } from "@/lib/storage"
import { useAuth, isAdmin } from "@/lib/auth"
import { Search, Filter, Download, Calendar, UserIcon, Activity } from "lucide-react"
import { format } from "date-fns"

export default function AuditLogPage() {
  const { user } = useAuth()
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [eons, setEons] = useState<EON[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("all")

  useEffect(() => {
    if (user && isAdmin(user)) {
      const logs = storage
        .getAll<AuditLog>("audit_logs")
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setAuditLogs(logs)
      setFilteredLogs(logs)
      setUsers(storage.getAll<User>("users"))
      setEons(storage.getAll<EON>("eons"))
    }
  }, [user])

  useEffect(() => {
    let filtered = auditLogs

    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.payload_json.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (actionFilter !== "all") {
      filtered = filtered.filter((log) => log.action === actionFilter)
    }

    if (userFilter !== "all") {
      filtered = filtered.filter((log) => log.actor_user_id === userFilter)
    }

    setFilteredLogs(filtered)
  }, [auditLogs, searchTerm, actionFilter, userFilter])

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    return user ? user.name : "Unknown User"
  }

  const getEONTitle = (eonId?: string) => {
    if (!eonId) return null
    const eon = eons.find((e) => e.id === eonId)
    return eon ? eon.subject : "Unknown Document"
  }

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("CREATE")) return "default"
    if (action.includes("UPDATE") || action.includes("EDIT")) return "secondary"
    if (action.includes("DELETE")) return "destructive"
    if (action.includes("APPROVE")) return "default"
    if (action.includes("REJECT")) return "destructive"
    if (action.includes("LOGIN")) return "outline"
    return "secondary"
  }

  const uniqueActions = [...new Set(auditLogs.map((log) => log.action))]

  if (!user || !isAdmin(user)) {
    return (
      <AuthGuard>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header title="Access Denied" />
            <main className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
                <p className="text-muted-foreground">You don't have permission to view audit logs.</p>
              </div>
            </main>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Audit Log">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </Header>
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search actions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={actionFilter} onValueChange={setActionFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Actions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        {uniqueActions.map((action) => (
                          <SelectItem key={action} value={action}>
                            {action}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={userFilter} onValueChange={setUserFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Users" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Activity className="w-4 h-4 mr-2" />
                      {filteredLogs.length} entries
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Audit Log Entries */}
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <Card key={log.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant={getActionBadgeVariant(log.action)}>{log.action}</Badge>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <UserIcon className="w-4 h-4" />
                              {getUserName(log.actor_user_id)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(log.created_at), "MMM dd, yyyy HH:mm:ss")}
                            </div>
                          </div>

                          {log.eon_id && (
                            <div className="mb-2">
                              <span className="text-sm font-medium">Document: </span>
                              <span className="text-sm text-muted-foreground">{getEONTitle(log.eon_id)}</span>
                            </div>
                          )}

                          {log.payload_json && log.payload_json !== "{}" && (
                            <div className="bg-muted p-3 rounded-md">
                              <pre className="text-xs text-muted-foreground overflow-x-auto">
                                {JSON.stringify(JSON.parse(log.payload_json), null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredLogs.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No audit logs found</h3>
                      <p className="text-muted-foreground">
                        {searchTerm || actionFilter !== "all" || userFilter !== "all"
                          ? "Try adjusting your filters to see more results."
                          : "No audit logs have been recorded yet."}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
