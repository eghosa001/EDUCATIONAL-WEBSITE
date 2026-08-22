import { getSupabase } from '@/lib/supabase';

export interface PlatformStats { totalUsers:number; activeUsers:number; totalCourses:number; totalLessons:number; totalQuestions:number; totalExams:number; totalSubscriptions:number; monthlyRevenue:number; userGrowth:number; courseCompletionRate:number; }
export interface UserAnalytics { totalSessions:number; totalStudyTime:number; coursesEnrolled:number; coursesCompleted:number; lessonsCompleted:number; examsTaken:number; averageExamScore:number; activeDays:number; currentStreak:number; longestStreak:number; }
export interface CourseAnalytics { enrollmentCount:number; completionRate:number; averageProgress:number; totalLessons:number; completedLessons:number; averageRating:number; reviewCount:number; popularLessons:Array<{lessonId:string;title:string;viewCount:number}>; }
export interface ExamAnalytics { totalAttempts:number; averageScore:number; passRate:number; difficultyDistribution:Record<string,number>; questionPerformance:Array<{questionId:string;correctCount:number;incorrectCount:number}>; }
export interface LearningAnalytics { timeSpentBySubject:Record<string,number>; performanceBySubject:Record<string,{averageScore:number;completionRate:number}>; activityByDay:Record<string,{date:string;studyTime:number;lessonsCompleted:number}>; popularTopics:Array<{topicId:string;topicName:string;timeSpent:number}>; weakAreas:Array<{topicId:string;topicName:string;averageScore:number}>; }
export interface RevenueAnalytics { totalRevenue:number; monthlyRevenue:Array<{month:string;revenue:number}>; revenueBySource:Record<string,number>; subscriptionBreakdown:Record<string,{count:number;revenue:number}>; activeSubscriptions:number; churnRate:number; }
export interface ContentAnalytics { mostViewedCourses:Array<{courseId:string;title:string;viewCount:number}>; mostPopularLessons:Array<{lessonId:string;title:string;viewCount:number}>; highestRatedCourses:Array<{courseId:string;title:string;rating:number}>; mostAttemptedExams:Array<{examId:string;title:string;attemptCount:number}>; }
export interface TimeSeriesData { date:string; value:number; }
export interface TimeSeriesAnalytics { userSignups:TimeSeriesData[]; courseEnrollments:TimeSeriesData[]; examAttempts:TimeSeriesData[]; revenue:TimeSeriesData[]; activeUsers:TimeSeriesData[]; }

const requireUser = async () => { const { data, error } = await getSupabase().auth.getUser(); if (error || !data.user) throw new Error('You must be signed in'); return data.user; };
const fn = async <T>(action:string, payload:Record<string,unknown>={}) => { const { data, error } = await getSupabase().functions.invoke('analytics',{body:{action,...payload}}); if(error) throw new Error(error.message); if(data?.error) throw new Error(String(data.error)); return data as T; };

export const fetchPlatformStats = (_token?:string) => fn<{stats:PlatformStats}>('platform');
export const fetchUserAnalytics = (_token?:string) => fn<{analytics:UserAnalytics}>('user');
export const fetchCourseAnalytics = (courseId:string,_token?:string) => fn<{analytics:CourseAnalytics}>('course',{courseId});
export const fetchExamAnalytics = (examId:string,_token?:string) => fn<{analytics:ExamAnalytics}>('exam',{examId});
export const fetchLearningAnalytics = (_token?:string) => fn<{analytics:LearningAnalytics}>('learning');
export const fetchRevenueAnalytics = (_token?:string) => fn<{analytics:RevenueAnalytics}>('revenue');
export const fetchContentAnalytics = (_token?:string) => fn<{analytics:ContentAnalytics}>('content');
export const fetchTimeSeriesAnalytics = (startDate:string,endDate:string,_token?:string) => fn<{analytics:TimeSeriesAnalytics}>('time-series',{startDate,endDate});
export const exportAnalyticsReport = (reportType:'users'|'courses'|'exams'|'revenue'|'activity',format:'csv'|'excel'|'pdf',_token?:string,startDate?:string,endDate?:string) => fn('export',{reportType,format,startDate,endDate});

void requireUser;
