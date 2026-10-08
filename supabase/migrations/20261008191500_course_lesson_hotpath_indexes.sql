create index if not exists courses_status_slug_hotpath_idx
  on public.courses (status, slug);

create index if not exists lessons_course_published_order_hotpath_idx
  on public.lessons (course_id, is_published, order_index)
  include (id, slug, title, topic_id, estimated_minutes);

create index if not exists lessons_course_slug_hotpath_idx
  on public.lessons (course_id, slug)
  where is_published = true;

create index if not exists lesson_resources_lesson_created_hotpath_idx
  on public.lesson_resources (lesson_id, created_at);

create index if not exists questions_topic_class_subject_active_hotpath_idx
  on public.questions (topic_id, class_id, subject_id, is_active);
