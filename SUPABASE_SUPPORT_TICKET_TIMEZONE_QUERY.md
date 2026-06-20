# Supabase Support Ticket: Zero Cache Hit on `pg_timezone_names` Query

## Summary
The query `SELECT name FROM pg_timezone_names` runs with **0% cache hit rate** and consumes ~6% of total database time (186,585ms total across 351 calls, mean 531ms).

## Details
- **Query**: `SELECT name FROM pg_timezone_names`
- **Role**: `authenticator` (Supabase Auth internal)
- **Calls**: 351
- **Mean time**: 531ms
- **Max time**: 1.69s
- **Total time**: 186,585ms
- **Cache hit rate**: 0% (full seq scan every execution)
- **Rows read**: 419,094

## Context
- This query appears to be triggered by Supabase Auth's internal timezone handling
- Not called by application code (no timezone references in our codebase)
- Runs on every Auth operation that needs timezone info
- `pg_timezone_names` is a system view with ~1,300 rows — should be trivially cacheable

## Expected Behavior
- Results should be cached after first execution
- Subsequent calls should hit shared buffers (100% cache hit)
- Mean time should be <1ms, not 531ms

## Impact
- Adds ~500ms latency to Auth operations
- Contributes 6% of total database load
- Unnecessary I/O on system catalog

## Request
Please investigate why this query isn't being cached by the planner/buffer cache. Consider:
1. Adding a materialized view or cached lookup for timezone names
2. Optimizing the planner to recognize this as a stable, cacheable result
3. Pre-warming the cache on Auth worker startup

## Environment
- **Project**: `rmsjrhamjmupvrxqyagm` (Southeast Asia/Singapore)
- **Plan**: Pro
- **Supabase Version**: Latest (as of June 2026)

## Additional Notes
- Application code does not query timezones directly
- All timezone handling is via Supabase Auth (email templates, session timestamps)
- This appears to be an internal Auth optimization opportunity

---

*Generated from pg_stat_statements analysis showing this as the 2nd highest time consumer (6% of total) after realtime.list_changes (81%).*