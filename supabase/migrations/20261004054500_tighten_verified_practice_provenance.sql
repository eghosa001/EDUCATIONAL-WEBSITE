-- Tighten verified-practice provenance to exact supporting pages and replace weaker Biology meta-prompts.

update public.verified_practice_questions q
set source_title='FAO Feed and water for ruminants', source_url='https://www.fao.org/4/t0690e/t0690e05.htm', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Agricultural Science' limit 1)
  and q.question_text='A key purpose of clean water in livestock management is to support:';

update public.verified_practice_questions q
set source_title='FAO Species diversification — Crop rotation', source_url='https://www.fao.org/conservation-agriculture/in-practice/species-diversification/en/', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Agricultural Science' limit 1)
  and q.question_text='Crop rotation can help plants explore different soil layers because different crops have:';

update public.verified_practice_questions q
set source_title='FAO Crop rotation and nitrogen fixation', source_url='https://www.fao.org/unfao/bodies/coag/coaG15/X0075E.htm', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Agricultural Science' limit 1)
  and q.question_text='Leguminous crops can contribute to soil fertility mainly through:';

update public.verified_practice_questions q
set source_title='FAO Ruminant livestock systems', source_url='https://www.fao.org/livestock-systems/production-systems/ruminant/en/', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Agricultural Science' limit 1)
  and q.question_text='Which animal is NOT a ruminant?';

update public.verified_practice_questions q
set source_title='FAO Feed and water for ruminants', source_url='https://www.fao.org/4/t0690e/t0690e05.htm', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Agricultural Science' limit 1)
  and q.question_text='Which combination lists nutrients animals require in their feed?';

update public.verified_practice_questions q
set source_title='FAO Ruminant livestock systems', source_url='https://www.fao.org/livestock-systems/production-systems/ruminant/en/', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Agricultural Science' limit 1)
  and q.question_text='Which group contains only common ruminant livestock?';

update public.verified_practice_questions q
set source_title='FAO Feed and water for ruminants', source_url='https://www.fao.org/4/t0690e/t0690e05.htm', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Agricultural Science' limit 1)
  and q.question_text='Which nutrient group is a major source of energy in animal feed?';

update public.verified_practice_questions q
set source_title='FAO Feed and water for ruminants', source_url='https://www.fao.org/4/t0690e/t0690e05.htm', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Agricultural Science' limit 1)
  and q.question_text='Which nutrient is especially important as a building material for muscles in animals?';

update public.verified_practice_questions q
set source_title='FAO Species diversification — Crop rotation', source_url='https://www.fao.org/conservation-agriculture/in-practice/species-diversification/en/', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Agricultural Science' limit 1)
  and q.question_text='Which of the following is a major benefit of crop rotation?';

update public.verified_practice_questions q
set source_title='FAO Species diversification — Crop rotation', source_url='https://www.fao.org/conservation-agriculture/in-practice/species-diversification/en/', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Agricultural Science' limit 1)
  and q.question_text='Which practice can improve the diversity of soil flora and fauna?';

update public.verified_practice_questions q
set source_title='FAO Species diversification — Crop rotation', source_url='https://www.fao.org/conservation-agriculture/in-practice/species-diversification/en/', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Agricultural Science' limit 1)
  and q.question_text='Which practice helps reduce the carry-over of crop-specific pests and diseases?';

update public.verified_practice_questions q
set source_title='FAO Agronomic factors — Nutrients (NPK)', source_url='https://www.fao.org/4/x5648e/x5648e0e.htm', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Agricultural Science' limit 1)
  and q.question_text='Which three nutrients are commonly referred to as NPK fertilizer nutrients?';

update public.verified_practice_questions q
set source_title='Central Bank of Nigeria — FAQs', source_url='https://www.cbn.gov.ng/faqs/', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Economics' limit 1)
  and q.question_text='A policy aimed at controlling money supply to support low and stable inflation is an example of:';

update public.verified_practice_questions q
set source_title='Central Bank of Nigeria — Monetary Policy Decisions', source_url='https://www.cbn.gov.ng/MonetaryPolicy/decisions.html', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Economics' limit 1)
  and q.question_text='At the CBN Monetary Policy Committee meeting of 21-22 September 2026, what Monetary Policy Rate was announced?';

