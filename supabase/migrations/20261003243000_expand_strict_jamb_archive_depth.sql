-- Expand strict JAMB depth using only existing archived source-paper rows.
-- Seed/demo JAMB rows are deliberately excluded.

-- MATHEMATICS: restore five source questions/options cross-validated against public JAMB archives.
update public.past_questions
set question_text='Find the sum to infinity of the sequence 1, 9/10, (9/10)^2, (9/10)^3, ...',
    options='[{"id":"A","text":"1/10"},{"id":"B","text":"9/10"},{"id":"C","text":"10/9"},{"id":"D","text":"10"}]'::jsonb,
    question_type='mcq',
    correct_answer=to_jsonb('D'::text),
    explanation='This is a geometric progression with first term 1 and common ratio 9/10. Its sum to infinity is 1/(1-9/10)=10.',
    answer_source='public-archive-cross-validation',
    answer_verified_at=now(),
    updated_at=now()
where id='24af9641-5222-4c3b-86e4-499245d4db5f'
  and source='storage:256ba2ee-b872-4024-bf35-ef96c6a3a4c7'
  and correct_answer is null;

update public.past_questions
set question_text='Two perpendicular lines PQ and QR intersect at (1, -1). If the equation of PQ is x - 2y + 4 = 0, find the equation of QR.',
    options='[{"id":"A","text":"x + 2y - 1 = 0"},{"id":"B","text":"2x + y - 3 = 0"},{"id":"C","text":"x - 2y - 3 = 0"},{"id":"D","text":"2x + y - 1 = 0"}]'::jsonb,
    question_type='mcq',
    correct_answer=to_jsonb('D'::text),
    explanation='PQ has slope 1/2, so the perpendicular slope is -2. Through (1,-1): y+1=-2(x-1), giving 2x+y-1=0.',
    answer_source='public-archive-cross-validation',
    answer_verified_at=now(),
    updated_at=now()
where id='2dae2947-e19b-4ad7-aca9-b907bc9cf2fd'
  and source='storage:256ba2ee-b872-4024-bf35-ef96c6a3a4c7'
  and correct_answer is null;

update public.past_questions
set question_text='If nP3 - 6(nC4) = 0, find the value of n.',
    options='[{"id":"A","text":"6"},{"id":"B","text":"5"},{"id":"C","text":"8"},{"id":"D","text":"7"}]'::jsonb,
    question_type='mcq',
    correct_answer=to_jsonb('D'::text),
    explanation='nP3=n(n-1)(n-2) and 6nC4=n(n-1)(n-2)(n-3)/4. Hence 1-(n-3)/4=0, so n=7.',
    answer_source='public-archive-cross-validation',
    answer_verified_at=now(),
    updated_at=now()
where id='95fa541a-0c40-4cf6-b134-f6e8b904d79c'
  and source='storage:256ba2ee-b872-4024-bf35-ef96c6a3a4c7'
  and correct_answer is null;

update public.past_questions
set question_text='Find the variance of 2, 6, 8, 6, 2 and 6.',
    options='[{"id":"A","text":"6"},{"id":"B","text":"5"},{"id":"C","text":"√6"},{"id":"D","text":"√5"}]'::jsonb,
    question_type='mcq',
    correct_answer=to_jsonb('B'::text),
    explanation='The mean is 5. The squared deviations sum to 30, and 30/6=5.',
    answer_source='public-archive-cross-validation',
    answer_verified_at=now(),
    updated_at=now()
where id='f5cdf8ee-c68b-4cb7-b9d0-00c9b7f5a9b7'
  and source='storage:256ba2ee-b872-4024-bf35-ef96c6a3a4c7'
  and correct_answer is null;

update public.past_questions
set question_text='Find the sum of the range and the mode of the set 10, 9, 10, 9, 8, 7, 7, 10, 8, 10, 8, 4, 6, 9, 10, 9, 10, 9, 7, 10, 6, 5.',
    options='[{"id":"A","text":"16"},{"id":"B","text":"14"},{"id":"C","text":"12"},{"id":"D","text":"10"}]'::jsonb,
    question_type='mcq',
    correct_answer=to_jsonb('A'::text),
    explanation='The range is 10-4=6 and the mode is 10, so their sum is 16.',
    answer_source='public-archive-cross-validation',
    answer_verified_at=now(),
    updated_at=now()
where id='66b447c6-dfab-472a-a75e-47f20af346b8'
  and source='storage:256ba2ee-b872-4024-bf35-ef96c6a3a4c7'
  and correct_answer is null;

-- BIOLOGY: validate six clean archived JAMB MCQs.
update public.past_questions
set question_text='The short thick beak in birds is an adaptation for',
    options='[{"id":"A","text":"crushing seeds"},{"id":"B","text":"sucking nectar"},{"id":"C","text":"tearing flesh"},{"id":"D","text":"straining mud"}]'::jsonb,
    correct_answer=to_jsonb('A'::text),
    explanation='A short, thick beak is adapted for exerting force to crack and crush seeds.',
    answer_source='manual-content-validation', answer_verified_at=now(), updated_at=now()
