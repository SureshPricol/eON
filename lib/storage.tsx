// Database-based storage system for eON application
// This file is kept for backward compatibility - actual implementation is in lib/db/storage.ts

// For client-side, we'll use a mock storage that makes API calls
// For server-side, we'll use the actual database storage
export interface User {
  id: string
  email: string
  name: string
  department_id: string
  roles: string[]
  status: "active" | "inactive"
  created_at: string
  updated_at: string
}

export interface Department {
  id: string
  name: string
  code: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Role {
  id: string
  name: string
  permissions: string[]
  created_at: string
  updated_at: string
}

export interface Permission {
  id: string
  name: string
  description: string
  module: string
  created_at: string
  updated_at: string
}

export interface EON {
  id: string
  number: string
  subject: string
  description_rich: string
  category_id: string
  creator_id: string
  department_id: string
  created_at: string
  updated_at: string
  submitted_at?: string
  final_approver_id?: string
  state: "DRAFT" | "IN_PROCESS" | "CLARIFICATION_SOUGHT" | "REJECTED" | "APPROVED" | "ARCHIVED" | "DELETED"
  version: number
}

export interface EONApprover {
  id: string
  eon_id: string
  order_index: number
  approver_user_id: string
  is_final: boolean
  alternate_user_id?: string
  acted_at?: string
  action: "CONSENT" | "APPROVE" | "REJECT" | "ASK_CLARIFICATION" | "NONE"
  comment_id?: string
  created_at: string
  updated_at: string
}

export interface EONViewer {
  id: string
  eon_id: string
  user_id: string
  added_by_user_id: string
  added_at: string
  created_at: string
  updated_at: string
}

export interface EONComment {
  id: string
  eon_id: string
  author_user_id: string
  body_rich: string
  visibility: "all" | "approvers" | "specific"
  created_at: string
  updated_at: string
  type: "GENERAL" | "CLARIFICATION"
}

export interface EONAttachment {
  id: string
  eon_id: string
  added_by_user_id: string
  filename: string
  size: number
  file_url: string // Using local storage instead of OneDrive
  added_at: string
}

export interface AuditLog {
  id: string
  eon_id?: string
  actor_user_id: string
  action: string
  payload_json: string
  ip?: string
  user_agent?: string
  created_at: string
  updated_at: string
}

// Storage class for managing JSON data
class JSONStorage {
  private getStorageKey(entity: string): string {
    return `eon_${entity}`
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private getCurrentTimestamp(): string {
    return new Date().toISOString()
  }

  // Generic CRUD operations
  create<T extends { id: string; created_at: string; updated_at: string }>(
    entity: string,
    data: Omit<T, "id" | "created_at" | "updated_at">,
  ): T {
    const items = this.getAll<T>(entity)
    const newItem = {
      ...data,
      id: this.generateId(),
      created_at: this.getCurrentTimestamp(),
      updated_at: this.getCurrentTimestamp(),
    } as T

    items.push(newItem)
    localStorage.setItem(this.getStorageKey(entity), JSON.stringify(items))
    return newItem
  }

  getAll<T>(entity: string): T[] {
    const data = localStorage.getItem(this.getStorageKey(entity))
    return data ? JSON.parse(data) : []
  }

  getById<T extends { id: string }>(entity: string, id: string): T | null {
    const items = this.getAll<T>(entity)
    return items.find((item) => item.id === id) || null
  }

  update<T extends { id: string; updated_at: string }>(
    entity: string,
    id: string,
    updates: Partial<Omit<T, "id" | "created_at">>,
  ): T | null {
    const items = this.getAll<T>(entity)
    const index = items.findIndex((item) => item.id === id)

    if (index === -1) return null

    const updatedItem = {
      ...items[index],
      ...updates,
      updated_at: this.getCurrentTimestamp(),
    }

    items[index] = updatedItem
    localStorage.setItem(this.getStorageKey(entity), JSON.stringify(items))
    return updatedItem
  }

  delete<T extends { id: string }>(entity: string, id: string): boolean {
    const items = this.getAll<T>(entity)
    const filteredItems = items.filter((item) => item.id !== id)

    if (filteredItems.length === items.length) return false

    localStorage.setItem(this.getStorageKey(entity), JSON.stringify(filteredItems))
    return true
  }

  // Specialized methods for eON workflow
  generateEONNumber(departmentCode: string): string {
    const year = new Date().getFullYear()
    const eons = this.getAll<EON>("eons")
    const yearEONs = eons.filter((eon) => eon.number.startsWith(`${year}/${departmentCode}/`))
    const sequence = yearEONs.length + 1
    return `${year}/${departmentCode}/${sequence.toString().padStart(3, "0")}`
  }

  // Helper methods for document workflow queries
  getEONsByCreator(creatorId: string): EON[] {
    return this.getAll<EON>("eons").filter((eon) => eon.creator_id === creatorId)
  }

  getEONsForApproval(userId: string): EON[] {
    const approvers = this.getAll<EONApprover>("eon_approvers")
    const userApprovals = approvers.filter(
      (approver) => approver.approver_user_id === userId && approver.action === "NONE",
    )
    const eonIds = userApprovals.map((approval) => approval.eon_id)
    return this.getAll<EON>("eons").filter((eon) => eonIds.includes(eon.id) && eon.state === "IN_PROCESS")
  }

  getEONsSharedWithUser(userId: string): EON[] {
    const viewers = this.getAll<EONViewer>("eon_viewers")
    const userViewers = viewers.filter((viewer) => viewer.user_id === userId)
    const eonIds = userViewers.map((viewer) => viewer.eon_id)
    return this.getAll<EON>("eons").filter((eon) => eonIds.includes(eon.id))
  }

  getEONApprovers(eonId: string): EONApprover[] {
    return this.getAll<EONApprover>("eon_approvers")
      .filter((approver) => approver.eon_id === eonId)
      .sort((a, b) => a.order_index - b.order_index)
  }

  getEONViewers(eonId: string): EONViewer[] {
    return this.getAll<EONViewer>("eon_viewers").filter((viewer) => viewer.eon_id === eonId)
  }

  getEONComments(eonId: string): EONComment[] {
    return this.getAll<EONComment>("eon_comments")
      .filter((comment) => comment.eon_id === eonId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }

  getEONAttachments(eonId: string): EONAttachment[] {
    return this.getAll<EONAttachment>("eon_attachments").filter((attachment) => attachment.eon_id === eonId)
  }

  getCurrentApprover(eonId: string): EONApprover | null {
    const approvers = this.getEONApprovers(eonId)
    return approvers.find((approver) => approver.action === "NONE") || null
  }

  canUserApprove(eonId: string, userId: string): boolean {
    const currentApprover = this.getCurrentApprover(eonId)
    return currentApprover?.approver_user_id === userId
  }

  // Method to create clarification requests
  createClarificationRequest(
    eonId: string,
    fromUserId: string,
    toUserIds: string[],
    comment: string,
    attachments?: EONAttachment[],
  ): EONComment {
    // Create the clarification comment
    const clarificationComment = this.create<EONComment>("eon_comments", {
      eon_id: eonId,
      author_user_id: fromUserId,
      body_rich: comment,
      visibility: "specific",
      type: "CLARIFICATION",
    })

    // Update EON state to clarification sought
    this.update<{ id: string; updated_at: string; state: string }>("eons", eonId, { state: "CLARIFICATION_SOUGHT" })

    // Log the action
    this.logAction("REQUEST_CLARIFICATION", fromUserId, eonId, {
      recipients: toUserIds,
      comment_id: clarificationComment.id,
    })

    return clarificationComment
  }

  // Audit logging
  logAction(action: string, actorId: string, eonId?: string, payload?: any): void {
    const auditLog: Omit<AuditLog, "id" | "created_at" | "updated_at"> = {
      eon_id: eonId,
      actor_user_id: actorId,
      action,
      payload_json: JSON.stringify(payload || {}),
      ip: "localhost", // In real app, would get actual IP
      user_agent: navigator.userAgent,
    }

    this.create<AuditLog>("audit_logs", auditLog)
  }

  // Initialize default data
  initializeDefaultData(): void {
    console.log("[v0] Initializing default data...")

    // Check if data already exists
    const existingUsers = this.getAll("users")
    console.log("[v0] Existing users:", existingUsers.length)

    if (existingUsers.length > 0) {
      console.log("[v0] Data already exists, skipping initialization")
      return
    }

    console.log("[v0] Creating default data...")

    // Create default departments
    const departments: Omit<Department, "id" | "created_at" | "updated_at">[] = [
      { name: "Finance", code: "FIN" },
      { name: "Human Resources", code: "HR" },
      { name: "Information Technology", code: "IT" },
      { name: "Operations", code: "OPS" },
      { name: "Marketing", code: "MKT" },
    ]

    departments.forEach((dept) => this.create<Department>("departments", dept))
    console.log("[v0] Created departments:", departments.length)

    // Create default categories
    const categories: Omit<Category, "id" | "created_at" | "updated_at">[] = [
      { name: "Internal Memos", is_active: true },
      { name: "Project Proposals", is_active: true },
      { name: "Expense Reports", is_active: true },
      { name: "Policy Updates", is_active: true },
      { name: "Budget Requests", is_active: true },
    ]

    categories.forEach((cat) => this.create<Category>("categories", cat))
    console.log("[v0] Created categories:", categories.length)

    // Create default permissions
    const permissions: Omit<Permission, "id" | "created_at" | "updated_at">[] = [
      { name: "create_eon", description: "Create new eON documents", module: "eon" },
      { name: "edit_eon", description: "Edit eON documents", module: "eon" },
      { name: "approve_eon", description: "Approve eON documents", module: "eon" },
      { name: "view_all_eons", description: "View all eON documents", module: "eon" },
      { name: "manage_users", description: "Manage user accounts", module: "admin" },
      { name: "manage_categories", description: "Manage categories", module: "admin" },
      { name: "view_audit_logs", description: "View audit logs", module: "admin" },
    ]

    permissions.forEach((perm) => this.create<Permission>("permissions", perm))
    console.log("[v0] Created permissions:", permissions.length)

    // Create default roles
    const roles: Omit<Role, "id" | "created_at" | "updated_at">[] = [
      {
        name: "Admin",
        permissions: [
          "create_eon",
          "edit_eon",
          "approve_eon",
          "view_all_eons",
          "manage_users",
          "manage_categories",
          "view_audit_logs",
        ],
      },
      { name: "Manager", permissions: ["create_eon", "edit_eon", "approve_eon", "view_all_eons"] },
      { name: "Employee", permissions: ["create_eon", "edit_eon"] },
      { name: "Viewer", permissions: [] },
    ]

    roles.forEach((role) => this.create<Role>("roles", role))
    console.log("[v0] Created roles:", roles.length)

    // Create default users
    const finDept = this.getAll<Department>("departments").find((d) => d.code === "FIN")!
    const hrDept = this.getAll<Department>("departments").find((d) => d.code === "HR")!
    const itDept = this.getAll<Department>("departments").find((d) => d.code === "IT")!
    const opsDept = this.getAll<Department>("departments").find((d) => d.code === "OPS")!
    const mktDept = this.getAll<Department>("departments").find((d) => d.code === "MKT")!

    const users: Omit<User, "id" | "created_at" | "updated_at">[] = [
      {
        email: "john.smith@company.com",
        name: "John Smith",
        department_id: finDept.id,
        roles: ["Admin"],
        status: "active",
      },
      {
        email: "jane.doe@company.com",
        name: "Jane Doe",
        department_id: hrDept.id,
        roles: ["Manager"],
        status: "active",
      },
      {
        email: "alex.chen@company.com",
        name: "Alex Chen",
        department_id: itDept.id,
        roles: ["Employee"],
        status: "active",
      },
      {
        email: "sarah.wilson@company.com",
        name: "Sarah Wilson",
        department_id: hrDept.id,
        roles: ["Manager"],
        status: "active",
      },
      {
        email: "mike.johnson@company.com",
        name: "Mike Johnson",
        department_id: finDept.id,
        roles: ["Employee"],
        status: "active",
      },
    ]

    users.forEach((user) => this.create<User>("users", user))
    console.log("[v0] Created users:", users.length)

    const createdUsers = this.getAll<User>("users")
    const createdCategories = this.getAll<Category>("categories")
    const johnSmith = createdUsers.find((u) => u.email === "john.smith@company.com")!
    const janeDoe = createdUsers.find((u) => u.email === "jane.doe@company.com")!
    const alexChen = createdUsers.find((u) => u.email === "alex.chen@company.com")!
    const sarahWilson = createdUsers.find((u) => u.email === "sarah.wilson@company.com")!
    const mikeJohnson = createdUsers.find((u) => u.email === "mike.johnson@company.com")!

    const internalMemoCategory = createdCategories.find((c) => c.name === "Internal Memos")!
    const projectProposalCategory = createdCategories.find((c) => c.name === "Project Proposals")!
    const budgetRequestCategory = createdCategories.find((c) => c.name === "Budget Requests")!

    // Sample eON 1: Created by John, shared with Jane and Alex, needs approval from Sarah
    const eon1 = this.create<EON>("eons", {
      number: this.generateEONNumber("FIN"),
      subject: "Q4 Budget Allocation Review",
      description_rich:
        "<p>This document outlines the proposed budget allocation for Q4 operations, including departmental spending limits and project funding priorities.</p>",
      category_id: budgetRequestCategory.id,
      creator_id: johnSmith.id,
      department_id: finDept.id,
      state: "IN_PROCESS",
      version: 1,
      submitted_at: new Date().toISOString(),
    })

    // Add viewers for eON 1
    this.create<EONViewer>("eon_viewers", {
      eon_id: eon1.id,
      user_id: janeDoe.id,
      added_by_user_id: johnSmith.id,
      added_at: new Date().toISOString(),
    })

    this.create<EONViewer>("eon_viewers", {
      eon_id: eon1.id,
      user_id: alexChen.id,
      added_by_user_id: johnSmith.id,
      added_at: new Date().toISOString(),
    })

    // Add approver for eON 1
    this.create<EONApprover>("eon_approvers", {
      eon_id: eon1.id,
      order_index: 1,
      approver_user_id: sarahWilson.id,
      is_final: true,
      action: "NONE",
    })

    // Sample eON 2: Created by Jane, shared with Mike, needs approval from John
    const eon2 = this.create<EON>("eons", {
      number: this.generateEONNumber("HR"),
      subject: "New Employee Onboarding Process Update",
      description_rich:
        "<p>Proposed updates to the employee onboarding process to improve efficiency and new hire experience. Includes digital forms and automated workflows.</p>",
      category_id: internalMemoCategory.id,
      creator_id: janeDoe.id,
      department_id: hrDept.id,
      state: "IN_PROCESS",
      version: 1,
      submitted_at: new Date().toISOString(),
    })

    // Add viewer for eON 2
    this.create<EONViewer>("eon_viewers", {
      eon_id: eon2.id,
      user_id: mikeJohnson.id,
      added_by_user_id: janeDoe.id,
      added_at: new Date().toISOString(),
    })

    // Add approver for eON 2
    this.create<EONApprover>("eon_approvers", {
      eon_id: eon2.id,
      order_index: 1,
      approver_user_id: johnSmith.id,
      is_final: true,
      action: "NONE",
    })

    // Sample eON 3: Created by Alex, shared with Sarah and Mike, needs approval from Jane
    const eon3 = this.create<EON>("eons", {
      number: this.generateEONNumber("IT"),
      subject: "Cloud Infrastructure Migration Plan",
      description_rich:
        "<p>Comprehensive plan for migrating our on-premise infrastructure to cloud services. Includes timeline, cost analysis, and risk assessment.</p>",
      category_id: projectProposalCategory.id,
      creator_id: alexChen.id,
      department_id: itDept.id,
      state: "IN_PROCESS",
      version: 1,
      submitted_at: new Date().toISOString(),
    })

    // Add viewers for eON 3
    this.create<EONViewer>("eon_viewers", {
      eon_id: eon3.id,
      user_id: sarahWilson.id,
      added_by_user_id: alexChen.id,
      added_at: new Date().toISOString(),
    })

    this.create<EONViewer>("eon_viewers", {
      eon_id: eon3.id,
      user_id: mikeJohnson.id,
      added_by_user_id: alexChen.id,
      added_at: new Date().toISOString(),
    })

    // Add approver for eON 3
    this.create<EONApprover>("eon_approvers", {
      eon_id: eon3.id,
      order_index: 1,
      approver_user_id: janeDoe.id,
      is_final: true,
      action: "NONE",
    })

    console.log("[v0] Created sample eONs with viewers and approvers")

    // Verify users were created
    const finalUsers = this.getAll<User>("users")
    console.log("[v0] Final user count:", finalUsers.length)
    console.log(
      "[v0] Users created:",
      finalUsers.map((u) => u.email),
    )

    // Verify eONs were created
    const finalEONs = this.getAll<EON>("eons")
    const finalViewers = this.getAll<EONViewer>("eon_viewers")
    const finalApprovers = this.getAll<EONApprover>("eon_approvers")
    console.log("[v0] Final eON count:", finalEONs.length)
    console.log("[v0] Final viewer count:", finalViewers.length)
    console.log("[v0] Final approver count:", finalApprovers.length)
  }
}

// Conditional import based on environment
let storage: any;

if (typeof window === 'undefined') {
  // Server-side: use database storage
  const { storage: dbStorage } = require('./db/storage');
  storage = dbStorage;
} else {
  // Client-side: use API-based storage
  storage = {
    // Mock implementation that makes API calls
    async create(table: string, data: any) {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', table, data })
      });
      return response.json();
    },

    async getById(table: string, id: string) {
      const response = await fetch(`/api/data/${table}/${id}`);
      return response.json();
    },

    async getAll(table: string) {
      const response = await fetch(`/api/data/${table}`);
      return response.json();
    },

    async update(table: string, id: string, data: any) {
      const response = await fetch(`/api/data/${table}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    },

    async delete(table: string, id: string) {
      const response = await fetch(`/api/data/${table}/${id}`, {
        method: 'DELETE'
      });
      return response.json();
    },

    // Add other methods as needed
    getUserByEmail: async (email: string) => {
      const response = await fetch(`/api/users/email/${email}`);
      return response.json();
    },

    getEONsByCreator: async (creatorId: string) => {
      const response = await fetch(`/api/eons/creator/${creatorId}`);
      return response.json();
    },

    getEONsForApproval: async (approverId: string) => {
      const response = await fetch(`/api/eons/approval/${approverId}`);
      return response.json();
    },

    getEONsForViewing: async (viewerId: string) => {
      const response = await fetch(`/api/eons/viewing/${viewerId}`);
      return response.json();
    },

    logAction: async (action: string, userId: string, entityId?: string, details?: any) => {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId, entityId, details })
      });
      return response.json();
    },

    generateEONNumber: async (departmentCode: string) => {
      const response = await fetch(`/api/eons/generate-number/${departmentCode}`);
      return response.json();
    },

    initializeDefaultData: async () => {
      // No-op on client side
    }
  };
}

export { storage };

if (typeof window !== "undefined") {
  // Use setTimeout to ensure DOM is ready
  setTimeout(() => {
    console.log("[v0] Starting storage initialization...")
    storage.initializeDefaultData()
  }, 100)
}