update public.verified_practice_questions q
set source_title='Central Bank of Nigeria — Monetary Policy Decisions', source_url='https://www.cbn.gov.ng/MonetaryPolicy/decisions.html', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Economics' limit 1)
  and q.question_text='At the September 2026 CBN MPC meeting, the Cash Reserve Requirement for Deposit Money Banks was retained at:';

update public.verified_practice_questions q
set source_title='Central Bank of Nigeria — Monetary Policy Reforms', source_url='https://www.cbn.gov.ng/MonetaryPolicy/MP_Reforms.html', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Economics' limit 1)
  and q.question_text='Inflation targeting is best described as a framework in which a central bank:';

update public.verified_practice_questions q
set source_title='Central Bank of Nigeria — Educational resources', source_url='https://www.cbn.gov.ng/educational.html', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Economics' limit 1)
  and q.question_text='The Monetary Policy Committee is associated primarily with decisions about:';

update public.verified_practice_questions q
set source_title='Central Bank of Nigeria — FAQs', source_url='https://www.cbn.gov.ng/faqs/', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Economics' limit 1)
  and q.question_text='Which concept is most directly associated with preserving the purchasing power of money?';

update public.verified_practice_questions q
set source_title='Central Bank of Nigeria — Educational resources', source_url='https://www.cbn.gov.ng/educational.html', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Economics' limit 1)
  and q.question_text='Which institution is responsible for monetary policy in Nigeria?';

update public.verified_practice_questions q
set source_title='Central Bank of Nigeria — FAQs', source_url='https://www.cbn.gov.ng/faqs/', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Economics' limit 1)
  and q.question_text='Which macroeconomic problem directly reduces the purchasing power of money when prices rise persistently?';

update public.verified_practice_questions q
set source_title='Central Bank of Nigeria — FAQs', source_url='https://www.cbn.gov.ng/faqs/', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Economics' limit 1)
  and q.question_text='Which objective is a core goal of monetary policy according to the Central Bank of Nigeria?';

update public.verified_practice_questions q
set source_title='Central Bank of Nigeria — Educational resources', source_url='https://www.cbn.gov.ng/educational.html', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Economics' limit 1)
  and q.question_text='Which of the following is a monetary-policy instrument in Nigeria?';

update public.verified_practice_questions q
set source_title='Central Bank of Nigeria — FAQs', source_url='https://www.cbn.gov.ng/faqs/', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Economics' limit 1)
  and q.question_text='Which outcome is generally consistent with successful price stability?';

update public.verified_practice_questions q
set source_title='Central Bank of Nigeria — FAQs', source_url='https://www.cbn.gov.ng/faqs/', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Economics' limit 1)
  and q.question_text='Why does a central bank pursue price stability?';

update public.verified_practice_questions q
set source_title='British Council LearnEnglish — Verbs and prepositions', source_url='https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/verbs-prepositions', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='English Language' limit 1)
  and q.question_text='Choose the correct preposition: I agree ___ your suggestion.';

update public.verified_practice_questions q
set source_title='British Council LearnEnglish — Verbs and prepositions', source_url='https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/verbs-prepositions', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='English Language' limit 1)
  and q.question_text='Choose the correct preposition: She listens ___ the radio.';

update public.verified_practice_questions q
set source_title='British Council LearnEnglish — Verbs and prepositions', source_url='https://learnenglish.britishcouncil.org/free-resources/grammar/b1-b2/verbs-prepositions', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='English Language' limit 1)
  and q.question_text='Choose the correct preposition: They are waiting ___ the bus.';

update public.verified_practice_questions q
set source_title='Purdue OWL — Pronoun Case', source_url='https://owl.purdue.edu/owl/general_writing/grammar/pronouns/pronoun_case.html', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='English Language' limit 1)
  and q.question_text='Choose the correct pronoun: The teacher spoke to Ada and ___.';

update public.verified_practice_questions q
set source_title='Purdue OWL — Grammar', source_url='https://owl.purdue.edu/owl/general_writing/grammar/index.html', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='English Language' limit 1)
  and q.question_text='Choose the correct sentence about one item.';

