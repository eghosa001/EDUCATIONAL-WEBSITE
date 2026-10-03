-- Additional audited answers on actual JAMB source questions.
-- Physics
update public.past_questions
set correct_answer=to_jsonb('A'::text),
    explanation='For a diverging lens with f = -12 cm and an object 4 cm away, the image distance is -3 cm: virtual and 3 cm in front of the lens.',
    answer_source='manual-content-validation', answer_verified_at=now(), updated_at=now()
where id='03eab97b-a280-491c-86ec-4ee0099d8f89' and correct_answer is null;

update public.past_questions
set correct_answer=to_jsonb('A'::text),
    explanation='Grape juice contains dissolved acids and ions, so it conducts electricity; sugar solution, alcohol and paraffin are non-electrolytes.',
    answer_source='manual-content-validation', answer_verified_at=now(), updated_at=now()
where id='5435b03d-623d-410e-8187-f533a0c56202' and correct_answer is null;

update public.past_questions
set correct_answer=to_jsonb('D'::text),
    explanation='Soft iron provides a low-reluctance path for magnetic flux and is used for magnetic shielding.',
    answer_source='manual-content-validation', answer_verified_at=now(), updated_at=now()
where id='5ea6c033-2383-4a2a-9285-5bd87778d616' and correct_answer is null;

-- Biology
update public.past_questions
set correct_answer=to_jsonb('B'::text),
    explanation='Producing many winged termites during nuptial swarming increases the chance that enough survive predators to reproduce and perpetuate the species.',
    answer_source='manual-content-validation', answer_verified_at=now(), updated_at=now()
where id='6fa4b8c2-28bf-4f8c-b521-53a25953dcc7' and correct_answer is null;

update public.past_questions
set correct_answer=to_jsonb('B'::text),
    explanation='Use and disuse and inheritance of acquired characteristics are associated with Lamarckian evolution.',
    answer_source='manual-content-validation', answer_verified_at=now(), updated_at=now()
where id='98d72b6b-bfe8-45ea-91c5-02e50c114e90' and correct_answer is null;

update public.past_questions
set correct_answer=to_jsonb('A'::text),
    explanation='Agglutination in an incompatible transfusion results from reactions between corresponding red-cell antigens and plasma antibodies.',
    answer_source='manual-content-validation', answer_verified_at=now(), updated_at=now()
where id='c2cb3eb5-23aa-4687-bb2f-6e88d4cff698' and correct_answer is null;

-- Chemistry
update public.past_questions
set correct_answer=to_jsonb('D'::text),
    explanation='At fixed mass and temperature, increasing gas pressure compresses the gas and therefore increases its density.',
    answer_source='manual-content-validation', answer_verified_at=now(), updated_at=now()
where id='6eff0a30-a3a0-4e85-86bf-951cdd0319c4' and correct_answer is null;

update public.past_questions
set correct_answer=to_jsonb('E'::text),
    explanation='Of pH 3, 5 and 9, the pH 9 solution is the least acidic.',
    answer_source='manual-content-validation', answer_verified_at=now(), updated_at=now()
where id='71f0f02b-db81-411f-a28b-75a16d4caac1' and correct_answer is null;

update public.past_questions
set correct_answer=to_jsonb('D'::text),
    explanation='The configuration ends in 3p2, so the element belongs to the p-block.',
    answer_source='manual-content-validation', answer_verified_at=now(), updated_at=now()
where id='8e77dbb9-15d5-4743-a982-10a2dd59dd99' and correct_answer is null;

-- Government
update public.past_questions
set correct_answer=to_jsonb('B'::text),
    explanation='Public opinion helps government understand the preferences and demands of the people.',
    answer_source='manual-content-validation', answer_verified_at=now(), updated_at=now()
where id='97606e1d-8c9a-4b40-ab38-27ce2acb206a' and correct_answer is null;

update public.past_questions
set correct_answer=to_jsonb('A'::text),
    explanation='In a parliamentary system, ministers are collectively responsible to parliament.',
    answer_source='manual-content-validation', answer_verified_at=now(), updated_at=now()
where id='fcf557db-b86a-4eb2-b4a2-a461515ca695' and correct_answer is null;

update public.past_questions
set correct_answer=to_jsonb('A'::text),
    explanation='Under simple plurality/majority voting, the candidate with the greatest number of votes cast wins.',
    answer_source='manual-content-validation', answer_verified_at=now(), updated_at=now()
where id='9ff9d9ed-0f7d-457f-afdf-e9b6035525ee' and correct_answer is null;
