-- Dedicated dynamic JAMB CBT now owns the JAMB exam experience.
-- Retire the old fixed JAMB catalogue entries so Literature/English remapping
-- cannot surface a misleading duplicate examination.
update public.exams
set is_active=false,
    is_public=false,
    updated_at=now()
where title in ('JAMB English CBT','JAMB Economics CBT');
