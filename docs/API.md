# Basketball Manager — Server Actions API Reference

All functions are exported from `src/app/actions.ts` with the `'use server'` directive. They can be called directly from Server Components or imported into Client Components and invoked as async functions.

---

## Usage Patterns

### Calling from a Server Component

```ts
import { getTrainers } from '@/app/actions'

export default async function TrainersPage() {
  const trainers = await getTrainers()
  return <TrainerList trainers={trainers} />
}
```

### Calling from a Client Component

```ts
'use client'
import { updateTrainee } from '@/app/actions'

async function handleSave(id: string, data: object) {
  const result = await updateTrainee(id, data)
  if (!result.success) {
    // handle error
  }
}
```

### Standard Error Handling Pattern

Most mutating actions return a discriminated union. Always check before using data:

```ts
const result = await saveAttendance(eventId, traineeId, 'present')
if (!result.success) {
  console.error(result.error)
  return
}
// proceed with success
```

---

## Authentication

### `sendOTP(phone: string)`

Sends a 4-digit one-time password to the given phone number via Vonage or Twilio SMS.

**Parameters**

| Name    | Type     | Required | Description                        |
|---------|----------|----------|------------------------------------|
| `phone` | `string` | Yes      | E.164 formatted phone number       |

**Returns**

```ts
{ success: true }
| { success: false; error: string }
```

**Side Effects**
- SMS sent to the provided phone number.

**Mock Mode**
When `E2E_MOCK_OTP=true` is set in the environment, returns `{ success: true }` immediately without sending an SMS.

---

### `verifyOTP(phone: string, otp: string, context?: string)`

Verifies the OTP submitted by the user. If the phone number is not associated with any trainer, a new trainer record is created. Sets an `admin_session` httpOnly cookie on success.

**Parameters**

| Name      | Type     | Required | Description                                         |
|-----------|----------|----------|-----------------------------------------------------|
| `phone`   | `string` | Yes      | E.164 formatted phone number                        |
| `otp`     | `string` | Yes      | 4-digit code entered by the user                    |
| `context` | `string` | No       | Optional context string for the session             |

**Returns**

```ts
{ success: true; isNewUser?: boolean }
| { success: false; error: string }
```

**Side Effects**
- Sets `admin_session` httpOnly cookie.
- Creates a trainer record if the phone number is not found.

**Mock Mode**
When `E2E_MOCK_OTP=true`, accepts `1111` or `1234` as valid OTP values for any phone number.

---

### `getSession()`

Reads and cryptographically verifies the `admin_session` cookie using HMAC.

**Parameters**

None.

**Returns**

```ts
{ id: string; name: string; role: string }
| null
```

Returns `null` if the cookie is absent, expired, or the HMAC signature is invalid.

**Side Effects**

None.

---

### `logout()`

Clears the `admin_session` cookie and redirects the user to the login page.

**Parameters**

None.

**Returns**

Does not return — performs a server-side redirect.

**Side Effects**
- Clears `admin_session` cookie.
- Redirects to login.

---

## Events

### `upsertEvent(eventData)`

Creates a new event or updates an existing one. Uses RPC `upsert_event`.

**Parameters**

| Name          | Type     | Required | Description                                    |
|---------------|----------|----------|------------------------------------------------|
| `title_ar`    | `string` | No       | Event title in Arabic                          |
| `title_he`    | `string` | No       | Event title in Hebrew                          |
| `title_en`    | `string` | No       | Event title in English                         |
| `event_date`  | `string` | Yes      | ISO date string (`YYYY-MM-DD`)                 |
| `start_time`  | `string` | Yes      | 24-hour time string (`HH:MM`)                  |
| `end_time`    | `string` | Yes      | 24-hour time string (`HH:MM`)                  |
| `type`        | `string` | Yes      | `'training'` or `'game'`                       |
| `hall_id`     | `string` | Yes      | UUID of the hall                               |
| `trainer_id`  | `string` | Yes      | UUID of the trainer                            |
| `class_id`    | `string` | No       | UUID of the class                              |
| `schedule_id` | `string` | No       | UUID of the recurring schedule                 |

**Returns**

```ts
{ success: true; data: Event }
| { success: false; error: string }
```

**Side Effects**
- Calls `revalidatePath` on relevant paths.

**RPC:** `upsert_event`

---

### `deleteEvent(id: string)`

Deletes an event by ID. Uses RPC `delete_event`.

**Parameters**

