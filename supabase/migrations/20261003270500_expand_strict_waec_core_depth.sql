-- Build a genuine source-backed WAEC baseline from archived Storage PDFs.
-- Only self-contained MCQs with unambiguous answers are validated here.

with validated(id, answer) as (
  values
    ('f57c42fd-2143-4df1-90e9-6e37226a6fbc'::uuid,'C'),
    ('9ddff8db-188e-4cef-b9fc-eebbd2374d5e'::uuid,'B'),
    ('21280a34-0fea-4764-ba54-d31b306ca513'::uuid,'C'),
    ('3f562d19-f69f-46a6-ae78-57d43bfdc7a3'::uuid,'A'),
    ('76865178-ecb2-4aaa-a86b-52197f8870bc'::uuid,'C'),
    ('351e3830-af09-447d-8aad-c2a2c8d120ba'::uuid,'D'),
    ('b55dcf8f-9ea2-47fd-b3a1-d8770b7b6435'::uuid,'D'),
    ('44c9c315-99e0-45c8-9d88-43d266112ee6'::uuid,'C'),
    ('4e2e9677-9920-4677-8872-8eeb513808b7'::uuid,'C'),
    ('10c8d663-8a2a-46dd-9033-34813fd162c7'::uuid,'C'),
    ('a15571c8-2eb3-4abf-a1de-1b7edf71b591'::uuid,'A'),
    ('6da69f45-1805-4783-818d-d915beccd70a'::uuid,'C'),
    ('f75ea3a4-79f7-4f66-b47b-5bef3eb695fd'::uuid,'B'),
    ('10adebed-1acd-4e6d-b570-7dd8a2ad5400'::uuid,'D'),
    ('2a5d351a-2886-4875-8e9e-45957d174dc0'::uuid,'A'),
    ('7312e370-db2b-41ad-b9ba-bbfa48a0ea34'::uuid,'C'),
    ('d4a098d2-1d01-469d-aeeb-1aa8bccf6bc2'::uuid,'C'),
    ('f0addecb-18a4-4efb-b7ad-25290abe7672'::uuid,'A'),
    ('fd93c503-457d-4d21-b7c7-99493132e23f'::uuid,'B'),
    ('0cdef668-a8e9-456c-bbe5-a1201abe7132'::uuid,'A'),
    ('a52b3801-daca-43f1-806a-1799fba96f93'::uuid,'C'),
    ('50667b35-975a-46d6-a9bd-da0efddd7145'::uuid,'A'),
    ('ca5943f6-cd28-430d-ada4-8f5871c0a359'::uuid,'A'),
    ('505dbbfe-1309-432a-ac02-0176a0d38283'::uuid,'C'),
    ('9f2bf1a0-0852-4c18-a182-33ec2dbc1239'::uuid,'B'),
    ('bece037b-c23f-463a-a910-4e8c21493476'::uuid,'A'),
    ('c415c205-d479-47cb-b56c-39cd86fa267e'::uuid,'C'),
    ('f69d6fe9-df93-4d9d-9fff-c8fbb9750776'::uuid,'A'),
    ('b35a9929-18d3-4f93-91f1-f7cb34b80881'::uuid,'B'),
    ('8c14ccf1-2d37-4997-a449-b3d8b7b6cb51'::uuid,'C')
)
update public.past_questions q
set correct_answer=to_jsonb(v.answer),
    answer_source='manual-content-validation',
    answer_verified_at=coalesce(q.answer_verified_at,now()),
    updated_at=now()
from validated v
where q.id=v.id and upper(q.board)='WAEC'
  and q.source like 'storage:%'
  and q.is_active is true and q.question_type='mcq';

update public.past_questions set options='[{"id":"A","text":"cattle with high milk yield."},{"id":"B","text":"disease-resistant crops."},{"id":"C","text":"insecticide-resistant mosquitoes."},{"id":"D","text":"seedless oranges."}]'::jsonb,updated_at=now() where id='44c9c315-99e0-45c8-9d88-43d266112ee6';
update public.past_questions set question_text='The atom and ion of chlorine have the same',options='[{"id":"A","text":"number of protons."},{"id":"B","text":"electronic configuration."},{"id":"C","text":"chemical properties."},{"id":"D","text":"electrical charge."}]'::jsonb,updated_at=now() where id='2a5d351a-2886-4875-8e9e-45957d174dc0';
update public.past_questions set question_text='The IUPAC name of the compound CH₃CH(OH)CH₂OH is',options='[{"id":"A","text":"propan-2-ol."},{"id":"B","text":"propan-1,2-diol."},{"id":"C","text":"propan-2,3-diol."},{"id":"D","text":"propan-3-ol."}]'::jsonb,updated_at=now() where id='fd93c503-457d-4d21-b7c7-99493132e23f';
update public.past_questions set options='[{"id":"A","text":"Newton’s first law of motion."},{"id":"B","text":"Newton’s second law of motion."},{"id":"C","text":"Newton’s third law of motion."},{"id":"D","text":"principle of moments."}]'::jsonb,updated_at=now() where id='a52b3801-daca-43f1-806a-1799fba96f93';
update public.past_questions set question_text='Which of the following factors does not increase the strength of an induced emf in a solenoid?',options='[{"id":"A","text":"cross-sectional area of the solenoid"},{"id":"B","text":"polarity of the magnet facing the solenoid"},{"id":"C","text":"speed at which the magnet moves"},{"id":"D","text":"number of turns of the solenoid"}]'::jsonb,updated_at=now() where id='9f2bf1a0-0852-4c18-a182-33ec2dbc1239';
update public.past_questions set question_text='The quantity of heat required to raise the temperature of a unit mass of a substance by 1°C is known as',updated_at=now() where id='bece037b-c23f-463a-a910-4e8c21493476';
update public.past_questions set question_text='A student pulls a trolley with a horizontal force of 50.0 N through a distance of 1.5 km in 20 minutes. Calculate the average power of the student.',options='[{"id":"A","text":"3.8 W"},{"id":"B","text":"62.5 W"},{"id":"C","text":"666.7 W"},{"id":"D","text":"3750.0 W"}]'::jsonb,updated_at=now() where id='b35a9929-18d3-4f93-91f1-f7cb34b80881';
update public.past_questions set question_text='A load of 80 N extends a spring by 8 cm. When the load is replaced by a copper block, the extension produced is 10 cm. Calculate the weight of the copper block, assuming that the elastic limit of the spring is not exceeded.',options='[{"id":"A","text":"40 N"},{"id":"B","text":"64 N"},{"id":"C","text":"100 N"},{"id":"D","text":"160 N"}]'::jsonb,updated_at=now() where id='8c14ccf1-2d37-4997-a449-b3d8b7b6cb51';
