-- Raise archived, source-backed WAEC Biology and Chemistry banks from 10 to 20 each.
with validated(id,answer) as (
  values
    ('8c8d7179-1c67-4e63-b242-1f4e34fca9e1'::uuid,'C'),('b36db1a4-c1d2-41e1-8c56-458c28774ebc'::uuid,'B'),
    ('f345f002-5b7c-410a-abd3-c86c8512a761'::uuid,'B'),('df2a4fa0-5a36-48dc-ab6d-3370d684d4e5'::uuid,'D'),
    ('711bc681-41d8-4663-b49e-5ba84ab8a660'::uuid,'E'),('433f72c0-2a4e-4900-8390-76e51b805762'::uuid,'E'),
    ('c551be1b-ca91-418e-9c7a-f946a10e4477'::uuid,'A'),('cc7c8500-0b4e-4f2e-a74c-f72b43a06d99'::uuid,'B'),
    ('5cdc3de3-ac4e-404b-87b9-de2579dbaf6c'::uuid,'E'),('dcdb9f19-b05c-4333-b09f-612847e82fe5'::uuid,'C'),
    ('750d5ae2-60fd-41af-91e4-247955a17b7d'::uuid,'B'),('557086e0-3de6-4e8b-a1a0-47b929a45d28'::uuid,'B'),
    ('76e9b0b6-8594-4046-96f2-3447018339f5'::uuid,'D'),('bbb04b23-9d91-443a-9bed-96e4b895612c'::uuid,'D'),
    ('336814f6-5b6b-4be6-8279-a406730485cd'::uuid,'C'),('714be9c4-6870-42d5-9ae1-d3b3ef4568fc'::uuid,'D'),
    ('b11b9eae-c423-4f05-8806-e1ed8472ff03'::uuid,'B'),('812b4404-4b62-440f-8648-749c54d3679a'::uuid,'B'),
    ('c4278d90-6f27-4959-a7cd-165bf65bd607'::uuid,'C'),('8737a0cd-3d1d-41fb-aa24-44372a450143'::uuid,'A')
)
update public.past_questions q set correct_answer=to_jsonb(v.answer),answer_source='manual-content-validation',
answer_verified_at=coalesce(q.answer_verified_at,now()),updated_at=now()
from validated v where q.id=v.id and q.board='waec' and q.source like 'storage:%'
and q.is_active and q.question_type='mcq';

update public.past_questions set options='[{"id":"A","text":"its star-shaped chloroplast."},{"id":"B","text":"the presence of pseudopodia."},{"id":"C","text":"its cup-shaped chloroplast."},{"id":"D","text":"the presence of a nucleus in its cell."}]'::jsonb,updated_at=now() where id='8c8d7179-1c67-4e63-b242-1f4e34fca9e1';
update public.past_questions set question_text='The respiratory organ found in the cockroach is the',options='[{"id":"A","text":"air sac."},{"id":"B","text":"trachea."},{"id":"C","text":"book lung."},{"id":"D","text":"lung."},{"id":"E","text":"gill."}]'::jsonb,updated_at=now() where id='f345f002-5b7c-410a-abd3-c86c8512a761';
update public.past_questions set question_text='Aerobic respiration in the cell takes place in the',options='[{"id":"A","text":"cytoplasm."},{"id":"B","text":"lysosome."},{"id":"C","text":"nucleus."},{"id":"D","text":"mitochondrion."}]'::jsonb,updated_at=now() where id='df2a4fa0-5a36-48dc-ab6d-3370d684d4e5';
update public.past_questions set question_text='Which of the following can cause desert encroachment?',options='[{"id":"A","text":"Afforestation"},{"id":"B","text":"Irrigation"},{"id":"C","text":"Planting of trees"},{"id":"D","text":"Establishment of a game reserve"},{"id":"E","text":"Overgrazing"}]'::jsonb,updated_at=now() where id='711bc681-41d8-4663-b49e-5ba84ab8a660';
update public.past_questions set options='[{"id":"A","text":"Polymerization"},{"id":"B","text":"Addition"},{"id":"C","text":"Substitution"},{"id":"D","text":"Hydrolysis"}]'::jsonb,updated_at=now() where id='336814f6-5b6b-4be6-8279-a406730485cd';
