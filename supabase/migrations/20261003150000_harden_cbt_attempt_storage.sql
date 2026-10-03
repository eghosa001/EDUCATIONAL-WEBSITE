-- Support autosaved CBT answers and efficient resume/result lookups.
create unique index if not exists exam_answers_attempt_question_uidx
  on public.exam_answers (attempt_id, question_id);

create index if not exists exam_attempts_student_exam_status_idx
  on public.exam_attempts (student_id, exam_id, status, started_at desc);
