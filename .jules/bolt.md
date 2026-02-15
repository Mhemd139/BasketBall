# Bolt's Journal ⚡

## 2025-02-18 - Sequential Queries in Server Actions
**Learning:** Independent Supabase queries in Server Actions often block each other when `await` is used sequentially, leading to unnecessary latency.
**Action:** Always use `Promise.all` for independent data fetching operations to parallelize I/O and reduce total request time.
