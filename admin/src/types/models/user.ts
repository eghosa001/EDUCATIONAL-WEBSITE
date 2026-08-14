export type UserRole = 'student' | 'parent' | 'teacher' | 'school_admin' | 'content_admin' | 'super_admin';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  roles: UserRole[];
}