update public.verified_practice_questions q
set source_title='Purdue OWL — Grammar', source_url='https://owl.purdue.edu/owl/general_writing/grammar/index.html', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='English Language' limit 1)
  and q.question_text='Choose the correct sentence for a plural subject.';

update public.verified_practice_questions q
set source_title='Cambridge Grammar — Present perfect simple', source_url='https://dictionary.cambridge.org/grammar/british-grammar/present-perfect-simple-i-', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='English Language' limit 1)
  and q.question_text='Choose the correct sentence.';

update public.verified_practice_questions q
set source_title='Purdue OWL — Grammar', source_url='https://owl.purdue.edu/owl/general_writing/grammar/index.html', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='English Language' limit 1)
  and q.question_text='Choose the correct subject-verb agreement.';

update public.verified_practice_questions q
set source_title='Cambridge Grammar — Present perfect simple', source_url='https://dictionary.cambridge.org/grammar/british-grammar/present-perfect-simple-i-', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='English Language' limit 1)
  and q.question_text='Which form is a present perfect question?';

update public.verified_practice_questions q
set source_title='Cambridge Grammar — Present perfect simple', source_url='https://dictionary.cambridge.org/grammar/british-grammar/present-perfect-simple-i-', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='English Language' limit 1)
  and q.question_text='Which phrase correctly uses for to express duration?';

update public.verified_practice_questions q
set source_title='Cambridge Grammar — Present perfect simple', source_url='https://dictionary.cambridge.org/grammar/british-grammar/present-perfect-simple-i-', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='English Language' limit 1)
  and q.question_text='Which phrase correctly uses since?';

update public.verified_practice_questions q
set source_title='Purdue OWL — Pronoun Case', source_url='https://owl.purdue.edu/owl/general_writing/grammar/pronouns/pronoun_case.html', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='English Language' limit 1)
  and q.question_text='Which pronoun is in the possessive case?';

update public.verified_practice_questions q
set source_title='Cambridge Grammar — Present perfect simple', source_url='https://dictionary.cambridge.org/grammar/british-grammar/present-perfect-simple-i-', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='English Language' limit 1)
  and q.question_text='Which sentence correctly uses the present perfect?';

update public.verified_practice_questions q
set source_title='Cambridge Grammar — Present perfect simple', source_url='https://dictionary.cambridge.org/grammar/british-grammar/present-perfect-simple-i-', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='English Language' limit 1)
  and q.question_text='Which sentence uses yet naturally with the present perfect?';

update public.verified_practice_questions q
set source_title='Cambridge Grammar — Past simple or present perfect', source_url='https://dictionary.cambridge.org/grammar/british-grammar/past-simple-or-present-perfect', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='English Language' limit 1)
  and q.question_text='Which tense is most suitable for a completed action at a definite past time such as yesterday?';

update public.verified_practice_questions q
set source_title='National Assembly of Nigeria', source_url='https://nass.gov.ng/about/item/1548', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Government' limit 1)
  and q.question_text='Each Nigerian state is represented in the Senate by how many senatorial districts?';

update public.verified_practice_questions q
set source_title='National Assembly of Nigeria', source_url='https://nass.gov.ng/about/item/1548', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Government' limit 1)
  and q.question_text='How many members make up Nigeria''s House of Representatives?';

update public.verified_practice_questions q
set source_title='National Assembly of Nigeria', source_url='https://nass.gov.ng/about/item/1548', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Government' limit 1)
  and q.question_text='How many senators make up Nigeria''s Senate?';

update public.verified_practice_questions q
set source_title='National Assembly of Nigeria', source_url='https://nass.gov.ng/about/item/1548', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Government' limit 1)
  and q.question_text='Nigeria''s National Assembly is:';

update public.verified_practice_questions q
set source_title='National Assembly of Nigeria', source_url='https://nass.gov.ng/about/item/1548', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Government' limit 1)
  and q.question_text='The Federal Capital Territory contributes how many senatorial district to the Senate?';

