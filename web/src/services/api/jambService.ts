import { learnerApiConfig, getLearnerApiHeaders, handleApiResponse } from '@/services/api/config';

export type JambPresetSubject = {
  id: string;
  name: string;
  code: string;
  orderIndex: number;
  availableQuestions: number;
};

export type JambCoursePreset = {
  id: string;
  courseName: string;
  aliases: string[];
  notes: string;
  sourceUrl: string;
  subjects: JambPresetSubject[];
  maxBalancedCount: number;
  readyForTenEach: boolean;
};

export type JambCoursePresetPayload = {
  presets: JambCoursePreset[];
  subjectAvailability: Record<string, number>;
};

export async function fetchJambCoursePresets(token: string): Promise<JambCoursePresetPayload> {
  const response = await fetch(`${learnerApiConfig.baseUrl}/jamb/course-presets`, {
    headers: getLearnerApiHeaders(token),
    credentials: learnerApiConfig.credentials,
  });
  const payload = await handleApiResponse<{ data: JambCoursePresetPayload }>(response);
  return payload.data;
}

export async function startJambCbtSession(
  token: string,
  input: {
    coursePresetId?: string;
    durationMinutes: number;
    subjects: Array<{ subjectId: string; count: number }>;
  },
) {
  const response = await fetch(`${learnerApiConfig.baseUrl}/jamb-cbt/session`, {
    method: 'POST',
    headers: getLearnerApiHeaders(token),
    credentials: learnerApiConfig.credentials,
    body: JSON.stringify(input),
  });
  const payload = await handleApiResponse<{ data: any }>(response);
  return payload.data;
}

export async function gradeJambCbtSession(
  token: string,
  sessionId: string,
  answers: Array<{ questionId: string; answer: string }>,
) {
  const response = await fetch(`${learnerApiConfig.baseUrl}/jamb-cbt/${sessionId}/grade`, {
    method: 'POST',
    headers: getLearnerApiHeaders(token),
    credentials: learnerApiConfig.credentials,
    body: JSON.stringify({ answers }),
  });
  const payload = await handleApiResponse<{ data: { result: any } }>(response);
  return payload.data.result;
}


export async function saveJambCbtAnswer(
  token: string,
  sessionId: string,
  questionId: string,
  answer: string,
) {
  const response = await fetch(`${learnerApiConfig.baseUrl}/jamb-cbt/${sessionId}/answer`, {
    method: 'POST',
    headers: getLearnerApiHeaders(token),
    credentials: learnerApiConfig.credentials,
    body: JSON.stringify({ questionId, answer }),
  });
  return handleApiResponse<{ data: { saved: boolean; questionId: string } }>(response);
}
