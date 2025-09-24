"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { storage, type EON } from "@/lib/storage"
import { useState, useEffect } from "react"
import Link from "next/link"
import { FileText, Plus, Clock, CheckCircle, AlertCircle } from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalEONs: 0,
    drafts: 0,
    inProcess: 0,
    approved: 0,
    pendingApproval: 0,
  })

  useEffect(() => {
    if (user) {
      const allEONs = storage.getAll<EON>("eons")
      const userEONs = allEONs.filter((eon) => eon.creator_id === user.id)

      setStats({
        totalEONs: userEONs.length,
        drafts: userEONs.filter((eon) => eon.state === "DRAFT").length,
        inProcess: userEONs.filter((eon) => eon.state === "IN_PROCESS").length,
        approved: userEONs.filter((eon) => eon.state === "APPROVED").length,
        pendingApproval: allEONs.filter((eon) => {
          // Check if user is a pending approver
          const approvers = storage.getAll("eon_approvers").filter((a) => a.eon_id === eon.id)
          return approvers.some((a) => a.approver_user_id === user.id && a.action === "NONE")
        }).length,
      })
    }
  }, [user])

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Dashboard" />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Welcome Section */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Welcome back, {user?.name}</h2>
                  <p className="text-muted-foreground">Here's what's happening with your eONs today.</p>
                </div>
                <Link href="/documents/create">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New eON
                  </Button>
                </Link>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total eONs</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalEONs}</div>
                    <p className="text-xs text-muted-foreground">All your documents</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.drafts}</div>
                    <p className="text-xs text-muted-foreground">Pending submission</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">In Process</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.inProcess}</div>
                    <p className="text-xs text-muted-foreground">Awaiting approval</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Approved</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.approved}</div>
                    <p className="text-xs text-muted-foreground">Completed successfully</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Plus className="w-5 h-5 mr-2" />
                      Create New eON
                    </CardTitle>
                    <CardDescription>Start a new electronic office note</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/documents/create">
                      <Button className="w-full">Create eON</Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Pending Approvals
                    </CardTitle>
                    <CardDescription>{stats.pendingApproval} documents need your approval</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/documents/approvals">
                      <Button variant="outline" className="w-full bg-transparent">
                        Review Approvals
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      My Documents
                    </CardTitle>
                    <CardDescription>View all your created documents</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/documents/created">
                      <Button variant="outline" className="w-full bg-transparent">
                        View Documents
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest eON activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm">Welcome to eON! Start by creating your first document.</p>
                        <p className="text-xs text-muted-foreground">Just now</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
