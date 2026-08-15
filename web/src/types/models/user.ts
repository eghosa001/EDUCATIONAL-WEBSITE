export type UserRole = 'student' | 'teacher' | 'parent' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  schoolId?: string;
  schoolName?: string;
  className?: string;
}

export interface Student extends User {
  role: 'student';
  schoolId?: string;
  classId?: string;
}

export interface Teacher extends User {
  role: 'teacher';
  schoolId?: string;
  subjectIds: string[];
  verified: boolean;
}

export interface Parent extends User {
  role: 'parent';
  studentIds: string[];
}

export interface Admin extends User {
  role: 'admin';
  permissions: string[];
}