| Name | Type     | Required | Description          |
|------|----------|----------|----------------------|
| `id` | `string` | Yes      | UUID of the event    |

**Returns**

```ts
{ success: true }
| { success: false; error: string }
```

**Side Effects**
- Calls `revalidatePath` on relevant paths.

**RPC:** `delete_event`

---

### `updateEventTime(eventId: string, startTime: string, endTime: string)`

Updates only the start and end time of an existing event. Uses RPC `update_event_time`.

**Parameters**

| Name        | Type     | Required | Description                        |
|-------------|----------|----------|------------------------------------|
| `eventId`   | `string` | Yes      | UUID of the event                  |
| `startTime` | `string` | Yes      | New start time (`HH:MM`)           |
| `endTime`   | `string` | Yes      | New end time (`HH:MM`)             |

**Returns**

```ts
{ success: true }
| { success: false; error: string }
```

**Side Effects**
- Calls `revalidatePath` on relevant paths.

**RPC:** `update_event_time`

---

### `getEventRefData()`

Fetches all halls and trainers needed to populate event creation and edit forms.

**Parameters**

None.

**Returns**

```ts
{ halls: Hall[]; trainers: Trainer[] }
```

**Side Effects**

None.

---

### `fetchHallEvents(hallId: string, startDate: string, endDate: string)`

Fetches all events assigned to a specific hall within the given date range.

**Parameters**

| Name        | Type     | Required | Description                        |
|-------------|----------|----------|------------------------------------|
| `hallId`    | `string` | Yes      | UUID of the hall                   |
| `startDate` | `string` | Yes      | ISO date string (`YYYY-MM-DD`)     |
| `endDate`   | `string` | Yes      | ISO date string (`YYYY-MM-DD`)     |

**Returns**

```ts
Event[]
```

**Side Effects**

None.

---

### `fetchHallSchedules(hallId: string)`

Fetches all recurring weekly schedule slots for a given hall.

**Parameters**

| Name     | Type     | Required | Description       |
|----------|----------|----------|-------------------|
| `hallId` | `string` | Yes      | UUID of the hall  |

**Returns**

```ts
Schedule[]
```

**Side Effects**

None.

---

### `fetchTodaySchedules()`

Calls the `ensure_events_for_schedules` RPC to generate today's recurring events if they have not yet been created, then returns the full list of today's events.

**Parameters**

None.

**Returns**

```ts
Event[]
```

**Side Effects**
- May insert new event rows for today if they do not already exist.

**RPC:** `ensure_events_for_schedules`

---

### `getOrCreateEventForSchedule(scheduleId: string, date: string)`

Returns the existing event for a schedule on a specific date, or creates one if it does not exist.

**Parameters**

| Name         | Type     | Required | Description                        |
|--------------|----------|----------|------------------------------------|
| `scheduleId` | `string` | Yes      | UUID of the recurring schedule     |
| `date`       | `string` | Yes      | ISO date string (`YYYY-MM-DD`)     |

**Returns**

```ts
{ success: true; event: Event }
| { success: false; error: string }
```

**Side Effects**
- May insert a new event row if one does not exist for the given date.

---

## Trainers

### `getTrainers()`

Fetches all trainer records along with their assigned classes.

**Parameters**

None.

**Returns**

```ts
Array<Trainer & { classes: Class[] }>
```

**Side Effects**

None.

---

### `upsertTrainer(phone: string, name: string, role: string)`

Creates a new trainer record or updates an existing one matched by phone number.

**Parameters**

| Name    | Type     | Required | Description                              |
|---------|----------|----------|------------------------------------------|
| `phone` | `string` | Yes      | E.164 formatted phone number             |
| `name`  | `string` | Yes      | Trainer display name                     |
| `role`  | `string` | Yes      | Trainer role (e.g. `'trainer'`, `'admin'`) |

**Returns**

```ts
{ success: true; data: Trainer }
| { success: false; error: string }
```

**Side Effects**

None.

---

### `deleteTrainer(id: string)`

Deletes a trainer and all associated data. Uses RPC `delete_trainer_rpc`.

**Parameters**

| Name | Type     | Required | Description          |
|------|----------|----------|----------------------|
| `id` | `string` | Yes      | UUID of the trainer  |

**Returns**

```ts
{ success: true }
| { success: false; error: string }
```

**Side Effects**
- Calls `revalidatePath` on relevant paths.

**RPC:** `delete_trainer_rpc`

---

