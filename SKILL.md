# Fast Production Fix Skill

## Purpose

Use this workflow for every maintenance, bug-fix, production-readiness, UI/UX, Supabase, Vercel, GitHub, and deployment task in this repository.

The priority order is:

1. **Correctness**
2. **Fastest safe path**
3. **Minimum necessary testing**
4. **Minimum commits/deployments**
5. **No duplicated investigation**

Do not turn a small fix into a broad audit unless the user explicitly asks for one.

## Fast-path protocol

### 1. Locate the exact failing surface first

Before editing anything:

- Identify the exact deployed app/page/function involved.
- Check the latest relevant production error, failing test, browser trace, Supabase log, or Vercel deployment.
- Read only the smallest set of files needed to understand that failure.
- Do not inspect unrelated modules “just in case”.

If the user points to a visible UI problem, verify which deployed surface owns that UI before editing.

### 2. Parallelize independent work

When tools support parallel work, split independent tasks immediately.

Good parallel tracks include:

- UI/source inspection
- Supabase schema/function/storage inspection
- GitHub CI/log inspection
- Vercel deployment inspection
- regression-test inspection

Use subagents when available for independent workstreams. Give each subagent a narrow, non-overlapping task and merge only the useful results.

If subagents are unavailable, batch independent connector/tool calls concurrently rather than doing them one by one.

Never have two agents investigate the same thing unless the first result is inconclusive.

### 3. Prefer the smallest production-safe fix

- Patch the actual failing path, not adjacent code.
- Reuse existing APIs/functions/tables before creating new architecture.
- Prefer one cohesive commit over many tiny commits.
- Avoid refactors during bug fixes unless the refactor is required for correctness.
- Do not create duplicate data paths or duplicate Supabase tables/functions.
- Never weaken authentication, RLS, JWT verification, or secret handling for speed.

### 4. Use the minimum necessary tests

Testing must be proportional to the change.

#### Tiny docs/config/test-only change
Run no product test unless the changed file can affect runtime.

#### Localized UI/service change
Run:
- typecheck for the affected app
- the directly relevant repository/unit test
- one targeted Playwright/browser test for that flow

#### Supabase Edge Function/API change
Run:
- targeted source/repository test
- direct Edge/API smoke for the changed route
- one authenticated browser test only if the route powers a user-facing flow

#### Cross-cutting release change
Run the full production smoke only when:
- shared auth/routing changed
- shared API contracts changed
- database schema/RLS changed
- multiple major learner flows changed
- the user explicitly requested full production-readiness verification

Do not rerun the whole suite after a test-only assertion fix unless that assertion gates release.

### 5. Fail fast

Always run the cheapest/high-signal checks before expensive ones:

1. syntax/typecheck
2. targeted repository/unit test
3. targeted API/Edge smoke
4. targeted browser test
5. full build
6. full production smoke only if justified

If step 1–3 fails, fix it before triggering expensive deployment/browser work.

### 6. Avoid polling waste

- Do not repeatedly poll CI every few seconds.
- Check after meaningful state changes.
- While a long build runs, use the time for independent inspection or verification.
- If a newer commit supersedes an older run, stop treating the older run as authoritative.
- Cancel or ignore obsolete runs when the tooling supports it.

### 7. Production verification rules

For user-facing fixes, verify the deployed behavior that the user actually reported.

Examples:

- CBT issue → navigate the real CBT flow and prove the exact step works.
- Flashcards issue → generate real flashcards and measure completion.
- Supabase question-bank issue → prove a live CBT request returns storage-backed questions.
- AI Tutor issue → test provider failure handling as well as normal response.

A green build alone is not proof of a fixed user flow.

### 8. Supabase question/content rules

- Treat Supabase Storage as source material, not as learner-facing PDFs.
- Extract/normalize question content into the database and serve it through secure APIs.
- Never expose correct answers before submission in CBT.
- Only include scoreable questions in timed/graded CBT.
- Preserve source metadata so extracted content remains traceable.

### 9. AI feature resilience

AI-backed features must not become unusable when an external model provider fails.

Preferred order:

1. deterministic curriculum/database result
2. AI enhancement
3. bounded fallback model
4. curriculum-grounded fallback response

Use short provider timeouts for interactive features. Do not let a model timeout block the UI for minutes.

### 10. Commit/deployment discipline

- Batch related fixes into one commit.
- Avoid cosmetic follow-up commits during an active production fix.
- Do not commit merely to trigger Vercel unless a real source change exists.
- When deployment quotas are limited, inspect/test locally or through Supabase first.
- Keep commit messages specific and short.

### 11. Communication

During long work:

- Report only meaningful findings or state changes.
- Do not narrate every tool call.
- If a real blocker is found, state it immediately.
- Do not claim production-ready until the necessary release gate has actually passed.

## Default decision rule

When choosing between two valid approaches, choose the one that:

- changes fewer files,
- triggers fewer deployments,
- runs fewer but higher-value tests,
- reuses existing infrastructure,
- and still gives strong evidence the reported problem is fixed.
