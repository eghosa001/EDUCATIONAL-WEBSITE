import { fetchCachedJson, getLearnerApiHeaders, learnerApiConfig } from '@/services/api/config';

export interface ExamBoardAvailability {
  subjectIds: string[];
  years: number[];
  questionCount: number;
  subjectCounts: Record<string, number>;
}

export type ExamBoardAvailabilityMap = Record<string, ExamBoardAvailability>;

const AVAILABILITY_TTL_MS = 5 * 60 * 1000;

const availabilityCacheKey = (kind: 'historical' | 'verified', token?: string | null) => {
  const authBucket = token ? 'auth' : 'anon';
  return `the-guide:${kind}-exam-board-availability:v3:${authBucket}`;
};

const selectAvailability = (payload: any): ExamBoardAvailabilityMap => payload?.data?.availability || {};

export const fetchExamBoardAvailability = async (
  token?: string | null,
  options: { force?: boolean; signal?: AbortSignal } = {},
): Promise<ExamBoardAvailabilityMap> => {
  return fetchCachedJson<ExamBoardAvailabilityMap>(
    `${learnerApiConfig.baseUrl}/past-question-availability`,
    {
      headers: getLearnerApiHeaders(token ?? undefined),
      credentials: learnerApiConfig.credentials,
    },
    {
      cacheKey: availabilityCacheKey('historical', token),
      ttlMs: options.force ? 0 : AVAILABILITY_TTL_MS,
      signal: options.signal,
      retries: 2,
      allowStaleOnError: true,
      select: selectAvailability,
    },
  );
};

export const fetchVerifiedPracticeAvailability = async (
  token?: string | null,
  options: { force?: boolean; signal?: AbortSignal } = {},
): Promise<ExamBoardAvailabilityMap> => {
  return fetchCachedJson<ExamBoardAvailabilityMap>(
    `${learnerApiConfig.baseUrl}/verified-practice-availability`,
    {
      headers: getLearnerApiHeaders(token ?? undefined),
      credentials: learnerApiConfig.credentials,
    },
    {
      cacheKey: availabilityCacheKey('verified', token),
      ttlMs: options.force ? 0 : AVAILABILITY_TTL_MS,
      signal: options.signal,
      retries: 2,
      allowStaleOnError: true,
      select: selectAvailability,
    },
  );
};
