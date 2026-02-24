# Hall Calendar Time Fix — Plan

## What's Happening

The hall calendar shows schedule **template** times (e.g. 16:30-18:00) instead of the
**actual event** times (e.g. 12:30-14:00).

Why: `HallSchedule.tsx` matches events to schedule slots using `event.schedule_id === schedule.id`.
If that field is null on the event, the match fails → template time shows, event appears as a "manual" entry.

The attendance page always reads directly from `events` table → always shows the correct time.

## The Cause (One Line)

`allDayEvents.filter(e => e.schedule_id)` — if event's `schedule_id` column is null, it's excluded
from schedule matching, so the template slot (old time) still renders.

## The Fix — HallSchedule.tsx only, ~10 lines

Extend matching to also use `class_id` as a fallback when `schedule_id` is null:

```ts
// BEFORE
const scheduleEvents = allDayEvents.filter(e => e.schedule_id)

// AFTER — also match by class_id if schedule_id is missing
const scheduleEvents = allDayEvents.filter(e =>
    e.schedule_id ||
    weeklySchedules.some(s => s.classes?.id === e.class_id && s.day_of_week === dayOfWeek)
)
```

And in `withEvents`, find the schedule by `schedule_id` first, then `class_id` fallback:

```ts
const schedule = weeklySchedules.find(s => s.id === e.schedule_id)
    ?? weeklySchedules.find(s => s.classes?.id === e.class_id && s.day_of_week === dayOfWeek)
```

And exclude matched schedules from `withoutEvents` using both sets:

```ts
const matchedScheduleIds = new Set(scheduleEvents.map(e => e.schedule_id).filter(Boolean))
const matchedClassIds    = new Set(scheduleEvents.map(e => e.class_id).filter(Boolean))
const withoutEvents = weeklySchedules
    .filter(s => s.day_of_week === dayOfWeek && s.start_time !== '00:00:00')
    .filter(s => !matchedScheduleIds.has(s.id) && !matchedClassIds.has(s.classes?.id))
```

## Result

- If an event exists for that class+date → show event's actual time ✓
- If no event yet (future date) → show schedule template time ✓
- No DB migrations needed ✓
- Only one file changes: `src/components/halls/HallSchedule.tsx` ✓

## Awaiting approval