where id='46e47bd6-0e60-4ab0-932d-0946301b51f9' and source like 'storage:%' and correct_answer is null;

update public.past_questions
set question_text='The dominant phase in the life cycle of a fern is the',
    options='[{"id":"A","text":"gametophyte"},{"id":"B","text":"prothallus"},{"id":"C","text":"sporophyte"},{"id":"D","text":"antheridium"}]'::jsonb,
    correct_answer=to_jsonb('C'::text),
    explanation='The conspicuous leafy fern plant is the diploid sporophyte, which is the dominant generation.',
    answer_source='manual-content-validation', answer_verified_at=now(), updated_at=now()
where id='97891c24-4c4b-47ea-b7a2-cb54e157eb1e' and source like 'storage:%' and correct_answer is null;

update public.past_questions
set correct_answer=to_jsonb('B'::text),
    explanation='Lamarck incorrectly proposed that characteristics acquired during an organism''s lifetime could be inherited by offspring.',
    answer_source='manual-content-validation', answer_verified_at=now(), updated_at=now()
where id='b3db36db-4845-4ec0-beee-7a61b652c5a2' and source like 'storage:%' and correct_answer is null;

update public.past_questions
set correct_answer=to_jsonb('B'::text),
    explanation='The modified insect-trapping leaves of a Venus flytrap are a structural adaptation.',
    answer_source='manual-content-validation', answer_verified_at=now(), updated_at=now()
where id='f67ca25c-a311-4154-a67d-99ddcb8df255' and source like 'storage:%' and correct_answer is null;

update public.past_questions
set question_text='When a virus is placed in a non-living medium it',
    options='[{"id":"A","text":"becomes dehydrated"},{"id":"B","text":"forms spores"},{"id":"C","text":"forms flagella"},{"id":"D","text":"becomes crystallized"}]'::jsonb,
    correct_answer=to_jsonb('D'::text),
    explanation='Outside a living host cell, viruses can behave like non-living material and can be crystallized.',
    answer_source='manual-content-validation', answer_verified_at=now(), updated_at=now()
where id='02e80785-38b0-48f4-b0aa-84f730da6723' and source like 'storage:%' and correct_answer is null;

update public.past_questions
set correct_answer=to_jsonb('C'::text),
    explanation='The pulmonary arteries carry deoxygenated blood from the right ventricle to the lungs.',
    answer_source='manual-content-validation', answer_verified_at=now(), updated_at=now()
where id='0e56a485-df4c-4cce-8d19-0f089bddd9d0' and source like 'storage:%' and correct_answer is null;

-- CHEMISTRY: validate four clean archived JAMB MCQs.
update public.past_questions
set correct_answer=to_jsonb('B'::text),
    explanation='Alkaline hydrolysis (saponification) of fats and oils produces soap salts and glycerol.',
    answer_source='manual-content-validation', answer_verified_at=now(), updated_at=now()
where id='9ccb536c-7acd-4c90-a461-53676e6a6ef4' and source like 'storage:%' and correct_answer is null;

update public.past_questions
set correct_answer=to_jsonb('C'::text),
    explanation='Finely divided iron serves as the catalyst in the Haber process.',
    answer_source='manual-content-validation', answer_verified_at=now(), updated_at=now()
where id='e3590f4f-db36-4247-9753-eee3b1f6cec7' and source like 'storage:%' and correct_answer is null;

update public.past_questions
set correct_answer=to_jsonb('E'::text),
    explanation='During electrolysis of molten sodium chloride, chloride ions lose electrons at the anode and are oxidized.',
    answer_source='manual-content-validation', answer_verified_at=now(), updated_at=now()
where id='e5b4f329-87f0-4873-b19d-dda9888b5df9' and source like 'storage:%' and correct_answer is null;

update public.past_questions
set correct_answer=to_jsonb('D'::text),
    explanation='Metal welding commonly uses the high-temperature oxy-acetylene flame.',
    answer_source='manual-content-validation', answer_verified_at=now(), updated_at=now()
where id='dbc1f840-2b77-4600-92ba-e6a54637f8d3' and source like 'storage:%' and correct_answer is null;

-- GOVERNMENT: add one clean archived question to reach the minimum.
update public.past_questions
set correct_answer=to_jsonb('E'::text),
    explanation='An unwritten constitution is not codified in a single document; its rules are distributed across statutes, conventions and precedents.',
    answer_source='manual-content-validation', answer_verified_at=now(), updated_at=now()
where id='59b61d69-a74b-4722-a3ca-c8bad6531132' and source like 'storage:%' and correct_answer is null;

