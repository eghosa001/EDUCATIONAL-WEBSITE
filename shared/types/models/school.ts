import type { User } from './user';

export interface School {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolStudent {
  id: string;
  schoolId: string;
  studentId: string;
  classId?: string;
  admittedAt: string;
}

export interface SchoolTeacher {
  id: string;
  schoolId: string;
  teacherId: string;
  joinedAt: string;
}

export interface SchoolClass {
  id: string;
  schoolId: string;
  classId: string;
  name: string;
  orderIndex: number;
}

export interface SchoolWithUsers extends School {
  administrators: User[];
  teachers: User[];
  students: User[];
}
