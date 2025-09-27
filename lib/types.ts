// Type definitions for the eON application
export interface User {
    id: string;
    email: string;
    name: string;
    department_id: string;
    role_id: string;
    created_at: string;
    updated_at: string;
}

export interface Department {
    id: string;
    name: string;
    code: string;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

export interface Role {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

export interface Permission {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

export interface EON {
    id: string;
    number: string;
    subject: string;
    description_rich: string;
    creator_id: string;
    department_id: string;
    category_id: string;
    state: 'DRAFT' | 'IN_PROCESS' | 'APPROVED' | 'REJECTED' | 'CLARIFICATION_SOUGHT' | 'DELETED';
    created_at: string;
    updated_at: string;
}

export interface EONApprover {
    id: string;
    eon_id: string;
    approver_user_id: string;
    order_index: number;
    action: 'NONE' | 'APPROVED' | 'REJECTED' | 'CLARIFICATION_SOUGHT';
    comment?: string;
    created_at: string;
    updated_at: string;
}

export interface EONViewer {
    id: string;
    eon_id: string;
    user_id: string;
    created_at: string;
}

export interface EONComment {
    id: string;
    eon_id: string;
    user_id: string;
    content: string;
    created_at: string;
}

export interface EONAttachment {
    id: string;
    eon_id: string;
    filename: string;
    original_name: string;
    mime_type: string;
    size: number;
    uploaded_at: string;
}

export interface AuditLog {
    id: string;
    user_id: string;
    action: string;
    entity_type?: string;
    entity_id?: string;
    details?: Record<string, any>;
    created_at: string;
}
