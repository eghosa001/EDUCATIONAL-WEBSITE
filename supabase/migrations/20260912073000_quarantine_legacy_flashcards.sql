-- Legacy flashcard batch used compact f/b keys, had no creator, and contains
-- generic/misaligned generated fragments. Preserve for review but never serve.
update public.flashcards
set is_public = false,
    updated_at = now()
where is_public
  and jsonb_typeof(cards) = 'array'
  and jsonb_array_length(cards) > 0
  and (cards->0 ? 'f')
  and (cards->0 ? 'b')
  and not (cards->0 ? 'front')
  and not (cards->0 ? 'back')
  and created_by is null;
