import { learnerApiConfig, getLearnerApiHeaders, handleApiResponse } from '@/services/api/config';

export interface ExamBoardAvailability {
  subjectIds: string[];
  years: number[];
  questionCount: number;
  subjectCounts: Record<string, number>;
}

export type ExamBoardAvailabilityMap = Record<string, ExamBoardAvailability>;

const CACHE_KEY = 'the-guide:exam-board-availability:v2';
const CACHE_TTL_MS = 5 * 60 * 1000;
let inFlight: Promise<ExamBoardAvailabilityMap> | null = null;

const readCache = (): ExamBoardAvailabilityMap | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || Date.now() - Number(parsed.savedAt) > CACHE_TTL_MS) return null;
    return parsed.data || null;
  } catch {
    return null;
  }
};

const writeCache = (data: ExamBoardAvailabilityMap) => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // Session cache is only a performance optimization.
  }
};

export const fetchExamBoardAvailability = async (
  token?: string | null,
  options: { force?: boolean } = {},
): Promise<ExamBoardAvailabilityMap> => {
  if (!options.force) {
    const cached = readCache();
    if (cached) return cached;
    if (inFlight) return inFlight;
  }

  inFlight = fetch(`${learnerApiConfig.baseUrl}/past-question-availability`, {
    headers: getLearnerApiHeaders(token ?? undefined),
    credentials: learnerApiConfig.credentials,
  })
    .then(handleApiResponse<{ data: { availability: ExamBoardAvailabilityMap } }>)
    .then((payload) => {
      const data = payload.data?.availability || {};
      writeCache(data);
      return data;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
};
