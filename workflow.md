# eON Document Management System - Workflow

## Main Application Workflow

```mermaid
graph TD
    A[User Login] --> B{Authentication}
    B -->|Success| C[Dashboard]
    B -->|Failure| A
    
    C --> D[Document Management]
    C --> E[Masters Management]
    C --> F[Audit Log]
    
    D --> G[Create Document]
    D --> H[View Documents]
    D --> I[Approval Queue]
    
    G --> J[Document Creation Form]
    J --> K[Add Approvers]
    J --> L[Add Viewers]
    J --> M[Upload Attachments]
    J --> N{Save Action}
    N -->|Save Draft| O[DRAFT State]
    N -->|Submit for Approval| P[IN_PROCESS State]
    
    O --> Q[Edit Document]
    Q --> N
    
    P --> R[Approval Workflow]
    R --> S[Sequential Approval]
    S --> T{Approver Action}
    T -->|Approve| U{Is Final Approver?}
    T -->|Reject| V[REJECTED State]
    T -->|Ask Clarification| W[CLARIFICATION_SOUGHT State]
    
    U -->|Yes| X[APPROVED State]
    U -->|No| Y[Next Approver]
    Y --> T
    
    W --> Z[Creator Response]
    Z --> AA[Resubmit for Approval]
    AA --> P
    
    V --> BB[Archive Document]
    X --> BB
    
    I --> CC[Pending Approvals]
    CC --> T
    
    H --> DD[Document Views]
    DD --> EE[Created by Me]
    DD --> FF[Shared with Me]
    DD --> GG[Archived]
    
    E --> HH[User Management]
    E --> II[Role Management]
    E --> JJ[Permission Management]
    E --> KK[Category Management]
    E --> LL[Department Management]
```

## Document States and Transitions

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Create Document
    
    DRAFT --> DRAFT: Save Changes
    DRAFT --> IN_PROCESS: Submit for Approval
    
    IN_PROCESS --> CLARIFICATION_SOUGHT: Ask Clarification
    IN_PROCESS --> REJECTED: Reject
    IN_PROCESS --> APPROVED: Final Approval
    
    CLARIFICATION_SOUGHT --> IN_PROCESS: Resubmit
    CLARIFICATION_SOUGHT --> DRAFT: Edit and Resubmit
    
    REJECTED --> ARCHIVED: Archive
    APPROVED --> ARCHIVED: Archive
    
    ARCHIVED --> [*]
```

## User Roles and Permissions

```mermaid
graph LR
    A[User] --> B[Regular User]
    A --> C[Admin User]
    
    B --> D[Create Documents]
    B --> E[View Own Documents]
    B --> F[Approve Assigned Documents]
    B --> G[View Shared Documents]
    
    C --> H[All User Permissions]
    C --> I[Manage Users]
    C --> J[Manage Roles]
    C --> K[Manage Permissions]
    C --> L[Manage Categories]
    C --> M[Manage Departments]
    C --> N[View Audit Log]
```

## Approval Sequence Workflow

```mermaid
sequenceDiagram
    participant C as Creator
    participant S as System
    participant A1 as Approver 1
    participant A2 as Approver 2
    participant AF as Final Approver
    
    C->>S: Create Document
    C->>S: Add Approvers (Sequential)
    C->>S: Submit for Approval
    
    S->>A1: Notify First Approver
    A1->>S: Review Document
    A1->>S: Approve/Reject/Ask Clarification
    
    alt Approve
        S->>A2: Notify Next Approver
        A2->>S: Review Document
        A2->>S: Approve/Reject/Ask Clarification
        
        alt Approve
            S->>AF: Notify Final Approver
            AF->>S: Final Approval
            S->>C: Document Approved
        else Reject
            S->>C: Document Rejected
        end
    else Reject
        S->>C: Document Rejected
    else Ask Clarification
        S->>C: Clarification Requested
        C->>S: Provide Clarification
        S->>A1: Resubmit for Review
    end
```

## Key Features

### Document Management
- **Create**: Rich text editor, approver selection, viewer assignment, attachments
- **Edit**: Modify draft documents, update approvers/viewers
- **View**: Document details, approval sequence, activity timeline, comments
- **Archive**: Move completed documents to archive

### Approval System
- **Sequential Approval**: Ordered approver sequence
- **Final Approver**: Designated final approval authority
- **Actions**: Approve, Reject, Ask Clarification
- **Comments**: Add comments with actions
- **Notifications**: Real-time approval status updates

### User Management
- **Authentication**: Email-based login
- **Roles**: Admin and regular user roles
- **Permissions**: Granular permission system
- **Departments**: Organizational structure
- **Categories**: Document categorization

### Audit & Tracking
- **Activity Log**: Complete document lifecycle tracking
- **User Actions**: Login, logout, document operations
- **Approval History**: Complete approval sequence with timestamps
- **Comments**: Threaded discussion system
