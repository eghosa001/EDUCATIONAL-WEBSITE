-- Complete a 10-question source-backed WAEC baseline for Mathematics and English.
-- Answers are limited to self-contained questions that remain traceable to archived Storage PDFs.

with validated(id, answer) as (
  values
    ('9bce93f3-6e58-466a-9bae-ca1958df3704'::uuid,'B'),
    ('1611783b-8a94-48c8-9937-e0e1a04ac0d2'::uuid,'D'),
    ('980339c5-8642-4590-8ba7-ed0bc2546682'::uuid,'C'),
    ('47e3be39-429f-429d-8e5b-24445dc6d496'::uuid,'A'),
    ('bc5aa746-8a77-495b-bb7a-c1f5f6f83076'::uuid,'B'),
    ('60020c29-769c-4696-b0ca-e3beb09ed133'::uuid,'C'),
    ('7ece68fe-6c98-4316-87c9-e4c02ba655e5'::uuid,'D'),
    ('db326541-d3b7-45c9-8336-c2a8c12d13f0'::uuid,'C'),
    ('d6393ecd-667c-4837-b072-c87b1c88ed6f'::uuid,'B'),
    ('27376b98-f3b6-4daf-bdf3-c7e351e4822b'::uuid,'C'),
    ('54eb3507-ffbd-4367-9bcb-bcf634c22326'::uuid,'B'),
    ('4ae7aa02-25f4-4a7a-897d-916edb50170b'::uuid,'C'),
    ('4f8ca2ea-36d4-47a4-9873-9f15eda254b5'::uuid,'D'),
    ('6a659058-6520-4eed-93e5-c50816bccb09'::uuid,'A'),
    ('6e605068-be3a-4664-aa4a-bbed8f0aed96'::uuid,'B'),
    ('56c16369-90ea-4c25-ada9-8c71d09aac5b'::uuid,'A')
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

update public.past_questions set question_text='Expand: (5x - y)(x - 3y).',options='[{"id":"A","text":"5x² + 16xy + 3y²"},{"id":"B","text":"5x² - 16xy + 3y²"},{"id":"C","text":"5x² + 14xy - 3y²"},{"id":"D","text":"5x² - 14xy + 3y²"}]'::jsonb,updated_at=now() where id='9bce93f3-6e58-466a-9bae-ca1958df3704';
update public.past_questions set question_text='If VW and XY are two vectors such that VW = 4XY, then',options='[{"id":"A","text":"V, W, X and Y are vertices of a parallelogram."},{"id":"B","text":"VW = 4YX."},{"id":"C","text":"VW is perpendicular to XY."},{"id":"D","text":"VW is parallel to XY."}]'::jsonb,updated_at=now() where id='1611783b-8a94-48c8-9937-e0e1a04ac0d2';
update public.past_questions set question_text='A side of a regular polygon is 10 cm. If each interior angle is 156°, calculate its perimeter.',options='[{"id":"A","text":"100 cm"},{"id":"B","text":"120 cm"},{"id":"C","text":"150 cm"},{"id":"D","text":"240 cm"}]'::jsonb,updated_at=now() where id='980339c5-8642-4590-8ba7-ed0bc2546682';
update public.past_questions set question_text='A cylinder of height 7 cm has a curved surface area of 264 cm². Find the radius of its base. Take π = 22/7.',options='[{"id":"A","text":"6 cm"},{"id":"B","text":"10 cm"},{"id":"C","text":"5 cm"},{"id":"D","text":"16 cm"}]'::jsonb,updated_at=now() where id='47e3be39-429f-429d-8e5b-24445dc6d496';
update public.past_questions set question_text='A rectangle whose length is twice its width has the same perimeter as a square of area 144 cm². Find the length of the rectangle.',options='[{"id":"A","text":"10 cm"},{"id":"B","text":"12 cm"},{"id":"C","text":"16 cm"},{"id":"D","text":"24 cm"}]'::jsonb,updated_at=now() where id='60020c29-769c-4696-b0ca-e3beb09ed133';
update public.past_questions set options='[{"id":"A","text":"GH¢92.00"},{"id":"B","text":"GH¢126.67"},{"id":"C","text":"GH¢153.60"},{"id":"D","text":"GH¢192.00"}]'::jsonb,updated_at=now() where id='7ece68fe-6c98-4316-87c9-e4c02ba655e5';
update public.past_questions set question_text='A bookseller gives 5% discount to a customer who pays cash. What is the marked price of a book for which the customer pays ₦475.00?',options='[{"id":"A","text":"₦300.00"},{"id":"B","text":"₦400.00"},{"id":"C","text":"₦500.00"},{"id":"D","text":"₦600.00"}]'::jsonb,updated_at=now() where id='db326541-d3b7-45c9-8336-c2a8c12d13f0';
update public.past_questions set question_text='Four oranges sell for ₦x and three mangoes sell for ₦y. Olu bought 24 oranges and 12 mangoes. How much did he pay in terms of x and y?',options='[{"id":"A","text":"₦(4x + 6y)"},{"id":"B","text":"₦(6x + 4y)"},{"id":"C","text":"₦(24x + 12y)"},{"id":"D","text":"₦(12x + 24y)"}]'::jsonb,updated_at=now() where id='d6393ecd-667c-4837-b072-c87b1c88ed6f';
update public.past_questions set question_text='The slant height of a cone is 5 cm and the radius of its base is 3 cm. Find, correct to the nearest whole number, the volume of the cone. Take π = 22/7.',options='[{"id":"A","text":"48 cm³"},{"id":"B","text":"47 cm³"},{"id":"C","text":"38 cm³"},{"id":"D","text":"13 cm³"}]'::jsonb,updated_at=now() where id='27376b98-f3b6-4daf-bdf3-c7e351e4822b';
update public.past_questions set question_text='Miss Onassis was a ...',options='[{"id":"A","text":"young rich lady"},{"id":"B","text":"rich young lady"},{"id":"C","text":"lady young rich"},{"id":"D","text":"young lady rich"}]'::jsonb,updated_at=now() where id='54eb3507-ffbd-4367-9bcb-bcf634c22326';
update public.past_questions set question_text='Harry hates ... in suspense.',options='[{"id":"A","text":"been kept"},{"id":"B","text":"keeping"},{"id":"C","text":"being kept"},{"id":"D","text":"having been kept"}]'::jsonb,updated_at=now() where id='4ae7aa02-25f4-4a7a-897d-916edb50170b';
update public.past_questions set question_text='Monkeys don’t talk, ...?',options='[{"id":"A","text":"don’t they"},{"id":"B","text":"they do"},{"id":"C","text":"didn’t they"},{"id":"D","text":"do they"}]'::jsonb,updated_at=now() where id='4f8ca2ea-36d4-47a4-9873-9f15eda254b5';
update public.past_questions set question_text='It’s been rough so far, ...?',options='[{"id":"A","text":"hasn’t it"},{"id":"B","text":"hadn’t it"},{"id":"C","text":"isn’t it"},{"id":"D","text":"wasn’t it"}]'::jsonb,updated_at=now() where id='6a659058-6520-4eed-93e5-c50816bccb09';
update public.past_questions set question_text='The boss has an aversion to smoking.',options='[{"id":"A","text":"an inclination"},{"id":"B","text":"a distaste"},{"id":"C","text":"a lust"},{"id":"D","text":"a desire"},{"id":"E","text":"a habit"}]'::jsonb,updated_at=now() where id='6e605068-be3a-4664-aa4a-bbed8f0aed96';
update public.past_questions set question_text='Isn’t it high time we ...?',options='[{"id":"A","text":"started eating"},{"id":"B","text":"start eating"},{"id":"C","text":"had started eating"},{"id":"D","text":"start to eat"}]'::jsonb,updated_at=now() where id='56c16369-90ea-4c25-ada9-8c71d09aac5b';
