## 2024-03-22 - [Parallelize Supabase Queries]
**Learning:** Sequential await calls for independent Supabase queries create unnecessary waterfalls, increasing latency by the sum of query times.
**Action:** Use `Promise.all` to execute independent queries in parallel, reducing total latency to `max(query_time)`. This is especially impactful for reference data fetching on page loads or modal opens.
