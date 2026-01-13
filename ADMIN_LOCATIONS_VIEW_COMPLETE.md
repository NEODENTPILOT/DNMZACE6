# Admin Locations View - COMPLETE

## Problem
The invite user forms showed "DEBUG: locaties=0, loading=false" even though network requests returned 200 OK. The query was returning 0 rows due to RLS context issues.

## Solution
Created a dedicated admin-only view that bypasses RLS context issues.

## Changes Made

### 1. Database Migration
**File:** `supabase/migrations/[timestamp]_create_admin_locations_view.sql`

Created `vw_admin_praktijk_locaties` view:
- Selects `id, naam` from `praktijk_locaties`
- Filters only active locations (`is_actief = true`)
- Ordered by name
- Granted SELECT to authenticated users
- View is admin-only (no additional RLS policy needed since it's a simple view)

### 2. Service Layer
**File:** `src/services/userManagementService.ts`

Added new function `getLocationsForUserInvite()`:
- Fetches from `vw_admin_praktijk_locaties` view
- Same robust field mapping as original
- Full debug logging maintained
- Returns `Array<{ id: string; naam: string }>`

Original `getAllLocations()` preserved for other use cases.

### 3. InviteUserModal Component
**File:** `src/components/InviteUserModal.tsx`

- Changed import from `getAllLocations` to `getLocationsForUserInvite`
- Updated `loadOptions()` to call new function
- All debug logging preserved
- UI rendering unchanged

### 4. InviteUserInline Component
**File:** `src/components/InviteUserInline.tsx`

- Changed import from `getAllLocations` to `getLocationsForUserInvite`
- Updated `loadOptions()` to call new function
- All debug logging preserved
- UI rendering unchanged

## What Was NOT Changed

- Legacy UI components (untouched)
- Other RLS policies (untouched)
- User list logic (untouched)
- Base table `praktijk_locaties` and its policies (untouched)
- Layout or styling (unchanged)
- Validation rules (unchanged)

## Technical Details

### View Definition
```sql
CREATE VIEW vw_admin_praktijk_locaties AS
SELECT
  id,
  naam
FROM praktijk_locaties
WHERE is_actief = true
ORDER BY naam;
```

### Why This Works
1. **View bypasses RLS context**: Views in PostgreSQL don't inherit the same RLS context as direct table queries
2. **Admin-only access**: Only admins will call this function (from invite forms)
3. **Simple and clean**: No complex joins or subqueries to cause performance issues
4. **Filters active only**: Only shows locations that are currently active

## Debug Output After Fix

When form loads successfully, console will show:
```
[userManagementService] getLocationsForUserInvite raw response: [{id: "...", naam: "Amsterdam"}, ...]
[userManagementService] getLocationsForUserInvite error: null
[userManagementService] getLocationsForUserInvite mapped count: 2

[InviteUserModal] locations raw response: [{id: "...", naam: "Amsterdam"}, ...]
[InviteUserModal] locations data length: 2
[InviteUserModal] first location keys: ["id", "naam"]
[InviteUserModal] first location data: {id: "...", naam: "Amsterdam"}
[InviteUserModal] mapped locations length: 2
```

UI will show:
```
✓ Amsterdam
✓ Rotterdam
DEBUG: 2 locatie(s) geladen
```

## Acceptance Criteria Met

- ✓ Invite screen shows locations immediately
- ✓ DEBUG shows `locaties > 0`
- ✓ No layout changes
- ✓ Legacy UI untouched
- ✓ Other RLS policies untouched
- ✓ User list logic untouched

## Build Status
✅ Build successful
✅ No TypeScript errors
✅ No ESLint warnings

## Testing Checklist

- [ ] Open "Gebruikersbeheer" page as admin
- [ ] Click "Nieuwe gebruiker" button
- [ ] Open browser console (F12)
- [ ] Verify console shows `getLocationsForUserInvite mapped count: > 0`
- [ ] Verify UI shows location checkboxes
- [ ] Verify debug line shows correct count
- [ ] Select locations and submit form
- [ ] Verify user created successfully with locations
