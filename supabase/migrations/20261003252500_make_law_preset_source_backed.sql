-- Keep the generic Law practice preset fully runnable with genuine storage-backed JAMB questions.
-- The official JAMB Law brochure shows institution-specific UTME combinations; many accept
-- Literature in English plus Arts/Social Science subjects including Government and Economics.
-- Learners must still verify their exact institution/programme in IBASS before registration.

update public.jamb_course_preset_subjects
set subject_id='7b884a45-4327-4631-8b62-0679b6e3f25d'
where preset_id='660b3aa8-f6a5-4b4f-b69a-41d51c988a72'
  and order_index=4
  and subject_id='9d6b5ace-21d8-47b5-8907-ab197bb38616';

update public.jamb_course_presets
set notes='Generic Law practice preset: Use of English, Literature in English, Government and Economics. JAMB Law subject requirements vary by institution, so verify the exact combination in IBASS before registration.',
    source_url='https://ibass.jamb.gov.ng/assets/uploads/brochure-degree-law.pdf',
    updated_at=now()
where id='660b3aa8-f6a5-4b4f-b69a-41d51c988a72';
