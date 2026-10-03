-- Expand the strict JAMB bank using only existing storage-backed source rows.
-- These rows were manually content-validated; visibly corrupted neighbouring OCR rows remain excluded.
-- This migration intentionally does not relax the storage: provenance requirement.

with validated(id, answer) as (
  values
    ('2e4b9837-9521-4aa5-8c82-3c3b32fc6db9'::uuid, 'A'),
    ('350aed99-70d7-4e99-b0b9-210c4d301ac9'::uuid, 'B'),
    ('353907e5-20a7-42a1-bf73-425ba24dfbaa'::uuid, 'B'),
    ('4d4fddf2-4995-484f-ab22-8075b091f5cb'::uuid, 'D'),
    ('594cc355-7f83-4558-8aba-530f1cc59c20'::uuid, 'C'),
    ('7761adea-1f38-44ff-8d59-46f4e3f469bb'::uuid, 'C'),
    ('ae92b390-bf9e-4308-9ce1-2774ce82e147'::uuid, 'B'),
    ('b109c100-3302-4af8-b592-244a4bd13695'::uuid, 'C'),
    ('b387fd4b-4c66-4b02-86ef-5f33c84578ed'::uuid, 'D'),
    ('bd57aad0-3da5-4911-8ebf-3ec9d0e99693'::uuid, 'C'),
    ('13a80cae-e01e-4fd7-9801-71805fb39a6b'::uuid, 'B'),
    ('2080aaba-ed64-47e7-8dcb-5f22dc65a767'::uuid, 'A'),
    ('2a4d5ffb-1f7a-4264-b582-7b5ec9dc6a23'::uuid, 'B'),
    ('4c25611f-7eb3-4814-af8d-abab10495a70'::uuid, 'D'),
    ('721232b3-8ab1-4790-9844-1aba5111e884'::uuid, 'B'),
    ('bba6baef-af30-4a73-9d46-3d28721fdf10'::uuid, 'E'),
    ('c2310fdd-b1ca-43cf-aa94-2963f085f3ea'::uuid, 'D'),
    ('c5dfa14e-deb4-45e3-9a6a-ee81369618a4'::uuid, 'B'),
    ('cfab625d-0eae-47ee-bc0a-940b482304d7'::uuid, 'C'),
    ('ddd841fd-b53e-44ed-a6c9-712175509c16'::uuid, 'D'),
    ('a3968a6d-256a-4ebf-8217-4c36ee35bc99'::uuid, 'C'),
    ('a5df47af-035b-4211-b32d-0367300ba0b3'::uuid, 'B'),
    ('583e0c9c-2bee-458c-8de7-d109624e035d'::uuid, 'D'),
    ('1fd42ddb-5d05-4c8d-a27b-cf95938a41c9'::uuid, 'D'),
    ('186a1bef-8629-4bf6-a992-9cef2bf6eb0a'::uuid, 'C'),
    ('f0cb07df-c906-4d10-9dfa-8376d5aa029d'::uuid, 'D'),
    ('4375992c-edb1-470e-9730-3d62cad6f0d1'::uuid, 'D'),
    ('adce2ee5-f860-4b88-afce-9e9ff4a6e776'::uuid, 'C'),
    ('600a6b27-1334-47d1-9b92-d79df2f7e59a'::uuid, 'C'),
    ('1fa0ce6d-ccba-4670-9720-b3176254b608'::uuid, 'D')
)
update public.past_questions q
set correct_answer = to_jsonb(v.answer),
    answer_source = 'manual-content-validation',
    answer_verified_at = coalesce(q.answer_verified_at, now()),
    updated_at = now()
from validated v
where q.id = v.id
  and upper(q.board) = 'JAMB'
  and q.source like 'storage:%';

update public.past_questions
set options='[
  {"id":"A","text":"kidney"},
  {"id":"B","text":"Malpighian tubule"},
  {"id":"C","text":"flame cell"},
  {"id":"D","text":"nephridium"}
]'::jsonb,
updated_at=now()
where id='353907e5-20a7-42a1-bf73-425ba24dfbaa'
  and upper(board)='JAMB' and source like 'storage:%';

update public.past_questions
set options='[
  {"id":"A","text":"have no leaves"},
  {"id":"B","text":"lack roots"},
  {"id":"C","text":"are filamentous"},
  {"id":"D","text":"lack chlorophyll"}
]'::jsonb,
updated_at=now()
where id='b387fd4b-4c66-4b02-86ef-5f33c84578ed'
  and upper(board)='JAMB' and source like 'storage:%';

