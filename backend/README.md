# Backend

This folder is reserved for backend services once you split business logic out of Next.js server actions.

Recommended starter structure:

- `src/api/` route handlers or controllers
- `src/services/` business logic
- `src/db/` Supabase/Admin data access
- `src/middleware/` auth and request guards
- `src/types/` backend-only types

For now, your backend logic still lives in `frontend/app/actions` and `frontend/lib/supabase`.
