-- Raise archived, source-backed WAEC Physics from 10 to 20.
-- One objective item merged into a neighboring OCR row is restored explicitly from the same archived paper.
with validated(id,answer) as (
  values
    ('3e288382-46dd-4bb6-8c82-d6563fa8fe68'::uuid,'A'),('a8c1ca65-8540-4c78-9aeb-7c4140150ae2'::uuid,'A'),
    ('affc7cfe-b540-46e0-a693-a840f24dfa05'::uuid,'D'),('894e736e-3e48-4d3c-9fdc-c69971267506'::uuid,'B'),
    ('b1a20c70-9a2b-4ec3-9077-a82e0b74cc2b'::uuid,'C'),('16753677-a2cc-4d83-8cc0-9562763ab5fe'::uuid,'B'),
    ('92912f0e-11df-4892-8a73-f18303640018'::uuid,'D'),('ce8c7558-4d50-438b-ac1d-241f0ddef665'::uuid,'B'),
    ('b5d395cf-1dd6-4885-9c56-e5c8c83361f8'::uuid,'C')
)
update public.past_questions q set correct_answer=to_jsonb(v.answer),answer_source='public-archive-cross-validation',
answer_verified_at=coalesce(q.answer_verified_at,now()),updated_at=now()
from validated v where q.id=v.id and q.board='waec'
and q.source='storage:7193c653-74f8-4b38-983c-92acb901df25';

update public.past_questions set question_text='The mass of an object can be measured using the following instruments except',options='[{"id":"A","text":"spring balance."},{"id":"B","text":"lever."},{"id":"C","text":"metre rule."},{"id":"D","text":"beam balance."}]'::jsonb,updated_at=now() where id='3e288382-46dd-4bb6-8c82-d6563fa8fe68';
update public.past_questions set options='[{"id":"A","text":"greater than 1."},{"id":"B","text":"less than 1."},{"id":"C","text":"equal to 1."},{"id":"D","text":"equal to its velocity ratio."}]'::jsonb,updated_at=now() where id='a8c1ca65-8540-4c78-9aeb-7c4140150ae2';
update public.past_questions set options='[{"id":"A","text":"Each of the conductors will experience a force."},{"id":"B","text":"Each of the conductors can move."},{"id":"C","text":"The magnitudes of the forces on the conductors will be equal."},{"id":"D","text":"The two conductors will repel each other."}]'::jsonb,updated_at=now() where id='affc7cfe-b540-46e0-a693-a840f24dfa05';
update public.past_questions set question_text='A uniform metre rule balances horizontally when it is pivoted at the 70 cm mark and a mass of 105 g is suspended at the 90 cm mark. Calculate the mass of the metre rule.',options='[{"id":"A","text":"100.0 g"},{"id":"B","text":"105.0 g"},{"id":"C","text":"135.0 g"},{"id":"D","text":"189.0 g"}]'::jsonb,updated_at=now() where id='894e736e-3e48-4d3c-9fdc-c69971267506';
update public.past_questions set question_text='The first resonant length of the air column vibrating to a tuning fork in a closed tube is 26.25 cm. Neglecting end correction, calculate the frequency of the fork. Take the speed of sound in air as 336 m s⁻¹.',options='[{"id":"A","text":"960 Hz"},{"id":"B","text":"640 Hz"},{"id":"C","text":"320 Hz"},{"id":"D","text":"160 Hz"}]'::jsonb,updated_at=now() where id='b1a20c70-9a2b-4ec3-9077-a82e0b74cc2b';
update public.past_questions set question_text='An insulated negatively charged rod is held above the cap of a positively charged electroscope. The rod is slowly moved down towards the cap until it is just above it. The leaves of the electroscope will be observed to slowly',options='[{"id":"A","text":"collapse completely."},{"id":"B","text":"collapse and then diverge."},{"id":"C","text":"attain maximum divergence."},{"id":"D","text":"diverge and then collapse completely."}]'::jsonb,updated_at=now() where id='16753677-a2cc-4d83-8cc0-9562763ab5fe';
update public.past_questions set question_text='An aluminium calorimeter without a lid and jacket is placed on a table. Boiling water is then poured into it. Which processes account for the cooling of the water? I. Conduction II. Evaporation III. Radiation IV. Convection',options='[{"id":"A","text":"I only"},{"id":"B","text":"I and II only"},{"id":"C","text":"II and III only"},{"id":"D","text":"I, II, III and IV"}]'::jsonb,updated_at=now() where id='92912f0e-11df-4892-8a73-f18303640018';
update public.past_questions set question_text='Which of the following statements about sound waves are correct? I. In a uniform medium, intensity is directly proportional to distance from the source. II. For a given frequency and wavelength, amplitude is a measure of wave energy. III. Pitch is the effect of sound frequency on the human ear.',options='[{"id":"A","text":"I and II only"},{"id":"B","text":"II and III only"},{"id":"C","text":"I and III only"},{"id":"D","text":"I, II and III"}]'::jsonb,updated_at=now() where id='ce8c7558-4d50-438b-ac1d-241f0ddef665';
update public.past_questions set question_text='The refractive indices of water and glass with respect to air are 4/3 and 3/2 respectively. If the speed of white light in glass is 2.00 × 10⁸ m s⁻¹, calculate its speed in water.',options='[{"id":"A","text":"1.33 × 10⁸ m s⁻¹"},{"id":"B","text":"1.50 × 10⁸ m s⁻¹"},{"id":"C","text":"2.25 × 10⁸ m s⁻¹"},{"id":"D","text":"2.67 × 10⁸ m s⁻¹"}]'::jsonb,updated_at=now() where id='b5d395cf-1dd6-4885-9c56-e5c8c83361f8';

insert into public.past_questions(id,board,year,subject_id,question_type,question_text,options,correct_answer,difficulty,marks,source,tags,is_active,answer_source,answer_verified_at)
select 'd3f7b7d1-6c12-4f78-a9fb-9b0e2c84c611'::uuid,'waec',2011,'04903394-7e23-4154-bcfe-f1b6236ef47a'::uuid,'mcq',
'When the average separation of the molecules of a fixed mass of an ideal gas is increased, there is a corresponding average',
'[{"id":"A","text":"increase in the rate of collisions."},{"id":"B","text":"decrease in the pressure of the gas."},{"id":"C","text":"increase in the kinetic energy of the gas."},{"id":"D","text":"decrease in the number of molecules."}]'::jsonb,to_jsonb('B'::text),'medium',1,
'storage:7193c653-74f8-4b38-983c-92acb901df25',
'["waec","Physics",2011,"waec-physics-november-2011-paper-2-objective-and-essay.pdf","storage-extracted","manual-row-recovery"]'::jsonb,
true,'public-archive-cross-validation',now()
where not exists(select 1 from public.past_questions where id='d3f7b7d1-6c12-4f78-a9fb-9b0e2c84c611' or (source='storage:7193c653-74f8-4b38-983c-92acb901df25' and question_text ilike 'When the average separation of the molecules%'));

update public.past_question_files f
set questions_extracted=(select count(*) from public.past_questions q where q.source='storage:'||f.id::text),
metadata=jsonb_set(jsonb_set(coalesce(f.metadata,'{}'::jsonb),'{linked_questions}',to_jsonb((select count(*) from public.past_questions q where q.source='storage:'||f.id::text))),'{active_questions}',to_jsonb((select count(*) from public.past_questions q where q.source='storage:'||f.id::text and q.is_active))),
updated_at=now() where f.id='7193c653-74f8-4b38-983c-92acb901df25';
