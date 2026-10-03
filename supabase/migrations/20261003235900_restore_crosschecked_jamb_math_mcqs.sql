-- Restore four JAMB Mathematics MCQs whose exact question/options were cross-verified
-- against independent public JAMB archives. No choices are generated.

update public.past_questions
set question_text='A regular polygon of n sides has 160° as the size of each interior angle. Find n.',
    question_type='mcq',
    options='[{"id":"A","text":"18"},{"id":"B","text":"16"},{"id":"C","text":"14"},{"id":"D","text":"12"}]'::jsonb,
    correct_answer=to_jsonb('A'::text),
    explanation='For a regular polygon, each interior angle is 180 - 360/n degrees. Setting this equal to 160 gives 360/n = 20, so n = 18.',
    answer_source='public-archive-cross-validation',
    answer_verified_at=now(),
    tags=coalesce(tags,'[]'::jsonb) || '["options-recovered-public-crosscheck"]'::jsonb,
    updated_at=now()
where id='0034d23d-91ba-4f31-8d09-6867c7331901'
  and is_active=true and question_type='essay' and correct_answer is null
  and source='storage:256ba2ee-b872-4024-bf35-ef96c6a3a4c7';

update public.past_questions
set question_text='If cos θ = a/b, find 1 + tan²θ.',
    question_type='mcq',
    options='[{"id":"A","text":"b²/a²"},{"id":"B","text":"a²/b²"},{"id":"C","text":"(a² + b²)/(b² - a²)"},{"id":"D","text":"(2a² + b²)/(a² + b²)"}]'::jsonb,
    correct_answer=to_jsonb('A'::text),
    explanation='Using 1 + tan²θ = sec²θ and cos θ = a/b, sec²θ = (b/a)² = b²/a².',
    answer_source='public-archive-cross-validation',
    answer_verified_at=now(),
    tags=coalesce(tags,'[]'::jsonb) || '["options-recovered-public-crosscheck"]'::jsonb,
    updated_at=now()
where id='1ec1e920-65db-4dae-a698-3dc5374d8239'
  and is_active=true and question_type='essay' and correct_answer is null
  and source='storage:256ba2ee-b872-4024-bf35-ef96c6a3a4c7';

update public.past_questions
set question_text='What is the n-th term of the sequence 2, 6, 12, 20, ...?',
    question_type='mcq',
    options='[{"id":"A","text":"4n - 2"},{"id":"B","text":"2(3^(n - 1))"},{"id":"C","text":"n² + n"},{"id":"D","text":"n² + 3n + 2"}]'::jsonb,
    correct_answer=to_jsonb('C'::text),
    explanation='The terms follow n² + n: 1²+1=2, 2²+2=6, 3²+3=12 and 4²+4=20.',
    answer_source='public-archive-cross-validation',
    answer_verified_at=now(),
    tags=coalesce(tags,'[]'::jsonb) || '["options-recovered-public-crosscheck"]'::jsonb,
    updated_at=now()
where id='2a8313f0-3c06-4b5e-bf4e-08de227089db'
  and is_active=true and question_type='essay' and correct_answer is null
  and source='storage:256ba2ee-b872-4024-bf35-ef96c6a3a4c7';

update public.past_questions
set question_text='Write h in terms of a, b, c and d if a = b(1 - ch)/(1 - dh).',
    question_type='mcq',
    options='[{"id":"A","text":"(a - b)/(ad - bc)"},{"id":"B","text":"(a + b)/(ad - bc)"},{"id":"C","text":"(ad - bc)/(a - b)"},{"id":"D","text":"(1 - b)/(d - bc)"},{"id":"E","text":"(b - a)/(ad - bc)"}]'::jsonb,
    correct_answer=to_jsonb('A'::text),
    explanation='a(1-dh)=b(1-ch), so a-b=h(ad-bc). Therefore h=(a-b)/(ad-bc).',
    answer_source='public-archive-cross-validation',
    answer_verified_at=now(),
    tags=coalesce(tags,'[]'::jsonb) || '["options-recovered-public-crosscheck"]'::jsonb,
    updated_at=now()
where id='55eb7554-0320-420d-8d0b-fbef7f27d989'
  and is_active=true and question_type='essay' and correct_answer is null
  and source='storage:256ba2ee-b872-4024-bf35-ef96c6a3a4c7';
