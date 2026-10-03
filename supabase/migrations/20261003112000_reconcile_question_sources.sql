-- Keep Supabase Storage inventory and extracted-question metadata reproducible.
-- The four files below are physical duplicate objects that already have canonical
-- tracked copies; record them without re-extracting duplicate questions.
insert into public.past_question_files
  (bucket_id,file_name,file_path,file_size,mime_type,board,subject,year,paper_type,is_processed,questions_extracted,metadata)
select * from (values
  ('WAEC 1','waec-lit-in-english-2006-november-drama-and-poetry-paper-2 (1).pdf','waec-lit-in-english-2006-november-drama-and-poetry-paper-2 (1).pdf',219499::bigint,'application/pdf','waec','Literature in English',2006,'Paper 2',true,0,jsonb_build_object('status','duplicate_source','duplicate_of','waec-lit-in-english-2006-november-drama-and-poetry-paper-2.pdf')),
  ('WAEC 2','WAEC_Biology2_November_2011 (1).pdf','WAEC_Biology2_November_2011 (1).pdf',1834935::bigint,'application/pdf','waec','Biology',2011,null,true,0,jsonb_build_object('status','duplicate_source','duplicate_of','WAEC_Biology2_November_2011.pdf')),
  ('WAEC 3','WAEC_Biology2_June_1993 (1).pdf','WAEC_Biology2_June_1993 (1).pdf',2136241::bigint,'application/pdf','waec','Biology',1993,null,true,0,jsonb_build_object('status','duplicate_source','duplicate_of','WAEC_Biology2_June_1993.pdf')),
  ('WAEC 3','WAEC_Biology2_June_1994 (1).pdf','WAEC_Biology2_June_1994 (1).pdf',2220836::bigint,'application/pdf','waec','Biology',1994,null,true,0,jsonb_build_object('status','duplicate_source','duplicate_of','WAEC_Biology2_June_1994.pdf'))
) as v(bucket_id,file_name,file_path,file_size,mime_type,board,subject,year,paper_type,is_processed,questions_extracted,metadata)
where not exists (
  select 1 from public.past_question_files f
  where f.bucket_id=v.bucket_id and f.file_path=v.file_path
);

-- A large subset of the legacy "question" PDFs are actually WAEC syllabus/reference
-- documents. Classify only the clear cases; do not manufacture questions from them.
with stats as (
  select f.id,
         count(p.id) filter (where p.question_text like '%?%') as question_mark_rows,
         count(p.id) filter (
           where jsonb_typeof(p.options)='array' and jsonb_array_length(p.options)>0
         ) as option_rows
  from public.past_question_files f
  left join public.past_questions p on p.source='storage:'||f.id::text
  where coalesce(f.questions_extracted,0)=0
    and coalesce(f.metadata->>'status','')='extracted'
    and f.year is null
  group by f.id
)
update public.past_question_files f
set metadata = coalesce(f.metadata,'{}'::jsonb) || jsonb_build_object(
      'status','reference_material',
      'classified_at',now(),
      'review_reason','Extracted content is syllabus/reference material rather than a question paper'
    ),
    is_processed = true,
    updated_at = now()
from stats s
where f.id=s.id
  and coalesce(s.question_mark_rows,0)=0
  and coalesce(s.option_rows,0)<=2;

-- Counters describe questions that are actually active after quality filtering.
with actual as (
  select replace(source,'storage:','')::uuid as file_id,
         count(*) filter (where is_active) as active_rows
  from public.past_questions
  where source like 'storage:%'
  group by 1
)
update public.past_question_files f
set questions_extracted=coalesce(a.active_rows,0), updated_at=now()
from actual a
where f.id=a.file_id
  and f.questions_extracted is distinct from a.active_rows;
