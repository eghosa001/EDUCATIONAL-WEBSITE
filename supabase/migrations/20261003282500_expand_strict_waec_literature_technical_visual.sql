-- Activate genuine archived WAEC baselines for Literature in English, Technical Drawing and Visual Arts.
with validated(id,answer) as (
 values
 ('8ea6f0b7-bcb7-4300-aff5-c477029b210a'::uuid,'C'),('dc6c2a60-7bd7-433f-8e2f-f362150ec1e0'::uuid,'C'),
 ('06e7e3a2-65e1-4003-8859-917ddeb907bd'::uuid,'D'),('c0fb7662-b056-4c16-acb4-e9e4b3c915b1'::uuid,'C'),
 ('0c6c8003-f535-448c-9974-b723719e913b'::uuid,'B'),('9bde95fd-0ccc-45e7-960a-a60da1329212'::uuid,'A'),
 ('3c53ff35-ccde-49c1-ae13-12102ea1f1c2'::uuid,'A'),('00d6f0fb-feea-453f-983b-98604503edad'::uuid,'D'),
 ('9c25e4e7-6931-4e6c-bf50-7a7b6cd97a94'::uuid,'A'),('b8c73b0b-d80a-4359-8269-d9d489166046'::uuid,'A'),
 ('274727db-599a-42b4-b687-07b630410463'::uuid,'B'),('5408c0b2-92e0-40f7-943a-accbe1ae5964'::uuid,'B'),
 ('125d85e3-b0d2-4ef0-a964-809f0d6a2ee7'::uuid,'B'),('06a6278f-7358-40ef-8dc2-d1852e92b63d'::uuid,'A'),
 ('649652b3-b721-492b-a562-f793207f1560'::uuid,'C'),('a0f6aaaa-aee8-487b-8188-f04037bd01a8'::uuid,'A'),
 ('d5603236-13ee-4e77-8f5c-96e4f5fc6a05'::uuid,'C'),('2909868a-4b73-440b-b500-e4164a8848fc'::uuid,'B'),
 ('f70a60d4-49e8-4e8d-9cf4-3ee370039af2'::uuid,'A'),('963703b2-64fc-41a1-a324-1de5ceab8d89'::uuid,'C'),
 ('6b9f5e39-32d3-40e5-8375-8518e98e033d'::uuid,'D'),('3b17d990-5599-422c-a2b8-d54ba0d1af06'::uuid,'D'),
 ('0f116c87-6fef-4cef-9231-8454cfc94bfb'::uuid,'A'),('9f5503b7-ee6d-40bf-beb4-e02682f5f4b3'::uuid,'C'),
 ('ab2f4a92-e131-4f84-8814-0f72fc7197a1'::uuid,'C'),('21bc44f6-1991-4e16-98d1-70fd71d390fe'::uuid,'C'),
 ('4314f011-eb7a-4031-9a3e-ac16bcd2723b'::uuid,'A'),('a49fa3e7-91f2-4d0f-9755-1fe069e66301'::uuid,'A'),
 ('0582cb3c-f984-46b2-b23f-a59927f9489c'::uuid,'D'),('685d5386-f5c3-4229-9527-c88538e324be'::uuid,'A')
)
update public.past_questions q set correct_answer=to_jsonb(v.answer),answer_source='manual-content-validation',
answer_verified_at=coalesce(q.answer_verified_at,now()),updated_at=now()
from validated v where q.id=v.id and q.board='waec' and q.source like 'storage:%' and q.is_active and q.question_type='mcq';

update public.past_questions set question_text='A writer’s choice of words is called',options='[{"id":"A","text":"diction."},{"id":"B","text":"mood."},{"id":"C","text":"tone."},{"id":"D","text":"setting."}]'::jsonb,updated_at=now() where id='9bde95fd-0ccc-45e7-960a-a60da1329212';
update public.past_questions set question_text='A stanza of four lines in poetry is a',options='[{"id":"A","text":"quatrain."},{"id":"B","text":"sestet."},{"id":"C","text":"octave."},{"id":"D","text":"elegy."}]'::jsonb,updated_at=now() where id='9c25e4e7-6931-4e6c-bf50-7a7b6cd97a94';
update public.past_questions set question_text='The development of a closed square prism will have',options='[{"id":"A","text":"4 rectangles and 4 squares."},{"id":"B","text":"2 squares and 2 rectangles."},{"id":"C","text":"4 rectangles and 2 squares."},{"id":"D","text":"4 squares and 2 rectangles."}]'::jsonb,updated_at=now() where id='649652b3-b721-492b-a562-f793207f1560';
update public.past_questions set question_text='The expression M12 × 2.5 mm on a metric thread refers to',options='[{"id":"A","text":"diameter and flank."},{"id":"B","text":"root diameter and pitch."},{"id":"C","text":"diameter and pitch."},{"id":"D","text":"diameter and thread depth."}]'::jsonb,updated_at=now() where id='d5603236-13ee-4e77-8f5c-96e4f5fc6a05';
update public.past_questions set question_text='Which of the following is not a type of orthographic projection?',options='[{"id":"A","text":"First angle"},{"id":"B","text":"Third angle"},{"id":"C","text":"Isometric"},{"id":"D","text":"Auxiliary"}]'::jsonb,updated_at=now() where id='963703b2-64fc-41a1-a324-1de5ceab8d89';
update public.past_questions set question_text='Artefacts are valuable because they',options='[{"id":"A","text":"can be preserved."},{"id":"B","text":"are found in niches."},{"id":"C","text":"can be seen everywhere."},{"id":"D","text":"tell the story of the past."}]'::jsonb,updated_at=now() where id='3b17d990-5599-422c-a2b8-d54ba0d1af06';
update public.past_questions set question_text='Who among the following was a master of chiaroscuro?',options='[{"id":"A","text":"Albrecht Dürer"},{"id":"B","text":"El Greco"},{"id":"C","text":"Rembrandt van Rijn"},{"id":"D","text":"Frans Hals"}]'::jsonb,updated_at=now() where id='21bc44f6-1991-4e16-98d1-70fd71d390fe';
update public.past_questions set question_text='The bronze works from Ife and Benin were made through the',options='[{"id":"A","text":"cire perdue process."},{"id":"B","text":"etching technique."},{"id":"C","text":"resist process."},{"id":"D","text":"subtractive technique."}]'::jsonb,updated_at=now() where id='685d5386-f5c3-4229-9527-c88538e324be';
