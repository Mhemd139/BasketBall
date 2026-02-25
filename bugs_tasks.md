# Bug 5: Add Delete Button Inside Event Cards

## Root Cause
One-time event cards in HallSchedule have no delete button. The edit button is `group-hover:opacity-100` — invisible on mobile (no hover). `InteractiveEventModal` already has a `delete-confirm` step and `onDelete` prop, but neither is wired in HallSchedule.

## Fix
1. Import `deleteEvent` action into HallSchedule
2. Add `modalInitialStep` state so modal can open directly to `delete-confirm`
3. Add `handleDeleteEvent` that deletes + updates local state (no redirect)
4. Add `handleDeleteClick` that sets selectedEvent + opens modal at delete-confirm
5. Wire `onDelete={handleDeleteEvent}` and `initialStep={modalInitialStep}` to modal
6. Add trash icon button on each one-time event card (always visible on mobile)

## File
`src/components/halls/HallSchedule.tsx`
