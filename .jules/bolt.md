## 2024-05-22 - Parallelizing Independent Supabase Queries
**Learning:** Sequential `await` calls for independent database queries create a "waterfall" effect, significantly increasing latency. This is especially impactful in server actions used for initial data fetching (like `getEventRefData`).
**Action:** Always identify independent queries and use `Promise.all` to fetch them in parallel. This reduces total latency to the duration of the slowest query rather than the sum of all queries. Refer to `CLAUDE.md` rule #1.
