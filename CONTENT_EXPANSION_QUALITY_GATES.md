# THE GUIDE — content expansion and deduplication gate (October 2026)

These rules apply to every new batch of courses, lessons, flashcards and assessment questions.

## Identity and uniqueness
1. Check live courses by **(subject_id, class_id, term_id)** before creating a new course. Extend an existing canonical course instead of making a duplicate.
2. Check lesson identity by course, topic, normalised title and slug. Keep a single published canonical lesson for a given topic unless truly separate subtopics and learning outcomes are explicitly defined and labelled.
3. Never create two active original questions with the same normalised text within one topic. Maintain four distinct answer options, a matching correct option ID and an explanation.
4. Do not equate **Class A and Class B** material reuse with within-class duplicates. It is acceptable for two different class courses to use the same original teaching content; each course must have its own topic and lesson record.
5. Never label author-created practice as WAEC, JAMB, NECO, NABTEB, official past paper or prescribed-text quotation. Genuine past papers require source, board, year, question and answer-key verification. They live in a separate bank.

## Quality gate
- Verify each lesson matches the class, term, subject and actual curricular topic. Use the stored official scheme as the source of truth; external guides are only a cross-check.
- Require original explanation, worked example, meaningful misconceptions, independent exercise, and a model answer or marking rubric; do not pad content to satisfy a character count.
- Add concept-and-application checks with explanations and recall cards. Use varied correct-answer positions, not a fixed option.
- In senior secondary literary-skills batches, require one original analytical passage, at least five well-defined concepts, ten scoreable original practice questions, six cards and at least 3,800 characters of grounded instruction. Prescribed set-text analysis additionally requires checking the current official edition and list.
- Reject generic option sets, malformed answers, repeated problem templates without learning variation, unsafe age or class mismatches, and fabricated quotes or source claims.
- Prefer enriching an existing canonical page to increasing a raw count. No automatic deletion or forced merging of student records.

## Safe duplicate remediation
- Compare course, class, term, topic and source before deciding that wording is redundant.
- Exact duplicate bodies in the same course can be unpublished **only if no learner progress, bookmark, attempt, study session, assignment, quiz or conversation points to the redundant row**. Preserve the row and keep its highest-use canonical counterpart.
- Same-topic/same-title rows should be reviewed with the same reference safeguards. Similar headings in different topic records may require clearer titles or curriculum re-mapping, not automatic deletion.
- Generic original checkpoint questions with repeated topic/class/normalised wording may be disabled only if they are unreferenced by exams, answers or quizzes. Do not touch SOURCE_PAPER historical questions.
- Recalculate course.lesson_count after any publication-state change and re-run targeted database integrity queries.
- Migration SQL must be re-entrant and transactional. Apply only the minimum change-scoped tests; do not run unrelated broad CI unless necessary.

## 2026-10-09 audit notes
The inherited database had 334 excess repeated normalised lesson titles, 78 extra exact same-course lesson bodies, and 101 excess repeated active generic questions. One cleanup archived the 78 exact-body copies and inactivated the 101 generic duplicates; a second pass archived 156 same-course/topic/title repeats with no checked learner-facing references. Remaining repeated titles, including different topic identities and one learner-linked item, require review rather than deletion. New 2026 Literature expansion underwent a scoped zero-duplicate check and has database unique indexes for active original-practice text and published version-3 lesson titles.
