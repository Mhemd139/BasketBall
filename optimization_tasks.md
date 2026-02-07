# Performance Optimization Tasks

> Generated after full audit of every page and component. Fix these in order — each task is independent and can be done one at a time.

---

## Task 1: Parallelize homepage queries with Promise.all()
**File:** `src/app/[locale]/page.tsx`
**Lines:** 38-48
**Impact:** HIGH — 4 sequential DB round trips → 1 parallel batch

**Problem:** Four queries run one after another:
```ts
const { data: events } = await supabase.from('events')...
const { count: hallsCount } = await supabase.from('halls')...
const { count: teamsCount } = await supabase.from('teams')...
const { count: traineesCount } = await supabase.from('trainees')...
```

**Fix:** Wrap all four in `Promise.all()`:
```ts
const [
  { data: events },
  { count: hallsCount },
  { count: teamsCount },
  { count: traineesCount }
] = await Promise.all([
  supabase.from('events').select('*, halls(*)').eq('event_date', today).order('start_time', { ascending: true }),
  supabase.from('halls').select('*', { count: 'exact', head: true }),
  supabase.from('teams').select('*', { count: 'exact', head: true }),
  supabase.from('trainees').select('*', { count: 'exact', head: true }),
])
```
Keep `const todayEvents = (events || []) as unknown as EventWithHall[]` right after.

- [ ] Done

---

## Task 2: Remove `force-dynamic` from trainers page
**File:** `src/app/[locale]/trainers/page.tsx`
**Line:** 13
**Impact:** HIGH — page is re-rendered from scratch on every visit

**Fix:** Delete this line:
```ts
export const dynamic = 'force-dynamic'
```
The trainers list rarely changes. `revalidatePath()` in server actions already handles cache invalidation when trainers are modified.

- [ ] Done

---

## Task 3: Remove `force-dynamic` from payments page
**File:** `src/app/[locale]/payments/page.tsx`
**Line:** 11
**Impact:** HIGH — page is re-rendered from scratch on every visit

**Fix:** Delete this line:
```ts
export const dynamic = 'force-dynamic'
```
Same reasoning — `revalidatePath()` in `updateTraineePayment` and `toggleTraineePayment` actions already invalidates the cache.

- [ ] Done

---

## Task 4: Remove `force-dynamic` from payments/[classId] page
**File:** `src/app/[locale]/payments/[classId]/page.tsx`
**Line:** 7
**Impact:** HIGH — page is re-rendered from scratch on every visit

**Fix:** Delete this line:
```ts
export const dynamic = 'force-dynamic'
```

- [ ] Done

---

## Task 5: Add pagination to schedule page (loads ALL events)
**File:** `src/app/[locale]/schedule/page.tsx`
**Lines:** 29-32
**Impact:** HIGH — fetches every event ever created, gets worse over time

**Problem:**
```ts
const { data: events } = await (supabase as any)
  .from('events')
  .select('*, halls(*)')
  .order('event_date', { ascending: false })
```

**Fix:** Add `.limit(50)` to cap results. Optionally filter to recent events:
```ts
const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

const { data: events } = await (supabase as any)
  .from('events')
  .select('*, halls(*)')
  .gte('event_date', threeMonthsAgo)
  .order('event_date', { ascending: false })
  .limit(50)
```

- [ ] Done

---

## Task 6: Fix schedule page padding (pt-48 → pt-20)
**File:** `src/app/[locale]/schedule/page.tsx`
**Line:** 58
**Impact:** LOW — visual bug, 128px of wasted whitespace

**Fix:** Change:
```
pt-48 pb-32
```
To:
```
pt-20 pb-24 md:pb-8
```

- [ ] Done

---

## Task 7: Fix trainers page padding (pt-48 → pt-20)
**File:** `src/app/[locale]/trainers/page.tsx`
**Line:** 42
**Impact:** LOW — visual bug, 128px of wasted whitespace

**Fix:** Change:
```
pt-48 pb-32 md:pb-10
```
To:
```
pt-20 pb-24 md:pb-8
```

- [ ] Done

---

## Task 8: Parallelize attendance page queries (N+1 pattern)
**File:** `src/app/[locale]/attendance/[eventId]/page.tsx`
**Lines:** 30-64
**Impact:** HIGH — 4 sequential DB queries, classic N+1

**Problem:** Queries run one after another:
1. Fetch event (line 30)
2. Fetch class by trainer_id (line 44) — depends on #1
3. Fetch trainees by class_id (line 52) — depends on #2
4. Fetch attendance records (line 61) — independent of #2 and #3

**Fix:** Run query 1 and 4 in parallel, then 2, then 3:
```ts
// Step 1: event + attendance in parallel
const [
  { data: event, error: eventError },
  { data: attendanceRecords }
] = await Promise.all([
  (supabase as any).from('events').select('*, halls(*)').eq('id', eventId).single(),
  (supabase as any).from('attendance').select('trainee_id, status').eq('event_id', eventId),
])

if (eventError || !event) notFound()
const eventWithHall = event as unknown as EventWithHall

// Step 2: class from trainer
const { data: classData } = await (supabase as any)
  .from('classes')
  .select('id')
  .eq('trainer_id', event.trainer_id)
  .single()

// Step 3: trainees
let trainees: Trainee[] = []
if (classData) {
  const { data } = await (supabase as any)
    .from('trainees')
    .select('*')
    .eq('class_id', classData.id)
    .order('jersey_number', { ascending: true })
  trainees = data || []
}
```
This saves one full DB round trip (~100ms).

