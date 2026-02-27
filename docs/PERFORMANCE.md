# Performance Guidelines — Basketball Manager

These rules are mandatory for all code in this codebase. They are not suggestions. Every rule below has a concrete reason and a code pattern to follow.

---

## Rule 1: Parallel Queries

When a page or server component makes two or more database calls, check whether they depend on each other. If they do not, run them in parallel with `Promise.all()`.

Sequential awaits for independent queries waste time proportional to each query's round-trip latency. On a page with three independent queries that each take 50ms, sequential awaits take 150ms. `Promise.all()` brings that to ~50ms.

```ts
// WRONG — sequential for no reason
const { data: team } = await supabase.from('classes').select('*').eq('id', id).single()
const { data: trainees } = await supabase.from('trainees').select('*').eq('class_id', id)

// RIGHT — parallel, since both queries only need `id` which is already known
const [{ data: team }, { data: trainees }] = await Promise.all([
  supabase.from('classes').select('*').eq('id', id).single(),
  supabase.from('trainees').select('*').eq('class_id', id),
])
```

If query B genuinely depends on the result of query A, await A first, then run B and any other independent queries in parallel.

```ts
// Correct sequential + parallel pattern
const { data: event } = await supabase.from('events').select('trainer_id').eq('id', eventId).single()

const [{ data: trainer }, { data: hall }] = await Promise.all([
  supabase.from('trainers').select('*').eq('id', event.trainer_id).single(),
  supabase.from('halls').select('*').eq('id', event.hall_id).single(),
])
```

---

## Rule 2: No `force-dynamic`

Never export `export const dynamic = 'force-dynamic'` from a page or layout. This disables all caching and forces a full server render on every request, even when nothing has changed.

Instead, use Next.js default caching and call `revalidatePath()` or `revalidateTag()` inside server actions after mutations. This gives you fresh data exactly when needed, and cached data the rest of the time.

```ts
// WRONG — disables caching for the entire page
export const dynamic = 'force-dynamic'

export default async function TeamsPage() { ... }
```

```ts
// RIGHT — page uses default caching; action invalidates only what changed
'use server'
import { revalidatePath } from 'next/cache'

export async function createTeam(formData: FormData) {
  await supabase.from('classes').insert({ ... })
  revalidatePath('/teams')
}
```

---

## Rule 3: Bounded Queries

Every `.select()` that could return many rows must have one of the following:

- A `.limit(N)` clause
- A date or filter constraint that bounds the result set
- Pagination (offset + limit)

Never fetch an entire table. Unbounded queries grow slower as data accumulates.

```ts
// WRONG — loads every event ever created, grows unbounded over time
const { data } = await supabase.from('events').select('*').order('event_date', { ascending: false })

// RIGHT — bounded by a date window and a hard limit
const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

const { data } = await supabase
  .from('events')
  .select('*')
  .gte('event_date', threeMonthsAgo)
  .order('event_date', { ascending: false })
  .limit(50)
```

---

## Rule 4: Debounced Inputs

Any search field, filter, or autocomplete that fires on `onChange` or on every keystroke must be debounced by at least 300ms. Update UI state immediately so the input feels responsive; debounce only the API call.

Without debouncing, a user typing a 10-character search term fires 10 API calls in rapid succession.

```ts
// WRONG — fires an API call on every single keystroke
const handleSearch = async (term: string) => {
  setQuery(term)
  const results = await fetchResults(term)
  setResults(results)
}
```

```ts
// RIGHT — UI updates immediately, API call is debounced
const debounceRef = useRef<NodeJS.Timeout | null>(null)

const handleSearch = (term: string) => {
  setQuery(term) // immediate — input stays responsive

  if (debounceRef.current) clearTimeout(debounceRef.current)

  debounceRef.current = setTimeout(async () => {
    const results = await fetchResults(term)
    setResults(results)
  }, 300)
}
```

---

## Rule 5: No Debug Logs in Committed Code

Never leave `console.log`, `console.warn`, or `console.error` in server components, server actions, or API routes in committed code. Use them during debugging and remove them before finishing.

Debug logs in server components appear in the terminal on every request and can leak sensitive data.

```ts
// WRONG
export async function getTeam(id: string) {
  const { data } = await supabase.from('classes').select('*').eq('id', id).single()
  console.log('team data:', data) // remove before committing
  return data
}

// RIGHT
export async function getTeam(id: string) {
  const { data } = await supabase.from('classes').select('*').eq('id', id).single()
  return data
}
```

---

## Rule 6: Select Only Needed Columns

Do not use `select('*')` when a component only needs a few fields. Fetching unused columns wastes bandwidth and serialization time. For count-only queries, use `{ count: 'exact', head: true }` to avoid fetching any rows at all.

```ts
// WRONG — fetches all columns just to render a name
const { data: trainers } = await supabase.from('trainers').select('*')

// RIGHT — fetch only what is rendered
const { data: trainers } = await supabase.from('trainers').select('id, name, phone')
```

```ts
// WRONG — fetches all rows just to count them
const { data } = await supabase.from('trainees').select('*')
const count = data?.length

// RIGHT — no rows transferred
const { count } = await supabase
  .from('trainees')
  .select('*', { count: 'exact', head: true })
  .eq('class_id', classId)
```

