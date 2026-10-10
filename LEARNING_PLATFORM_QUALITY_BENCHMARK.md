# THE GUIDE — High-End Learning Platform Benchmark
Last reviewed: 9 October 2026. Standard for future UI, API, curriculum, CBT, and study feature changes.

## Evidence and scoring
Benchmark against:
- [Khan Academy Mastery](https://support.khanacademy.org/hc/en-us/articles/115002552631-What-are-Course-and-Unit-Mastery): skill/unit/course progress, recommended exercises, assessment-to-feedback loop.
- [Quizlet Learn](https://quizlet.com/features/learn): active recall, mixed question formats, difficult-card repetition and progress across devices.
- [Seneca](https://help.senecalearning.com/en/articles/2483292-what-is-seneca-learning): brief instruction, formative checks, immediate feedback and repeated correction.
- Nigeria-focused exam flows: accurately separate JAMB four-subject CBT from WAEC, NECO and NABTEB source boards, and from original class practice. Do not fabricate board papers.

Score every category on **observable evidence**, not feature counts. A 9+/10 requires passing scoped code checks and a real production browser/mobile verification. Where a feature is code-verified but not production-verified, mark its score provisional.

| Category | Strict preliminary score (/10) | Definition of 9+ |
| --- | ---: | --- |
| Curriculum breadth | 8.0 | All supported grades/terms have accurate lessons, source checks, no empty or duplicated canonical topics |
| Content depth / originality | 7.0 | Worked reasoning, real exercises, differentiated misconceptions, source provenance, prescribed book fidelity |
| Assessment integrity | 7.5 | Four valid distinct options, keyed answers, explanations, realistic difficulty, no board mixing |
| Flashcards / recall | 5.5 | Actual per-card spacing, correctly repeated failed cards, persisted progress and accessible controls |
| Retention and learner progress | 6.5 | Clear continue path, weakness-to-lesson recommendation, verified progress and no fake streaks |
| Navigation / UX | 7.0 | No wrong route, no overlapping active menu, clear back and return flows, robust auth |
| Mobile usability / accessibility | 7.0 | Touch targets, focus, keyboard and voice-over, contrast, safe light/dark, tested 320–430px and tablets |
| Performance | 6.0 | Fast p75 navigation, bounded API round trips, sensible caches, saved-data support, no blank screens |
| Visual consistency | 7.5 | Readable hierarchy, consistent controls, restrained motion, stable layout and components |
| Exam board separation | 8.0 | Board/source isolation and honest question labels at setup, exam, feedback and analytics |

Scores above are directional review estimates from repository/database inspection, NOT a measured Lighthouse score or mobile-user study. Do not inflate them after code changes.

## Priority quality gates
1. **One action, one destination**. Route clicks must not land on an unrelated area. Mark only the single most-specific sidebar entry active. Prefer targeted next-route prefetch to all-route eager prefetch; obey data-saving network preference.
2. **Mobile course and table acceptance**. At 320, 360, 390 and 430 CSS pixels (including Safari/iPhone), courses, class cards, lesson tabs, teaching content, practice and reports must fit the viewport without page-level sideways scrolling. Any table wider than its card must remain fully readable via independent horizontal touch-swipe, visible swipe guidance and keyboard focus, without losing columns or clipping cells. Verify with an authenticated real-device browser before claiming 9+.
2. **Complete learning loop**. Lesson → active question → explain wrong answer → repeat weak skill/card → track real mastery. Do not label simple next-card scrolling as spaced repetition.
3. **Saved mastery**. Flashcard review histories are user-specific and should persist across browser sessions; rows must obey RLS. The current first rollout uses the existing public-card review table. Verify real multi-device sync before scoring 9+.
4. **Fair sampling**. Mixed subject flashcards must rotate across sets, not consume only the first stored lesson. Select new and due cards first; future cards can be practised early only on request.
5. **Source trust**. Historical JAMB, WAEC, NECO and NABTEB archives must be separate from synthetic or authored practice. Show provenance to students. Do not claim an invented excerpt is from a prescribed author.
6. **Inclusive motion and control**. Reduce unnecessary flipping/motion for learners sensitive to visual movement and support keyboard focus; avoid effects that impair reading.
7. **Resilient sessions**. Error states give concrete recovery actions; never silently assume offline/sync writes succeeded.
8. **Scope control**. Check ongoing PRs and existing canonical lessons, then run only relevant tests and typecheck. No broad CI if change-scoped validation suffices.

## Evidence and remaining work
2026-10-09 PR: implement account-persisted flashcard reviews using existing `flashcard_reviews`, scoped write policies, spaced scheduler, first-due selection, mixed topic selection, retriable save errors, navigation active-state fix and bounded route prefetch. These changes need deployed mobile browser, logged-in review round-trip and performance measurements before assigning verified post-change scores.

Further benchmark gaps: learner-specific topic mastery, server-side flashcard recommendations from *all* due decks rather than newest 80; class-specific subject filtering; accessible reduced-motion fallback for 3-D flips; end-to-end metrics/availability; authenticated teacher/parent workflow audits; prescribed-text study coverage and difficulty calibration.
