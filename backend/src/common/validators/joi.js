import Joi from 'joi';

export const validate = async (schema, data) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    const details = error.details.map(d => ({
      field: d.path.join('.'),
      message: d.message,
      type: d.type,
    }));
    const err = new Error('Validation failed');
    err.details = details;
    err.isJoi = true;
    throw err;
  }

  return value;
};

export const schemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().pattern(/^[a-zA-Z_]+:(asc|desc)$/),
    search: Joi.string().max(200).allow(''),
  }),

  idParam: Joi.object({
    id: Joi.string().uuid().required(),
  }),

  uuidParam: Joi.object({
    id: Joi.string().uuid().required(),
  }),

  user: {
    register: Joi.object({
      email: Joi.string().email().required(),
      phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
      password: Joi.string().min(8).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
      firstName: Joi.string().min(1).max(100).required(),
      lastName: Joi.string().min(1).max(100).required(),
      middleName: Joi.string().max(100).optional(),
      dateOfBirth: Joi.date().max('now').optional(),
      gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
    }),

    login: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
      rememberMe: Joi.boolean().default(false),
    }),

    updateProfile: Joi.object({
      firstName: Joi.string().min(1).max(100).optional(),
      lastName: Joi.string().min(1).max(100).optional(),
      middleName: Joi.string().max(100).allow('').optional(),
      phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
      dateOfBirth: Joi.date().max('now').optional(),
      gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
      avatarUrl: Joi.string().uri().max(500).optional(),
    }),

    changePassword: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(8).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
    }),
  },

  course: {
    create: Joi.object({
      subjectId: Joi.string().uuid().required(),
      classId: Joi.string().uuid().required(),
      termId: Joi.string().uuid().required(),
      title: Joi.string().min(3).max(300).required(),
      shortDescription: Joi.string().max(500).optional(),
      fullDescription: Joi.string().optional(),
      thumbnailUrl: Joi.string().uri().max(500).optional(),
      previewVideoUrl: Joi.string().uri().max(500).optional(),
      difficulty: Joi.string().valid('beginner', 'easy', 'medium', 'hard', 'expert').default('beginner'),
      price: Joi.number().min(0).precision(2).default(0),
      currency: Joi.string().length(3).default('NGN'),
      isFree: Joi.boolean().default(true),
    }),

    update: Joi.object({
      title: Joi.string().min(3).max(300).optional(),
      shortDescription: Joi.string().max(500).optional(),
      fullDescription: Joi.string().optional(),
      thumbnailUrl: Joi.string().uri().max(500).optional(),
      previewVideoUrl: Joi.string().uri().max(500).optional(),
      difficulty: Joi.string().valid('beginner', 'easy', 'medium', 'hard', 'expert').optional(),
      price: Joi.number().min(0).precision(2).optional(),
      currency: Joi.string().length(3).optional(),
      isFree: Joi.boolean().optional(),
      status: Joi.string().valid('draft', 'pending_review', 'approved', 'published', 'archived', 'rejected').optional(),
    }),
  },

  flashcard: {
    create: Joi.object({
      courseId: Joi.string().uuid().required(),
      subjectId: Joi.string().uuid().optional(),
      topicId: Joi.string().uuid().optional(),
      front: Joi.string().min(1).max(500).required(),
      back: Joi.string().min(1).max(1000).required(),
      difficulty: Joi.string().valid('beginner', 'easy', 'medium', 'hard', 'expert').default('medium'),
    }),
  },

  lesson: {
    create: Joi.object({
      courseId: Joi.string().uuid().required(),
      sectionId: Joi.string().uuid().optional(),
      topicId: Joi.string().uuid().optional(),
      subtopicId: Joi.string().uuid().optional(),
      title: Joi.string().min(3).max(300).required(),
      description: Joi.string().optional(),
      learningObjectives: Joi.array().items(Joi.string()).default([]),
      contentType: Joi.string().valid('video', 'text', 'pdf', 'audio', 'interactive', 'live').default('video'),
      videoUrl: Joi.string().uri().max(500).when('contentType', { is: 'video', then: Joi.required() }),
      videoDurationSeconds: Joi.number().integer().min(0).optional(),
      writtenContent: Joi.string().optional(),
      keyPoints: Joi.array().items(Joi.string()).default([]),
      orderIndex: Joi.number().integer().min(0).required(),
      isFree: Joi.boolean().default(false),
      estimatedMinutes: Joi.number().integer().min(0).default(0),
    }),

    update: Joi.object({
      title: Joi.string().min(3).max(300).optional(),
      description: Joi.string().optional(),
      learningObjectives: Joi.array().items(Joi.string()).optional(),
      contentType: Joi.string().valid('video', 'text', 'pdf', 'audio', 'interactive', 'live').optional(),
      videoUrl: Joi.string().uri().max(500).optional(),
      videoDurationSeconds: Joi.number().integer().min(0).optional(),
      writtenContent: Joi.string().optional(),
      keyPoints: Joi.array().items(Joi.string()).optional(),
      orderIndex: Joi.number().integer().min(0).optional(),
      isFree: Joi.boolean().optional(),
      estimatedMinutes: Joi.number().integer().min(0).optional(),
      isPublished: Joi.boolean().optional(),
    }),
  },

  question: {
    create: Joi.object({
      subjectId: Joi.string().uuid().optional(),
      topicId: Joi.string().uuid().optional(),
      subtopicId: Joi.string().uuid().optional(),
      classId: Joi.string().uuid().optional(),
      questionType: Joi.string().valid(
        'mcq', 'true_false', 'fill_blank', 'matching',
        'short_answer', 'essay', 'numerical', 'image_based', 'multiple_select'
      ).required(),
      questionText: Joi.string().required(),
      questionImageUrl: Joi.string().uri().max(500).optional(),
      options: Joi.array().items(Joi.object({
        id: Joi.string().required(),
        text: Joi.string().required(),
        imageUrl: Joi.string().uri().max(500).optional(),
      })).min(2).max(6).default([]),
      correctAnswer: Joi.alternatives().try(
        Joi.string(),
        Joi.number(),
        Joi.boolean(),
        Joi.array().items(Joi.string())
      ).required(),
      explanation: Joi.string().optional(),
      explanationImageUrl: Joi.string().uri().max(500).optional(),
      difficulty: Joi.string().valid('beginner', 'easy', 'medium', 'hard', 'expert').default('medium'),
      marks: Joi.number().min(0).precision(2).default(1),
      negativeMarks: Joi.number().min(0).precision(2).default(0),
      timeLimitSeconds: Joi.number().integer().min(0).optional(),
      source: Joi.string().max(100).optional(),
      examYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional(),
      examName: Joi.string().max(100).optional(),
      tags: Joi.array().items(Joi.string()).default([]),
    }),

    bulkImport: Joi.object({
      questions: Joi.array().items(Joi.object({
        subjectId: Joi.string().uuid().optional(),
        topicId: Joi.string().uuid().optional(),
        subtopicId: Joi.string().uuid().optional(),
        classId: Joi.string().uuid().optional(),
        questionType: Joi.string().valid(
          'mcq', 'true_false', 'fill_blank', 'matching',
          'short_answer', 'essay', 'numerical', 'image_based', 'multiple_select'
        ).required(),
        questionText: Joi.string().required(),
        questionImageUrl: Joi.string().uri().max(500).optional(),
        options: Joi.array().items(Joi.object({
          id: Joi.string().required(),
          text: Joi.string().required(),
          imageUrl: Joi.string().uri().max(500).optional(),
        })).min(2).max(6).default([]),
        correctAnswer: Joi.alternatives().try(
          Joi.string(),
          Joi.number(),
          Joi.boolean(),
          Joi.array().items(Joi.string())
        ).required(),
        explanation: Joi.string().optional(),
        explanationImageUrl: Joi.string().uri().max(500).optional(),
        difficulty: Joi.string().valid('beginner', 'easy', 'medium', 'hard', 'expert').default('medium'),
        marks: Joi.number().min(0).precision(2).default(1),
        negativeMarks: Joi.number().min(0).precision(2).default(0),
        timeLimitSeconds: Joi.number().integer().min(0).optional(),
        source: Joi.string().max(100).optional(),
        examYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional(),
        examName: Joi.string().max(100).optional(),
        tags: Joi.array().items(Joi.string()).default([]),
      })).min(1).max(1000).required(),
    }),
  },

  exam: {
    create: Joi.object({
      title: Joi.string().min(3).max(300).required(),
      description: Joi.string().optional(),
      examType: Joi.string().valid(
        'practice', 'timed_test', 'mock', 'past_questions',
        'subject_test', 'topic_test', 'full_examination', 'competition'
      ).required(),
      subjectId: Joi.string().uuid().optional(),
      classId: Joi.string().uuid().optional(),
      durationMinutes: Joi.number().integer().min(1).required(),
      totalMarks: Joi.number().min(0).precision(2).default(0),
      passingMarks: Joi.number().min(0).precision(2).default(0),
      instructions: Joi.string().optional(),
      startTime: Joi.date().optional(),
      endTime: Joi.date().min(Joi.ref('startTime')).optional(),
      isTimed: Joi.boolean().default(true),
      shuffleQuestions: Joi.boolean().default(true),
      showResultsImmediately: Joi.boolean().default(false),
      allowReview: Joi.boolean().default(true),
      maxAttempts: Joi.number().integer().min(1).default(1),
      isPublic: Joi.boolean().default(true),
    }),
  },

  subscription: {
    createPlan: Joi.object({
      name: Joi.string().min(2).max(100).required(),
      description: Joi.string().optional(),
      price: Joi.number().min(0).precision(2).required(),
      currency: Joi.string().length(3).default('NGN'),
      durationDays: Joi.number().integer().min(1).required(),
      features: Joi.array().items(Joi.string()).default([]),
      limits: Joi.object({
        coursesPerMonth: Joi.number().integer().min(-1).default(-1),
        examsPerMonth: Joi.number().integer().min(-1).default(-1),
        aiQuestionsPerMonth: Joi.number().integer().min(-1).default(-1),
        downloadsPerMonth: Joi.number().integer().min(-1).default(-1),
        liveClassesPerMonth: Joi.number().integer().min(-1).default(-1),
      }).default({}),
      isActive: Joi.boolean().default(true),
    }),
  },

  payment: {
    initialize: Joi.object({
      amount: Joi.number().min(1).precision(2).required(),
      currency: Joi.string().length(3).default('NGN'),
      gateway: Joi.string().valid('flutterwave', 'paystack', 'stripe').required(),
      planId: Joi.string().uuid().optional(),
      courseId: Joi.string().uuid().optional(),
      examId: Joi.string().uuid().optional(),
      redirectUrl: Joi.string().uri().optional(),
      metadata: Joi.object().optional(),
    }),
  },

  ai: {
    chat: Joi.object({
      messages: Joi.array().items(Joi.object({
        role: Joi.string().valid('system', 'user', 'assistant').required(),
        content: Joi.string().required(),
      })).min(1).required(),
      model: Joi.string().optional(),
      temperature: Joi.number().min(0).max(2).default(0.7),
      maxTokens: Joi.number().integer().min(1).max(4096).default(2048),
      stream: Joi.boolean().default(false),
    }),
  },
};

export default schemas;