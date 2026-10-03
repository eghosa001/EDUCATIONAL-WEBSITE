-- Raise strict source-backed JAMB Government depth from 31 to 40.
-- The answer facts were cross-checked against authoritative public sources before validation:
-- UK Parliament/GOV.UK for delegated legislation, assent, cabinet/collective responsibility;
-- Nigeria State House for the first military Head of State;
-- Electoral Commission/ACE for plurality voting; and Nigerian government records for local government.
-- Every learner-facing row remains tied to its original Supabase Storage source.

with validated(id, answer) as (
  values
    ('d461cf34-0d1f-42e5-9da2-c8f2e9d5e442'::uuid, 'B'),
    ('a902e2d0-ae3a-43be-a20b-280cb99561ff'::uuid, 'A'),
    ('66766490-641a-4306-8e4f-6256a2bde177'::uuid, 'B'),
    ('672c8c41-c7ae-4fbb-814a-eb9474ab9ff0'::uuid, 'D'),
    ('9ee81339-732d-472b-847c-f6976b5d51a3'::uuid, 'C'),
    ('a1232c3b-6891-4dd5-b35f-8f250d0adf5c'::uuid, 'D'),
    ('7a8be975-6974-4ec8-98e1-ea6cf8740b35'::uuid, 'B'),
    ('8626df7d-fea5-4ee6-9720-fba8facd6fee'::uuid, 'A'),
    ('e04da497-3934-4351-a9ca-99f317b01a85'::uuid, 'C')
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
set question_text='A bill becomes an Act of Parliament after it has been',
    updated_at=now()
where id='66766490-641a-4306-8e4f-6256a2bde177'
  and upper(board)='JAMB' and source like 'storage:%';

update public.past_questions
set question_text='Local governments in Nigeria are created in order to',
    options=jsonb_set(options,'{3,text}','"prevent the creation of more states"'::jsonb),
    updated_at=now()
where id='e04da497-3934-4351-a9ca-99f317b01a85'
  and upper(board)='JAMB' and source like 'storage:%';

update public.past_questions
set question_text='The head of the first military government in Nigeria was',
    updated_at=now()
where id='9ee81339-732d-472b-847c-f6976b5d51a3'
  and upper(board)='JAMB' and source like 'storage:%';