- [ ] Done

---

## Task 9: Parallelize team detail page queries
**File:** `src/app/[locale]/teams/[classId]/page.tsx`
**Lines:** 35-54
**Impact:** MEDIUM — 2 sequential independent queries

**Problem:** Class details and trainees roster are fetched sequentially but don't depend on each other (both use `classId`).

**Fix:**
```ts
const [
  { data: team, error: teamError },
  { data: roster }
] = await Promise.all([
  (supabase as any).from('classes').select('*, trainers(*), halls(*)').eq('id', classId).single(),
  (supabase as any).from('trainees').select('*').eq('class_id', classId).order('jersey_number', { ascending: true }),
])

if (teamError || !team) notFound()
const teamDetails = team as unknown as ClassWithDetails
const trainees = (roster || []) as Trainee[]
```

- [ ] Done

---

## Task 10: Parallelize payments/[classId] page queries
**File:** `src/app/[locale]/payments/[classId]/page.tsx`
**Lines:** 19-40
**Impact:** MEDIUM — 2 sequential independent queries

**Problem:** Class details and trainees are fetched sequentially but both use `classId`.

**Fix:**
```ts
const [{ data: classData }, { data: trainees, error }] = await Promise.all([
  supabase.from('classes').select('*, trainers (name_en, name_ar, name_he)').eq('id', classId).single(),
  supabase.from('trainees').select('*, classes (name_en, name_ar, name_he)').eq('class_id', classId).order('name_en'),
])
```

- [ ] Done

---

## Task 11: Parallelize hall detail page queries
**File:** `src/app/[locale]/halls/[id]/page.tsx`
**Lines:** 27-45
**Impact:** MEDIUM — 2 sequential independent queries

**Problem:** Hall details and events are fetched sequentially. Events query doesn't depend on hall query result (both use `id`).

**Fix:**
```ts
const today = new Date().toISOString().split('T')[0]

const [{ data: hall, error: hallError }, { data: events }] = await Promise.all([
  supabase.from('halls').select('*').eq('id', id).single(),
  supabase.from('events').select('*').eq('hall_id', id).gte('event_date', today)
    .order('event_date', { ascending: true }).order('start_time', { ascending: true }).limit(10),
])

if (hallError || !hall) notFound()
```

- [ ] Done

---

## Task 12: Add debounce to header search
**File:** `src/components/layout/Header.tsx`
**Lines:** ~55-97 (handleSearch) and ~260 (onChange)
**Impact:** MEDIUM — typing "Ahmed" fires 4 separate Supabase queries

**Fix:** Add a 300ms debounce using `useRef` for a timer:
```ts
const debounceRef = useRef<NodeJS.Timeout | null>(null);

const handleSearch = useCallback(async (term: string) => {
  setQuery(term);
  if (term.length < 2) {
    setResults([]);
    return;
  }

  // Debounce: clear previous timer, set new one
  if (debounceRef.current) clearTimeout(debounceRef.current);

  debounceRef.current = setTimeout(async () => {
    setLoading(true);
    const supabase = createClient();
    // ... rest of the search logic stays the same
    setLoading(false);
  }, 300);
}, [locale, nameField]);
```

**Important:** Keep `setQuery(term)` outside the timeout so the input updates immediately. Only the API call is debounced.

- [ ] Done

---

## Task 13: Remove debug console.log from trainers page
**File:** `src/app/[locale]/trainers/page.tsx`
**Line:** 29
**Impact:** LOW — clutters server logs

**Fix:** Delete this line:
```ts
console.log('DEBUG TRAINERS FROM DB:', trainers)
```

- [ ] Done

---

## Task 14: Add optimizePackageImports to next.config.ts
**File:** `next.config.ts`
**Impact:** MEDIUM — reduces bundle size for lucide-react (tree-shaking)

**Fix:** Add experimental config:
```ts
const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}
```

- [ ] Done

---

## Summary

| # | Task | File | Impact |
|---|------|------|--------|
| 1 | Parallelize homepage queries | page.tsx (home) | HIGH |
| 2 | Remove force-dynamic (trainers) | trainers/page.tsx | HIGH |
| 3 | Remove force-dynamic (payments) | payments/page.tsx | HIGH |
| 4 | Remove force-dynamic (payments/classId) | payments/[classId]/page.tsx | HIGH |
| 5 | Add pagination to schedule | schedule/page.tsx | HIGH |
| 6 | Fix schedule padding | schedule/page.tsx | LOW |
| 7 | Fix trainers padding | trainers/page.tsx | LOW |
| 8 | Parallelize attendance queries | attendance/[eventId]/page.tsx | HIGH |
| 9 | Parallelize team detail queries | teams/[classId]/page.tsx | MEDIUM |
| 10 | Parallelize payments class queries | payments/[classId]/page.tsx | MEDIUM |
| 11 | Parallelize hall detail queries | halls/[id]/page.tsx | MEDIUM |
| 12 | Add search debounce | Header.tsx | MEDIUM |
| 13 | Remove debug console.log | trainers/page.tsx | LOW |
| 14 | Add optimizePackageImports | next.config.ts | MEDIUM |
