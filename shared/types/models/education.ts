export interface EducationSystem {
  id: string;
  name: string;
  code: string;
  country: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface EducationLevel {
  id: string;
  educationSystemId: string;
  name: string;
  code: string;
  description?: string;
  orderIndex: number;
  minAge?: number;
  maxAge?: number;
  isActive: boolean;
  createdAt: string;
}

export interface Program {
  id: string;
  educationLevelId: string;
  name: string;
  code: string;
  description?: string;
  durationYears?: number;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
}

export interface ClassRoom {
  id: string;
  programId: string;
  name: string;
  code: string;
  description?: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
}

export interface Term {
  id: string;
  educationSystemId: string;
  name: string;
  code: string;
  description?: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
}
