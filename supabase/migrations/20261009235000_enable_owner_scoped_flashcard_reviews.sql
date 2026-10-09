-- Activate existing per-card, user-scoped spaced-review records.
-- Use Supabase auth.uid() and check the user can view the referenced set.
-- Existing SELECT policy flashcard_reviews_read remains in place.
BEGIN;
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS flashcard_reviews_insert_own ON public.flashcard_reviews;
CREATE POLICY flashcard_reviews_insert_own ON public.flashcard_reviews
FOR INSERT TO authenticated WITH CHECK (
 user_id = (select auth.uid())
 AND flashcard_id IS NOT NULL
 AND card_index >= 0
 AND EXISTS (
   SELECT 1 FROM public.flashcards f
   WHERE f.id = flashcard_reviews.flashcard_id
   AND (f.is_public = true OR f.created_by = (select auth.uid()))
 )
);
DROP POLICY IF EXISTS flashcard_reviews_update_own ON public.flashcard_reviews;
CREATE POLICY flashcard_reviews_update_own ON public.flashcard_reviews
FOR UPDATE TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (
 user_id = (select auth.uid())
 AND flashcard_id IS NOT NULL
 AND card_index >= 0
 AND EXISTS (
   SELECT 1 FROM public.flashcards f
   WHERE f.id = flashcard_reviews.flashcard_id
   AND (f.is_public = true OR f.created_by = (select auth.uid()))
 )
);
GRANT SELECT,INSERT,UPDATE ON public.flashcard_reviews TO authenticated;
COMMIT;