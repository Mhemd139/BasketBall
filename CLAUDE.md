# Basketball Manager — Claude Code Instructions

> These rules apply to ALL code generated in this project. Follow them strictly.

## Stack

- Next.js 16 (App Router, Turbopack dev)
- React 19, TypeScript 5.9
- Supabase (DB + Auth via custom OTP)
- Tailwind CSS 4
- Lucide React icons

## Database

- Project ID: `amzfssqkjefzzbilqmfe`
- "Teams" in UI = `classes` table. Each class has one trainer, many trainees.
- Events link to trainers. Trainees for an event: event -> trainer -> class -> trainees.
- Use `SECURITY DEFINER` Postgres functions (RPC) to bypass RLS. Do NOT use service role key with supabase-js.

## Auth

- Custom cookie-based sessions (`admin_session` httpOnly cookie).
- `getSession()` returns `{ id, name, role }`.

---

# Performance Rules (MANDATORY)

## 1. Parallel Queries — Never Await Sequentially

When a page or server component makes 2+ database calls, **always check for dependencies**:
- If queries are independent (don't need each other's result), wrap them in `Promise.all()`.
- If query B depends on query A's result, await A first, then run B (and any other independent queries) in parallel.

```ts
// WRONG — sequential for no reason
const { data: team } = await supabase.from('classes').select('*').eq('id', id).single()
const { data: trainees } = await supabase.from('trainees').select('*').eq('class_id', id)

// RIGHT — parallel since both use `id` directly
const [{ data: team }, { data: trainees }] = await Promise.all([
  supabase.from('classes').select('*').eq('id', id).single(),
  supabase.from('trainees').select('*').eq('class_id', id),
])
```

## 2. No force-dynamic — Use Surgical Cache Invalidation

**Never** use `export const dynamic = 'force-dynamic'`. It disables all caching and re-renders the page from scratch on every request.

Instead, rely on Next.js default caching and call `revalidatePath()` or `revalidateTag()` inside server actions when data changes.

```ts
// WRONG
export const dynamic = 'force-dynamic'

// RIGHT — in your server action after a mutation:
revalidatePath('/trainers')
```

## 3. Bounded Queries — Always Limit Results

Every Supabase `.select()` that could return many rows **must** have:
- A `.limit(N)` clause, OR
- A date/filter constraint that bounds the result set, OR
- Pagination (offset + limit)

**Never** fetch an entire table. Unbounded queries get slower every day.

```ts
// WRONG — loads every event ever created
const { data } = await supabase.from('events').select('*').order('event_date', { ascending: false })

// RIGHT — bounded by time + limit
const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
const { data } = await supabase.from('events').select('*')
  .gte('event_date', threeMonthsAgo)
  .order('event_date', { ascending: false })
  .limit(50)
```

## 4. Debounce User-Triggered Queries

Any search, filter, or autocomplete triggered by `onChange` or keystroke **must** be debounced (300ms minimum). Update the UI state (input value) immediately; debounce only the API call.

```ts
const debounceRef = useRef<NodeJS.Timeout | null>(null)

const handleSearch = (term: string) => {
  setQuery(term) // immediate UI update
  if (debounceRef.current) clearTimeout(debounceRef.current)
  debounceRef.current = setTimeout(async () => {
    // API call here
  }, 300)
}
```

## 5. No Debug Logs in Committed Code

Never leave `console.log` in server components or API routes. Use them for debugging only and remove before finishing.

## 6. Select Only What You Need

When querying Supabase, select specific columns instead of `*` when the component only uses a few fields. For count-only queries, use `{ count: 'exact', head: true }`.

```ts
// WRONG — fetches all columns just to show a count
const { data } = await supabase.from('trainees').select('*')
const count = data?.length

// RIGHT
const { count } = await supabase.from('trainees').select('*', { count: 'exact', head: true })
```

## 7. Minimize Client Components

Default to Server Components. Only add `'use client'` when the component genuinely needs:
- `useState`, `useEffect`, `useRef`, or other hooks
- Event handlers (`onClick`, `onChange`, etc.)
- Browser-only APIs

If only a small part of a page needs interactivity, extract just that part into a client component and keep the parent as a server component.

## 8. Avoid Prop Drilling Large Data

Don't pass entire database result arrays from server to client components. Instead:
- Do data processing/filtering on the server
- Pass only the minimum props the client component needs
- Use server actions for mutations, not client-side fetches

## 9. Image Optimization

Always use `next/image` instead of `<img>`. Provide `width` and `height` or use `fill` with a sized container. Add `loading="lazy"` for below-the-fold images (it's the default). Use `priority` only for above-the-fold hero images.

## 10. Efficient Re-renders

In client components:
- Memoize expensive computations with `useMemo`
- Memoize callback functions passed as props with `useCallback`
- Don't create objects/arrays inline in JSX — they create new references every render
- Split state: don't put unrelated state in one object if only part of it changes

---

# Layout Constants

These are fixed. Use them, don't guess.

| Element    | Size   | CSS class needed on page content     |
|------------|--------|--------------------------------------|
| Header     | 64px fixed | `pt-20` (80px top padding)       |
| Sidebar    | 240px  | `md:ml-[240px]`                     |
| Bottom nav | 72px   | `pb-24` mobile, `md:pb-8` desktop   |

**Never** use `pt-48`, `pt-32`, or other arbitrary top padding. Always `pt-20`.
**Never** use `.container` class (was 480px max-width). Use `max-w-4xl mx-auto`.

---

# Code Style

- TypeScript strict mode. No `any` unless interfacing with untyped Supabase responses (use `as unknown as Type` pattern).
- Next.js 16: Layout `params` must be `Promise<{ locale: string }>`, not `Promise<{ locale: Locale }>`. Cast after awaiting.
- Tailwind CSS 4 — use utility classes, no CSS modules.
- Import icons individually from `lucide-react`: `import { Home } from 'lucide-react'`
- Use `clsx` + `tailwind-merge` for conditional classes via the `cn()` utility.

---

# Supabase Patterns

- Always handle errors: check `error` before using `data`.
- For single-record fetches, use `.single()` and handle the not-found case with `notFound()`.
- For mutations, always call `revalidatePath()` after successful writes.
- Use RPC (`supabase.rpc('function_name', params)`) for operations that need RLS bypass.

---

# Turbopack (Windows)

If you see "Persisting failed: Another write batch", the fix is `rm -rf .next` to clear the corrupted cache.