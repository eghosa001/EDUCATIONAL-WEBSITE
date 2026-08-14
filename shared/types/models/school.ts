export type SchoolType = 'government' | 'private' | 'missionary' | 'federal' | 'state' | 'local';
export type SchoolStatus = 'active' | 'suspended' | 'pending_approval';

export interface School {
  id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  state?: string;
  lga?: string;
  type?: SchoolType;
  logoUrl?: string;
  establishedYear?: number;
  maxStudents?: number;
  status: SchoolStatus;
  adminId?: string;
  subscriptionId?: string;
  subscriptionStatus: 'free' | 'active' | 'expired' | 'cancelled';
  features: Record<string, boolean>;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolStudent {
  id: string;
  schoolId: string;
  studentId: string;
  classId?: string;
  enrollmentYear?: number;
  admissionNumber?: string;
  status: 'active' | 'graduated' | 'transferred' | 'expelled';
  createdAt: string;
}

export interface SchoolTeacher {
  id: string;
  schoolId: string;
  teacherId: string;
  employeeId?: string;
  department?: string;
  employmentDate?: string;
  status: 'active' | 'inactive' | 'on_leave';
  createdAt: string;
}

export interface SchoolClass {
  id: string;
  schoolId: string;
  classId?: string;
  teacherId?: string;
  capacity?: number;
  termId?: string;
  academicYear?: number;
  status: 'active' | 'inactive';
  createdAt: string;
}
