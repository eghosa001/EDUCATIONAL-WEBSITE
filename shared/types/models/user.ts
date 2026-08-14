export type UserRole = 'student' | 'parent' | 'teacher' | 'school_admin' | 'content_admin' | 'super_admin';

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface User {
  id: string;
  email: string;
  phone?: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: string;
  gender?: Gender;
  avatarUrl?: string;
  isVerified: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  emailVerifiedAt?: string;
  phoneVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Record<string, unknown>;
  createdAt: string;
}

export interface UserRoleAssignment {
  userId: string;
  roleId: string;
  assignedAt: string;
  assignedBy?: string;
}

export interface Session {
  id: string;
  userId: string;
  tokenHash: string;
  refreshTokenHash?: string;
  deviceInfo?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: string;
  createdAt: string;
}

export interface PasswordReset {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
}
