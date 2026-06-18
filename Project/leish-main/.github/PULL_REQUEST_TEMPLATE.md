# Release: finalize-schema

Summary
-------
This PR finalizes the schema cleanup and converts `profiles.role` to the new `profile_role` enum.

What I changed
- Removed legacy migration artifacts and added `20260304200000_legacy_cleanup.sql` and `20260304210000_seed_and_fix_roles.sql` which convert the schema to UUID PKs and update the role enum.

Validation steps
- All migrations applied to remote DB (confirmed via `npx supabase migration list`).
- `npm run build` and `npm test` pass locally.
- RLS policies remain enabled and FK constraints validated.

Release checklist
- Follow `DEPLOY_CHECKLIST.md` after merging.

Notes for reviewers
- Seed SQL was intentionally limited due to Supabase `auth.users` FK constraints; use the Supabase Admin API to seed users + profiles when needed.
