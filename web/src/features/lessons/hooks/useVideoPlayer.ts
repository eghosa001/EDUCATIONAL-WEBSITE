'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLessonStore } from '@/features/lessons/store/lessonStore';
import type { Lesson } from '@/types/models/lesson';
import { apiConfig, getAuthHeaders, handleApiResponse } from '@/services/api/config';

export function useVideoPlayer(videoRef: React.RefObject<HTMLVideoElement>) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const updateBuffered = () => {
      if (video.buffered.length > 0) setBuffered(video.buffered.end(video.buffered.length - 1));
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleFullscreen = () => setIsFullscreen(!!document.fullscreenElement);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('progress', updateBuffered);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    document.addEventListener('fullscreenchange', handleFullscreen);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('progress', updateBuffered);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      document.removeEventListener('fullscreenchange', handleFullscreen);
    };
  }, [videoRef]);

  const play = useCallback(() => { void videoRef.current?.play(); }, [videoRef]);
  const pause = useCallback(() => { videoRef.current?.pause(); }, [videoRef]);
  const togglePlay = useCallback(() => {
    if (videoRef.current?.paused) play(); else pause();
  }, [videoRef, play, pause]);
  const seek = useCallback((time: number) => { if (videoRef.current) videoRef.current.currentTime = time; }, [videoRef]);
  const setVolumeLevel = useCallback((vol: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  }, [videoRef]);
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, [videoRef]);
  const setPlaybackRateSpeed = useCallback((rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  }, [videoRef]);
  const toggleFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!document.fullscreenElement) void video.requestFullscreen(); else void document.exitFullscreen();
  }, [videoRef]);
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (!videoRef.current?.paused) setShowControls(false);
    }, 3000);
  }, [videoRef]);

  return {
    isPlaying, currentTime, duration, buffered, volume, isMuted, playbackRate, isFullscreen, showControls,
    play, pause, togglePlay, seek, setVolume: setVolumeLevel, toggleMute, setPlaybackRate: setPlaybackRateSpeed,
    toggleFullscreen, showControlsTemporarily,
  };
}

export function useLessonProgress(lessonId: string) {
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const completeLesson = useCallback(async () => {
    if (isCompleted || isLoading) return;
    const state = useLessonStore.getState();
    const lesson = state.currentLesson?.id === lessonId
      ? state.currentLesson
      : state.lessons.find((item) => item.id === lessonId);
    const courseId = lesson?.courseId || state.currentCourse?.id;
    const token = typeof window === 'undefined' ? null : localStorage.getItem('edu_token');

    if (!courseId || !token) {
      console.error('Cannot complete lesson without a course and authenticated session');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${apiConfig.baseUrl}/progress/courses/${courseId}/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        credentials: apiConfig.credentials,
      });
      await handleApiResponse(response);
      useLessonStore.getState().markCompleted(lessonId);
      useLessonStore.getState().setVideoProgress(lessonId, 100);
      setIsCompleted(true);
      setProgress(100);
    } catch (err) {
      console.error('Failed to complete lesson:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isCompleted, isLoading, lessonId]);

  const updateProgress = useCallback((newProgress: number) => {
    const normalized = Math.max(0, Math.min(100, newProgress));
    setProgress(normalized);
    useLessonStore.getState().setVideoProgress(lessonId, normalized);
    if (normalized > 0 && normalized < 90) useLessonStore.getState().markInProgress(lessonId);
    if (normalized >= 90 && !isCompleted) void completeLesson();
  }, [lessonId, isCompleted, completeLesson]);

  return { progress, isCompleted, isLoading, completeLesson, updateProgress };
}

export function useLessonNavigation(lessons: Lesson[], currentIndex: number, onNavigate: (index: number) => void) {
  const currentLesson = lessons[currentIndex];
  const previousLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
  const goToPrevious = useCallback(() => { if (previousLesson) onNavigate(currentIndex - 1); }, [previousLesson, currentIndex, onNavigate]);
  const goToNext = useCallback(() => { if (nextLesson) onNavigate(currentIndex + 1); }, [nextLesson, currentIndex, onNavigate]);
  return { currentLesson, previousLesson, nextLesson, goToPrevious, goToNext };
}