---

## Rule 7: Server Components by Default

Default to Server Components. Only add `'use client'` when the component genuinely requires one of:

- `useState`, `useEffect`, `useRef`, or other React hooks
- Event handlers (`onClick`, `onChange`, etc.)
- Browser-only APIs (`window`, `localStorage`, etc.)

If only a small part of a page is interactive, extract just that part into a client component and keep the rest of the page as a Server Component. This reduces the JavaScript bundle sent to the browser.

```tsx
// WRONG — entire page is a client component just for one button
'use client'
export default function TeamsPage({ teams }) {
  const [selected, setSelected] = useState(null)
  // ... large page with mostly static content
}

// RIGHT — server component handles data fetching and static rendering
// Client component handles only the interactive part
export default async function TeamsPage() {
  const teams = await fetchTeams()
  return (
    <div>
      <h1>Teams</h1>
      <TeamList teams={teams} />      {/* server component */}
      <AddTeamButton />               {/* 'use client' — small interactive piece */}
    </div>
  )
}
```

---

## Rule 8: No Prop Drilling Large Data

Do not pass entire database result arrays from server to client components. Process and filter data on the server, then pass only the minimum props the client component needs.

Passing large arrays as props serializes them to JSON and embeds them in the HTML payload, increasing page size.

```tsx
// WRONG — passes 200-row array to a client component that only shows 5 items
const { data: allPayments } = await supabase.from('payments').select('*')
return <PaymentSummary payments={allPayments} traineeId={id} />

// RIGHT — filter on the server, pass only what is needed
const { data: recentPayments } = await supabase
  .from('payments')
  .select('id, amount, date, status')
  .eq('trainee_id', id)
  .order('date', { ascending: false })
  .limit(5)

return <PaymentSummary payments={recentPayments} />
```

---

## Rule 9: Image Optimization

Always use `next/image` instead of a plain `<img>` tag. Next.js automatically serves images in modern formats (WebP, AVIF), resizes them, and lazy-loads them.

```tsx
// WRONG
<img src="/team-photo.jpg" alt="Team" />

// RIGHT — fixed dimensions
import Image from 'next/image'
<Image src="/team-photo.jpg" alt="Team" width={400} height={300} />

// RIGHT — fill a sized container
<div className="relative w-full h-48">
  <Image src="/team-photo.jpg" alt="Team" fill className="object-cover" />
</div>
```

Use `priority` only for above-the-fold hero images. For everything else, the default (`loading="lazy"`) is correct and defers offscreen image loading.

---

## Rule 10: Efficient Re-renders

Avoid unnecessary re-renders in client components by following these patterns:

**Memoize expensive computations** with `useMemo` so they only recompute when their inputs change.

```tsx
// WRONG — recalculates on every render
const sortedTrainees = trainees.sort((a, b) => a.name.localeCompare(b.name))

// RIGHT
const sortedTrainees = useMemo(
  () => [...trainees].sort((a, b) => a.name.localeCompare(b.name)),
  [trainees]
)
```

**Memoize callbacks passed as props** with `useCallback` to prevent child components from re-rendering unnecessarily.

```tsx
// WRONG — new function reference on every render, causes child to re-render
<TraineeRow onDelete={() => handleDelete(trainee.id)} />

// RIGHT
const handleDeleteTrainee = useCallback((id: string) => {
  handleDelete(id)
}, [handleDelete])

<TraineeRow onDelete={handleDeleteTrainee} />
```

**Do not create objects or arrays inline in JSX**. Inline literals create a new reference on every render, defeating memoization.

```tsx
// WRONG — new array reference every render
<TeamFilter categories={['U12', 'U14', 'U16']} />

// RIGHT — stable reference
const CATEGORIES = ['U12', 'U14', 'U16']
<TeamFilter categories={CATEGORIES} />
```

**Split unrelated state** into separate `useState` calls so that updating one piece of state does not re-render components that depend on the other.

```tsx
// WRONG — updating isLoading re-renders everything that reads the whole object
const [state, setState] = useState({ query: '', isLoading: false, results: [] })

// RIGHT — independent state updates only trigger the components that need them
const [query, setQuery] = useState('')
const [isLoading, setIsLoading] = useState(false)
const [results, setResults] = useState([])
```

---

## Summary Table

| Rule | What to do | What to avoid |
|------|-----------|---------------|
| Parallel Queries | `Promise.all()` for independent queries | Sequential `await` chains |
| Caching | `revalidatePath()` after mutations | `export const dynamic = 'force-dynamic'` |
| Bounded Queries | `.limit(N)` or date filters | Unbounded `.select()` on large tables |
| Debounced Inputs | 300ms debounce on `onChange` API calls | Firing API call on every keystroke |
| Debug Logs | Remove before committing | `console.log` in server components |
| Column Selection | Select only needed columns | `select('*')` for partial data needs |
| Component Type | Server Components by default | `'use client'` on entire pages |
| Prop Drilling | Filter/process on the server | Passing full arrays to client components |
| Images | `next/image` with dimensions | Raw `<img>` tags |
| Re-renders | `useMemo`, `useCallback`, stable references | Inline objects/arrays in JSX |
