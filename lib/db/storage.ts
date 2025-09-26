import { db } from './connection';
import {
    users,
    departments,
    categories,
    roles,
    permissions,
    eons,
    eonApprovers,
    eonViewers,
    eonComments,
    eonAttachments,
    auditLogs
} from './schema';
import { eq, and, desc, asc, like, or } from 'drizzle-orm';
import type {
    User,
    Department,
    Category,
    Role,
    Permission,
    EON,
    EONApprover,
    EONViewer,
    EONComment,
    EONAttachment
} from '../storage';

export class DatabaseStorage {
    // Generic CRUD operations
    async create<T>(table: any, data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
        const result = await db.insert(table).values({
            ...data,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        } as any).returning();
        return result[0] as T;
    }

    async getById<T>(table: any, id: string): Promise<T | null> {
        const result = await db.select().from(table).where(eq(table.id, id)).limit(1);
        return result[0] as T || null;
    }

    async getAll<T>(table: any): Promise<T[]> {
        const result = await db.select().from(table);
        return result as T[];
    }

    async update<T>(table: any, id: string, data: Partial<T>): Promise<T> {
        const result = await db.update(table)
            .set({
                ...data,
                updated_at: new Date().toISOString(),
            } as any)
            .where(eq(table.id, id))
            .returning();
        return result[0] as T;
    }

    async delete(table: any, id: string): Promise<void> {
        await db.delete(table).where(eq(table.id, id));
    }

    // User operations
    async getUserByEmail(email: string): Promise<User | null> {
        const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
        return result[0] as User || null;
    }

    async getUsersByDepartment(departmentId: string): Promise<User[]> {
        const result = await db.select().from(users).where(eq(users.department_id, departmentId));
        return result as User[];
    }

    // EON operations
    async getEONsByCreator(creatorId: string): Promise<EON[]> {
        const result = await db.select().from(eons)
            .where(and(eq(eons.creator_id, creatorId), eq(eons.state, 'DELETED')))
            .orderBy(desc(eons.created_at));
        return result as EON[];
    }

    async getEONsForApproval(approverId: string): Promise<EON[]> {
        const result = await db.select().from(eons)
            .innerJoin(eonApprovers, eq(eons.id, eonApprovers.eon_id))
            .where(and(
                eq(eonApprovers.approver_user_id, approverId),
                eq(eonApprovers.action, 'NONE'),
                or(eq(eons.state, 'IN_PROCESS'), eq(eons.state, 'CLARIFICATION_SOUGHT'))
            ))
            .orderBy(desc(eons.created_at));

        return result.map(row => row.eons) as EON[];
    }

    async getEONsForViewing(viewerId: string): Promise<EON[]> {
        const result = await db.select().from(eons)
            .innerJoin(eonViewers, eq(eons.id, eonViewers.eon_id))
            .where(eq(eonViewers.user_id, viewerId))
            .orderBy(desc(eons.created_at));

        return result.map(row => row.eons) as EON[];
    }

    async getEONApprovers(eonId: string): Promise<EONApprover[]> {
        const result = await db.select().from(eonApprovers)
            .where(eq(eonApprovers.eon_id, eonId))
            .orderBy(asc(eonApprovers.order_index));
        return result as EONApprover[];
    }

    async getEONViewers(eonId: string): Promise<EONViewer[]> {
        const result = await db.select().from(eonViewers)
            .where(eq(eonViewers.eon_id, eonId));
        return result as EONViewer[];
    }

    async getEONComments(eonId: string): Promise<EONComment[]> {
        const result = await db.select().from(eonComments)
            .where(eq(eonComments.eon_id, eonId))
            .orderBy(desc(eonComments.created_at));
        return result as EONComment[];
    }

    async getEONAttachments(eonId: string): Promise<EONAttachment[]> {
        const result = await db.select().from(eonAttachments)
            .where(eq(eonAttachments.eon_id, eonId))
            .orderBy(desc(eonAttachments.uploaded_at));
        return result as EONAttachment[];
    }

    // Search operations
    async searchEONs(query: string, userId?: string): Promise<EON[]> {
        let whereClause = or(
            like(eons.subject, `%${query}%`),
            like(eons.description_rich, `%${query}%`)
        );

        if (userId) {
            whereClause = and(
                whereClause,
                eq(eons.creator_id, userId)
            );
        }

        const result = await db.select().from(eons)
            .where(whereClause)
            .orderBy(desc(eons.created_at));

        return result as EON[];
    }

    // Audit operations
    async logAction(
        action: string,
        userId: string,
        entityId?: string,
        details?: Record<string, any>,
        entityType?: string
    ): Promise<void> {
        await db.insert(auditLogs).values({
            user_id: userId,
            action,
            entity_type: entityType,
            entity_id: entityType,
            details,
            created_at: new Date().toISOString(),
        });
    }

    async getAuditLogs(userId?: string, limit = 100): Promise<any[]> {
        let query = db.select().from(auditLogs);

        if (userId) {
            query = query.where(eq(auditLogs.user_id, userId));
        }

        const result = await query
            .orderBy(desc(auditLogs.created_at))
            .limit(limit);

        return result;
    }

    // Utility operations
    async generateEONNumber(departmentCode: string): Promise<string> {
        const year = new Date().getFullYear();
        const prefix = `${departmentCode}-${year}`;

        const result = await db.select().from(eons)
            .where(like(eons.number, `${prefix}%`))
            .orderBy(desc(eons.number))
            .limit(1);

        if (result.length === 0) {
            return `${prefix}-001`;
        }

        const lastNumber = result[0].number;
        const lastSequence = parseInt(lastNumber.split('-')[2]) || 0;
        const nextSequence = (lastSequence + 1).toString().padStart(3, '0');

        return `${prefix}-${nextSequence}`;
    }

    // Initialize default data (migrated from JSON storage)
    async initializeDefaultData(): Promise<void> {
        console.log('🔄 Initializing default data...');

        // Check if data already exists
        const existingUsers = await db.select().from(users).limit(1);
        if (existingUsers.length > 0) {
            console.log('📋 Default data already exists, skipping...');
            return;
        }

        // This will be handled by the seed script
        console.log('✅ Default data initialization completed');
    }
}

// Export singleton instance
export const storage = new DatabaseStorage();