### `updateProfile(name: string, gender?: string, availability?: any)`

Updates the currently logged-in trainer's own profile. Uses RPC `update_trainer_profile`.

**Parameters**

| Name           | Type     | Required | Description                           |
|----------------|----------|----------|---------------------------------------|
| `name`         | `string` | Yes      | Updated display name                  |
| `gender`       | `string` | No       | Trainer gender                        |
| `availability` | `any`    | No       | Availability JSON object              |

**Returns**

```ts
{ success: true }
| { success: false; error: string }
```

**Side Effects**
- Calls `revalidatePath` on the trainer's profile path.

**RPC:** `update_trainer_profile`

---

### `updateTrainerDetails(id: string, data: object)`

Admin-level update of any trainer's details. Uses RPC `update_trainer_rpc`.

**Parameters**

| Name   | Type     | Required | Description                                |
|--------|----------|----------|--------------------------------------------|
| `id`   | `string` | Yes      | UUID of the trainer to update              |
| `data` | `object` | Yes      | Key-value pairs of fields to update        |

**Returns**

```ts
{ success: true }
| { success: false; error: string }
```

**Side Effects**
- Calls `revalidatePath` on relevant paths.

**RPC:** `update_trainer_rpc`

---

### `getTrainerProfile(trainerId: string)`

Fetches a trainer record along with their associated teams, schedules, and halls.

**Parameters**

| Name        | Type     | Required | Description          |
|-------------|----------|----------|----------------------|
| `trainerId` | `string` | Yes      | UUID of the trainer  |

**Returns**

```ts
{
  trainer: Trainer
  classes: Class[]
  schedules: Schedule[]
  halls: Hall[]
}
```

**Side Effects**

None.

---

### `getTrainerProfileServer()`

Fetches the currently logged-in trainer's own full profile. Internally calls `getSession()` to determine the caller's identity.

**Parameters**

None.

**Returns**

```ts
{
  trainer: Trainer
  classes: Class[]
  schedules: Schedule[]
  halls: Hall[]
}
| null
```

Returns `null` if there is no active session.

**Side Effects**

None.

---

### `deleteAccount()`

Deletes the currently logged-in trainer's own account and clears the session cookie.

**Parameters**

None.

**Returns**

Does not return — performs a server-side redirect after deletion.

**Side Effects**
- Deletes trainer record from the database.
- Clears `admin_session` cookie.

---

## Teams / Classes

In the database, teams are stored in the `classes` table. The UI refers to them as "teams."

### `createTeam(teamData)`

Creates a new class (team). Uses RPC `insert_class`.

**Parameters**

| Name       | Type     | Required | Description                              |
|------------|----------|----------|------------------------------------------|
| `teamData` | `object` | Yes      | Class fields: `name`, `trainer_id`, etc. |

**Returns**

```ts
{ success: true; data: Class }
| { success: false; error: string }
```

**Side Effects**
- Calls `revalidatePath` on the teams path.

**RPC:** `insert_class`

---

### `updateTeam(id: string, teamData)`

Updates an existing class. Uses RPC `update_class`.

**Parameters**

| Name       | Type     | Required | Description                          |
|------------|----------|----------|--------------------------------------|
| `id`       | `string` | Yes      | UUID of the class                    |
| `teamData` | `object` | Yes      | Fields to update                     |

**Returns**

```ts
{ success: true }
| { success: false; error: string }
```

**RPC:** `update_class`

---

### `deleteTeam(id: string)`

Deletes a class and its associated data. Uses RPC `delete_class`.

**Parameters**

| Name | Type     | Required | Description       |
|------|----------|----------|-------------------|
| `id` | `string` | Yes      | UUID of the class |

**Returns**

```ts
{ success: true }
| { success: false; error: string }
```

**RPC:** `delete_class`

---

### `updateTeamTrainer(classId: string, trainerId: string)`

Reassigns a team (class) to a different trainer.

**Parameters**

| Name        | Type     | Required | Description                    |
|-------------|----------|----------|--------------------------------|
| `classId`   | `string` | Yes      | UUID of the class              |
| `trainerId` | `string` | Yes      | UUID of the new trainer        |

**Returns**

```ts
{ success: true }
| { success: false; error: string }
```

**Side Effects**
- Calls `revalidatePath` on the team and trainer paths.

---

### `updateClassSchedule(scheduleId: string, hallId: string, startTime: string, endTime: string)`

