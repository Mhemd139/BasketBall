# Head Coach Role Selection Feature

> **Status:** Not yet implemented. This document describes the desired feature for future implementation.

## Problem

Currently, when the head coach adds a new trainer via the Admin panel, the new person is always assigned `role='trainer'`. There is no way to promote someone to `headcoach` through the UI — head coach status is determined by a **hardcoded phone number array** in `verifyOTP()`.

This means:
- Only the two hardcoded phone numbers can ever be head coaches
- If a new head coach needs to be added, a code change + deployment is required
- There's no way to delegate admin access dynamically

## Desired Behavior

When the head coach clicks "Add Trainer" in the Admin panel (`/head-coach`):

1. Enter the phone number and name (existing flow)
2. **New step:** A role selector appears asking:
   - **"Head Coach" (رئيس المدربين / מאמן ראשי)** — full admin access
   - **"Trainer" (مدرب / מאמן)** — regular trainer access (default)
3. The selected role is saved to the `trainers.role` column in the database
4. When that person logs in via OTP, their role is read from the DB instead of the hardcoded array

## Current Architecture

### Files involved:

| File | What it does |
|------|-------------|
| `src/app/actions.ts` — `verifyOTP()` (line ~227) | Checks `HEAD_COACH_NUMBERS` array to determine role |
| `src/app/actions.ts` — `upsertTrainer()` (line ~292) | Creates/updates trainer, does NOT set role |
| `src/components/admin/TrainerManager.tsx` | UI for adding trainers — phone + name form only |
| `src/lib/session.ts` | Signs/verifies session with `{ id, name, role }` |

### Hardcoded head coach numbers:
```ts
// In verifyOTP(), line ~227
const HEAD_COACH_NUMBERS = ['972543299106', '972587131002']
const isHeadCoach = HEAD_COACH_NUMBERS.includes(cleanPhone)
```

### Database:
- `trainers` table already has a `role` column (values: `'admin'`, `'sub_trainer'`)
- Need to standardize to `'headcoach'` and `'trainer'` to match the session

## Implementation Plan

### Step 1: Database Migration
```sql
-- Standardize existing role values
UPDATE trainers SET role = 'headcoach' WHERE phone IN ('972543299106', '972587131002');
UPDATE trainers SET role = 'trainer' WHERE role IS NULL OR role NOT IN ('headcoach', 'trainer');

-- Optionally add a constraint
ALTER TABLE trainers ADD CONSTRAINT trainers_role_check
  CHECK (role IN ('headcoach', 'trainer'));
```

### Step 2: Modify `upsertTrainer()` in `src/app/actions.ts`
```ts
// Add role parameter
export async function upsertTrainer(phone: string, name: string, role: 'headcoach' | 'trainer' = 'trainer') {
    // ... existing validation ...

    if (existing) {
        // Update name AND role
        await supabase.from('trainers')
            .update({ name_en: name, name_ar: name, name_he: name, role })
            .eq('id', existing.id)
    } else {
        // Create via RPC, then update name + role
        await supabase.rpc('create_trainer', { p_phone: cleanPhone })
        await supabase.from('trainers')
            .update({ name_en: name, name_ar: name, name_he: name, role })
            .eq('phone', cleanPhone)
    }
}
```

### Step 3: Modify `verifyOTP()` in `src/app/actions.ts`
```ts
// REMOVE hardcoded phone array
// INSTEAD, read role from DB:
const role = trainer.role === 'headcoach' ? 'headcoach' : 'trainer'

const sessionToken = await sign({
    id: trainer.id,
    name: trainer.name_ar || trainer.name_en || 'Trainer',
    role
})
```

### Step 4: Modify `TrainerManager.tsx`
Add a role selector to the "Add Trainer" modal:

```tsx
// New state
const [selectedRole, setSelectedRole] = useState<'trainer' | 'headcoach'>('trainer')

// In the form, after name input:
<div className="space-y-2">
    <label>الدور / תפקיד</label>
    <div className="flex gap-2">
        <button
            onClick={() => setSelectedRole('trainer')}
            className={selectedRole === 'trainer' ? 'active' : ''}
        >
            مدرب / מאמן
        </button>
        <button
            onClick={() => setSelectedRole('headcoach')}
            className={selectedRole === 'headcoach' ? 'active' : ''}
        >
            رئيس المدربين / מאמן ראשי
        </button>
    </div>
</div>

// Pass to action:
await upsertTrainer(phone, name, selectedRole)
```

### Step 5: Migration Path
1. Run SQL migration to set existing head coaches' role in DB
2. Deploy code changes
3. Keep `HEAD_COACH_NUMBERS` as fallback for one release cycle
4. Remove hardcoded array after confirming DB roles work

## Security Considerations

- Only existing head coaches can promote others to head coach
- The `upsertTrainer()` action already checks `session.role !== 'headcoach'`
- Consider adding a confirmation dialog when promoting to head coach
- Consider limiting the total number of head coaches (e.g., max 5)
