export interface Assignment {
  id: string;
  courseId: string;
  lessonId?: string;
  teacherId?: string;
  title: string;
  description?: string;
  instructions?: string;
  assignmentType: string;
  maxScore: number;
  dueDate?: string;
  allowLateSubmission: boolean;
  latePenaltyPercent: number;
  maxFileSizeMb: number;
  allowedFileTypes: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SubmissionStatus = 'submitted' | 'graded';

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  content?: string;
  fileUrls: string[];
  status: SubmissionStatus;
  submittedAt: string;
  gradedAt?: string;
  gradedBy?: string;
  score?: number;
  feedback?: string;
  isLate: boolean;
}
