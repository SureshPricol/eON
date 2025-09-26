import { pgTable, text, timestamp, uuid, integer, boolean, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    department_id: uuid('department_id').notNull(),
    roles: json('roles').$type<string[]>().notNull().default([]),
    status: text('status', { enum: ['active', 'inactive'] }).notNull().default('active'),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// Departments table
export const departments = pgTable('departments', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    code: text('code').notNull().unique(),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// Categories table
export const categories = pgTable('categories', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// Roles table
export const roles = pgTable('roles', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    permissions: json('permissions').$type<string[]>().notNull().default([]),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// Permissions table
export const permissions = pgTable('permissions', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    description: text('description').notNull(),
    module: text('module').notNull(),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// EONs (documents) table
export const eons = pgTable('eons', {
    id: uuid('id').primaryKey().defaultRandom(),
    number: text('number').notNull().unique(),
    subject: text('subject').notNull(),
    description_rich: text('description_rich').notNull(),
    category_id: uuid('category_id').notNull(),
    creator_id: uuid('creator_id').notNull(),
    department_id: uuid('department_id').notNull(),
    created_at: timestamp('created_at').notNull().defaultNow(),
    submitted_at: timestamp('submitted_at'),
    final_approver_id: uuid('final_approver_id'),
    state: text('state', {
        enum: ['DRAFT', 'IN_PROCESS', 'CLARIFICATION_SOUGHT', 'REJECTED', 'APPROVED', 'ARCHIVED', 'DELETED']
    }).notNull().default('DRAFT'),
    version: integer('version').notNull().default(1),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// EON Approvers table
export const eonApprovers = pgTable('eon_approvers', {
    id: uuid('id').primaryKey().defaultRandom(),
    eon_id: uuid('eon_id').notNull(),
    order_index: integer('order_index').notNull(),
    approver_user_id: uuid('approver_user_id').notNull(),
    is_final: boolean('is_final').notNull().default(false),
    alternate_user_id: uuid('alternate_user_id'),
    acted_at: timestamp('acted_at'),
    action: text('action', {
        enum: ['CONSENT', 'APPROVE', 'REJECT', 'ASK_CLARIFICATION', 'NONE']
    }).notNull().default('NONE'),
    comment_id: uuid('comment_id'),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// EON Viewers table
export const eonViewers = pgTable('eon_viewers', {
    id: uuid('id').primaryKey().defaultRandom(),
    eon_id: uuid('eon_id').notNull(),
    user_id: uuid('user_id').notNull(),
    added_by_user_id: uuid('added_by_user_id').notNull(),
    added_at: timestamp('added_at').notNull().defaultNow(),
});

// EON Comments table
export const eonComments = pgTable('eon_comments', {
    id: uuid('id').primaryKey().defaultRandom(),
    eon_id: uuid('eon_id').notNull(),
    author_user_id: uuid('author_user_id').notNull(),
    body_rich: text('body_rich').notNull(),
    visibility: text('visibility', { enum: ['all', 'approvers', 'creator'] }).notNull().default('all'),
    type: text('type', { enum: ['GENERAL', 'CLARIFICATION', 'APPROVAL'] }).notNull().default('GENERAL'),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// EON Attachments table
export const eonAttachments = pgTable('eon_attachments', {
    id: uuid('id').primaryKey().defaultRandom(),
    eon_id: uuid('eon_id').notNull(),
    filename: text('filename').notNull(),
    original_name: text('original_name').notNull(),
    mime_type: text('mime_type').notNull(),
    size: integer('size').notNull(),
    uploaded_by_user_id: uuid('uploaded_by_user_id').notNull(),
    uploaded_at: timestamp('uploaded_at').notNull().defaultNow(),
});

// Audit Log table
export const auditLogs = pgTable('audit_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull(),
    action: text('action').notNull(),
    entity_type: text('entity_type'),
    entity_id: uuid('entity_id'),
    details: json('details').$type<Record<string, any>>(),
    ip_address: text('ip_address'),
    user_agent: text('user_agent'),
    created_at: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
    department: one(departments, {
        fields: [users.department_id],
        references: [departments.id],
    }),
    createdEons: many(eons),
    approverEons: many(eonApprovers),
    viewerEons: many(eonViewers),
    comments: many(eonComments),
    attachments: many(eonAttachments),
    auditLogs: many(auditLogs),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
    users: many(users),
    eons: many(eons),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
    eons: many(eons),
}));

export const eonsRelations = relations(eons, ({ one, many }) => ({
    category: one(categories, {
        fields: [eons.category_id],
        references: [categories.id],
    }),
    creator: one(users, {
        fields: [eons.creator_id],
        references: [users.id],
    }),
    department: one(departments, {
        fields: [eons.department_id],
        references: [departments.id],
    }),
    finalApprover: one(users, {
        fields: [eons.final_approver_id],
        references: [users.id],
    }),
    approvers: many(eonApprovers),
    viewers: many(eonViewers),
    comments: many(eonComments),
    attachments: many(eonAttachments),
}));

export const eonApproversRelations = relations(eonApprovers, ({ one }) => ({
    eon: one(eons, {
        fields: [eonApprovers.eon_id],
        references: [eons.id],
    }),
    approver: one(users, {
        fields: [eonApprovers.approver_user_id],
        references: [users.id],
    }),
    alternateUser: one(users, {
        fields: [eonApprovers.alternate_user_id],
        references: [users.id],
    }),
    comment: one(eonComments, {
        fields: [eonApprovers.comment_id],
        references: [eonComments.id],
    }),
}));

export const eonViewersRelations = relations(eonViewers, ({ one }) => ({
    eon: one(eons, {
        fields: [eonViewers.eon_id],
        references: [eons.id],
    }),
    user: one(users, {
        fields: [eonViewers.user_id],
        references: [users.id],
    }),
    addedBy: one(users, {
        fields: [eonViewers.added_by_user_id],
        references: [users.id],
    }),
}));

export const eonCommentsRelations = relations(eonComments, ({ one }) => ({
    eon: one(eons, {
        fields: [eonComments.eon_id],
        references: [eons.id],
    }),
    author: one(users, {
        fields: [eonComments.author_user_id],
        references: [users.id],
    }),
}));

export const eonAttachmentsRelations = relations(eonAttachments, ({ one }) => ({
    eon: one(eons, {
        fields: [eonAttachments.eon_id],
        references: [eons.id],
    }),
    uploadedBy: one(users, {
        fields: [eonAttachments.uploaded_by_user_id],
        references: [users.id],
    }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
    user: one(users, {
        fields: [auditLogs.user_id],
        references: [users.id],
    }),
}));
