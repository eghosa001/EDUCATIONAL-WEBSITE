import { z } from 'zod';
import {
  idSchema,
  isoStringSchema,
  optionalStringSchema,
  nullableStringSchema,
  nullableNumberSchema,
  nonNegativeNumberSchema,
  arrayOf,
} from './common';

export const AssignmentSchema = z.object({
  id: idSchema,
  courseId: idSchema,
  lessonId: optionalStringSchema,
  teacherId: optionalStringSchema,
  title: z.string().min(1),
  description: optionalStringSchema,
  instructions: optionalStringSchema,
  assignmentType: z.string().min(1),
  maxScore: nonNegativeNumberSchema,
  dueDate: nullableStringSchema,
  allowLateSubmission: z.boolean(),
  latePenaltyPercent: nonNegativeNumberSchema,
  maxFileSizeMb: nonNegativeNumberSchema,
  allowedFileTypes: arrayOf(z.string()),
  isActive: z.boolean(),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
});

export const SubmissionStatusSchema = z.enum(['submitted', 'graded']);

export const SubmissionSchema = z.object({
  id: idSchema,
  assignmentId: idSchema,
  studentId: idSchema,
  content: optionalStringSchema,
  fileUrls: arrayOf(z.string()),
  status: SubmissionStatusSchema,
  submittedAt: isoStringSchema,
  gradedAt: nullableStringSchema,
  gradedBy: optionalStringSchema,
  score: nullableNumberSchema,
  feedback: optionalStringSchema,
  isLate: z.boolean(),
});

export const CreateAssignmentSchema = AssignmentSchema.omit({
  id: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateSubmissionSchema = SubmissionSchema.omit({
  id: true,
  status: true,
  gradedAt: true,
  gradedBy: true,
  score: true,
  feedback: true,
  isLate: true,
});

export const UpdateAssignmentSchema = CreateAssignmentSchema.partial();
export const UpdateSubmissionSchema = CreateSubmissionSchema.partial();

export type Assignment = z.infer<typeof AssignmentSchema>;
export type Submission = z.infer<typeof SubmissionSchema>;
export type CreateAssignment = z.infer<typeof CreateAssignmentSchema>;
export type CreateSubmission = z.infer<typeof CreateSubmissionSchema>;
export type UpdateAssignment = z.infer<typeof UpdateAssignmentSchema>;
export type UpdateSubmission = z.infer<typeof UpdateSubmissionSchema>;
