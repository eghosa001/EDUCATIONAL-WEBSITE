-- Activate genuine archived WAEC baselines for Economics, Commerce and Agricultural Science.
with validated(id,answer) as (
 values
 ('24d97a67-db80-4af1-9e01-ab2d916f4f9c'::uuid,'C'),('469a56e3-60c4-4b46-9230-52c20fab40a3'::uuid,'C'),
 ('b2020a64-81c7-4ecf-bff7-57e64eb7e698'::uuid,'B'),('ab632051-8746-4ae0-87b3-cbd195d70f5a'::uuid,'D'),
 ('3d6b86d8-e60d-4b37-b8fe-7f292249086e'::uuid,'D'),('1f846473-6113-4e5b-998c-ef37a0dfa196'::uuid,'A'),
 ('899fbcfa-8c71-4fb3-ab15-5c047b7bee31'::uuid,'A'),('6d21e3b9-02bc-4e85-b982-5123bb83030b'::uuid,'C'),
 ('fc79ab7a-b346-4462-b658-89e5f3cc9469'::uuid,'C'),('eedcb2f1-dc89-4679-b68a-36bee4c9d8a0'::uuid,'A'),
 ('b4b2b1a8-dec3-4108-a39a-62a3b408b1bd'::uuid,'A'),('c3f74e50-fc2f-4789-b9c9-30f6b47059c0'::uuid,'B'),
 ('3a5ee508-c364-4000-a8de-84f835c0f5ee'::uuid,'C'),('076e19d6-0f4a-4633-808a-c3338230a292'::uuid,'D'),
 ('58472f0c-fe33-45e2-a6ca-72c8665c6cf9'::uuid,'B'),('40d0f8eb-ab68-4f1d-b5d3-ff3bbc0bbd63'::uuid,'B'),
 ('d25dad59-52c0-40b1-b9b7-b5a11fe7f853'::uuid,'C'),('26c16208-2208-4ce6-8897-bb6a2792d210'::uuid,'A'),
 ('3ed8d52a-92da-47f7-9207-595c7714aa9e'::uuid,'B'),('6951a675-77dd-4fae-8d27-fa98f60d0906'::uuid,'D'),
 ('2319aae8-cab8-4fdd-a0b7-3fa7c48788ea'::uuid,'C'),('93acd514-0a48-401b-a3d4-d598fb446678'::uuid,'A'),
 ('cbb067a5-6214-4d2b-89f8-e7ef21f4d8d3'::uuid,'C'),('6999d90c-97e8-4490-8832-5eca5f40acca'::uuid,'A'),
 ('32e66374-bdf4-4b45-bdb1-dba424632313'::uuid,'B'),('a217ae42-3dc0-4773-88c2-e164a785a1eb'::uuid,'C'),
 ('689bd493-e4f2-4b1c-9fc2-714b854bca08'::uuid,'C'),('9b59aa2e-07e5-4a51-abac-8eee703b1822'::uuid,'A'),
 ('b00558d3-3dd2-40d3-a24c-30c3ec710980'::uuid,'A'),('7bad17ff-a2b1-4fa1-994c-26f9aab06eff'::uuid,'A')
)
update public.past_questions q set correct_answer=to_jsonb(v.answer),answer_source='manual-content-validation',
answer_verified_at=coalesce(q.answer_verified_at,now()),updated_at=now()
from validated v where q.id=v.id and q.board='waec' and q.source like 'storage:%' and q.is_active and q.question_type='mcq';

update public.past_questions set question_text='Land is a free gift of nature because',options='[{"id":"A","text":"it belongs to all people."},{"id":"B","text":"it is controlled by the government."},{"id":"C","text":"it has cost humanity nothing to put it where it is."},{"id":"D","text":"people can live freely on land without any challenge."}]'::jsonb,updated_at=now() where id='469a56e3-60c4-4b46-9230-52c20fab40a3';
update public.past_questions set question_text='A change in consumers’ income will cause',options='[{"id":"A","text":"a change in demand."},{"id":"B","text":"reckless spending."},{"id":"C","text":"an increase in savings."},{"id":"D","text":"a change in quantity demanded."}]'::jsonb,updated_at=now() where id='1f846473-6113-4e5b-998c-ef37a0dfa196';
update public.past_questions set question_text='A specially crossed cheque has',options='[{"id":"A","text":"the name of the drawer printed on it."},{"id":"B","text":"two parallel lines across it."},{"id":"C","text":"the name of a bank written across it."},{"id":"D","text":"the words “not negotiable” written on it."}]'::jsonb,updated_at=now() where id='3a5ee508-c364-4000-a8de-84f835c0f5ee';
update public.past_questions set question_text='An incubator is used for',options='[{"id":"A","text":"candling eggs."},{"id":"B","text":"brooding chicks."},{"id":"C","text":"hatching fertile eggs."},{"id":"D","text":"storing eggs."}]'::jsonb,updated_at=now() where id='a217ae42-3dc0-4773-88c2-e164a785a1eb';
update public.past_questions set options='[{"id":"A","text":"well-drained, light sandy-loam soil."},{"id":"B","text":"well-drained, clayey friable soil."},{"id":"C","text":"swampy, sandy-clay soil."},{"id":"D","text":"well-drained, clayey-loam soil."}]'::jsonb,updated_at=now() where id='6999d90c-97e8-4490-8832-5eca5f40acca';
