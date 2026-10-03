-- Final title cleanup for published lessons.
-- 1) Replace raw curriculum bullet glyphs with readable punctuation.
update public.lessons
set title = trim(regexp_replace(regexp_replace(title,'[[:space:]]*[•]+[[:space:]]*',' — ','g'),'[[:space:]]+',' ','g')),
    updated_at = now()
where is_published=true
  and (title like '%•%' or title like '%%');

-- 2) Repair the remaining known truncated revision titles from their lesson bodies.
update public.lessons
set title = case id
  when '1867794a-f909-4d1f-9571-92c1995b8ccd'::uuid then 'JSS2 English Language: Review of Tenses'
  when 'f2e183de-d92e-434b-a514-10fa21d5bc1b'::uuid then 'JSS2 English Language: Review of English Language Fundamentals'
  when '001c548a-e6bf-46b2-b01a-71b91a32e0d8'::uuid then 'JSS2 English Language: Review of Grammar and Usage'
  when '6431df1b-3589-4304-b91e-cc1cf5f27723'::uuid then 'JSS2 English Language: Review of Parts of Speech'
  when 'b38b297c-3e81-4d0f-bee4-785d9b4bf2a5'::uuid then 'JSS3 English Language: Comprehensive Review'
  when 'e9ea8edb-bfc4-4442-9353-66c1bc14c000'::uuid then 'JSS3 English Language: Comprehensive Review of Core Concepts'
  when '5dac3dd5-8ed3-485e-bfec-bbeb24433f71'::uuid then 'JSS3 English Language: Comprehensive Review of Core Grammar Skills'
  when '93277305-7b8f-45ed-abc4-3ae73148d192'::uuid then 'JSS3 English Language: Review of Core English Language Topics'
  when '5847e355-ef0c-4ebe-8942-b6c82dad9d47'::uuid then 'JSS3 English Language: Review of Core English Language Topics'
  when 'bc3b9b29-a85c-4410-a0c9-de8f340a4da4'::uuid then 'JSS3 English Language: Review of Core Topics'
  when '91b33818-b935-4948-9021-163a140fae3a'::uuid then 'SSS3 Mathematics: General Review'
  when '760c37fc-afca-4e76-b03e-80b4ed632598'::uuid then 'SSS3 Mathematics: General Review'
  else title
end,
updated_at=now()
where id in (
  '1867794a-f909-4d1f-9571-92c1995b8ccd',
  'f2e183de-d92e-434b-a514-10fa21d5bc1b',
  '001c548a-e6bf-46b2-b01a-71b91a32e0d8',
  '6431df1b-3589-4304-b91e-cc1cf5f27723',
  'b38b297c-3e81-4d0f-bee4-785d9b4bf2a5',
  'e9ea8edb-bfc4-4442-9353-66c1bc14c000',
  '5dac3dd5-8ed3-485e-bfec-bbeb24433f71',
  '93277305-7b8f-45ed-abc4-3ae73148d192',
  '5847e355-ef0c-4ebe-8942-b6c82dad9d47',
  'bc3b9b29-a85c-4410-a0c9-de8f340a4da4',
  '91b33818-b935-4948-9021-163a140fae3a',
  '760c37fc-afca-4e76-b03e-80b4ed632598'
);
