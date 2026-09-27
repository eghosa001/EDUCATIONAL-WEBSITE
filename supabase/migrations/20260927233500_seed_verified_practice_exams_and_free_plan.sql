-- Populate production-safe features from existing verified curriculum/question data.

with coverage as (
  select c.id class_id, c.code class_code, s.id subject_id, s.name subject_name, count(*) question_count,
         row_number() over (partition by c.id order by count(*) desc, s.name) subject_rank
  from public.questions q
  join public.classes c on c.id=q.class_id
  join public.subjects s on s.id=q.subject_id
  where q.is_active=true and c.code ~ '-A$'
  group by c.id,c.code,s.id,s.name
  having count(*) >= 20
), selected as (
  select *, regexp_replace(class_code,'-A$','') level_code from coverage where subject_rank <= 5
)
insert into public.exams
  (title,slug,description,exam_type,subject_id,class_id,duration_minutes,total_marks,passing_marks,
   instructions,is_timed,shuffle_questions,show_results_immediately,allow_review,max_attempts,is_active,is_public)
select level_code || ' ' || subject_name || ' Practice',
  trim(both '-' from regexp_replace(lower(level_code || '-' || subject_name || '-practice'),'[^a-z0-9]+','-','g')),
  'Curriculum practice built from the verified active question bank for ' || level_code || ' ' || subject_name || '.',
  'practice', subject_id, class_id, 30, 20, 10,
  'Answer all 20 questions. You may flag questions and review your answers before submitting.',
  true,true,true,true,5,true,true
from selected
on conflict (slug) do update set
  description=excluded.description,subject_id=excluded.subject_id,class_id=excluded.class_id,
  duration_minutes=excluded.duration_minutes,total_marks=excluded.total_marks,passing_marks=excluded.passing_marks,
  instructions=excluded.instructions,show_results_immediately=true,allow_review=true,max_attempts=5,
  is_active=true,is_public=true,updated_at=now();

with coverage as (
  select c.id class_id, c.code class_code, s.id subject_id, s.name subject_name, count(*) question_count,
         row_number() over (partition by c.id order by count(*) desc, s.name) subject_rank
  from public.questions q
  join public.classes c on c.id=q.class_id
  join public.subjects s on s.id=q.subject_id
  where q.is_active=true and c.code ~ '-A$'
  group by c.id,c.code,s.id,s.name
  having count(*) >= 20
), selected as (
  select *, regexp_replace(class_code,'-A$','') level_code from coverage where subject_rank <= 5
), ranked_questions as (
  select e.id exam_id,q.id question_id,
         row_number() over (partition by e.id order by q.topic_id nulls last,q.created_at nulls last,q.id) rn
  from selected g
  join public.exams e on e.slug=trim(both '-' from regexp_replace(lower(g.level_code || '-' || g.subject_name || '-practice'),'[^a-z0-9]+','-','g'))
  join public.questions q on q.class_id=g.class_id and q.subject_id=g.subject_id and q.is_active=true
)
insert into public.exam_questions (exam_id,question_id,order_index,marks,section_name)
select exam_id,question_id,rn,1,null from ranked_questions where rn<=20
on conflict (exam_id,question_id) do nothing;

insert into public.subscription_plans
  (name,code,description,price,currency,billing_cycle,duration_days,trial_days,features,limits,is_active,is_popular,display_order)
values ('Free','free',
  'Free access to published curriculum lessons, practice exams, past questions and saved revision tools.',
  0,'NGN','monthly',30,0,
  '["Published curriculum lessons","Practice exams","Past questions","Flashcards and revision tools"]'::jsonb,
  '{}'::jsonb,true,false,1)
on conflict (code) do update set
  name=excluded.name,description=excluded.description,price=0,currency='NGN',
  features=excluded.features,limits=excluded.limits,is_active=true,display_order=1,updated_at=now();