update public.verified_practice_questions q
set source_title='Constitution of the Federal Republic of Nigeria 1999 (updated)', source_url='https://placng.org/i/wp-content/uploads/2023/11/Constitution-of-the-Federal-Republic-of-Nigeria-1999-Updated.pdf', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Government' limit 1)
  and q.question_text='Under Nigeria''s 1999 Constitution, executive powers are primarily addressed in which section?';

update public.verified_practice_questions q
set source_title='Constitution of the Federal Republic of Nigeria 1999 (updated)', source_url='https://placng.org/i/wp-content/uploads/2023/11/Constitution-of-the-Federal-Republic-of-Nigeria-1999-Updated.pdf', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Government' limit 1)
  and q.question_text='Under Nigeria''s 1999 Constitution, judicial powers are primarily addressed in which section?';

update public.verified_practice_questions q
set source_title='Constitution of the Federal Republic of Nigeria 1999 (updated)', source_url='https://placng.org/i/wp-content/uploads/2023/11/Constitution-of-the-Federal-Republic-of-Nigeria-1999-Updated.pdf', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Government' limit 1)
  and q.question_text='Under Nigeria''s 1999 Constitution, legislative powers are primarily addressed in which section?';

update public.verified_practice_questions q
set source_title='National Assembly of Nigeria', source_url='https://nass.gov.ng/about/item/1548', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Government' limit 1)
  and q.question_text='Which chamber is commonly called Nigeria''s Green Chamber?';

update public.verified_practice_questions q
set source_title='National Assembly of Nigeria', source_url='https://nass.gov.ng/about/item/1548', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Government' limit 1)
  and q.question_text='Which chamber is commonly called Nigeria''s Red Chamber?';

update public.verified_practice_questions q
set source_title='National Assembly of Nigeria', source_url='https://nass.gov.ng/about/item/1548', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Government' limit 1)
  and q.question_text='Which is a core function of the National Assembly?';

update public.verified_practice_questions q
set source_title='National Assembly of Nigeria', source_url='https://nass.gov.ng/about/item/1548', verified_at=now(), updated_at=now()
where q.subject_id=(select id from public.subjects where name='Government' limit 1)
  and q.question_text='Which National Assembly function involves scrutinising public institutions and officials?';

delete from public.verified_practice_questions
where subject_id=(select id from public.subjects where name='Biology' limit 1)
  and question_text like 'Which statement correctly explains the concept tested by this prompt:%';

