# Basketball Manager — Component Library Reference

> Auto-generated reference for all React components in the Basketball Manager web application.
> Covers component types, responsibilities, and key props across all domains.

---

## Table of Contents

1. [Summary Statistics](#summary-statistics)
2. [Layout](#layout)
3. [Attendance](#attendance)
4. [Events](#events)
5. [Halls](#halls)
6. [Teams](#teams)
7. [Trainees](#trainees)
8. [Trainers](#trainers)
9. [Payments](#payments)
10. [Import / Export](#import--export)
11. [Profile](#profile)
12. [Admin](#admin)
13. [Schedule](#schedule)
14. [Home](#home)
15. [Players](#players)
16. [UI Primitives](#ui-primitives)
17. [Shared Patterns](#shared-patterns)

---

## Summary Statistics

| Metric | Count |
|---|---|
| Total components | 65 |
| Client components (`'use client'`) | 52 |
| Server components | 13 |
| Domains | 15 |

**Client-heavy ratio** reflects the app's interactive nature: inline editing, modals, real-time toggles, and mobile-optimized pickers all require client-side state.

---

## Layout

**Path:** `src/components/layout/`

These components form the application shell that wraps every page. They are loaded once and persist across navigations.

| Component | Type | Description | Key Props |
|---|---|---|---|
| `AppShell.tsx` | Server | Root wrapper that composes Header, Sidebar, and BottomNav. Fetches session on the server and passes locale/session data to child layout components. | `locale`, `session`, `children` |
| `Header.tsx` | Client | 64px fixed top bar. Renders the club logo and name on the left, an optional back button, and the current page title. Includes global search with 300ms debounce that runs parallel trainee + trainer queries returning max 5 + 5 results. On mobile, the search icon expands to a full-width overlay. | `title`, `showBack`, `locale` |
| `Sidebar.tsx` | Client | 240px fixed sidebar, desktop only (`hidden md:flex`). Contains 8 navigation items: Home, Schedule, Teams, Halls, Trainers, Payments, Reports, Settings. Head coach role receives an additional admin link rendered in gold. Active item detected via `usePathname()`. | `session`, `locale` |
| `BottomNav.tsx` | Client | 72px fixed bottom bar, mobile only (`md:hidden`). Four primary tabs: Home, Halls, Teams, and "حسابي" (My Account). Head coach role gets a fifth tab. Active state shown with a golden glow dot. Respects iOS safe area via `pb-[max(env(safe-area-inset-bottom),8px)]`. | `session`, `locale` |
| `LocaleSwitcher.tsx` | Client | Toggles the active locale. Component exists but is not mounted in the active navigation. | `currentLocale` |

---

## Attendance

**Path:** `src/components/attendance/`

Components for recording and displaying per-player attendance within an event.

| Component | Type | Description | Key Props |
|---|---|---|---|
| `AttendanceSheet.tsx` | Client | Full event roster. Renders one `StatusToggle` per player. Tracks all changes locally in state and performs a single bulk write via the `bulkSaveAttendance` server action on save. | `eventId`, `trainees`, `initialStatuses` |
| `StatusToggle.tsx` | Client | Three-state toggle cycling: present (green) → absent (red) → late (amber) → present. Calls `onChange` with the new status string. Includes `aria-label` for screen reader accessibility. Touch target is at minimum 48px. | `status`, `onChange`, `label` |

---

## Events

**Path:** `src/components/events/`

Components for displaying and managing individual scheduled events.

| Component | Type | Description | Key Props |
|---|---|---|---|
| `EventCard.tsx` | Server | Card-level display for a single event. Shows start/end time, event type badge (training vs. game), assigned hall, and title. | `event` |
| `EventTimeEditor.tsx` | Client | Inline editor that allows changing an event's start and end time. Submits via the `updateEventTime` server action. Uses `ScrollTimePicker` for mobile-friendly time input. | `eventId`, `startTime`, `endTime` |
| `EventManagementActions.tsx` | Client | Renders a delete button for an event. Uses `useConfirm` to show a confirmation dialog before calling the delete action. | `eventId`, `onDelete` |

---

## Halls

**Path:** `src/components/halls/`

Components for viewing and managing sports halls and their event schedules.

| Component | Type | Description | Key Props |
|---|---|---|---|
| `HallCard.tsx` | Server | List-view card for a hall. Displays the hall name and links to the hall detail page. | `hall` |
| `HallSchedule.tsx` | Client | Interactive monthly calendar/schedule view for a single hall. Renders all events for the selected month and allows head coaches to add new events. | `hallId`, `events`, `session` |
| `InteractiveEventModal.tsx` | Client | Multi-step modal for creating or editing an event. Steps: event type selection → details → time selection → review and confirm. | `hallId`, `initialDate`, `onClose`, `onSave` |
| `AttendanceModal.tsx` | Client | Opens attendance records for a specific event from within the hall schedule context. | `eventId`, `onClose` |
| `CoachEventModal.tsx` | Client | Coach-facing modal surfacing available actions for a tapped event (view details, take attendance). | `event`, `onClose` |
| `EditHallModal.tsx` | Client | Form modal for editing a hall's multilingual name (Arabic, Hebrew, English). Submits via `updateHall` server action. | `hall`, `onClose` |
| `HallManagementActions.tsx` | Client | Renders the edit/manage button on the hall detail page. Visible to head coach role only. | `hallId`, `hall` |

---

## Teams

**Path:** `src/components/teams/`

Components for managing training classes (referred to as "Teams" in the UI, stored as `classes` in the database).

| Component | Type | Description | Key Props |
|---|---|---|---|
| `TeamCard.tsx` | Server | List-view card for a team. Displays team name, trainee count, and category badge. | `team` |
| `TeamsClientView.tsx` | Client | Wraps the full team list with category and "my teams" filter controls. Manages the create team modal trigger. | `teams`, `session`, `locale` |
| `TraineeList.tsx` | Client | Full roster for a team. Shows jersey numbers, per-player attendance statistics, and per-row edit/delete actions that open `TraineeProfileModal`. | `trainees`, `classId`, `session` |
| `AttendanceHistoryView.tsx` | Client | 30-day attendance history grid. Sessions appear as columns and players as rows. Each cell is color-coded: green for present, red for absent, amber for late, grey for no record. | `classId`, `trainees`, `sessions` |
| `ScheduleEditor.tsx` | Client | Inline editor for a class's weekly recurring schedule. Allows adding, editing, and removing day/time/hall entries. | `classId`, `schedule`, `halls` |
| `TrainerReassignButton.tsx` | Client | Trigger button that opens the `TrainerReassignModal`. | `classId`, `currentTrainerId` |
| `TrainerReassignModal.tsx` | Client | Modal presenting a searchable list of trainers for reassigning a class. Calls the reassign server action on selection. | `classId`, `trainers`, `onClose` |
| `CreateTeamButton.tsx` | Client | Floating or inline button that opens the `CreateTeamModal`. | — |
| `CreateTeamModal.tsx` | Client | Form modal for creating a new team. Fields: multilingual name (AR/HE/EN), assigned trainer, default hall, and category. | `trainers`, `halls`, `onClose` |

---

## Trainees

**Path:** `src/components/trainees/`

| Component | Type | Description | Key Props |
|---|---|---|---|
| `TraineeProfileModal.tsx` | Client | Bottom sheet modal for viewing and editing a trainee's profile. Editable fields: name, phone number, jersey number, gender, and payment status. | `trainee`, `classId`, `onClose`, `onSave` |

---

## Trainers

**Path:** `src/components/trainers/`

| Component | Type | Description | Key Props |
|---|---|---|---|
| `TrainerCard.tsx` | Server | List-view card for a trainer. Displays name, phone number, and a gender badge. | `trainer` |
| `TrainerProfileModal.tsx` | Client | Modal for viewing a trainer's full profile details. | `trainer`, `onClose` |
| `TrainerProfileActions.tsx` | Client | Renders edit and delete action buttons on a trainer's detail page. | `trainerId`, `session` |
| `EditTrainerProfileModal.tsx` | Client | Full edit form for a trainer. Fields: multilingual name (AR/HE/EN), gender, and a weekly availability schedule builder (day + time slots). | `trainer`, `onClose`, `onSave` |

---

## Payments

**Path:** `src/components/payments/`

| Component | Type | Description | Key Props |
|---|---|---|---|
| `PaymentsClient.tsx` | Client | Global payments list view. Supports filter by status and sort by date or amount. | `payments`, `classes` |
| `ClassPaymentsClient.tsx` | Client | Per-class payment view. Lists every trainee with their payment status, amount paid, and a toggle to mark paid or unpaid inline. | `classId`, `trainees`, `payments` |
| `PaymentModal.tsx` | Client | Modal for recording a payment. Input for amount with quick-add chips for common values, plus an optional comment field. | `traineeId`, `classId`, `onClose`, `onSave` |

---

## Import / Export

**Path:** `src/components/import/`

A multi-step wizard for importing trainee/team data from spreadsheets and exporting table data to Excel.

| Component | Type | Description | Key Props |
|---|---|---|---|
| `ImportWizard.tsx` | Client | Orchestrates the full 4-step import flow: upload → sheet select → review → progress. Manages wizard state and step transitions. | `onComplete`, `onCancel` |
| `FileUploadStep.tsx` | Client | Step 1. Drag-and-drop or click-to-browse file upload. Accepts `.xlsx`, `.xls`, `.csv`. Enforces 5MB maximum file size. | `onFileSelect` |
| `SheetSelectStep.tsx` | Client | Step 2. Displays a list of sheets from a multi-sheet workbook for the user to select. | `sheets`, `onSelect` |
| `SmartReviewStep.tsx` | Client | Step 3 (auto). Auto-detects the data table, shows column mappings with confidence percentages, a preview of the first rows, and highlights new entities to be created. | `parsedData`, `mappings`, `onConfirm` |
| `ColumnMappingStep.tsx` | Client | Step 3 (manual override). Allows the user to manually correct column-to-field mappings via dropdowns. | `columns`, `mappings`, `onChange` |
| `DataPreviewStep.tsx` | Client | Tabular preview of all parsed rows before import is committed. | `rows`, `columns` |
| `ResolveTrainersStep.tsx` | Client | Resolves unmatched trainer name strings from the import file to existing trainer records via a dropdown per unmatched name. | `unmatchedNames`, `trainers`, `onResolve` |
| `ImportProgressStep.tsx` | Client | Final step. Displays an animated progress bar while the import runs and a results summary (created, skipped, errors) on completion. | `total`, `processed`, `errors` |
| `ExportButton.tsx` | Client | Button that triggers the `exportTableData` server action and initiates a `.xlsx` file download in the browser. | `classId`, `label` |

---

## Profile

**Path:** `src/components/profile/`

| Component | Type | Description | Key Props |
|---|---|---|---|
| `ProfileContent.tsx` | Client | The logged-in trainer's own profile page. Allows editing name, gender, and weekly availability schedule. Includes a delete account option with confirmation. | `session`, `trainer` |

---

## Admin

**Path:** `src/components/admin/`

| Component | Type | Description | Key Props |
|---|---|---|---|
| `TrainerManager.tsx` | Client | Full CRUD table for managing all trainer accounts. Supports creating new trainers, editing existing records, and deleting with confirmation. Head coach access only. | `trainers` |

---

## Schedule

**Path:** `src/components/schedule/`

| Component | Type | Description | Key Props |
|---|---|---|---|
| `ScheduleActions.tsx` | Client | Floating action button displayed on the schedule page. Opens the event creation flow for the selected date. | `selectedDate`, `halls` |

---

## Home

**Path:** `src/components/home/`

| Component | Type | Description | Key Props |
|---|---|---|---|
| `QuickActions.tsx` | Client/Server | Quick-action button grid on the dashboard. Links to the most common tasks. | `session` |
| `ScheduleCard.tsx` | Client/Server | Summary card showing upcoming scheduled events on the home dashboard. | `events`, `locale` |

---

## Players

**Path:** `src/components/players/`

| Component | Type | Description | Key Props |
|---|---|---|---|
| `CreatePlayerModal.tsx` | Client | Modal form for creating a new player (trainee) and assigning them to a class. | `classId`, `onClose`, `onSave` |

---

## UI Primitives

**Path:** `src/components/ui/`

Foundational, domain-agnostic components used throughout the application.

| Component | Type | Description | Key Props |
|---|---|---|---|
| `Button.tsx` | Client | Variant-based button component. Variants: `primary`, `secondary`, `ghost`, `danger`. Handles disabled state and loading indicator. | `variant`, `disabled`, `onClick`, `children` |
| `Card.tsx` + `CardContent` | Server | Glassmorphic card primitive: `bg-white/5 backdrop-blur-2xl border border-white/10`. Accepts an optional `interactive` prop that adds hover and press states for clickable cards. | `interactive`, `className`, `children` |
| `Badge.tsx` | Server | Small status label. Variants map to semantic colors: `success` (green), `error` (red), `warning` (amber), `info` (blue). | `variant`, `children` |
| `Input.tsx` | Client | Standard form text input. Forwards `ref`, includes error state styling, and optional label. | `label`, `error`, `...inputProps` |
| `Dialog.tsx` | Client | Base modal wrapper. Handles open/close state, backdrop click dismissal, and focus trap. Used as the foundation for all modals. | `open`, `onClose`, `children` |
| `Portal.tsx` | Client | React portal that renders children into `document.body`. Used by modals and overlays to escape stacking context issues. | `children` |
| `Toast.tsx` | Client | Toast notification display component. Paired with the `useToast` hook to imperatively trigger notifications from anywhere in the component tree. Variants: `success`, `error`, `info`. | `message`, `variant`, `duration` |
| `ConfirmModal.tsx` | Client | Reusable confirmation dialog. Paired with the `useConfirm` hook, which returns a promise that resolves `true` (confirmed) or `false` (cancelled). | `title`, `message`, `confirmLabel`, `onConfirm`, `onCancel` |
| `LoadingSpinner.tsx` | Server/Client | Simple CSS spinner for inline loading states. | `size`, `className` |
| `BouncingBasketballLoader.tsx` | Client | Full-page animated basketball bounce loader. Used in `loading.tsx` route files to display a skeleton state during server component data fetching. | — |
| `AnimatedMeshBackground.tsx` | Client | Animated dark blue/indigo gradient mesh rendered behind all page content. Mounted once in the app shell. | — |
| `ScrollTimePicker.tsx` | Client | Custom scroll-drum time picker designed for mobile. Avoids the inconsistent native `<input type="time">` across iOS/Android. Separate scrollable columns for hours and minutes. | `value`, `onChange`, `step` |
| `JerseyNumber.tsx` | Server/Client | Styled basketball jersey number display. Renders a number inside a jersey-shaped visual element. | `number`, `size` |
| `svg/GameSVG.tsx` | Server | SVG illustration used as a visual identifier for game-type events. | — |
| `svg/TrainingSVG.tsx` | Server | SVG illustration used as a visual identifier for training-type events. | — |
| `svg/ProfileHeaderSVG.tsx` | Server | Decorative SVG rendered at the top of profile pages. | — |

---

## Shared Patterns

This section documents the recurring implementation patterns used across components. New components should follow these conventions.

---

### Glassmorphic Cards

All card surfaces use the following Tailwind utility combination:

```tsx
<div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-4">
  {/* content */}
</div>
```

For interactive cards (clickable list items), add:

```tsx
className="... hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer"
```

The `Card` component in `src/components/ui/Card.tsx` wraps this pattern and accepts an `interactive` boolean prop.

---

### Modal Pattern

All modals follow a consistent structure:

1. The trigger component manages open state with `useState<boolean>`.
2. The modal itself is wrapped in `Portal` to render at `document.body`.
3. `Dialog` handles backdrop, escape key, and focus trap.
4. The inner content uses the glassmorphic card surface.
5. A fixed action row at the bottom contains Cancel and Confirm buttons.

```tsx
// Trigger
const [open, setOpen] = useState(false)

// Render
{open && (
  <Portal>
    <Dialog open={open} onClose={() => setOpen(false)}>
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-6">
        {/* form content */}
        <div className="flex gap-3 mt-6">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save</Button>
        </div>
      </div>
    </Dialog>
  </Portal>
)}
```

**Bottom sheets on mobile:** Modals that originate from a tap on a list item (e.g., `TraineeProfileModal`) use a slide-up bottom sheet variant with `rounded-t-2xl` and `fixed bottom-0 inset-x-0`.

---

### Toast Usage

Import and call `useToast` from `src/components/ui/Toast.tsx` in any client component:

```tsx
const { showToast } = useToast()

// On success
showToast('Saved successfully', 'success')

// On error
showToast('Something went wrong', 'error')
```

Toasts auto-dismiss after a configurable duration (default 3000ms). Only one toast is shown at a time; subsequent calls replace the current one.

---

### Confirmation Dialogs

Use the `useConfirm` hook from `src/components/ui/ConfirmModal.tsx` to prompt before destructive actions:

```tsx
const { confirm } = useConfirm()

const handleDelete = async () => {
  const confirmed = await confirm({
    title: 'Delete trainee',
    message: 'This action cannot be undone.',
    confirmLabel: 'Delete',
  })
  if (!confirmed) return
  // proceed with deletion
}
```

The hook renders the `ConfirmModal` via a portal and returns a `Promise<boolean>`. This avoids prop-drilling callback functions through parent components.

---

### Server Action Pattern

All mutations follow this structure:

```ts
// src/app/actions.ts
'use server'

export async function updateSomething(id: string, data: SomeType) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }

  const { error } = await supabase.rpc('update_something', { p_id: id, ...data })
  if (error) return { error: error.message }

  revalidatePath('/relevant-path')
  return { success: true }
}
```

Client components call the action, check the returned `error`, and use `showToast` to surface feedback. They never `fetch()` directly — all mutations go through typed server actions.

---

*Last updated: 2026-02-27*