update public.past_questions
set options='[
  {"id":"A","text":"acts as a semi-permeable membrane"},
  {"id":"B","text":"acts as a storage organ"},
  {"id":"C","text":"is permeable to the salt solution"},
  {"id":"D","text":"is a plant material"}
]'::jsonb,
updated_at=now()
where id='2e4b9837-9521-4aa5-8c82-3c3b32fc6db9'
  and upper(board)='JAMB' and source like 'storage:%';

update public.past_questions
set options='[
  {"id":"A","text":"walking"},
  {"id":"B","text":"swimming"},
  {"id":"C","text":"feeding"},
  {"id":"D","text":"respiration"}
]'::jsonb,
updated_at=now()
where id='594cc355-7f83-4558-8aba-530f1cc59c20'
  and upper(board)='JAMB' and source like 'storage:%';

update public.past_questions
set question_text='The dorsal and anal fins of fish are used for',
    options='[
      {"id":"A","text":"upward movements"},
      {"id":"B","text":"controlling rolling movements"},
      {"id":"C","text":"downward movements"},
      {"id":"D","text":"steering"},
      {"id":"E","text":"buoyancy"}
    ]'::jsonb,
    updated_at=now()
where id='ae92b390-bf9e-4308-9ce1-2774ce82e147'
  and upper(board)='JAMB' and source like 'storage:%';

update public.past_questions
set options='[
  {"id":"A","text":"transmitting impulses"},
  {"id":"B","text":"regulating body temperature"},
  {"id":"C","text":"regulating osmotic pressure of blood"},
  {"id":"D","text":"chemical co-ordination"},
  {"id":"E","text":"the manufacture of blood"}
]'::jsonb,
updated_at=now()
where id='4d4fddf2-4995-484f-ab22-8075b091f5cb'
  and upper(board)='JAMB' and source like 'storage:%';

update public.past_questions
set question_text='An acid and its conjugate base',
    updated_at=now()
where id='2a4d5ffb-1f7a-4264-b582-7b5ec9dc6a23'
  and upper(board)='JAMB' and source like 'storage:%';

update public.past_questions
set question_text='Alloys are best prepared by',
    options='[
      {"id":"A","text":"high-temperature arc welding of the metals"},
      {"id":"B","text":"electrolysis using the major metallic component"},
      {"id":"C","text":"reducing a mixture of the oxides of the elements"},
      {"id":"D","text":"cooling a molten mixture of the necessary metals"}
    ]'::jsonb,
    updated_at=now()
where id='4c25611f-7eb3-4814-af8d-abab10495a70'
  and upper(board)='JAMB' and source like 'storage:%';

update public.past_questions
set question_text='Complete oxidation of propan-1-ol gives',
    updated_at=now()
where id='c2310fdd-b1ca-43cf-aa94-2963f085f3ea'
  and upper(board)='JAMB' and source like 'storage:%';

update public.past_questions
set options=jsonb_set(options,'{2,text}','"The dissolution of sodium chloride in water"'::jsonb),
    updated_at=now()
where id='cfab625d-0eae-47ee-bc0a-940b482304d7'
  and upper(board)='JAMB' and source like 'storage:%';

update public.past_questions
set options='[
  {"id":"A","text":"ability to effect political action"},
  {"id":"B","text":"capacity to produce desired political results"},
  {"id":"C","text":"capacity to reshape political behaviour"},
  {"id":"D","text":"recognized right to exercise political power"}
]'::jsonb,
updated_at=now()
where id='583e0c9c-2bee-458c-8de7-d109624e035d'
  and upper(board)='JAMB' and source like 'storage:%';

update public.past_questions
set question_text='An unwritten constitution is one which',
    options='[
      {"id":"A","text":"embodies only tradition and customs"},
      {"id":"B","text":"relies on the memories of elders and priests"},
      {"id":"C","text":"codifies the basic laws in one document"},
      {"id":"D","text":"embodies the basic laws in more than one document"}
    ]'::jsonb,
    updated_at=now()
where id='1fd42ddb-5d05-4c8d-a27b-cf95938a41c9'
  and upper(board)='JAMB' and source like 'storage:%';

update public.past_questions
set question_text='The notion of checks and balances guarantees that',
    options='[
      {"id":"A","text":"the executive is able to control the legislature"},
      {"id":"B","text":"the judiciary can stop all executive actions"},
      {"id":"C","text":"each branch of government acts as a check on the powers of the others"},
      {"id":"D","text":"the legislature is subordinate to the judiciary"}
    ]'::jsonb,
    updated_at=now()
where id='600a6b27-1334-47d1-9b92-d79df2f7e59a'
  and upper(board)='JAMB' and source like 'storage:%';
