-- OCR answer-key consensus can drift question-number alignment across PDF layouts.
-- Quarantine all answers created by that method. Embedded source-key and manual validations are unaffected.
update public.past_questions
set correct_answer=null,
    answer_source=null,
    answer_verified_at=null,
    updated_at=now()
where lower(board)='jamb'
  and answer_source='source-pdf-answer-key-ocr-consensus';
