-- Cover the optional JAMB course-preset foreign key.
create index if not exists jamb_cbt_sessions_course_preset_idx
  on public.jamb_cbt_sessions(course_preset_id);
