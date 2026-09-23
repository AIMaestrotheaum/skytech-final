# SKYTECH Functionality Pass

This build preserves the existing Stitch visual screens and adds a reusable
navigation bridge for the static Stitch HTML running inside same-origin iframes.

Included:
- Public/customer/admin route navigation from Stitch links and buttons.
- Mobile menu bridge for Stitch screens.
- Existing React/FastAPI/PostgreSQL form and CRUD integrations are preserved.
- Existing authentication and protected routes are preserved.
- Backend Python syntax was checked with `python -m compileall -q backend/app`.

Before local frontend testing:
1. `cd frontend`
2. `npm install`
3. `npm run build`
4. `npm run dev`

Do not commit `.env` files or production secrets.
