'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon, PlayIcon, PauseIcon, CheckCircleIcon,
  ClockIcon, BookOpenIcon, DownloadIcon, ChevronRightIcon,
  ChevronLeftIcon, Volume2Icon, MaximizeIcon,
} from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import { fetchLessonByIdOrSlug, markLessonComplete } from '@/services/api/lessonService';
import { fetchCourseByIdOrSlug, fetchCourseLessons } from '@/services/api/courseService';
import { startStudySession, endStudySession } from '@/services/api/progressService';

interface Lesson {
  id: string;
  courseId: string;
  sectionId?: string;
  title: string;
  slug?: string;
  description?: string;
  learningObjectives?: string[];
  videoUrl?: string;
  videoDurationSeconds?: number;
  writtenContent?: string;
  keyPoints?: string[];
  orderIndex: number;
  isFree: boolean;
  isPublished: boolean;
  estimatedMinutes?: number;
  resources?: Array<{
    id: string;
    title: string;
    resourceType: string;
    fileUrl: string;
    description?: string;
  }>;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  subjects?: Array<{ id: string; name: string }>;
  lessons?: Lesson[];
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { token, user } = useAuthStore();
  const lessonId = params?.lessonId as string;
  const courseId = params?.courseId as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<'video' | 'content' | 'resources'>('video');
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<{ id: string; startedAt: number } | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    const loadLesson = async () => {
      setLoading(true);
      try {
        const res = await fetchLessonByIdOrSlug(lessonId, courseId || undefined, token || undefined);
        setLesson(res.lesson || res.data);
        const courseIdVal = (res.lesson?.courseId || res.data?.courseId) as string | undefined;
        if (courseIdVal) {
          const [courseRes, lessonsRes] = await Promise.all([
            fetchCourseByIdOrSlug(courseIdVal, token || undefined),
            fetchCourseLessons(courseIdVal, token || undefined),
          ]);
          setCourse(courseRes.course);
          setLessons(lessonsRes.lessons || []);
        }
      } catch (err) {
        console.error('Failed to load lesson:', err);
      } finally {
        setLoading(false);
      }
    };
    loadLesson();
  }, [lessonId, courseId, token]);

  // Start study session on mount
  useEffect(() => {
    if (!lesson || !token) return;
    const startSession = async () => {
      try {
        const res = await startStudySession({
          courseId: lesson.courseId,
          lessonId: lesson.id,
          activityType: 'watching',
        }, token);
        sessionRef.current = { id: res.session.id, startedAt: Date.now() };
      } catch {
        // Silent fail - session tracking is optional
      }
    };
    startSession();
    return () => {
      if (sessionRef.current) {
        endStudySession(sessionRef.current.id, token).catch(() => {});
      }
    };
  }, [lesson?.id]);

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleVideoLoaded = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    handleComplete();
  };

  const handleComplete = async () => {
    if (!lesson || !token || isCompleted) return;
    try {
      await markLessonComplete(lesson.id, token);
      setIsCompleted(true);
      setShowComplete(true);
      setTimeout(() => setShowComplete(false), 3000);
    } catch {
      // Silent fail
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const currentIndex = lessons.findIndex(l => l.id === lesson?.id);
  const nextLesson = lessons[currentIndex + 1];
  const prevLesson = lessons[currentIndex - 1];

  const handleNext = () => {
    if (nextLesson?.slug) router.push(`/dashboard/lessons/${courseId}/${nextLesson.slug}`);
  };

  const handlePrev = () => {
    if (prevLesson?.slug) router.push(`/dashboard/lessons/${courseId}/${prevLesson.slug}`);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-64 bg-gray-200 rounded-xl" />
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-2/3" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-16">
        <BookOpenIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Lesson not found</h2>
        <Link href="/dashboard/courses" className="text-blue-600 hover:text-blue-700">Back to courses</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-gray-700">Dashboard</Link>
        <ChevronRightIcon className="w-4 h-4" />
        {course && <Link href={`/dashboard/courses/${course.slug}`} className="hover:text-gray-700">{course.title}</Link>}
        <ChevronRightIcon className="w-4 h-4" />
        <span className="text-gray-900 font-medium truncate">{lesson.title}</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="xl:col-span-2 space-y-4">
          {/* Video player or content */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              {(['video', 'content', 'resources'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'video' && 'Video'}
                  {tab === 'content' && 'Notes'}
                  {tab === 'resources' && 'Resources'}
                </button>
              ))}
            </div>

            {/* Video tab */}
            {activeTab === 'video' && (
              <div>
                {lesson.videoUrl ? (
                  <div className="relative bg-black aspect-video">
                    <video
                      ref={videoRef}
                      src={lesson.videoUrl}
                      className="w-full h-full"
                      onTimeUpdate={handleVideoTimeUpdate}
                      onLoadedMetadata={handleVideoLoaded}
                      onEnded={handleVideoEnded}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                    {/* Custom controls overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause()}
                          className="text-white hover:text-blue-400 transition-colors"
                        >
                          {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                        </button>
                        <span className="text-white text-sm">{formatTime(currentTime)} / {formatTime(duration || lesson.videoDurationSeconds || 0)}</span>
                        <div className="flex-1 h-1 bg-gray-600 rounded-full cursor-pointer">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                          />
                        </div>
                        <Volume2Icon className="w-5 h-5 text-white" />
                        <MaximizeIcon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center">
                    <PlayIcon className="w-16 h-16 text-blue-300 mb-4" />
                    <p className="text-gray-500 text-sm">Video content not available</p>
                  </div>
                )}
                <div className="p-4">
                  <h1 className="text-xl font-bold text-gray-900">{lesson.title}</h1>
                  {lesson.description && (
                    <p className="text-gray-500 text-sm mt-1">{lesson.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" /> {lesson.estimatedMinutes || Math.ceil((lesson.videoDurationSeconds || 0) / 60)} min</span>
                    {lesson.isFree && <span className="text-green-600">Free</span>}
                    {isCompleted && <span className="flex items-center gap-1 text-green-600"><CheckCircleIcon className="w-3 h-3" /> Completed</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Content tab */}
            {activeTab === 'content' && (
              <div className="p-6">
                {lesson.learningObjectives && lesson.learningObjectives.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Learning Objectives</h3>
                    <ul className="space-y-2">
                      {lesson.learningObjectives.map((obj, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircleIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          {obj}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {lesson.writtenContent && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Lesson Content</h3>
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                      {lesson.writtenContent}
                    </div>
                  </div>
                )}
                {lesson.keyPoints && lesson.keyPoints.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Key Points</h3>
                    <ul className="space-y-2">
                      {lesson.keyPoints.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {!lesson.writtenContent && (!lesson.learningObjectives || lesson.learningObjectives.length === 0) && (
                  <p className="text-gray-500 text-sm">No written content available for this lesson.</p>
                )}
              </div>
            )}

            {/* Resources tab */}
            {activeTab === 'resources' && (
              <div className="p-6">
                {lesson.resources && lesson.resources.length > 0 ? (
                  <div className="space-y-3">
                    {lesson.resources.map((res) => (
                      <a
                        key={res.id}
                        href={res.fileUrl}
                        download
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <DownloadIcon className="w-5 h-5 text-blue-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{res.title}</p>
                          <p className="text-xs text-gray-500 capitalize">{res.resourceType}</p>
                        </div>
                        <DownloadIcon className="w-4 h-4 text-gray-400" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No resources available for this lesson.</p>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={!prevLesson}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4" /> Previous Lesson
            </button>
            <button
              onClick={handleComplete}
              disabled={isCompleted}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                isCompleted
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <CheckCircleIcon className="w-4 h-4" />
              {isCompleted ? 'Completed' : 'Mark as Complete'}
            </button>
            <button
              onClick={handleNext}
              disabled={!nextLesson}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next Lesson <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Complete notification */}
          {showComplete && (
            <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
              <CheckCircleIcon className="w-5 h-5" /> Lesson completed! +10 XP
            </div>
          )}
        </div>

        {/* Sidebar - Course curriculum */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden sticky top-4">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Course Content</h2>
              <p className="text-xs text-gray-500 mt-1">{lessons.length} lessons</p>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {lessons.map((l, i) => (
                <Link
                  key={l.id}
                  href={`/dashboard/lessons/${courseId}/${l.slug}`}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    l.id === lesson.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                    l.id === lesson.id ? 'bg-blue-600 text-white' :
                    isCompleted ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {l.id === lesson.id ? <PlayIcon className="w-3 h-3" /> : i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${l.id === lesson.id ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
                      {l.title}
                    </p>
                    <p className="text-xs text-gray-400">{l.estimatedMinutes || Math.ceil((l.videoDurationSeconds || 0) / 60)} min</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
