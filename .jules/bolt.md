## 2025-02-18 - Parallelizing Independent Supabase Queries
**Learning:** Sequential `await` calls for independent Supabase queries create a waterfall effect, significantly increasing latency.
**Action:** Use `Promise.all` to fetch independent data in parallel. This reduces total latency to the duration of the slowest query rather than the sum of all queries.
