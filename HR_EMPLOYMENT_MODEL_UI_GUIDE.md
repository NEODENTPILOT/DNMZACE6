# HR Employment Model UI Implementation Guide

## Overview
The HR employment model now cleanly separates **loondienst** (employment) and **ZZP** (freelance/self-employed) workers.

## Database Changes Completed

### New Fields
- `arbeidsrelatie_type` - ENUM: 'loondienst' | 'zzp' (default: 'loondienst', NOT NULL)
- `bedrijf_naam` - text (ZZP company name)
- `kvk_nummer` - text (Chamber of Commerce registration)
- `btw_nummer` - text (VAT number)
- `zzp_uurtarief` - numeric(10,2) (hourly rate excl. VAT)
- `facturatie_email` - text (invoicing email, can differ from personal email)

### Business Rules (Enforced by CHECK Constraints)
1. If `arbeidsrelatie_type = 'loondienst'` → `dienstverband_type` MUST be set
2. If `arbeidsrelatie_type = 'zzp'` → `dienstverband_type` MUST be NULL
3. `dienstverband_type` only allows: 'vast', 'tijdelijk', 'oproep', 'stage' (no more 'zzp')

### Updated View
`hq_employees_view` now includes all new fields:
- arbeidsrelatie_type
- bedrijf_naam
- kvk_nummer
- btw_nummer
- zzp_uurtarief
- facturatie_email

## UI Implementation Guidance

### Employee Form Structure

```tsx
interface EmployeeFormData {
  voornaam: string;
  achternaam: string;
  email: string;
  functie: string;
  arbeidsrelatie_type: 'loondienst' | 'zzp';

  // Loondienst fields (only if arbeidsrelatie_type === 'loondienst')
  dienstverband_type?: 'vast' | 'tijdelijk' | 'oproep' | 'stage';
  in_dienst_vanaf?: string;
  fte?: number;

  // ZZP fields (only if arbeidsrelatie_type === 'zzp')
  bedrijf_naam?: string;
  kvk_nummer?: string;
  btw_nummer?: string;
  zzp_uurtarief?: number;
  facturatie_email?: string;
}
```

### Conditional Rendering Example

```tsx
function EmployeeForm({ employee, onSave }: Props) {
  const [arbeidsrelatie, setArbeidsrelatie] = useState<'loondienst' | 'zzp'>('loondienst');

  return (
    <form onSubmit={handleSubmit}>
      {/* Basic fields */}
      <input name="voornaam" required />
      <input name="achternaam" required />
      <input name="email" type="email" required />
      <input name="functie" required />

      {/* Arbeidsrelatie type selector */}
      <select
        value={arbeidsrelatie}
        onChange={(e) => setArbeidsrelatie(e.target.value as any)}
        required
      >
        <option value="loondienst">In loondienst</option>
        <option value="zzp">ZZP / Freelance</option>
      </select>

      {/* Conditional: Loondienst fields */}
      {arbeidsrelatie === 'loondienst' && (
        <div className="loondienst-fields">
          <label>Dienstverband type *</label>
          <select name="dienstverband_type" required>
            <option value="">Selecteer...</option>
            <option value="vast">Vast</option>
            <option value="tijdelijk">Tijdelijk</option>
            <option value="oproep">Oproep</option>
            <option value="stage">Stage</option>
          </select>

          <label>In dienst vanaf</label>
          <input name="in_dienst_vanaf" type="date" />

          <label>FTE</label>
          <input name="fte" type="number" min="0" max="1" step="0.1" defaultValue="1.0" />
        </div>
      )}

      {/* Conditional: ZZP fields */}
      {arbeidsrelatie === 'zzp' && (
        <div className="zzp-fields">
          <label>Bedrijfsnaam</label>
          <input name="bedrijf_naam" placeholder="Bijv. Tandartspraktijk Jan Jansen" />

          <label>KvK nummer</label>
          <input name="kvk_nummer" placeholder="12345678" />

          <label>BTW nummer</label>
          <input name="btw_nummer" placeholder="NL123456789B01" />

          <label>Uurtarief (excl. BTW)</label>
          <input name="zzp_uurtarief" type="number" min="0" step="0.01" placeholder="75.00" />

          <label>Facturatie email</label>
          <input name="facturatie_email" type="email" placeholder="facturen@bedrijf.nl" />
        </div>
      )}

      <button type="submit">Opslaan</button>
    </form>
  );
}
```

