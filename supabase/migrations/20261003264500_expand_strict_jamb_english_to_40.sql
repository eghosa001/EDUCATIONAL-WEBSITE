-- Raise strict source-backed JAMB English Language depth from 31 to 40.
-- Only self-contained grammar/vocabulary questions are validated here; passage-dependent rows remain excluded.

with validated(id, answer) as (
  values
    ('10c2d6e7-c763-4366-a944-edc554ff7086'::uuid, 'D'),
    ('28f8e727-fafc-4a11-b003-f4c91e3da393'::uuid, 'C'),
    ('9450cbb8-bb78-4fc6-b3f9-a3b8ed781f1c'::uuid, 'B'),
    ('adcc785b-be1d-4837-ba91-2acaaa1cd5a2'::uuid, 'C'),
    ('589fec46-f345-40cb-8640-383b651a37f1'::uuid, 'E'),
    ('41a760a9-e7ce-49f3-b95b-92778e16164f'::uuid, 'D'),
    ('5437c6e5-9db1-428f-a1c2-f0acc5ee3ae3'::uuid, 'A'),
    ('b7265a10-1be9-4d08-8a1b-ecc6fed3d73d'::uuid, 'D'),
    ('463fde2d-6f02-4465-898d-71f747846115'::uuid, 'E')
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

update public.past_questions set question_text='Jane asked James ...',options='[{"id":"A","text":"whether could she meet him later"},{"id":"B","text":"could she meet him later"},{"id":"C","text":"if she could meet him later"},{"id":"D","text":"she could meet him later"},{"id":"E","text":"that she could meet him later"}]'::jsonb,updated_at=now() where id='28f8e727-fafc-4a11-b003-f4c91e3da393' and upper(board)='JAMB' and source like 'storage:%';
update public.past_questions set question_text='No sooner ...',options='[{"id":"A","text":"did we set out when the rain had started to fall"},{"id":"B","text":"had we set out than the rain started to fall"},{"id":"C","text":"were we setting out than the rain started to fall"},{"id":"D","text":"we had set out when the rain started to fall"}]'::jsonb,updated_at=now() where id='9450cbb8-bb78-4fc6-b3f9-a3b8ed781f1c' and upper(board)='JAMB' and source like 'storage:%';
update public.past_questions set options='[{"id":"A","text":"a fact that is very secret"},{"id":"B","text":"an open matter"},{"id":"C","text":"a secret known to everybody"},{"id":"D","text":"a confidential matter"},{"id":"E","text":"a secret told in the open air"}]'::jsonb,updated_at=now() where id='adcc785b-be1d-4837-ba91-2acaaa1cd5a2' and upper(board)='JAMB' and source like 'storage:%';
update public.past_questions set question_text='The accident was due to ... driving by the defendant.',options='[{"id":"A","text":"negligence"},{"id":"B","text":"negligible"},{"id":"C","text":"negligent"},{"id":"D","text":"neglectable"}]'::jsonb,updated_at=now() where id='5437c6e5-9db1-428f-a1c2-f0acc5ee3ae3' and upper(board)='JAMB' and source like 'storage:%';
update public.past_questions set question_text='I have already ... the picture on the sitting-room wall.',options='[{"id":"A","text":"hanged"},{"id":"B","text":"hunged"},{"id":"C","text":"hang"},{"id":"D","text":"hung"}]'::jsonb,updated_at=now() where id='b7265a10-1be9-4d08-8a1b-ecc6fed3d73d' and upper(board)='JAMB' and source like 'storage:%';
