export interface Subject {
  id: string;
  educationSystemId: string;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  color?: string;
  orderIndex: number;
  isCore: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  classId: string;
  termId: string;
  name: string;
  code: string;
  description?: string;
  learningObjectives: string[];
  orderIndex: number;
  estimatedHours?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subtopic {
  id: string;
  topicId: string;
  name: string;
  code: string;
  description?: string;
  learningObjectives: string[];
  orderIndex: number;
  estimatedHours?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
