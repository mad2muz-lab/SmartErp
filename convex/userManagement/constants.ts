// Constants for user and organization management

export const GLOBAL_ADMIN_APPROVAL_STATUS = {
  PENDING_GLOBAL_APPROVAL: "pending_global_approval",
  APPROVED: "approved",
  REJECTED: "rejected"
} as const;

export const ORG_ASSIGNMENT_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  GLOBAL_OVERRIDE: "global_override"
} as const;

export const USER_STATUS = {
  PENDING: "pending",
  APPROVED: "approved", 
  REJECTED: "rejected",
  SUSPENDED: "suspended"
} as const;

export const USER_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin", 
  MANAGER: "manager",
  USER: "user",
  VIEWER: "viewer"
} as const;