### Validation Before Save

```typescript
function validateEmployeeData(data: EmployeeFormData): string[] {
  const errors: string[] = [];

  if (data.arbeidsrelatie_type === 'loondienst') {
    if (!data.dienstverband_type) {
      errors.push('Dienstverband type is verplicht voor loondienst');
    }
    if (!['vast', 'tijdelijk', 'oproep', 'stage'].includes(data.dienstverband_type)) {
      errors.push('Ongeldig dienstverband type');
    }
  }

  if (data.arbeidsrelatie_type === 'zzp') {
    if (data.dienstverband_type !== null && data.dienstverband_type !== undefined) {
      errors.push('Dienstverband type moet leeg zijn voor ZZP');
    }
  }

  return errors;
}
```

### Display in List/Table

```tsx
function EmployeeRow({ employee }: Props) {
  return (
    <tr>
      <td>{employee.voornaam} {employee.achternaam}</td>
      <td>{employee.functie}</td>
      <td>
        {employee.arbeidsrelatie_type === 'loondienst' ? (
          <span className="badge badge-blue">
            Loondienst ({employee.dienstverband_type})
          </span>
        ) : (
          <span className="badge badge-purple">
            ZZP {employee.bedrijf_naam && `- ${employee.bedrijf_naam}`}
          </span>
        )}
      </td>
      <td>{employee.status}</td>
    </tr>
  );
}
```

## Migration Report

### Data Changes
- **0 records migrated** from 'zzp' dienstverband_type (none existed)
- **10 employees verified** as valid loondienst records:
  - 9 employees with dienstverband_type = 'vast'
  - 1 employee with dienstverband_type = 'tijdelijk'
- **All existing employees remain valid** after migration

### Constraints Added
1. `check_arbeidsrelatie_type` - Ensures only 'loondienst' or 'zzp'
2. `check_dienstverband_type_loondienst_only` - Removes 'zzp' from allowed values
3. `check_arbeidsrelatie_consistency` - Enforces business rules

### Backwards Compatibility
- ✅ All existing employees default to 'loondienst'
- ✅ Existing dienstverband_type values remain valid
- ✅ No data loss
- ✅ ZZP fields are optional and nullable

## Testing Checklist

### Database Level
- [x] New columns exist with correct types
- [x] CHECK constraints enforce business rules
- [x] View includes all new fields
- [x] Existing data remains valid

### UI Level (To Be Implemented)
- [ ] Form shows arbeidsrelatie_type dropdown
- [ ] Conditional rendering works for loondienst/zzp
- [ ] Validation prevents invalid combinations
- [ ] Error messages are clear
- [ ] Save operation succeeds for both types
- [ ] List view displays employment type correctly

## Next Steps

1. Implement employee create/edit form (see examples above)
2. Add UI to HQEmployees page or create separate modal
3. Test creating a ZZP employee
4. Test creating a loondienst employee
5. Verify validation works on frontend and backend
6. Update existing employee records if needed (e.g., convert to ZZP)

## Database Testing Commands

```sql
-- Test creating a ZZP employee
INSERT INTO hq.employees (
  voornaam, achternaam, email, functie, arbeidsrelatie_type,
  bedrijf_naam, kvk_nummer, btw_nummer, zzp_uurtarief, facturatie_email
) VALUES (
  'Jan', 'de Vries', 'jan@dentistry.nl', 'Freelance Tandarts', 'zzp',
  'Dental Care Jan de Vries', '87654321', 'NL123456789B01', 85.00, 'facturen@jandental.nl'
);

-- Test creating a loondienst employee
INSERT INTO hq.employees (
  voornaam, achternaam, email, functie, arbeidsrelatie_type, dienstverband_type, fte
) VALUES (
  'Piet', 'Jansen', 'piet@dentistry.nl', 'Tandarts', 'loondienst', 'vast', 0.8
);

-- Should FAIL: ZZP with dienstverband_type
INSERT INTO hq.employees (
  voornaam, achternaam, functie, arbeidsrelatie_type, dienstverband_type
) VALUES (
  'Test', 'User', 'Tandarts', 'zzp', 'vast'
);

-- Should FAIL: Loondienst without dienstverband_type
INSERT INTO hq.employees (
  voornaam, achternaam, functie, arbeidsrelatie_type
) VALUES (
  'Test', 'User', 'Tandarts', 'loondienst'
);
```