-- PHYSICS: reconstruct four archived questions from exact source/public-archive matches.
update public.past_questions
set question_text='The displacement d produced in a glass block of thickness t and refractive index n when an object is viewed through it is',
    options='[{"id":"A","text":"t - n"},{"id":"B","text":"t(1 + 1/n)"},{"id":"C","text":"t(1 - 1/n)"},{"id":"D","text":"t(1/n - 1)"}]'::jsonb,
    question_type='mcq',
    correct_answer=to_jsonb('C'::text),
    explanation='The apparent thickness is t/n, so the apparent displacement is t - t/n = t(1 - 1/n).',
    answer_source='public-archive-cross-validation', answer_verified_at=now(), updated_at=now()
where id='0d7af83b-0898-49e9-9f04-3678674fb47d'
  and source='storage:787b6ff8-b879-4c0d-b2dd-8b51c119446f' and correct_answer is null;

update public.past_questions
set question_text='The resistances of a platinum wire at the ice and steam points are 0.75 ohm and 1.05 ohm respectively. Determine the temperature at which the resistance is 0.90 ohm.',
    options='[{"id":"A","text":"43.0°C"},{"id":"B","text":"50.0°C"},{"id":"C","text":"69.9°C"},{"id":"D","text":"87.0°C"}]'::jsonb,
    question_type='mcq',
    correct_answer=to_jsonb('B'::text),
    explanation='For a resistance thermometer, θ=100(Rθ-R0)/(R100-R0)=100(0.90-0.75)/(1.05-0.75)=50°C.',
    answer_source='public-archive-cross-validation', answer_verified_at=now(), updated_at=now()
where id='a058bf88-98af-42a3-8f6a-18d45ef10c9e'
  and source='storage:787b6ff8-b879-4c0d-b2dd-8b51c119446f' and correct_answer is null;

update public.past_questions
set question_text='Calculate the amount of heat required to convert 2 kg of ice at -2°C to water at 0°C. (Specific heat capacity of ice = 2090 J kg^-1 °C^-1; specific latent heat of fusion = 333 kJ kg^-1.)',
    options='[{"id":"A","text":"666 J"},{"id":"B","text":"8,360 J"},{"id":"C","text":"666,000 J"},{"id":"D","text":"674,360 J"}]'::jsonb,
    question_type='mcq',
    correct_answer=to_jsonb('D'::text),
    explanation='Heat to warm the ice is 2×2090×2=8,360 J; latent heat is 2×333,000=666,000 J; total=674,360 J.',
    answer_source='public-archive-cross-validation', answer_verified_at=now(), updated_at=now()
where id='f357c994-8731-4bd1-8bd3-07c26c7c8e63'
  and source='storage:787b6ff8-b879-4c0d-b2dd-8b51c119446f' and correct_answer is null;

update public.past_questions
set question_text='In a purely inductive circuit, the current',
    options='[{"id":"A","text":"lags behind the voltage in phase by 90°"},{"id":"B","text":"leads the voltage in phase by 90°"},{"id":"C","text":"is in the same phase with the voltage"},{"id":"D","text":"leads the voltage by 180°"}]'::jsonb,
    question_type='mcq',
    is_active=true,
    correct_answer=to_jsonb('A'::text),
    explanation='For a pure inductor, current lags the applied voltage by 90 degrees.',
    answer_source='public-archive-cross-validation', answer_verified_at=now(), updated_at=now()
where id='7e7a534c-c6bd-4679-8233-0288374f1d24'
  and source='storage:787b6ff8-b879-4c0d-b2dd-8b51c119446f' and correct_answer is null;

-- Two clean archived Physics MCQs were imported inactive because surrounding OCR text was contaminated.
update public.past_questions
set question_text='A semiconductor diode is used in rectifying alternating current into direct current mainly because it',
    options='[{"id":"A","text":"allows current to flow in either direction"},{"id":"B","text":"is non-linear"},{"id":"C","text":"offers a high input resistance"},{"id":"D","text":"allows current to flow only in one direction"}]'::jsonb,
    question_type='mcq',
    is_active=true,
    correct_answer=to_jsonb('D'::text),
    explanation='A diode rectifies because it conducts predominantly in one direction and blocks the reverse direction.',
    answer_source='manual-content-validation', answer_verified_at=now(), updated_at=now()
where id='0cfc1cbe-85e8-4991-94d0-80437e8bcca5'
  and source='storage:787b6ff8-b879-4c0d-b2dd-8b51c119446f' and correct_answer is null;

update public.past_questions
set question_text='In a reverse-biased junction diode, current flows by',
    options='[{"id":"A","text":"electrons alone"},{"id":"B","text":"majority carriers"},{"id":"C","text":"minority carriers"},{"id":"D","text":"positive holes alone"}]'::jsonb,
    question_type='mcq',
    is_active=true,
    correct_answer=to_jsonb('C'::text),
    explanation='The small reverse current in a reverse-biased p-n junction is due to thermally generated minority carriers.',
    answer_source='manual-content-validation', answer_verified_at=now(), updated_at=now()
where id='4c55bfe6-2f08-45bb-8e74-02d6671d9d7a'
  and source='storage:787b6ff8-b879-4c0d-b2dd-8b51c119446f' and correct_answer is null;

