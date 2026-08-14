import type { User } from './user';

export interface Teacher extends User {
  schoolId?: string;
  subjectIds: string[];
  verified: boolean;
  bio?: string;
  yearsOfExperience?: number;
  qualifications?: string[];
  earnings: number;
}

export interface TeacherEarning {
  id: string;
  teacherId: string;
  amount: number;
  currency: string;
  source: string;
  createdAt: string;
}

export interface Parent extends User {
  studentIds: string[];
  occupation?: string;
}

export interface ParentChild {
  id: string;
  parentId: string;
  studentId: string;
  relationship: string;
  addedAt: string;
}
