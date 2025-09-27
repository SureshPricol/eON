// Database-based storage system for eON application
// This file is kept for backward compatibility - actual implementation is in lib/db/storage.ts

// For client-side, we'll use a mock storage that makes API calls
// For server-side, we'll use the actual database storage

// Import types from separate file to avoid circular dependencies
export type {
  User,
  Department,
  Category,
  Role,
  Permission,
  EON,
  EONApprover,
  EONViewer,
  EONComment,
  EONAttachment,
  AuditLog
} from './types';

// All types are now imported from ./types to avoid circular dependencies

// Conditional import based on environment
let storage: any;

// Fallback storage implementation
const fallbackStorage = {
  async getAll() {
    console.log('[Storage] Fallback getAll called');
    return [];
  },
  async getById() {
    console.log('[Storage] Fallback getById called');
    return null;
  },
  async create() {
    console.log('[Storage] Fallback create called');
    throw new Error('Database storage not available');
  },
  async update() {
    console.log('[Storage] Fallback update called');
    throw new Error('Database storage not available');
  },
  async delete() {
    console.log('[Storage] Fallback delete called');
    throw new Error('Database storage not available');
  },
  async getUserByEmail() {
    console.log('[Storage] Fallback getUserByEmail called');
    return null;
  },
  async getUsersByDepartment() {
    console.log('[Storage] Fallback getUsersByDepartment called');
    return [];
  },
  async getEONsByCreator() {
    console.log('[Storage] Fallback getEONsByCreator called');
    return [];
  },
  async getEONsForApproval() {
    console.log('[Storage] Fallback getEONsForApproval called');
    return [];
  },
  async getEONsForViewing() {
    console.log('[Storage] Fallback getEONsForViewing called');
    return [];
  },
  async getEONApprovers() {
    console.log('[Storage] Fallback getEONApprovers called');
    return [];
  },
  async getEONViewers() {
    console.log('[Storage] Fallback getEONViewers called');
    return [];
  },
  async getEONComments() {
    console.log('[Storage] Fallback getEONComments called');
    return [];
  },
  async getEONAttachments() {
    console.log('[Storage] Fallback getEONAttachments called');
    return [];
  },
  async searchEONs() {
    console.log('[Storage] Fallback searchEONs called');
    return [];
  },
  async logAction() {
    console.log('[Storage] Fallback logAction called - audit logging disabled');
  },
  async getAuditLogs() {
    console.log('[Storage] Fallback getAuditLogs called');
    return [];
  },
  async generateEONNumber() {
    console.log('[Storage] Fallback generateEONNumber called');
    return 'ERROR-001';
  },
  async initializeDefaultData() {
    console.log('[Storage] Fallback initializeDefaultData called - database initialization skipped');
  }
};

// For server-side, we need to handle the async initialization differently
if (typeof window === 'undefined') {
  // Server-side: Initialize storage synchronously with a fallback
  try {
    // Try to require the module synchronously first
    const dbStorageModule = require('./db/storage');
    if (dbStorageModule && dbStorageModule.storage) {
      storage = dbStorageModule.storage;
      console.log('[Storage] Server-side database storage loaded successfully (sync)');
    } else {
      throw new Error('Database storage module not properly exported');
    }
  } catch (error) {
    console.error('[Storage] Failed to load database storage (sync):', error);
    console.error('[Storage] Error details:', error instanceof Error ? error.message : String(error));

    // Use fallback storage
    storage = fallbackStorage;
  }
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
      if (!response.ok) {
        throw new Error(`Failed to fetch ${table} with id ${id}`);
      }
      return response.json();
    },

    async getAll(table: string) {
      const response = await fetch(`/api/data/${table}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${table}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
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

    async getUserByEmail(email: string) {
      const response = await fetch(`/api/users/email/${email}`);
      return response.json();
    },

    async getUsersByDepartment(departmentId: string) {
      const response = await fetch(`/api/users/department/${departmentId}`);
      return response.json();
    },

    async getEONsByCreator(creatorId: string) {
      const response = await fetch(`/api/eons/creator/${creatorId}`);
      return response.json();
    },

    async getEONsForApproval(approverId: string) {
      const response = await fetch(`/api/eons/approval/${approverId}`);
      return response.json();
    },

    async getEONsForViewing(viewerId: string) {
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

// Validate storage object
if (!storage) {
  console.error('[Storage] CRITICAL ERROR: Storage object is undefined!');
  throw new Error('Storage object failed to initialize');
}

if (typeof storage.getAll !== 'function') {
  console.error('[Storage] CRITICAL ERROR: Storage object missing required methods!');
  console.error('[Storage] Available methods:', Object.keys(storage));
  throw new Error('Storage object is missing required methods');
}

console.log('[Storage] Storage object validated successfully');
console.log('[Storage] Available methods:', Object.keys(storage));

export { storage };