Updates a single weekly recurring schedule slot for a class. Uses RPC `update_class_schedule`.

**Parameters**

| Name         | Type     | Required | Description                          |
|--------------|----------|----------|--------------------------------------|
| `scheduleId` | `string` | Yes      | UUID of the schedule slot            |
| `hallId`     | `string` | Yes      | UUID of the hall                     |
| `startTime`  | `string` | Yes      | New start time (`HH:MM`)             |
| `endTime`    | `string` | Yes      | New end time (`HH:MM`)               |

**Returns**

```ts
{ success: true }
| { success: false; error: string }
```

**RPC:** `update_class_schedule`

---

## Trainees

### `addTrainee({ classId, name, phone, jerseyNumber, gender })`

Creates a new trainee and assigns them to a class. Uses RPC `insert_trainee`.

**Parameters**

| Name           | Type     | Required | Description                          |
|----------------|----------|----------|--------------------------------------|
| `classId`      | `string` | Yes      | UUID of the class to assign to       |
| `name`         | `string` | Yes      | Trainee's full name                  |
| `phone`        | `string` | No       | Phone number                         |
| `jerseyNumber` | `number` | No       | Jersey number                        |
| `gender`       | `string` | No       | Trainee gender                       |

**Returns**

```ts
{ success: true; data: Trainee }
| { success: false; error: string }
```

**RPC:** `insert_trainee`

---

### `deleteTrainee(traineeId: string)`

Deletes a trainee record. Uses RPC `delete_trainee`.

**Parameters**

| Name        | Type     | Required | Description          |
|-------------|----------|----------|----------------------|
| `traineeId` | `string` | Yes      | UUID of the trainee  |

**Returns**

```ts
{ success: true }
| { success: false; error: string }
```

**RPC:** `delete_trainee`

---

### `updateTrainee(traineeId: string, updateData: object)`

Updates fields on an existing trainee record. Uses RPC `update_trainee_rpc`.

**Parameters**

| Name         | Type     | Required | Description                     |
|--------------|----------|----------|---------------------------------|
| `traineeId`  | `string` | Yes      | UUID of the trainee             |
| `updateData` | `object` | Yes      | Key-value pairs of fields to update |

**Returns**

```ts
{ success: true }
| { success: false; error: string }
```

**RPC:** `update_trainee_rpc`

---

### `searchTrainees(query: string)`

Performs a text search across trainees by name and phone number.

**Parameters**

| Name    | Type     | Required | Description           |
|---------|----------|----------|-----------------------|
| `query` | `string` | Yes      | Search string         |

**Returns**

```ts
Trainee[]
```

**Side Effects**

None. Debounce this call on the client side (300ms minimum) when triggered by user input.

---

### `transferTrainee(traineeId: string, classId: string)`

Moves a trainee from their current class to a different one.

**Parameters**

| Name        | Type     | Required | Description                           |
|-------------|----------|----------|---------------------------------------|
| `traineeId` | `string` | Yes      | UUID of the trainee                   |
| `classId`   | `string` | Yes      | UUID of the destination class         |

**Returns**

```ts
{ success: true }
| { success: false; error: string }
```

---

### `assignTraineeToTeam(traineeId: string, classId: string)`

Assigns a trainee who is not currently in any class to the specified team.

**Parameters**

| Name        | Type     | Required | Description               |
|-------------|----------|----------|---------------------------|
| `traineeId` | `string` | Yes      | UUID of the trainee       |
| `classId`   | `string` | Yes      | UUID of the target class  |

**Returns**

```ts
{ success: true }
| { success: false; error: string }
```

---

### `quickRegisterAndAssign(traineeData, classId: string)`

Convenience action that creates a new trainee record and immediately assigns them to the specified class in a single operation.

**Parameters**

| Name          | Type     | Required | Description                             |
|---------------|----------|----------|-----------------------------------------|
| `traineeData` | `object` | Yes      | New trainee fields (name, phone, etc.)  |
| `classId`     | `string` | Yes      | UUID of the class to assign to          |

**Returns**

```ts
{ success: true; data: Trainee }
| { success: false; error: string }
```

---

## Payments

### `updateTraineePayment(traineeId: string, amount: number, comment: string)`

Records a payment amount and optional comment for a trainee. Uses RPC `update_trainee_payment_rpc`.

**Parameters**

| Name        | Type     | Required | Description                          |
|-------------|----------|----------|--------------------------------------|
| `traineeId` | `string` | Yes      | UUID of the trainee                  |
| `amount`    | `number` | Yes      | Payment amount                       |
| `comment`   | `string` | No       | Optional note about the payment      |

