# Continuous production smoke monitoring

The `Production Smoke` GitHub Actions workflow runs every six hours and can also be triggered manually. It verifies the live Vercel website root, robots file, sitemap, and the production backend `/api/v1/health` endpoint. The API health response must report `success: true`, which includes database connectivity in the backend health implementation.

This monitoring complements, rather than replaces, the pull-request release gates described in `PRODUCTION_READINESS.md`.
