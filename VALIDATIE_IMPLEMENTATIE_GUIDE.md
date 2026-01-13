# VALIDATIE ENGINE IMPLEMENTATIE GUIDE

**Voor:** Developers die de validation engine gaan implementeren
**Status:** Ready voor implementatie
**Versie:** 1.0

---

## OVERZICHT

De validation engine valideert shift groups (teams) volgens 17 gedefinieerde regels.
Alle specificaties staan in `VALIDATIE_MATRIX_V1.md`.

**Files:**
- `VALIDATIE_MATRIX_V1.md` - Complete regelspecificaties (LEES DIT EERST!)
- `src/types/validation.ts` - TypeScript type definities
- `src/config/validationRules.json` - Machine-readable regel configuratie
- `src/services/shiftValidationService.ts` - Validation service (SKELETON)

---

## IMPLEMENTATIE ROADMAP

### Phase 1: MVP (Week 1-2)
Implementeer deze 6 regels:
- ✅ R-EMP-001 - Employee status check
- ✅ R-EMP-003 - Supervisie vereist
- ✅ R-EMP-004 - Supervisor bevoegd
- ✅ R-TEAM-001 - Behandelaar aanwezig
- ✅ R-ROOM-001 - Primary room conflict
- ✅ R-ROOM-003 - Room venue match

**Database support:** Compleet (✅)

### Phase 2: Skills & Procedures (Week 3-4)
Implementeer na skills/procedures configuratie:
- ⏳ R-SKILL-001 - Procedure skill requirements
- ⏳ R-SKILL-002 - Delegatie skills
- ⏳ R-TEAM-002 - Assistent vereist

**Database support:** Schema ready, seed data leeg (⚠️)
**Actie vereist:** Configure `hq.procedure_skill_requirements`

### Phase 3: Advanced (Week 5-6)
- ⏳ R-EMP-002 - Werkdagen beschikbaarheid
- ⏳ R-EMP-005 - Onboarding beperkingen
- ⏳ R-TEAM-003 - 2e assistent aanbevolen
- ⏳ R-ROOM-002 - Secondary room conflicts
- ⏳ R-ASSET-001 - Ticket blokkades
- ⏳ R-ASSET-002 - Asset status
- ⏳ R-TIME-001 - Minimum rusttijd
- ⏳ R-TIME-002 - Max consecutieve dagen

**Database support:** Schema ready
**Actie vereist:** Seed `hq.roster_constraints`

### Phase 4: Management (Later)
- ⏳ R-FIN-001 - Cost coverage (informatief)

---

## HOE TE GEBRUIKEN

### 1. Import de service

```typescript
import { shiftValidationService } from '@/services/shiftValidationService';
```

### 2. Valideer een shift group

```typescript
// Voor opslaan: valideer shift group
const result = await shiftValidationService.validateShiftGroup(shiftGroupId);

if (!result.canSave) {
  // Toon errors
  console.log('BLOCK errors:', result.errors);
  // Disable save button
  setSaveDisabled(true);
} else if (result.warnings.length > 0) {
  // Toon warnings met "Opslaan toch doorgaan?" dialog
  console.log('Warnings:', result.warnings);
  setShowWarningDialog(true);
}
```

### 3. Check override permissies

```typescript
const canOverride = shiftValidationService.canOverrideRule(
  'R-TEAM-002',
  currentUser.role
);

if (canOverride === 'with_reason') {
  // Toon reden veld
  setReasonRequired(true);
} else if (canOverride === 'always') {
  // Admin: geen reden nodig
  setReasonRequired(false);
} else {
  // Geen override mogelijk
  setOverrideAllowed(false);
}
```

### 4. Override een regel

```typescript
await shiftValidationService.overrideValidation(
  shiftGroupId,
  'R-TEAM-002',
  currentUser.id,
  'Solo consulten, geen behandeling gepland'
);
```

---

## VALIDATOR IMPLEMENTATIE PATTERN

Elk validator function volgt dit pattern:

```typescript
private async validateRuleXXX(context: ValidationContext): Promise<ValidationResult> {
  const rule = this.registry.getRule('R-XXX-001');
  if (!rule) throw new Error('Rule not found');

  try {
    // 1. Fetch data (employees, rooms, etc.)
    const employees = await this.fetchEmployeesForShift(context.shiftGroupId);

    // 2. Run validation logic
    const failures = employees.filter(emp => {
      // ... check logic ...
      return !isValid;
    });

    // 3. Return result
    if (failures.length > 0) {
      return {
        valid: false,
        ruleCode: rule.code,
        severity: rule.severity,
        category: rule.category,
        message: this.interpolateMessage(rule.defaultMessage, {
          naam: failures[0].naam,
          // ... template vars
        }),
        details: { failures },
        context,
      };
    }

    return {
      valid: true,
      ruleCode: rule.code,
      severity: rule.severity,
      category: rule.category,
      message: 'OK',
      context,
    };

  } catch (error) {
    // Log error but don't block (or do block, depending on rule)
    console.error(`Validation ${rule.code} failed:`, error);
    throw error;
  }
}
```

---

## DATABASE QUERIES

### Check employee status (R-EMP-001)

```typescript
const { data, error } = await supabase
  .from('hq.employees')
  .select('id, voornaam, achternaam, status, uit_dienst_per')
  .in('id', employeeIds);

// Check each employee
const invalid = data.filter(emp => {
  if (emp.status === 'uit_dienst' || emp.status === 'geschorst') return true;
  if (emp.uit_dienst_per && new Date(emp.uit_dienst_per) <= shiftDate) return true;
  return false;
});
```

### Check supervisie (R-EMP-003)

```typescript
// Use view voor snelle lookup
const { data, error } = await supabase
  .from('hq.vw_employee_supervision_snapshot')
  .select('*')
  .in('employee_id', employeeIds)
  .eq('needs_supervisor', true);

// Check if supervisor in team
for (const emp of data) {
  const hasSupervisor = context.assignments.some(a =>
    a.is_supervisor &&
    (a.supervises_employee_id === emp.employee_id || !a.supervises_employee_id)
  );

  if (!hasSupervisor) {
    failures.push(emp);
  }
}
```

### Check room conflict (R-ROOM-001)

```typescript
const roomUsage = new Map<string, string[]>();

for (const assignment of context.assignments) {
  if (!assignment.primaryRoomId) continue;

  if (!roomUsage.has(assignment.primaryRoomId)) {
    roomUsage.set(assignment.primaryRoomId, []);
  }
  roomUsage.get(assignment.primaryRoomId)!.push(assignment.employeeId);
}

// Find conflicts (room used by >1 person)
const conflicts = Array.from(roomUsage.entries()).filter(([roomId, employeeIds]) =>
  employeeIds.length > 1
);
```

---

## UI INTEGRATION

### Validation Results Component

```typescript
interface ValidationResultsProps {
  results: ValidationBatchResult;
  onOverride: (ruleCode: ValidationRuleCode, reason?: string) => void;
}

export function ValidationResults({ results, onOverride }: ValidationResultsProps) {
  return (
    <div className="space-y-4">
      {/* BLOCK errors - rood */}
      {results.errors.map(error => (
        <ValidationError
          key={error.ruleCode}
          result={error}
          canOverride={canOverrideRule(error.ruleCode, currentUser.role)}
          onOverride={onOverride}
        />
      ))}

      {/* WARN warnings - oranje */}
      {results.warnings.map(warning => (
        <ValidationWarning
          key={warning.ruleCode}
          result={warning}
          onAcknowledge={() => acknowledgeWarning(warning.ruleCode)}
        />
      ))}

      {/* Summary */}
      <div className="text-sm text-gray-500">
        {results.summary.passed} / {results.summary.totalRules} regels geslaagd
      </div>
    </div>
  );
}
```

### Save Button with Validation

```typescript
async function handleSave() {
  setSaving(true);

  // Validate
  const validation = await shiftValidationService.validateShiftGroup(shiftGroupId);

  if (!validation.canSave) {
    setValidationErrors(validation.errors);
    setSaving(false);
    return;
  }

  if (validation.warnings.length > 0) {
    setValidationWarnings(validation.warnings);
    setShowWarningDialog(true);
    setSaving(false);
    return;
  }

  // Save shift group
  await saveShiftGroup();
  setSaving(false);
}
```

---

## TESTING

### Unit Test Example