**Returns**

```ts
{ success: true }
| { success: false; error: string }
```

**RPC:** `update_trainee_payment_rpc`

---

### `toggleTraineePayment(traineeId: string, isPaid: boolean)`

Sets the `is_paid` boolean flag on a trainee record.

**Parameters**

| Name        | Type      | Required | Description                    |
|-------------|-----------|----------|--------------------------------|
| `traineeId` | `string`  | Yes      | UUID of the trainee            |
| `isPaid`    | `boolean` | Yes      | New paid status                |

**Returns**

```ts
{ success: true }
| { success: false; error: string }
```

---

## Attendance

### `saveAttendance(eventId: string, traineeId: string, status: string)`

Saves attendance for a single trainee at a specific event. Uses RPC `upsert_attendance`.

**Parameters**

| Name        | Type     | Required | Description                                       |
|-------------|----------|----------|---------------------------------------------------|
| `eventId`   | `string` | Yes      | UUID of the event                                 |
| `traineeId` | `string` | Yes      | UUID of the trainee                               |
| `status`    | `string` | Yes      | One of `'present'`, `'absent'`, `'late'`          |

**Returns**

```ts
{ success: true }
| { success: false; error: string }
```

**RPC:** `upsert_attendance`

---

### `bulkSaveAttendance(records: Array)`

Saves attendance for multiple trainees at once. Prefer this over calling `saveAttendance` in a loop. Uses RPC `bulk_upsert_attendance`.

**Parameters**

| Name      | Type    | Required | Description                                              |
|-----------|---------|----------|----------------------------------------------------------|
| `records` | `Array` | Yes      | Array of `{ eventId, traineeId, status }` objects        |

**Returns**

```ts
{ success: true }
| { success: false; error: string }
```

**RPC:** `bulk_upsert_attendance`

**Example**

```ts
await bulkSaveAttendance([
  { eventId: 'abc', traineeId: 'x1', status: 'present' },
  { eventId: 'abc', traineeId: 'x2', status: 'absent' },
])
```

---

### `updateAttendance(eventId: string, traineeId: string, status: string)`

Updates the attendance status for a single trainee at a specific event. Use this when the record is known to already exist.

**Parameters**

| Name        | Type     | Required | Description                                       |
|-------------|----------|----------|---------------------------------------------------|
| `eventId`   | `string` | Yes      | UUID of the event                                 |
| `traineeId` | `string` | Yes      | UUID of the trainee                               |
| `status`    | `string` | Yes      | One of `'present'`, `'absent'`, `'late'`          |

**Returns**

```ts
{ success: true }
| { success: false; error: string }
```

---

### `getEventAttendance(eventId: string, classId?: string)`

Fetches all attendance records for an event, joined with trainee names. Optionally filtered to a single class.

**Parameters**

| Name      | Type     | Required | Description                                   |
|-----------|----------|----------|-----------------------------------------------|
| `eventId` | `string` | Yes      | UUID of the event                             |
| `classId` | `string` | No       | UUID of a class to filter results             |

**Returns**

```ts
Array<{
  trainee_id: string
  trainee_name: string
  status: 'present' | 'absent' | 'late'
}>
```

**Side Effects**

None.

---

### `getTraineeAttendanceStats(traineeId: string)`

Returns aggregate attendance counts for a single trainee.

**Parameters**

| Name        | Type     | Required | Description          |
|-------------|----------|----------|----------------------|
| `traineeId` | `string` | Yes      | UUID of the trainee  |

**Returns**

```ts
{ present: number; absent: number; late: number }
```

**Side Effects**

None.

---

### `getClassAttendanceStats(classId: string)`

Returns attendance statistics for all trainees in a class, bounded to the last 90 days and up to 50 events.

**Parameters**

| Name      | Type     | Required | Description       |
|-----------|----------|----------|-------------------|
| `classId` | `string` | Yes      | UUID of the class |

**Returns**

```ts
Map<string, { present: number; absent: number; late: number }>
```

The map key is `traineeId`.

**Side Effects**

None.

---

### `getTeamAttendanceHistory(classId: string)`

Returns a full 30-day attendance matrix for a class. Events are columns, trainees are rows.

**Parameters**

| Name      | Type     | Required | Description       |
|-----------|----------|----------|-------------------|
| `classId` | `string` | Yes      | UUID of the class |

