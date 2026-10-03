-- Preserve audited manual validations on real JAMB Government source questions.
update public.past_questions
set correct_answer=to_jsonb('A'::text),
    explanation='In a federation, both the national and regional governments derive constitutionally protected powers from the constitution.',
    answer_source='manual-content-validation', answer_verified_at=coalesce(answer_verified_at,now()), updated_at=now()
where id='82d52486-98da-4a6f-bf25-2f37dd3e64f6' and correct_answer is null;

update public.past_questions
set correct_answer=to_jsonb('D'::text),
    explanation='The three principal organs of government are the legislature, executive and judiciary.',
    answer_source='manual-content-validation', answer_verified_at=coalesce(answer_verified_at,now()), updated_at=now()
where id='012d3bbe-d879-42fc-9b67-57be357d9005' and correct_answer is null;

update public.past_questions
set correct_answer=to_jsonb('B'::text),
    explanation='Under the UN Charter, the Security Council can impose binding sanctions on member states.',
    answer_source='manual-content-validation', answer_verified_at=coalesce(answer_verified_at,now()), updated_at=now()
where id='3c86e78a-0e58-418d-94fc-54f085add786' and correct_answer is null;

update public.past_questions
set correct_answer=to_jsonb('D'::text),
    explanation='A core principle of the rule of law is that no person is above the law.',
    answer_source='manual-content-validation', answer_verified_at=coalesce(answer_verified_at,now()), updated_at=now()
where id='012ca482-2eaf-4435-a2c5-bfacda9d8ee5' and correct_answer is null;

update public.past_questions
set correct_answer=to_jsonb('A'::text),
    explanation='Universal adult suffrage means adult citizens meeting the legal voting-age requirement can vote without property, sex or similar restrictions.',
    answer_source='manual-content-validation', answer_verified_at=coalesce(answer_verified_at,now()), updated_at=now()
where id='0439a889-6c4d-48e8-bbc0-251d380c724e' and correct_answer is null;

update public.past_questions
set correct_answer=to_jsonb('B'::text),
    explanation='A unitary system concentrates sovereign political authority at the central level.',
    answer_source='manual-content-validation', answer_verified_at=coalesce(answer_verified_at,now()), updated_at=now()
where id='13879ed9-4bd7-4816-ade8-3a24de08b8bf' and correct_answer is null;
