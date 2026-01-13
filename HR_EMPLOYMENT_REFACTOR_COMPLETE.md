# HR Employment Model Refactor - Completion Report

**Date:** 2024-12-27
**Status:** ✅ COMPLETE
**Migration:** `20251227203000_refactor_hr_employment_model_loondienst_vs_zzp_v2.sql`

## Executive Summary

Successfully refactored the HR employment model to cleanly separate **loondienst** (employment) and **ZZP** (freelance/self-employed) workers. The migration is backwards compatible with all existing data remaining valid.

## Database Changes Implemented

### 1. New Column: `arbeidsrelatie_type`
- Type: `text NOT NULL`
- Default: `'loondienst'`
- Allowed values: `'loondienst'` | `'zzp'`
- Purpose: Primary indicator of employment relationship type

### 2. New ZZP-Specific Fields
| Field | Type | Purpose |
|-------|------|---------|
| `bedrijf_naam` | text | ZZP company/business name |
| `kvk_nummer` | text | Chamber of Commerce registration number |
| `btw_nummer` | text | VAT number (if VAT-registered) |
| `zzp_uurtarief` | numeric(10,2) | Hourly rate excluding VAT |
| `facturatie_email` | text | Invoicing email (can differ from personal) |

### 3. Updated Constraints

#### Old Constraints (REMOVED)
- `check_employees_dienstverband_type` - included 'zzp' as allowed value
- `employees_dienstverband_type_check` - duplicate constraint

#### New Constraints (ADDED)
1. **`check_arbeidsrelatie_type`**
   - Ensures only 'loondienst' or 'zzp'

2. **`check_dienstverband_type_loondienst_only`**
   - Allows: 'vast', 'tijdelijk', 'oproep', 'stage' (removed 'zzp')
   - Can be NULL

3. **`check_arbeidsrelatie_consistency`**
   - IF arbeidsrelatie_type = 'loondienst' THEN dienstverband_type NOT NULL
   - IF arbeidsrelatie_type = 'zzp' THEN dienstverband_type IS NULL

### 4. Updated View: `hq_employees_view`

**New fields exposed:**
```sql
SELECT
  e.id,
  e.user_id,
  e.voornaam,
  e.achternaam,
  e.roepnaam,
  e.geboortedatum,
  e.email,
  e.telefoon,
  e.functie,
  e.afdeling,
  e.locatie_id,
  e.arbeidsrelatie_type,        -- NEW
  e.dienstverband_type,
  e.in_dienst_vanaf,
  e.uit_dienst_per,
  e.fte,
  e.status,
  e.is_leidinggevend,
  e.toestemming_beeldmateriaal,
  e.bedrijf_naam,                -- NEW (ZZP)
  e.kvk_nummer,                  -- NEW (ZZP)
  e.btw_nummer,                  -- NEW (ZZP)
  e.zzp_uurtarief,               -- NEW (ZZP)
  e.facturatie_email,            -- NEW (ZZP)
  e.notities,
  e.created_at,
  e.updated_at,
  l.naam as locatie_naam
FROM hq.employees e
LEFT JOIN praktijk_locaties l ON e.locatie_id = l.id;
```

## Data Migration Report

### Pre-Migration State
```
Total employees: 10
├─ dienstverband_type = 'vast': 9 employees
├─ dienstverband_type = 'tijdelijk': 1 employee
└─ dienstverband_type = 'zzp': 0 employees
```

### Post-Migration State
```
Total employees: 10 (unchanged)
├─ arbeidsrelatie_type = 'loondienst': 10 employees
│  ├─ dienstverband_type = 'vast': 9 employees
│  └─ dienstverband_type = 'tijdelijk': 1 employee
└─ arbeidsrelatie_type = 'zzp': 0 employees
```

### Migration Statistics
- **Records migrated:** 0 (no 'zzp' dienstverband_type records existed)
- **Data loss:** NONE
- **Invalid records:** NONE
- **Backwards compatibility:** ✅ 100% maintained
- **All existing employees:** ✅ Remain valid after migration

## Business Rules Enforced

### Rule 1: Loondienst requires dienstverband_type
```sql
-- This is VALID
INSERT INTO hq.employees (
  voornaam, achternaam, functie,
  arbeidsrelatie_type, dienstverband_type
) VALUES (
  'Jan', 'Jansen', 'Tandarts',
  'loondienst', 'vast'
);

-- This will FAIL
INSERT INTO hq.employees (
  voornaam, achternaam, functie,
  arbeidsrelatie_type
) VALUES (
  'Jan', 'Jansen', 'Tandarts',
  'loondienst'
);
-- ERROR: arbeidsrelatie_consistency constraint violated
```

### Rule 2: ZZP cannot have dienstverband_type
```sql
-- This is VALID
INSERT INTO hq.employees (
  voornaam, achternaam, functie,
  arbeidsrelatie_type, bedrijf_naam, zzp_uurtarief
) VALUES (
  'Piet', 'Pietersen', 'Freelance Tandarts',
  'zzp', 'Dental Care Piet', 85.00
);

-- This will FAIL
INSERT INTO hq.employees (
  voornaam, achternaam, functie,
  arbeidsrelatie_type, dienstverband_type
) VALUES (
  'Piet', 'Pietersen', 'Tandarts',
  'zzp', 'vast'
);
-- ERROR: arbeidsrelatie_consistency constraint violated
```

