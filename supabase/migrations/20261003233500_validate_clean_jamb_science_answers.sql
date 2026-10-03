-- Manually validate only clean, unambiguous answers on actual JAMB source questions.
update public.past_questions
set correct_answer=to_jsonb('B'::text),
    explanation='Agama lizards bask in sunlight to raise their body temperature so they can become active.',
    answer_source='manual-content-validation',
    answer_verified_at=now(),
    updated_at=now()
where id='06e6e082-9ca1-41af-96e7-b96da73744b1'
  and correct_answer is null
  and source='storage:88a597c6-60e5-4a14-9e28-5bf2ee5c3e0c';

update public.past_questions
set correct_answer=to_jsonb('D'::text),
    explanation='Lost voltage across the internal resistance is Ir = 4 A × 0.5 ohm = 2.0 V.',
    answer_source='manual-content-validation',
    answer_verified_at=now(),
    updated_at=now()
where id='514b259a-f686-4a92-b839-4f06e779a9f8'
  and correct_answer is null
  and source='storage:787b6ff8-b879-4c0d-b2dd-8b51c119446f';

update public.past_questions
set correct_answer=to_jsonb('B'::text),
    explanation='Stainless steel is principally an alloy of iron with carbon and chromium.',
    answer_source='manual-content-validation',
    answer_verified_at=now(),
    updated_at=now()
where id='2a978bb2-02c9-4382-8eea-a590228f8ac3'
  and correct_answer is null
  and source='storage:ccd14c9d-222a-4ba8-8b4b-e3d847f8d19c';

update public.past_questions
set correct_answer=to_jsonb('D'::text),
    explanation='Atomic mass is determined mainly by the total number of protons and neutrons in the nucleus.',
    answer_source='manual-content-validation',
    answer_verified_at=now(),
    updated_at=now()
where id='32f205e5-d02e-4312-9be9-8c9849ffbce8'
  and correct_answer is null
  and source='storage:ccd14c9d-222a-4ba8-8b4b-e3d847f8d19c';

update public.past_questions
set correct_answer=to_jsonb('D'::text),
    explanation='An electronegative element has a strong tendency to attract or gain electrons in bonding.',
    answer_source='manual-content-validation',
    answer_verified_at=now(),
    updated_at=now()
where id='4a4d9d74-be0f-4f80-9da3-8f7dbb4f9c64'
  and correct_answer is null
  and source='storage:ccd14c9d-222a-4ba8-8b4b-e3d847f8d19c';

update public.past_questions
set correct_answer=to_jsonb('C'::text),
    explanation='For an arithmetic progression, a+5d = 1/2(a+11d), which simplifies to a=d.',
    answer_source='manual-content-validation',
    answer_verified_at=now(),
    updated_at=now()
where id='5a690d87-8963-4cd5-a628-6bda7f49a028'
  and correct_answer is null
  and source='storage:256ba2ee-b872-4024-bf35-ef96c6a3a4c7';
