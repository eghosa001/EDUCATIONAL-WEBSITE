# Website production readiness

This document defines the release gates for THE GUIDE website and its supporting web services.

## Required automated gates

A website release is eligible for production only when the `Comprehensive Tests` workflow passes all of the following:

- Web TypeScript typecheck
- Web repository/unit tests
- Next.js production build
- Browser/API end-to-end tests against the built application
- Public smoke tests against every deployed Supabase Edge Function
- Backend lint and automated tests
- Admin portal typecheck, tests, and production build

The Flutter mobile application has an independent `Mobile Analysis` workflow. Mobile failures do not change the release status of the website, and website success does not imply that the mobile application is production-ready.

## Production deployment gate

The `Deploy Website` workflow validates the web project, then verifies that Vercel has a READY production deployment for the relevant `main` commit and smoke-tests:

- `/`
- `/robots.txt`
- `/sitemap.xml`

Vercel requires the GitHub Actions secret `deploy` to contain an access token authorized for the configured Vercel team and project.

## Optional authenticated integration coverage

Public Supabase Edge Function smoke tests run with the repository's public project URL and publishable key. To extend CI into authenticated production-like flows, configure these GitHub Actions secrets:

- `TEST_ACCESS_TOKEN`
- `TEST_EMAIL`
- `TEST_PASSWORD`

`SUPABASE_URL` and `SUPABASE_ANON_KEY` may also be configured as secrets; when absent, the smoke suite uses the public project URL and publishable key already required by the web client.

## GitHub Pages

The static `pages/` landing site uses GitHub Pages only as a secondary landing surface. The workflow does not attempt to modify repository Pages settings because the workflow token does not have repository-administration permission. Pages must be enabled once in repository settings if this secondary surface is desired.

## Release interpretation

A green website CI and successful Vercel production verification establish repository-level release readiness. External services still need to remain provisioned and correctly configured (Vercel, Supabase, DNS/custom domain, payment/email providers where enabled). Provider outages or missing provider-side credentials cannot be proven solely from source code.
