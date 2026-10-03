-- Raise the strict source-backed JAMB Biology and Chemistry banks to 40 scoreable questions each.
-- Only existing active storage-backed JAMB MCQs with unambiguous content are validated here.
-- Diagram-dependent, graph-dependent, truncated and otherwise contaminated OCR rows remain excluded.

with validated(id, answer) as (
  values
    ('8dd49c07-0e11-4247-9db6-b8fc59d134b5'::uuid, 'C'),
    ('95a932db-d053-47b2-a47e-520cf18f571f'::uuid, 'A'),
    ('ceeaa090-d81c-4d5c-bdd1-e272747aaabb'::uuid, 'A'),
    ('66fd842f-f5c2-4bc5-ae6f-d80ed3838abd'::uuid, 'C'),
    ('a6b0aa93-2265-4234-833f-414c3e51fda0'::uuid, 'A'),
    ('71452cf0-d3fc-4cff-ba97-099790786fb7'::uuid, 'A'),
    ('c24327e9-9324-464f-bcfd-92332135ba19'::uuid, 'D'),
    ('41685012-62d7-47e1-a1da-862bbb2840a7'::uuid, 'C'),
    ('69ca17b5-36c5-4fab-84a3-38bc9986989c'::uuid, 'B'),
    ('803a7d6f-2013-4e4b-b4aa-90876497f302'::uuid, 'B'),
    ('f3f267d8-e7e9-4019-b136-a38bd0488b9c'::uuid, 'C'),
    ('632ec701-b9fb-4b45-b710-e8da269724ff'::uuid, 'B'),
    ('dc568204-5ad8-429c-b065-01f6c9cc3688'::uuid, 'A'),
    ('e3983985-5afc-4022-9a75-6b9e6cda28b2'::uuid, 'B'),
    ('840aca52-0a06-48de-92cb-7ef0422d898e'::uuid, 'A'),
    ('a1f9c6fb-e711-4908-9299-400dcd73adcd'::uuid, 'C'),
    ('ecee1a65-478d-4487-8ba3-be45b7ae53c9'::uuid, 'A'),
    ('4029d54f-56a5-4634-b719-c7b3466085a2'::uuid, 'B'),
    ('879e26f6-316a-4240-9a03-5de566d993d3'::uuid, 'B'),
    ('add47f22-913a-4ebd-843f-8d0192ea5fa5'::uuid, 'B')
)
update public.past_questions q
set correct_answer=to_jsonb(v.answer),
    answer_source='manual-content-validation',
    answer_verified_at=coalesce(q.answer_verified_at, now()),
    updated_at=now()
from validated v
where q.id=v.id
  and upper(q.board)='JAMB'
  and q.is_active is true
  and q.question_type='mcq'
  and q.source like 'storage:%';

update public.past_questions
set options=jsonb_set(options,'{2,text}','"breathing roots"'::jsonb),
    updated_at=now()
where id='66fd842f-f5c2-4bc5-ae6f-d80ed3838abd'
  and upper(board)='JAMB' and source like 'storage:%';

update public.past_questions
set options=jsonb_set(options,'{0,text}','"increases the surface area for absorption"'::jsonb),
    updated_at=now()
where id='71452cf0-d3fc-4cff-ba97-099790786fb7'
  and upper(board)='JAMB' and source like 'storage:%';

update public.past_questions
set question_text='During respiration, air circulates around plant tissues via the',
    options=jsonb_set(options,'{3,text}','"intercellular spaces"'::jsonb),
    updated_at=now()
where id='eca0ff27-ddfc-4302-bd9d-97d1a5ff8ae0'
  and upper(board)='JAMB' and source like 'storage:%';

update public.past_questions
set options=jsonb_set(options,'{2,text}','"forms an insoluble scum with soap"'::jsonb),
    updated_at=now()
where id='f3f267d8-e7e9-4019-b136-a38bd0488b9c'
  and upper(board)='JAMB' and source like 'storage:%';

update public.past_questions
set options=jsonb_set(options,'{1,text}','"alkanes, alkenes, alkynes and aromatics"'::jsonb),
    updated_at=now()
where id='e3983985-5afc-4022-9a75-6b9e6cda28b2'
  and upper(board)='JAMB' and source like 'storage:%';
