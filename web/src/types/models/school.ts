export interface School {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolClass {
  id: string;
  schoolId: string;
  name: string;
  levelId: string;
}

export interface Subject {
  id: string;
  name: string;
  levelId?: string;
  icon?: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  description?: string;
}
