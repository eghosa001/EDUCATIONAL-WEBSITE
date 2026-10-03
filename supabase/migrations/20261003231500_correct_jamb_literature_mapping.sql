-- Correct the JAMB Literature-in-English source that was previously mapped as English Language.
do $$
declare
  literature_id uuid;
begin
  select id into literature_id from public.subjects where name='Literature in English' limit 1;
  if literature_id is null then
    raise exception 'Literature in English subject not found';
  end if;

  update public.past_question_files
  set subject='Literature in English',
      metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
        'subject_mapping_corrected_at',now(),
        'subject_mapping_reason','Filename explicitly identifies Literature-In-English'
      ),
      updated_at=now()
  where id='8ff55438-3875-42c3-8ef9-7b3cad4c1177';

  update public.past_questions
  set subject_id=literature_id,
      updated_at=now()
  where source='storage:8ff55438-3875-42c3-8ef9-7b3cad4c1177';

  update public.questions q
  set subject_id=literature_id,
      updated_at=now()
  where exists (
    select 1 from public.past_questions pq
    where pq.id=q.id
      and pq.source='storage:8ff55438-3875-42c3-8ef9-7b3cad4c1177'
  );
end $$;