### Rule 3: dienstverband_type only allows loondienst values
```sql
-- 'zzp' is NO LONGER allowed as dienstverband_type
INSERT INTO hq.employees (
  voornaam, achternaam, functie, dienstverband_type
) VALUES (
  'Test', 'User', 'Tandarts', 'zzp'
);
-- ERROR: check_dienstverband_type_loondienst_only constraint violated
```

## Security & Permissions

### RLS Policies
- ✅ All existing RLS policies remain unchanged
- ✅ View permissions granted to `authenticated` role
- ✅ No breaking changes to security model

### Data Access
- Frontend can query `hq_employees_view` as before
- New fields are automatically included
- NULL values for ZZP fields on loondienst employees

## Build Verification

```bash
npm run build
✓ 1816 modules transformed.
✓ built in 14.78s
✅ Build successful - no errors
```

## UI Implementation Status

### Completed
- ✅ Database schema refactored
- ✅ Data migration applied
- ✅ Constraints enforced
- ✅ View updated
- ✅ Documentation created

### Not Yet Implemented (Future Work)
- ⏳ Employee create/edit form UI
- ⏳ Conditional rendering for loondienst/zzp fields
- ⏳ Form validation in frontend
- ⏳ Employment type badges in list views

**See:** `HR_EMPLOYMENT_MODEL_UI_GUIDE.md` for complete UI implementation guidance with code examples.

## Testing Checklist

### Database Tests ✅
- [x] New columns exist with correct types
- [x] Default values applied correctly
- [x] CHECK constraints prevent invalid data
- [x] View includes all new fields
- [x] Existing data remains valid
- [x] Can query view without errors

### UI Tests ⏳ (Pending Implementation)
- [ ] Can create loondienst employee with dienstverband_type
- [ ] Can create ZZP employee with ZZP fields
- [ ] Cannot create loondienst without dienstverband_type
- [ ] Cannot create ZZP with dienstverband_type
- [ ] Conditional rendering works correctly
- [ ] Form validation shows clear error messages

## Files Created/Modified

### Database Migrations
- `supabase/migrations/20251227203000_refactor_hr_employment_model_loondienst_vs_zzp_v2.sql`

### Documentation
- `HR_EMPLOYMENT_MODEL_UI_GUIDE.md` - Complete UI implementation guide
- `HR_EMPLOYMENT_REFACTOR_COMPLETE.md` - This report

### Modified
- `hq.employees` table structure
- `hq_employees_view` view definition

## Next Steps

1. **Immediate:**
   - ✅ Database changes deployed
   - ✅ Build verified
   - ✅ Documentation complete

2. **Short-term (when UI is needed):**
   - Implement employee create/edit form
   - Add arbeidsrelatie_type selector
   - Add conditional field rendering
   - Add frontend validation

3. **Optional (as needed):**
   - Add ZZP-specific reporting
   - Add ZZP invoice generation
   - Add contract templates for both types
   - Add ZZP rate history tracking

## Rollback Plan (if needed)

If rollback is required:

```sql
-- 1. Remove CHECK constraints
ALTER TABLE hq.employees
  DROP CONSTRAINT check_arbeidsrelatie_consistency,
  DROP CONSTRAINT check_dienstverband_type_loondienst_only,
  DROP CONSTRAINT check_arbeidsrelatie_type;

-- 2. Restore old constraint
ALTER TABLE hq.employees
  ADD CONSTRAINT employees_dienstverband_type_check
  CHECK (dienstverband_type IN ('vast', 'tijdelijk', 'oproep', 'zzp', 'stage'));

-- 3. Remove new columns (WARNING: data loss)
ALTER TABLE hq.employees
  DROP COLUMN arbeidsrelatie_type,
  DROP COLUMN bedrijf_naam,
  DROP COLUMN kvk_nummer,
  DROP COLUMN btw_nummer,
  DROP COLUMN zzp_uurtarief,
  DROP COLUMN facturatie_email;

-- 4. Restore old view
DROP VIEW hq_employees_view;
CREATE VIEW hq_employees_view AS
SELECT
  id, user_id, voornaam, achternaam, email, functie,
  afdeling, dienstverband_type, status, fte, locatie_id,
  in_dienst_vanaf, uit_dienst_per, created_at, updated_at
FROM hq.employees e;
```

⚠️ **Note:** Rollback will lose any ZZP data entered. Only rollback if no ZZP employees have been created.

## Conclusion

The HR employment model refactor is **successfully completed** with:
- Clean separation between loondienst and ZZP
- Strong data integrity through CHECK constraints
- Full backwards compatibility
- No data loss
- Build verification passed
- Comprehensive documentation for UI implementation

The system is ready for UI development when needed.
