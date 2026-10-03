-- Cover lesson-practice analytics foreign keys for efficient joins and deletes.
create index if not exists lesson_practice_attempts_lesson_idx
  on public.lesson_practice_attempts (lesson_id);
create index if not exists lesson_practice_attempts_topic_idx
  on public.lesson_practice_attempts (topic_id)
  where topic_id is not null;
create index if not exists lesson_practice_attempts_subject_idx
  on public.lesson_practice_attempts (subject_id)
  where subject_id is not null;