```typescript
describe('ShiftValidationService', () => {
  describe('R-EMP-001: Employee Status', () => {
    it('should block uit dienst employees', async () => {
      // Setup
      const context = createMockContext({
        assignments: [
          { employeeId: 'emp-uit-dienst', ... }
        ]
      });

      // Mock employee data
      mockSupabase({
        'hq.employees': [
          { id: 'emp-uit-dienst', status: 'uit_dienst' }
        ]
      });

      // Execute
      const result = await service.validateEmployeeStatus(context);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.severity).toBe('BLOCK');
      expect(result.message).toContain('niet actief');
    });
  });
});
```

---

## OVERRIDE AUDIT TABLE

Maak deze tabel voor audit logging:

```sql
CREATE TABLE IF NOT EXISTS hq.validation_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_group_id uuid NOT NULL REFERENCES hq.shift_groups(id) ON DELETE CASCADE,
  rule_code text NOT NULL,
  overridden_by_user_id uuid NOT NULL REFERENCES auth.users(id),
  reason text,
  original_severity text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_validation_overrides_shift_group
  ON hq.validation_overrides(shift_group_id);

CREATE INDEX idx_validation_overrides_rule_code
  ON hq.validation_overrides(rule_code);

ALTER TABLE hq.validation_overrides ENABLE ROW LEVEL SECURITY;

-- Policy: alleen lezen door authenticated users
CREATE POLICY "Authenticated users can read overrides"
  ON hq.validation_overrides FOR SELECT
  TO authenticated
  USING (true);

-- Policy: alleen schrijven door admin/manager
CREATE POLICY "Admin/Manager can insert overrides"
  ON hq.validation_overrides FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND rol IN ('admin', 'manager')
    )
  );
```

---

## HELPER FUNCTIONS

### Message Interpolation

```typescript
function interpolateMessage(template: string, vars: Record<string, any>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return vars[key] !== undefined ? String(vars[key]) : match;
  });
}

// Usage:
const message = interpolateMessage(
  'Medewerker {naam} werkt niet op {dag}.',
  { naam: 'Jan Jansen', dag: 'dinsdag' }
);
// => "Medewerker Jan Jansen werkt niet op dinsdag."
```

### Weekday Names

```typescript
const WEEKDAY_NAMES_NL = [
  'zondag',
  'maandag',
  'dinsdag',
  'woensdag',
  'donderdag',
  'vrijdag',
  'zaterdag'
];

function getWeekdayName(date: Date): string {
  return WEEKDAY_NAMES_NL[date.getDay()];
}
```

---

## PERFORMANCE TIPS

1. **Batch queries** - Haal alle employee data in 1 query op
2. **Use views** - `vw_employee_supervision_snapshot` is pre-computed
3. **Cache results** - Cache validation results voor 30 seconden
4. **Parallel validation** - Run independent rules in parallel met `Promise.all()`
5. **Early exit** - Stop bij eerste BLOCK (optioneel)

```typescript
// Parallel execution voorbeeld
const [empResult, roomResult, skillResult] = await Promise.all([
  validateEmployeeStatus(context),
  validateRoomConflicts(context),
  validateSkillRequirements(context)
]);
```

---

## TROUBLESHOOTING

### "Rule not found"
- Check of regel geregistreerd is in `initializeRules()`
- Check spelling van rule code

### "Failed to fetch data"
- Check Supabase RLS policies
- Check of tabellen/views bestaan
- Check of user authenticated is

### "Override niet toegestaan"
- Check user role in `overridePermissions`
- Check of reason verplicht is voor managers

### "Validation hangt"
- Check of alle queries een timeout hebben
- Check of er geen infinite loops zijn
- Check console voor errors

---

## NEXT STEPS

1. **Week 1:** Implementeer Phase 1 regels (6 stuks)
2. **Week 2:** Test Phase 1 grondig
3. **Week 3:** Configure skill requirements in database
4. **Week 4:** Implementeer Phase 2 regels (skills)
5. **Week 5-6:** Implementeer Phase 3 (advanced)
6. **Later:** Phase 4 (financial)

---

## SUPPORT

Bij vragen over specificaties: zie `VALIDATIE_MATRIX_V1.md` (complete specs)
Bij vragen over database: zie `SCHEMA_AANVULLING_COMPLEET.md` (database structuur)

**Belangrijk:** Elke regel in `VALIDATIE_MATRIX_V1.md` heeft:
- Exacte SQL query (waar van toepassing)
- TypeScript check logic
- Fail messages
- Override rules

Implementeer volgens spec, test grondig!

---

**Einde Guide**
