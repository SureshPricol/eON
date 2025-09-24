"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { DocumentCard } from "@/components/documents/document-card"
import { DocumentFilters } from "@/components/documents/document-filters"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { storage, type EON, type EONApprover, type Category, type Department } from "@/lib/storage"
import { useAuth } from "@/lib/auth"
import { CheckCircle, Clock, AlertCircle, Check, X, MessageSquare, Eye } from "lucide-react"

interface ApprovalAction {
  eon: EON
  action: "APPROVE" | "REJECT" | "ASK_CLARIFICATION"
}

export default function ApprovalQueuePage() {
  const { user } = useAuth()
  const [eons, setEons] = useState<EON[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [filteredEons, setFilteredEons] = useState<EON[]>([])
  const [stats, setStats] = useState({
    pending: 0,
    overdue: 0,
    completed: 0,
  })

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")

  // Dialog states
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [currentAction, setCurrentAction] = useState<ApprovalAction | null>(null)
  const [comment, setComment] = useState("")

  const loadData = () => {
    if (user) {
      console.log("[v0] Loading approval queue for user:", user.email)
      const allEons = storage.getAll<EON>("eons")
      const allApprovers = storage.getAll<EONApprover>("eon_approvers")

      console.log("[v0] Total eONs:", allEons.length)
      console.log("[v0] Total approvers:", allApprovers.length)
      console.log("[v0] User ID:", user.id)

      // Get eONs where user is an approver
      const approverEonIds = allApprovers
        .filter((approver) => approver.approver_user_id === user.id)
        .map((approver) => approver.eon_id)

      console.log("[v0] User approver eON IDs:", approverEonIds)

      const approvalEons = allEons.filter((eon) => approverEonIds.includes(eon.id) && eon.state !== "DELETED")

      console.log("[v0] Final approval eONs:", approvalEons.length)
      setEons(approvalEons)

      // Calculate stats
      const pending = approvalEons.filter((eon) => {
        const approver = allApprovers.find((a) => a.eon_id === eon.id && a.approver_user_id === user.id)
        return (
          approver && approver.action === "NONE" && (eon.state === "IN_PROCESS" || eon.state === "CLARIFICATION_SOUGHT")
        )
      }).length

      const completed = allApprovers.filter((a) => a.approver_user_id === user.id && a.action !== "NONE").length

      console.log("[v0] Approval stats - Pending:", pending, "Completed:", completed)

      setStats({
        pending,
        overdue: 0, // For demo, we'll set this to 0
        completed,
      })
    }
    setCategories(storage.getAll<Category>("categories"))
    setDepartments(storage.getAll<Department>("departments"))
  }

  useEffect(() => {
    loadData()
  }, [user])

  // Apply filters
  useEffect(() => {
    let filtered = eons

    if (searchTerm) {
      filtered = filtered.filter(
        (eon) =>
          eon.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          eon.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          eon.description_rich.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedCategory) {
      filtered = filtered.filter((eon) => eon.category_id === selectedCategory)
    }

    if (selectedDepartment) {
      filtered = filtered.filter((eon) => eon.department_id === selectedDepartment)
    }

    if (selectedStatus) {
      filtered = filtered.filter((eon) => eon.state === selectedStatus)
    }

    // Sort by priority: pending approvals first, then by date
    filtered.sort((a, b) => {
      const allApprovers = storage.getAll<EONApprover>("eon_approvers")
      const aApprover = allApprovers.find(
        (approver) => approver.eon_id === a.id && approver.approver_user_id === user?.id,
      )
      const bApprover = allApprovers.find(
        (approver) => approver.eon_id === b.id && approver.approver_user_id === user?.id,
      )

      const aPending = aApprover?.action === "NONE" && (a.state === "IN_PROCESS" || a.state === "CLARIFICATION_SOUGHT")
      const bPending = bApprover?.action === "NONE" && (b.state === "IN_PROCESS" || b.state === "CLARIFICATION_SOUGHT")

      if (aPending && !bPending) return -1
      if (!aPending && bPending) return 1

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    setFilteredEons(filtered)
  }, [eons, searchTerm, selectedCategory, selectedDepartment, selectedStatus, user])

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCategory("")
    setSelectedDepartment("")
    setSelectedStatus("")
  }

  const handleApprovalAction = (eon: EON, action: "APPROVE" | "REJECT" | "ASK_CLARIFICATION") => {
    setCurrentAction({ eon, action })
    if (action === "ASK_CLARIFICATION") {
      setShowActionDialog(true)
    } else {
      setShowConfirmDialog(true)
    }
  }

  const confirmAction = () => {
    if (!currentAction || !user) return

    const { eon, action } = currentAction

    // Update approver action
    const allApprovers = storage.getAll<EONApprover>("eon_approvers")
    const approver = allApprovers.find((a) => a.eon_id === eon.id && a.approver_user_id === user.id)

    if (approver) {
      // Create comment if provided
      let commentId: string | undefined
      if (comment.trim()) {
        const newComment = storage.create("eon_comments", {
          eon_id: eon.id,
          author_user_id: user.id,
          body_rich: comment.trim(),
          visibility: "all" as const,
          type: action === "ASK_CLARIFICATION" ? "CLARIFICATION" : ("GENERAL" as const),
        })
        commentId = newComment.id
      }

      // Update approver
      storage.update<EONApprover>("eon_approvers", approver.id, {
        action,
        acted_at: new Date().toISOString(),
        comment_id: commentId,
      })

      // Update eON state based on action
      let newState: EON["state"] = eon.state
      if (action === "APPROVE") {
        // Check if this is the final approver or if all approvers have approved
        const eonApprovers = storage.getEONApprovers(eon.id)
        const remainingApprovers = eonApprovers.filter((a) => a.action === "NONE" && a.id !== approver.id)

        if (approver.is_final || remainingApprovers.length === 0) {
          newState = "APPROVED"
        }
      } else if (action === "REJECT") {
        newState = "REJECTED"
      } else if (action === "ASK_CLARIFICATION") {
        newState = "CLARIFICATION_SOUGHT"
      }

      storage.update<EON>("eons", eon.id, { state: newState })

      // Log action
      storage.logAction(`${action}_EON`, user.id, eon.id, {
        subject: eon.subject,
        comment: comment.trim() || undefined,
      })

      // Reset states and reload data
      setCurrentAction(null)
      setComment("")
      setShowActionDialog(false)
      setShowConfirmDialog(false)
      loadData()
    }
  }

  const canUserApprove = (eon: EON): boolean => {
    if (!user) return false
    const allApprovers = storage.getAll<EONApprover>("eon_approvers")
    const approver = allApprovers.find((a) => a.eon_id === eon.id && a.approver_user_id === user.id)
    return approver?.action === "NONE" && (eon.state === "IN_PROCESS" || eon.state === "CLARIFICATION_SOUGHT")
  }

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Approval Queue" />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                    <p className="text-xs text-muted-foreground">Require your action</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
                    <p className="text-xs text-muted-foreground">Past due date</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <DocumentFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedDepartment={selectedDepartment}
                onDepartmentChange={setSelectedDepartment}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                categories={categories}
                departments={departments}
                onClearFilters={clearFilters}
              />

              {/* Results */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Documents Requiring Approval ({filteredEons.length})</h2>
                </div>

                {filteredEons.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No pending approvals</h3>
                    <p className="text-muted-foreground">
                      {eons.length === 0
                        ? "You don't have any documents to approve."
                        : "No documents match your current filters."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEons.map((eon) => {
                      const isPending = canUserApprove(eon)

                      return (
                        <div key={eon.id} className="relative">
                          {isPending && (
                            <Badge className="absolute -top-2 -right-2 z-10 bg-orange-500 text-white">
                              Action Required
                            </Badge>
                          )}
                          <Card className="hover:shadow-md transition-shadow duration-200">
                            <DocumentCard eon={eon} showActions={false} />
                            {isPending && (
                              <CardContent className="pt-0">
                                <div className="flex gap-2 mt-4">
                                  <Button
                                    size="sm"
                                    onClick={() => handleApprovalAction(eon, "APPROVE")}
                                    className="flex-1"
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleApprovalAction(eon, "REJECT")}
                                    className="flex-1"
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Reject
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleApprovalAction(eon, "ASK_CLARIFICATION")}
                                  >
                                    <MessageSquare className="w-4 h-4 mr-1" />
                                    Clarify
                                  </Button>
                                </div>
                                <Button size="sm" variant="ghost" className="w-full mt-2" asChild>
                                  <a href={`/documents/${eon.id}`}>
                                    <Eye className="w-4 h-4 mr-1" />
                                    View Details
                                  </a>
                                </Button>
                              </CardContent>
                            )}
                          </Card>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Action Dialog for Clarification */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Clarification</DialogTitle>
            <DialogDescription>
              Ask the document creator or previous approvers for clarification on "{currentAction?.eon.subject}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="comment">Comment (required)</Label>
              <Textarea
                id="comment"
                placeholder="Please specify the budget allocation breakdown for Q3..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-1"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAction} disabled={!comment.trim()}>
              Send Clarification Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {currentAction?.action === "APPROVE" ? "Approve Document" : "Reject Document"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {currentAction?.action === "APPROVE" ? "approve" : "reject"} the document "
              {currentAction?.eon.subject}"?
              {currentAction?.action === "REJECT" && " This action will stop the approval process."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="confirmComment">Comment (optional)</Label>
              <Textarea
                id="confirmComment"
                placeholder="Add a comment about your decision..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction}>
              {currentAction?.action === "APPROVE" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthGuard>
  )
}