insert into public.verified_practice_questions(
 board,subject_id,topic_label,question_text,options,correct_answer,explanation,difficulty,
 source_title,source_url,verification_method,verified_at,is_active,updated_at
) values
('jamb','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Genetics & Heredity','Approximately how many nucleotide bases are contained in one copy of the human genome?','[{"id":"A","text":"About 3 billion"},{"id":"B","text":"About 3 million"},{"id":"C","text":"About 30 thousand"},{"id":"D","text":"About 300"}]'::jsonb,'A','One copy of the human genome contains roughly 3 billion nucleotides distributed across 23 chromosomes.','medium','NHGRI Human Genomic Variation','https://www.genome.gov/about-genomics/educational-resources/fact-sheets/human-genomic-variation','authoritative-web',now(),true,now()),
('jamb','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Plant Biology','ATP and NADPH produced by the light reactions are used in the chloroplast stroma mainly to convert carbon dioxide into:','[{"id":"A","text":"Carbohydrates"},{"id":"B","text":"Mineral salts"},{"id":"C","text":"Nitrogen gas"},{"id":"D","text":"DNA bases"}]'::jsonb,'A','Calvin-cycle reactions in the stroma use ATP and NADPH to drive conversion of carbon dioxide to carbohydrates.','medium','NCBI Bookshelf — Photosynthesis','https://www.ncbi.nlm.nih.gov/books/NBK9861/','authoritative-web',now(),true,now()),
('jamb','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Plant Biology','During noncyclic photosynthetic electron flow, photosystem I primarily helps form which product?','[{"id":"A","text":"NADPH"},{"id":"B","text":"DNA"},{"id":"C","text":"Cellulose directly"},{"id":"D","text":"Lactic acid"}]'::jsonb,'A','Photosystem I transfers high-energy electrons to reduce NADP+ to NADPH.','medium','NCBI Bookshelf — Photosynthesis','https://www.ncbi.nlm.nih.gov/books/NBK9861/','authoritative-web',now(),true,now()),
('jamb','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Genetics & Heredity','How many chromosomes are normally present in a typical human diploid somatic cell?','[{"id":"A","text":"46"},{"id":"B","text":"23"},{"id":"C","text":"92"},{"id":"D","text":"44"}]'::jsonb,'A','Most human body cells are diploid and contain 23 chromosome pairs, giving 46 chromosomes in total.','easy','NHGRI Chromosomes Fact Sheet','https://www.genome.gov/about-genomics/fact-sheets/Chromosomes-Fact-Sheet','authoritative-web',now(),true,now()),
('jamb','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Plant Biology','In chloroplasts, where are the photosynthetic electron-transport chains located?','[{"id":"A","text":"Thylakoid membrane"},{"id":"B","text":"Cell wall"},{"id":"C","text":"Nuclear envelope"},{"id":"D","text":"Cytosol"}]'::jsonb,'A','The photosynthetic electron-transport chains are located in the thylakoid membrane.','medium','NCBI Bookshelf — Photosynthesis','https://www.ncbi.nlm.nih.gov/books/NBK9861/','authoritative-web',now(),true,now()),
('jamb','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Plant Biology','In the normal noncyclic pathway of photosynthesis, which photosystem receives electrons first from water-derived electron flow?','[{"id":"A","text":"Photosystem II"},{"id":"B","text":"Photosystem I"},{"id":"C","text":"Neither photosystem"},{"id":"D","text":"Both receive them simultaneously from carbon dioxide"}]'::jsonb,'A','Noncyclic electron flow begins at photosystem II, which obtains electrons from water before they pass toward photosystem I.','hard','NCBI Bookshelf — Photosynthesis','https://www.ncbi.nlm.nih.gov/books/NBK9861/','authoritative-web',now(),true,now()),
('jamb','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Plant Biology','Photosystem II replaces its lost electrons mainly by splitting which molecule?','[{"id":"A","text":"Water"},{"id":"B","text":"Carbon dioxide"},{"id":"C","text":"Glucose"},{"id":"D","text":"Nitrogen"}]'::jsonb,'A','Photosystem II uses light energy to split water, releasing electrons, protons and molecular oxygen.','medium','NCBI Bookshelf — Photosynthesis','https://www.ncbi.nlm.nih.gov/books/NBK9861/','authoritative-web',now(),true,now()),
('jamb','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Plant Biology','What directly drives ATP synthase during the light reactions in chloroplasts?','[{"id":"A","text":"A proton gradient across the thylakoid membrane"},{"id":"B","text":"A sodium gradient across the cell wall"},{"id":"C","text":"DNA replication in the nucleus"},{"id":"D","text":"Diffusion of glucose into the chloroplast"}]'::jsonb,'A','A proton gradient across the thylakoid membrane provides the energy used by ATP synthase to produce ATP.','hard','NCBI Bookshelf — Photosynthesis','https://www.ncbi.nlm.nih.gov/books/NBK9861/','authoritative-web',now(),true,now()),
('jamb','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Genetics & Heredity','What type of bond holds complementary DNA bases together between the two strands?','[{"id":"A","text":"Hydrogen bonds"},{"id":"B","text":"Peptide bonds"},{"id":"C","text":"Glycosidic bonds between proteins"},{"id":"D","text":"Metallic bonds"}]'::jsonb,'A','Complementary bases on the two DNA strands are held together by hydrogen bonds.','medium','NHGRI Base Pair glossary','https://www.genome.gov/genetics-glossary/Base-Pair','authoritative-web',now(),true,now()),
('jamb','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Genetics & Heredity','Which set lists the four nucleotide bases found in DNA?','[{"id":"A","text":"Adenine, thymine, cytosine and guanine"},{"id":"B","text":"Adenine, uracil, cytosine and guanine"},{"id":"C","text":"Thymine, uracil, glucose and guanine"},{"id":"D","text":"Adenine, thymine, ribose and phosphate"}]'::jsonb,'A','DNA uses four bases: adenine, thymine, cytosine and guanine.','easy','NHGRI Human Genomic Variation','https://www.genome.gov/about-genomics/educational-resources/fact-sheets/human-genomic-variation','authoritative-web',now(),true,now()),
('neco','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Genetics & Heredity','Approximately how many nucleotide bases are contained in one copy of the human genome?','[{"id":"A","text":"About 3 billion"},{"id":"B","text":"About 3 million"},{"id":"C","text":"About 30 thousand"},{"id":"D","text":"About 300"}]'::jsonb,'A','One copy of the human genome contains roughly 3 billion nucleotides distributed across 23 chromosomes.','medium','NHGRI Human Genomic Variation','https://www.genome.gov/about-genomics/educational-resources/fact-sheets/human-genomic-variation','authoritative-web',now(),true,now()),
('neco','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Plant Biology','ATP and NADPH produced by the light reactions are used in the chloroplast stroma mainly to convert carbon dioxide into:','[{"id":"A","text":"Carbohydrates"},{"id":"B","text":"Mineral salts"},{"id":"C","text":"Nitrogen gas"},{"id":"D","text":"DNA bases"}]'::jsonb,'A','Calvin-cycle reactions in the stroma use ATP and NADPH to drive conversion of carbon dioxide to carbohydrates.','medium','NCBI Bookshelf — Photosynthesis','https://www.ncbi.nlm.nih.gov/books/NBK9861/','authoritative-web',now(),true,now()),
('neco','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Plant Biology','During noncyclic photosynthetic electron flow, photosystem I primarily helps form which product?','[{"id":"A","text":"NADPH"},{"id":"B","text":"DNA"},{"id":"C","text":"Cellulose directly"},{"id":"D","text":"Lactic acid"}]'::jsonb,'A','Photosystem I transfers high-energy electrons to reduce NADP+ to NADPH.','medium','NCBI Bookshelf — Photosynthesis','https://www.ncbi.nlm.nih.gov/books/NBK9861/','authoritative-web',now(),true,now()),
('neco','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Genetics & Heredity','How many chromosomes are normally present in a typical human diploid somatic cell?','[{"id":"A","text":"46"},{"id":"B","text":"23"},{"id":"C","text":"92"},{"id":"D","text":"44"}]'::jsonb,'A','Most human body cells are diploid and contain 23 chromosome pairs, giving 46 chromosomes in total.','easy','NHGRI Chromosomes Fact Sheet','https://www.genome.gov/about-genomics/fact-sheets/Chromosomes-Fact-Sheet','authoritative-web',now(),true,now()),
('neco','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Plant Biology','In chloroplasts, where are the photosynthetic electron-transport chains located?','[{"id":"A","text":"Thylakoid membrane"},{"id":"B","text":"Cell wall"},{"id":"C","text":"Nuclear envelope"},{"id":"D","text":"Cytosol"}]'::jsonb,'A','The photosynthetic electron-transport chains are located in the thylakoid membrane.','medium','NCBI Bookshelf — Photosynthesis','https://www.ncbi.nlm.nih.gov/books/NBK9861/','authoritative-web',now(),true,now()),
('neco','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Plant Biology','In the normal noncyclic pathway of photosynthesis, which photosystem receives electrons first from water-derived electron flow?','[{"id":"A","text":"Photosystem II"},{"id":"B","text":"Photosystem I"},{"id":"C","text":"Neither photosystem"},{"id":"D","text":"Both receive them simultaneously from carbon dioxide"}]'::jsonb,'A','Noncyclic electron flow begins at photosystem II, which obtains electrons from water before they pass toward photosystem I.','hard','NCBI Bookshelf — Photosynthesis','https://www.ncbi.nlm.nih.gov/books/NBK9861/','authoritative-web',now(),true,now()),
('neco','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Plant Biology','Photosystem II replaces its lost electrons mainly by splitting which molecule?','[{"id":"A","text":"Water"},{"id":"B","text":"Carbon dioxide"},{"id":"C","text":"Glucose"},{"id":"D","text":"Nitrogen"}]'::jsonb,'A','Photosystem II uses light energy to split water, releasing electrons, protons and molecular oxygen.','medium','NCBI Bookshelf — Photosynthesis','https://www.ncbi.nlm.nih.gov/books/NBK9861/','authoritative-web',now(),true,now()),
('neco','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Plant Biology','What directly drives ATP synthase during the light reactions in chloroplasts?','[{"id":"A","text":"A proton gradient across the thylakoid membrane"},{"id":"B","text":"A sodium gradient across the cell wall"},{"id":"C","text":"DNA replication in the nucleus"},{"id":"D","text":"Diffusion of glucose into the chloroplast"}]'::jsonb,'A','A proton gradient across the thylakoid membrane provides the energy used by ATP synthase to produce ATP.','hard','NCBI Bookshelf — Photosynthesis','https://www.ncbi.nlm.nih.gov/books/NBK9861/','authoritative-web',now(),true,now()),
('neco','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Genetics & Heredity','What type of bond holds complementary DNA bases together between the two strands?','[{"id":"A","text":"Hydrogen bonds"},{"id":"B","text":"Peptide bonds"},{"id":"C","text":"Glycosidic bonds between proteins"},{"id":"D","text":"Metallic bonds"}]'::jsonb,'A','Complementary bases on the two DNA strands are held together by hydrogen bonds.','medium','NHGRI Base Pair glossary','https://www.genome.gov/genetics-glossary/Base-Pair','authoritative-web',now(),true,now()),
('neco','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Genetics & Heredity','Which set lists the four nucleotide bases found in DNA?','[{"id":"A","text":"Adenine, thymine, cytosine and guanine"},{"id":"B","text":"Adenine, uracil, cytosine and guanine"},{"id":"C","text":"Thymine, uracil, glucose and guanine"},{"id":"D","text":"Adenine, thymine, ribose and phosphate"}]'::jsonb,'A','DNA uses four bases: adenine, thymine, cytosine and guanine.','easy','NHGRI Human Genomic Variation','https://www.genome.gov/about-genomics/educational-resources/fact-sheets/human-genomic-variation','authoritative-web',now(),true,now()),
('waec','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Genetics & Heredity','Approximately how many nucleotide bases are contained in one copy of the human genome?','[{"id":"A","text":"About 3 billion"},{"id":"B","text":"About 3 million"},{"id":"C","text":"About 30 thousand"},{"id":"D","text":"About 300"}]'::jsonb,'A','One copy of the human genome contains roughly 3 billion nucleotides distributed across 23 chromosomes.','medium','NHGRI Human Genomic Variation','https://www.genome.gov/about-genomics/educational-resources/fact-sheets/human-genomic-variation','authoritative-web',now(),true,now()),
('waec','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Plant Biology','ATP and NADPH produced by the light reactions are used in the chloroplast stroma mainly to convert carbon dioxide into:','[{"id":"A","text":"Carbohydrates"},{"id":"B","text":"Mineral salts"},{"id":"C","text":"Nitrogen gas"},{"id":"D","text":"DNA bases"}]'::jsonb,'A','Calvin-cycle reactions in the stroma use ATP and NADPH to drive conversion of carbon dioxide to carbohydrates.','medium','NCBI Bookshelf — Photosynthesis','https://www.ncbi.nlm.nih.gov/books/NBK9861/','authoritative-web',now(),true,now()),
('waec','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Plant Biology','During noncyclic photosynthetic electron flow, photosystem I primarily helps form which product?','[{"id":"A","text":"NADPH"},{"id":"B","text":"DNA"},{"id":"C","text":"Cellulose directly"},{"id":"D","text":"Lactic acid"}]'::jsonb,'A','Photosystem I transfers high-energy electrons to reduce NADP+ to NADPH.','medium','NCBI Bookshelf — Photosynthesis','https://www.ncbi.nlm.nih.gov/books/NBK9861/','authoritative-web',now(),true,now()),
('waec','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Genetics & Heredity','How many chromosomes are normally present in a typical human diploid somatic cell?','[{"id":"A","text":"46"},{"id":"B","text":"23"},{"id":"C","text":"92"},{"id":"D","text":"44"}]'::jsonb,'A','Most human body cells are diploid and contain 23 chromosome pairs, giving 46 chromosomes in total.','easy','NHGRI Chromosomes Fact Sheet','https://www.genome.gov/about-genomics/fact-sheets/Chromosomes-Fact-Sheet','authoritative-web',now(),true,now()),
('waec','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Plant Biology','In chloroplasts, where are the photosynthetic electron-transport chains located?','[{"id":"A","text":"Thylakoid membrane"},{"id":"B","text":"Cell wall"},{"id":"C","text":"Nuclear envelope"},{"id":"D","text":"Cytosol"}]'::jsonb,'A','The photosynthetic electron-transport chains are located in the thylakoid membrane.','medium','NCBI Bookshelf — Photosynthesis','https://www.ncbi.nlm.nih.gov/books/NBK9861/','authoritative-web',now(),true,now()),
('waec','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Plant Biology','In the normal noncyclic pathway of photosynthesis, which photosystem receives electrons first from water-derived electron flow?','[{"id":"A","text":"Photosystem II"},{"id":"B","text":"Photosystem I"},{"id":"C","text":"Neither photosystem"},{"id":"D","text":"Both receive them simultaneously from carbon dioxide"}]'::jsonb,'A','Noncyclic electron flow begins at photosystem II, which obtains electrons from water before they pass toward photosystem I.','hard','NCBI Bookshelf — Photosynthesis','https://www.ncbi.nlm.nih.gov/books/NBK9861/','authoritative-web',now(),true,now()),
('waec','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Plant Biology','Photosystem II replaces its lost electrons mainly by splitting which molecule?','[{"id":"A","text":"Water"},{"id":"B","text":"Carbon dioxide"},{"id":"C","text":"Glucose"},{"id":"D","text":"Nitrogen"}]'::jsonb,'A','Photosystem II uses light energy to split water, releasing electrons, protons and molecular oxygen.','medium','NCBI Bookshelf — Photosynthesis','https://www.ncbi.nlm.nih.gov/books/NBK9861/','authoritative-web',now(),true,now()),
('waec','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Plant Biology','What directly drives ATP synthase during the light reactions in chloroplasts?','[{"id":"A","text":"A proton gradient across the thylakoid membrane"},{"id":"B","text":"A sodium gradient across the cell wall"},{"id":"C","text":"DNA replication in the nucleus"},{"id":"D","text":"Diffusion of glucose into the chloroplast"}]'::jsonb,'A','A proton gradient across the thylakoid membrane provides the energy used by ATP synthase to produce ATP.','hard','NCBI Bookshelf — Photosynthesis','https://www.ncbi.nlm.nih.gov/books/NBK9861/','authoritative-web',now(),true,now()),
('waec','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Genetics & Heredity','What type of bond holds complementary DNA bases together between the two strands?','[{"id":"A","text":"Hydrogen bonds"},{"id":"B","text":"Peptide bonds"},{"id":"C","text":"Glycosidic bonds between proteins"},{"id":"D","text":"Metallic bonds"}]'::jsonb,'A','Complementary bases on the two DNA strands are held together by hydrogen bonds.','medium','NHGRI Base Pair glossary','https://www.genome.gov/genetics-glossary/Base-Pair','authoritative-web',now(),true,now()),
('waec','5f347f7d-3a09-46b9-9275-6a5c9ca12470'::uuid,'Genetics & Heredity','Which set lists the four nucleotide bases found in DNA?','[{"id":"A","text":"Adenine, thymine, cytosine and guanine"},{"id":"B","text":"Adenine, uracil, cytosine and guanine"},{"id":"C","text":"Thymine, uracil, glucose and guanine"},{"id":"D","text":"Adenine, thymine, ribose and phosphate"}]'::jsonb,'A','DNA uses four bases: adenine, thymine, cytosine and guanine.','easy','NHGRI Human Genomic Variation','https://www.genome.gov/about-genomics/educational-resources/fact-sheets/human-genomic-variation','authoritative-web',now(),true,now())
on conflict (board,subject_id,md5(question_text)) do update set
 topic_label=excluded.topic_label,options=excluded.options,correct_answer=excluded.correct_answer,
 explanation=excluded.explanation,difficulty=excluded.difficulty,source_title=excluded.source_title,
 source_url=excluded.source_url,verification_method=excluded.verification_method,
 verified_at=now(),is_active=true,updated_at=now();
