-- Activate source-backed WAEC baselines for Financial Accounting, Geography and Christian Religious Studies.
with validated(id,answer) as (
 values
 ('4402054e-b6a0-4a7a-a8af-2f1cb763054c'::uuid,'D'),('b3839020-f309-4966-9e08-13812f5c9f2a'::uuid,'B'),
 ('b636f580-8590-46a5-a8ef-20986eb202be'::uuid,'B'),('823cb71c-4f70-4f30-9b1a-33e519a79389'::uuid,'D'),
 ('26940ee3-0988-4945-9439-3756812e0ac2'::uuid,'B'),('7ac8bfe5-2033-4348-a4ec-d60da84527da'::uuid,'B'),
 ('309bbc37-7267-4ed7-b3c5-9384548b59b3'::uuid,'D'),('aa2107f4-b826-4c39-924d-2928cf0cc604'::uuid,'D'),
 ('319c74cc-d556-4462-8341-99acca2b3a4b'::uuid,'B'),('76063119-3ae5-4cea-9a62-0ee81a899a91'::uuid,'B'),
 ('d3d8b51c-21cf-47a1-9981-9951e5f1b45f'::uuid,'B'),('2941d266-1645-4782-ad6f-1ce5616bb8e5'::uuid,'D'),
 ('963bbdb4-b2b2-4cf6-9125-13d87febd005'::uuid,'B'),('21150c82-5b4f-4e99-a6e6-22e7d40e45d6'::uuid,'C'),
 ('466e4bcb-23d8-4739-9aad-9d409334c9d4'::uuid,'C'),('42b80759-14f0-4e83-9c13-3649ecf5d5ed'::uuid,'B'),
 ('3fb68998-877e-4b53-a1a7-de55d5befb63'::uuid,'D'),('7146096a-1cdb-416d-b021-6345d0cbddb6'::uuid,'C'),
 ('d3319d8f-d8de-47db-a53c-7e1cdfa3e048'::uuid,'C'),('efcb23e2-68ea-4e68-b587-c2408cbc67a9'::uuid,'B'),
 ('c0956769-243a-4098-b2c1-aca0145018cf'::uuid,'B'),('60dae1f1-5c63-49ea-80ad-fb0325293a39'::uuid,'A'),
 ('fb0a6afa-51fc-4fcc-8ce8-48c100674fe9'::uuid,'C'),('f4693d8c-32b2-4b28-9b6e-bc42754904d0'::uuid,'C'),
 ('0ec86c65-6d43-4cd3-83dc-faebb9c8a4f4'::uuid,'C'),('2a9e7876-5196-450c-b143-931a8d1f4078'::uuid,'B'),
 ('0597dbe0-3298-4c83-8309-111b6698fc0a'::uuid,'C'),('ae6898f2-5d94-4326-a7f4-cbd627b622c6'::uuid,'B'),
 ('0d1aff2f-4507-45f5-bc5e-268e0cbdd30b'::uuid,'C'),('33713432-a08f-4d8b-a3f4-6ef98fecf08f'::uuid,'D')
)
update public.past_questions q set correct_answer=to_jsonb(v.answer),answer_source='manual-content-validation',
answer_verified_at=coalesce(q.answer_verified_at,now()),updated_at=now()
from validated v where q.id=v.id and q.board='waec' and q.source like 'storage:%' and q.is_active and q.question_type='mcq';

update public.past_questions set question_text='A limited company has',options='[{"id":"A","text":"no separate identity from its shareholders."},{"id":"B","text":"no separate identity from its directors."},{"id":"C","text":"separate capital from its shareholders."},{"id":"D","text":"a separate legal identity from its shareholders."}]'::jsonb,updated_at=now() where id='4402054e-b6a0-4a7a-a8af-2f1cb763054c';
update public.past_questions set question_text='Bills receivable is a',options='[{"id":"A","text":"current liability."},{"id":"B","text":"current asset."},{"id":"C","text":"long-term liability."},{"id":"D","text":"fictitious asset."}]'::jsonb,updated_at=now() where id='b636f580-8590-46a5-a8ef-20986eb202be';
update public.past_questions set question_text='The working capital of a business is',options='[{"id":"A","text":"total assets less total liabilities."},{"id":"B","text":"current assets less current liabilities."},{"id":"C","text":"fixed assets less current liabilities."},{"id":"D","text":"fixed assets less long-term liabilities."}]'::jsonb,updated_at=now() where id='26940ee3-0988-4945-9439-3756812e0ac2';
update public.past_questions set question_text='Igneous rocks are formed when',options='[{"id":"A","text":"glaciers transport and deposit materials in layers."},{"id":"B","text":"rivers transport and deposit materials along their banks."},{"id":"C","text":"molten materials from the earth’s interior cool and solidify."},{"id":"D","text":"materials are transported and deposited by wind."}]'::jsonb,updated_at=now() where id='21150c82-5b4f-4e99-a6e6-22e7d40e45d6';
update public.past_questions set question_text='According to Paul, grace is a',options='[{"id":"A","text":"right for all Christians to make wealth."},{"id":"B","text":"privilege to live long."},{"id":"C","text":"free gift from God for the person of faith."},{"id":"D","text":"right to gain eternal life."}]'::jsonb,updated_at=now() where id='f4693d8c-32b2-4b28-9b6e-bc42754904d0';
update public.past_questions set question_text='Paul’s letter to Philemon is about',options='[{"id":"A","text":"simplicity."},{"id":"B","text":"truthfulness."},{"id":"C","text":"forgiveness."},{"id":"D","text":"humility."}]'::jsonb,updated_at=now() where id='0d1aff2f-4507-45f5-bc5e-268e0cbdd30b';