**Returns**

```ts
{
  events: Event[]
  trainees: Trainee[]
  records: Map<string, Map<string, 'present' | 'absent' | 'late'>>
}
```

The outer map key is `traineeId`, the inner map key is `eventId`.

**Side Effects**

None.

---

## Halls

### `updateHall(id: string, name_en: string, name_ar: string, name_he: string)`

Updates the multilingual names of a hall. Uses RPC `update_hall_rpc`.

**Parameters**

| Name      | Type     | Required | Description               |
|-----------|----------|----------|---------------------------|
| `id`      | `string` | Yes      | UUID of the hall          |
| `name_en` | `string` | Yes      | Hall name in English      |
| `name_ar` | `string` | Yes      | Hall name in Arabic       |
| `name_he` | `string` | Yes      | Hall name in Hebrew       |

**Returns**

```ts
{ success: true }
| { success: false; error: string }
```

**RPC:** `update_hall_rpc`

---

## Import / Export

### `getImportRefData()`

Fetches all trainers, halls, and classes needed to resolve foreign keys during the import wizard.

**Parameters**

None.

**Returns**

```ts
{
  trainers: Trainer[]
  halls: Hall[]
  classes: Class[]
}
```

**Side Effects**

None.

---

### `createTrainersForImport(trainers: Array)`

Bulk creates new trainer records discovered in an uploaded Excel file. Uses RPC `create_trainer` for each record.

**Parameters**

| Name       | Type    | Required | Description                                         |
|------------|---------|----------|-----------------------------------------------------|
| `trainers` | `Array` | Yes      | Array of `{ name, phone, role }` objects            |

**Returns**

```ts
{ nameToId: Record<string, string> }
```

A mapping from trainer name to newly created UUID, used to resolve FK references in subsequent import steps.

**RPC:** `create_trainer` (called per record)

---

### `bulkImportRecords(table: string, records: Array)`

Bulk inserts records into the specified table. Dispatches to the appropriate RPC based on the target table.

**Parameters**

| Name      | Type     | Required | Description                                        |
|-----------|----------|----------|----------------------------------------------------|
| `table`   | `string` | Yes      | Target table name (e.g., `'trainees'`, `'events'`) |
| `records` | `Array`  | Yes      | Array of record objects matching the table schema  |

**Returns**

```ts
{ success: true; count: number }
| { success: false; error: string }
```

**Side Effects**
- Calls `revalidatePath` on paths related to the target table.

---

### `exportTableData(table: string, filters?: object)`

Fetches all records from the specified table, optionally filtered, for use in Excel download.

**Parameters**

| Name      | Type     | Required | Description                                        |
|-----------|----------|----------|----------------------------------------------------|
| `table`   | `string` | Yes      | Table to export (e.g., `'trainees'`, `'events'`)   |
| `filters` | `object` | No       | Key-value filter conditions to apply               |

**Returns**

```ts
Record<string, unknown>[]
```

**Side Effects**

None.

---

## RPC Reference Summary

The following Postgres functions are called via `supabase.rpc()`. All are defined with `SECURITY DEFINER` to bypass Row Level Security.

| RPC Function                  | Used By                          |
|-------------------------------|----------------------------------|
| `upsert_event`                | `upsertEvent`                    |
| `delete_event`                | `deleteEvent`                    |
| `update_event_time`           | `updateEventTime`                |
| `ensure_events_for_schedules` | `fetchTodaySchedules`            |
| `delete_trainer_rpc`          | `deleteTrainer`                  |
| `update_trainer_profile`      | `updateProfile`                  |
| `update_trainer_rpc`          | `updateTrainerDetails`           |
| `create_trainer`              | `upsertTrainer`, `createTrainersForImport` |
| `insert_class`                | `createTeam`                     |
| `update_class`                | `updateTeam`                     |
| `delete_class`                | `deleteTeam`                     |
| `update_class_schedule`       | `updateClassSchedule`            |
| `insert_trainee`              | `addTrainee`                     |
| `delete_trainee`              | `deleteTrainee`                  |
| `update_trainee_rpc`          | `updateTrainee`                  |
| `update_trainee_payment_rpc`  | `updateTraineePayment`           |
| `upsert_attendance`           | `saveAttendance`, `updateAttendance` |
| `bulk_upsert_attendance`      | `bulkSaveAttendance`             |
| `update_hall_rpc`             | `updateHall`                     |
