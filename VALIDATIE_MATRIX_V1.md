# VALIDATIE-MATRIX v1.0
## Planning & Rooster Validatie Regelcatalogus

**Datum:** 2026-01-10
**Status:** Definitief - Ready voor implementatie
**Scope:** Shift Groups (team planning per locatie/dag/tijd)

---

## OVERZICHT

Deze matrix definieert alle validatieregels voor het samenstellen van shift groups (teams).
Elke regel heeft:
- **Check Logic** - Wat wordt gevalideerd (SQL/TypeScript)
- **Severity** - BLOCK (hard blocker) of WARN (waarschuwing)
- **Override** - Wie mag overrulen en onder welke voorwaarden
- **Fail Message** - Gebruikersvriendelijke foutmelding

---

## SEVERITY LEVELS

| Level | Betekenis | Gedrag UI |
|-------|-----------|-----------|
| **BLOCK** | Hard blocker - shift mag niet opgeslagen worden | Rode error, save disabled |
| **WARN** | Waarschuwing - shift mag opgeslagen met acknowledge | Oranje warning, save enabled met bevestiging |
| **INFO** | Informatief - geen blokkade | Blauwe info badge, geen impact |

---

## OVERRIDE RULES

| Rol | BLOCK regels | WARN regels | Vereisten |
|-----|--------------|-------------|-----------|
| **Admin** | Mag altijd overrulen | Mag altijd overrulen | Geen reden vereist |
| **Manager** | Mag overrulen | Mag overrulen | Reden verplicht |
| **Planner** | Geen override | Mag acknowledge | - |
| **Overig** | Geen override | Mag acknowledge | - |

---

## A. MEDEWERKERSTATUS & SUPERVISIE

### R-EMP-001: Medewerker mag ingepland worden
**Categorie:** Employee Status
**Severity:** `BLOCK`

**Check Logic:**
```sql
SELECT 1 FROM hq.employees
WHERE id = :employee_id
  AND (
    status IS NULL OR status NOT IN ('uit_dienst', 'geschorst')
  )
  AND (
    uit_dienst_per IS NULL OR uit_dienst_per > :shift_date
  )
```

**Fail Message:**
"Medewerker is niet actief of uit dienst per {datum}."

**Override:** Admin zonder reden, Manager met reden

---

### R-EMP-002: Werkdagen beschikbaarheid
**Categorie:** Employee Availability
**Severity:** `WARN`

**Check Logic:**
```typescript
// shift_date.weekday (0=zo, 1=ma, ..., 6=za)
const weekday = shift_date.getDay();
const workDays = employee.work_days; // Array of numbers [1,2,3,4,5]

if (!workDays.includes(weekday)) {
  return {
    valid: false,
    message: `Medewerker werkt normaliter niet op ${dayNames[weekday]}.`
  };
}
```

**Fail Message:**
"Medewerker werkt normaliter niet op {dag}."

**Override:** Manager/Admin mag overrulen met reden

**Rationale:**
Soms zijn uitzonderingen nodig (vervanging, ziekte, etc.)

---

### R-EMP-003: Supervisie vereist voor stagiairs/werkstudenten
**Categorie:** Supervision Requirements
**Severity:** `BLOCK`

**Check Logic:**
```sql
-- Check of supervisie vereist is
SELECT 1 FROM hq.vw_employee_supervision_snapshot
WHERE employee_id = :employee_id
  AND needs_supervisor = true
  AND supervision_requirement_met = false;

-- Als deze query rijen retourneert = supervisie ontbreekt

-- Alternatief: check binnen shift_group_assignments
SELECT 1
FROM hq.shift_group_assignments sga
WHERE sga.shift_group_id = :shift_group_id
  AND sga.employee_id = :employee_id
  AND NOT EXISTS (
    SELECT 1
    FROM hq.shift_group_assignments sup
    WHERE sup.shift_group_id = sga.shift_group_id
      AND sup.is_supervisor = true
      AND (
        sup.supervises_employee_id = sga.employee_id
        OR sup.supervises_employee_id IS NULL -- algemene supervisor
      )
  );
```

**Fail Message:**
"Supervisie vereist: voeg een supervisor toe aan dit team voor {naam}."

**Override:** Geen - veiligheidsregel

**Related Rules:** R-EMP-004

---

### R-EMP-004: Supervisor moet bevoegd zijn
**Categorie:** Supervision Qualifications
**Severity:** `BLOCK`

**Check Logic:**
```sql
SELECT 1 FROM hq.shift_group_assignments sga
JOIN hq.employees e ON sga.employee_id = e.id
WHERE sga.shift_group_id = :shift_group_id
  AND sga.is_supervisor = true
  AND e.can_supervise = false;
```

**Fail Message:**
"Gekozen supervisor {naam} is niet bevoegd als supervisor."

**Override:** Geen - complianceregel

---

### R-EMP-005: Onboarding status beperkingen
**Categorie:** Onboarding Safety
**Severity:** `WARN` (start) / `BLOCK` (solo-behandelaar)

**Check Logic:**
```typescript
// Check 1: In onboarding?
if (employee.onboarding_status === 'start' ||
    employee.onboarding_status === 'in_progress') {

  // Check 2: Mag niet als solo behandelaar
  if (assignment.role_in_group === 'behandelaar') {
    const hasOtherBehandelaar = assignments.some(a =>
      a.role_in_group === 'behandelaar' &&
      a.employee_id !== employee.id
    );

    if (!hasOtherBehandelaar) {
      return {
        valid: false,
        severity: 'BLOCK',
        message: 'Onboarding: medewerker kan niet als solo-behandelaar ingepland worden.'
      };
    }
  }

  // Check 3: Waarschuwing voor complexe procedures
  if (procedures.some(p => p.complexity_level === 'hoogcomplex')) {
    return {
      valid: false,
      severity: 'WARN',
      message: 'Let op: medewerker in onboarding voor hoogcomplexe procedures.'
    };
  }
}
```

**Fail Message:**
- BLOCK: "Onboarding: medewerker kan niet als solo-behandelaar ingepland worden."
- WARN: "Let op: medewerker in onboarding voor hoogcomplexe procedures."

**Override:** Admin/Manager mag WARN overrulen, BLOCK alleen Admin

---

## B. ROLLEN-COMBINATIES & TEAMOPBOUW

### R-TEAM-001: Minimaal 1 behandelaar voor behandelkamers
**Categorie:** Team Composition
**Severity:** `BLOCK`

**Check Logic:**
```sql
-- Check of er behandelkamers zijn zonder behandelaar
SELECT sg.id, sg.venue_id, sg.date
FROM hq.shift_groups sg
WHERE sg.id = :shift_group_id
  AND EXISTS (
    -- Behandelkamer aanwezig in group
    SELECT 1
    FROM hq.shift_group_assignments sga
    JOIN public.rooms r ON sga.primary_room_id = r.id
    WHERE sga.shift_group_id = sg.id
      AND r.type = 'Behandelkamer'
  )
  AND NOT EXISTS (
    -- Maar geen behandelaar
    SELECT 1
    FROM hq.shift_group_assignments sga
    WHERE sga.shift_group_id = sg.id
      AND sga.role_in_group = 'behandelaar'
  );
```

**Fail Message:**
"Behandelkamer gepland zonder behandelaar."

**Override:** Geen - logische requirement

---

### R-TEAM-002: Assistent vereist bij behandelkamer
**Categorie:** Team Composition
**Severity:** `BLOCK`

**Check Logic:**
```sql
SELECT sg.id
FROM hq.shift_groups sg
WHERE sg.id = :shift_group_id
  AND EXISTS (
    -- Behandelkamer aanwezig
    SELECT 1
    FROM hq.shift_group_assignments sga
    JOIN public.rooms r ON sga.primary_room_id = r.id
    WHERE sga.shift_group_id = sg.id
      AND r.type = 'Behandelkamer'
  )
  AND NOT EXISTS (
    -- Geen assistent
    SELECT 1
    FROM hq.shift_group_assignments sga
    WHERE sga.shift_group_id = sg.id
      AND sga.role_in_group IN ('assistent', 'preventie_assistent')
  );
```

**Fail Message:**
"Geen assistent gekoppeld aan behandelkamer-team."

**Override:** Manager/Admin met reden (bv. "solo consulten")

**Rationale:**
Bij sommige consulten (geen behandeling) kan solo gewerkt worden.

---

### R-TEAM-003: 2 assistenten bij multi-room / zware procedures
**Categorie:** Team Optimization
**Severity:** `WARN`

**Check Logic:**
```typescript
// Multi-room check
const hasMultiRoom = assignments.some(a =>
  a.secondary_room_ids && a.secondary_room_ids.length > 0
);

// Zware procedure check (als procedures bekend)
const hasComplexProcedures = procedures.some(p =>
  ['hoogcomplex', 'complex'].includes(p.complexity_level) ||
  ['IMPL', 'SURG_EXT', 'ENDO'].includes(p.code)
);

const assistantCount = assignments.filter(a =>
  ['assistent', 'preventie_assistent'].includes(a.role_in_group)
).length;

if ((hasMultiRoom || hasComplexProcedures) && assistantCount < 2) {
  return {
    valid: false,
    severity: 'WARN',
    message: 'Multi-room of zware procedure: overweeg 2e assistent.'
  };
}
```

**Fail Message:**
"Multi-room of zware procedure: overweeg 2e assistent voor optimale workflow."

**Override:** Altijd mogelijk (WARN)

---

## C. KAMERREGELS (CONFLICTEN, MULTI-ROOM)

### R-ROOM-001: Kamer conflict - primary room uniek
**Categorie:** Room Conflicts
**Severity:** `BLOCK`

**Check Logic:**
```sql
-- Vind dubbele primary_room_id binnen shift_group
SELECT primary_room_id, COUNT(*) as conflict_count
FROM hq.shift_group_assignments
WHERE shift_group_id = :shift_group_id
  AND primary_room_id IS NOT NULL
GROUP BY primary_room_id
HAVING COUNT(*) > 1;
```

**Fail Message:**
"Kamerconflict: kamer {naam} wordt door {aantal} personen tegelijk als primary gebruikt."

**Override:** Geen - fysieke onmogelijkheid

---

### R-ROOM-002: Secondary rooms mogen niet elkaars primary zijn
**Categorie:** Room Conflicts
**Severity:** `BLOCK`

**Check Logic:**
```sql
-- Check of secondary_room van A primiary is van B
SELECT
  a1.employee_id as person_a,
  a2.employee_id as person_b,
  a2.primary_room_id as conflicted_room
FROM hq.shift_group_assignments a1
JOIN hq.shift_group_assignments a2
  ON a1.shift_group_id = a2.shift_group_id
  AND a1.id != a2.id
WHERE a1.shift_group_id = :shift_group_id
  AND a2.primary_room_id = ANY(a1.secondary_room_ids);
```

**Fail Message:**
"Kamerconflict: secondary room van {naam A} is primary van {naam B}."

**Override:** Geen - fysieke onmogelijkheid

---

### R-ROOM-003: Room moet bij venue horen
**Categorie:** Room Validation
**Severity:** `BLOCK`

**Check Logic:**
```sql
SELECT sga.id, sga.employee_id, r.naam as room_naam
FROM hq.shift_group_assignments sga
JOIN hq.shift_groups sg ON sga.shift_group_id = sg.id
JOIN public.rooms r ON sga.primary_room_id = r.id
WHERE sga.shift_group_id = :shift_group_id
  AND r.venue_id != sg.venue_id;
```

**Fail Message:**
"Kamer {naam} hoort niet bij locatie {venue naam}."

**Override:** Geen - data integriteit

---

## D. SKILLS & PROCEDURE-REQUIREMENTS

### R-SKILL-001: Procedure vereist skill level
**Categorie:** Skill Requirements
**Severity:** `BLOCK`

**Check Logic:**
```sql
-- Voor elke procedure in de shift: check of team skills dekt
WITH required_skills AS (
  SELECT
    psr.procedure_id,
    psr.skill_id,
    psr.required_level,
    p.code as procedure_code,
    p.naam as procedure_naam,
    s.naam as skill_naam
  FROM hq.procedure_skill_requirements psr
  JOIN hq.procedures p ON psr.procedure_id = p.id
  JOIN hq.skills s ON psr.skill_id = s.id
  WHERE psr.is_active = true
    AND p.code = ANY(:planned_procedure_codes)
),
team_skills AS (
  SELECT DISTINCT
    es.skill_id,
    MAX(es.level_ordinal) as max_level
  FROM hq.shift_group_assignments sga
  JOIN hq.employee_skills es ON sga.employee_id = es.employee_id
  WHERE sga.shift_group_id = :shift_group_id
    AND es.is_actief = true
    AND (es.certificaat_verloopt_op IS NULL
         OR es.certificaat_verloopt_op >= :shift_date)
  GROUP BY es.skill_id
)
SELECT
  rs.procedure_naam,
  rs.skill_naam,
  rs.required_level
FROM required_skills rs
LEFT JOIN team_skills ts ON rs.skill_id = ts.skill_id
WHERE ts.skill_id IS NULL -- skill ontbreekt
  OR ts.max_level < skill_level_ordinal(rs.required_level);
```

**Helper Function:**
```sql
CREATE OR REPLACE FUNCTION skill_level_ordinal(level TEXT)
RETURNS INTEGER AS $$
  SELECT CASE level
    WHEN 'beginner' THEN 1
    WHEN 'intermediate' THEN 2
    WHEN 'expert' THEN 3
    WHEN 'master' THEN 4
    ELSE 0
  END;
$$ LANGUAGE SQL IMMUTABLE;
```

**Fail Message:**
"Skill/certificaat ontbreekt of onvoldoende niveau: {procedure} vereist {skill} ({level})."

**Override:** Admin met reden (noodsituatie)

---

### R-SKILL-002: Delegatie vereist skill bij assistent
**Categorie:** Skill Requirements (Delegation)
**Severity:** `BLOCK`

**Check Logic:**
```typescript
// Check voor gedelegeerde handelingen
const delegatedProcedures = procedures.filter(p =>
  p.delegatable === true ||
  ['ANEST', 'WOUND', 'IOSCAN'].includes(p.code)
);

for (const proc of delegatedProcedures) {
  const assistants = assignments.filter(a =>
    ['assistent', 'preventie_assistent'].includes(a.role_in_group)
  );

  const hasQualifiedAssistant = assistants.some(a => {
    const skills = employeeSkills[a.employee_id];
    return skills.some(s =>
      s.procedure_id === proc.id &&
      s.delegatie_toegestaan === true &&
      (!s.certificaat_verloopt_op || s.certificaat_verloopt_op >= shift_date)
    );
  });

  if (!hasQualifiedAssistant) {
    return {
      valid: false,
      message: `Delegatie niet toegestaan: geen gekwalificeerde assistent voor ${proc.naam}.`
    };
  }
}
```

**Fail Message:**
"Delegatie niet toegestaan: geen gekwalificeerde assistent voor {procedure}."

**Override:** Geen - wettelijke requirement

---

## E. TICKETS/STORINGEN IMPACT (KAMER/ASSET BLOKKADES)

### R-ASSET-001: Kamer geblokkeerd door storing-ticket
**Categorie:** Asset Availability
**Severity:** `BLOCK`

**Check Logic:**
```sql
-- Check blocking tickets voor kamers in shift
SELECT
  t.id as ticket_id,
  t.titel,
  r.naam as room_naam,
  t.priority,
  t.status
FROM hq.shift_group_assignments sga
JOIN public.rooms r ON sga.primary_room_id = r.id
JOIN public.tickets t ON (
  t.room_id = r.id
  OR t.venue_id = r.venue_id
)
WHERE sga.shift_group_id = :shift_group_id
  AND t.status IN ('open', 'in_behandeling', 'urgent')
  AND t.ticket_type IN ('storing', 'onderhoud')
  AND t.blocks_usage = true;
```

**Fail Message:**
"Kamer {naam} geblokkeerd door storing (ticket #{nummer}: {titel})."

**Override:** Admin met reden (alternatieve kamer beschikbaar)

---

### R-ASSET-002: Asset status blokkeert mogelijk inzet
**Categorie:** Asset Status
**Severity:** `WARN`

**Check Logic:**
```sql
SELECT
  a.naam as asset_naam,
  a.status,
  r.naam as room_naam
FROM public.assets a
JOIN public.rooms r ON a.huidige_locatie_room_id = r.id
JOIN hq.shift_group_assignments sga ON sga.primary_room_id = r.id
WHERE sga.shift_group_id = :shift_group_id
  AND a.is_kritisch = true
  AND a.status IN ('Storing', 'Onderhoud', 'Defect');
```

**Fail Message:**
"Let op: kritisch apparaat {naam} in kamer {kamer} heeft status {status}."

**Override:** Altijd mogelijk (WARN)

---

## F. TIJDREGELS (ROSTER_CONSTRAINTS)

### R-TIME-001: Minimum rusttijd tussen shifts
**Categorie:** Work Time Regulations
**Severity:** `BLOCK`

**Check Logic:**
```sql
-- Check voor elke medewerker: vorige shift vs nieuwe shift
WITH prev_shift AS (
  SELECT
    sga.employee_id,
    MAX(sg.end_at) as last_shift_end
  FROM hq.shift_group_assignments sga
  JOIN hq.shift_groups sg ON sga.shift_group_id = sg.id
  WHERE sga.employee_id = :employee_id
    AND sg.end_at < :new_shift_start
  GROUP BY sga.employee_id
)
SELECT
  ps.employee_id,
  ps.last_shift_end,
  :new_shift_start as new_shift_start,
  EXTRACT(EPOCH FROM (:new_shift_start - ps.last_shift_end)) / 3600 as hours_rest,
  rc.min_rest_hours
FROM prev_shift ps
CROSS JOIN hq.roster_constraints rc
WHERE rc.constraint_type = 'min_rest_hours'
  AND EXTRACT(EPOCH FROM (:new_shift_start - ps.last_shift_end)) / 3600 < rc.min_rest_hours;
```

**Fail Message:**
"Rusttijd te kort: {uren} uur tussen shifts (minimum {min} uur vereist)."

**Override:** Admin met reden (noodsituatie)

---

### R-TIME-002: Maximum opeenvolgende werkdagen
**Categorie:** Work Time Regulations
**Severity:** `WARN`

**Check Logic:**
```sql
-- Tel consecutieve werkdagen in window (bv. 14 dagen)
WITH shift_dates AS (
  SELECT DISTINCT
    sga.employee_id,
    sg.date
  FROM hq.shift_group_assignments sga
  JOIN hq.shift_groups sg ON sga.shift_group_id = sg.id
  WHERE sga.employee_id = :employee_id
    AND sg.date BETWEEN (:shift_date - INTERVAL '14 days') AND :shift_date
  ORDER BY sg.date
),
consecutive_days AS (
  SELECT
    employee_id,
    date,
    date - (ROW_NUMBER() OVER (ORDER BY date))::INTEGER * INTERVAL '1 day' as group_id
  FROM shift_dates
)
SELECT
  employee_id,
  COUNT(*) as consecutive_count,
  MIN(date) as streak_start,
  MAX(date) as streak_end
FROM consecutive_days
GROUP BY employee_id, group_id
HAVING COUNT(*) > (
  SELECT max_consecutive_days
  FROM hq.roster_constraints
  WHERE constraint_type = 'max_consecutive_days'
  LIMIT 1
);
```

**Fail Message:**
"Te veel opeenvolgende werkdagen: {aantal} dagen vanaf {startdatum} (max {max} aanbevolen)."

**Override:** Altijd mogelijk (WARN)

---

## G. FINANCIËLE CHECKS (MANAGEMENT ONLY)

### R-FIN-001: Cost coverage check
**Categorie:** Financial Planning
**Severity:** `WARN` (INFO voor niet-management)

**Visibility:** Alleen tonen aan Admin/Manager/Directie

**Check Logic:**
```sql
-- Bereken kosten vs verwachte omzet per shift_group
WITH shift_costs AS (
  SELECT
    sg.id as shift_group_id,
    SUM(rc.cost_per_hour *
        EXTRACT(EPOCH FROM (sg.end_at - sg.start_at)) / 3600
    ) as total_room_costs
  FROM hq.shift_groups sg
  JOIN hq.shift_group_assignments sga ON sg.id = sga.shift_group_id
  JOIN hq.room_costs rc ON (
    rc.room_id = sga.primary_room_id
    AND rc.venue_id = sg.venue_id
    AND rc.is_active = true
  )
  WHERE sg.id = :shift_group_id
  GROUP BY sg.id
),
expected_revenue AS (
  -- Voor MVP: schatting op basis van shift duur en procedures
  -- Later: gekoppeld aan daadwerkelijke afspraken
  SELECT
    sg.id as shift_group_id,
    SUM(pra.revenue_per_unit *
        (EXTRACT(EPOCH FROM (sg.end_at - sg.start_at)) / 60.0) /
        NULLIF(pra.avg_minutes, 0)
    ) as estimated_revenue
  FROM hq.shift_groups sg
  CROSS JOIN hq.planning_revenue_assumptions pra
  WHERE sg.id = :shift_group_id
    AND pra.is_active = true
  GROUP BY sg.id
)
SELECT
  sc.shift_group_id,
  sc.total_room_costs,
  er.estimated_revenue,
  (er.estimated_revenue / NULLIF(sc.total_room_costs, 0) * 100) as coverage_percentage
FROM shift_costs sc
JOIN expected_revenue er ON sc.shift_group_id = er.shift_group_id
WHERE (er.estimated_revenue / NULLIF(sc.total_room_costs, 0) * 100) < 100;
```

**Fail Message:**
"Planning dekt kosten mogelijk niet (dekking {percentage}%). Let op: dit is een schatting."

**Override:** Altijd mogelijk (WARN/INFO)

**Rationale:**
Financiële checks zijn informatief, nooit blokkerende. Helpt management bij capacity planning.

---

## IMPLEMENTATIE PRIORITEIT

### Phase 1 (MVP - Direct implementeren)
- ✅ R-EMP-001 (status check)
- ✅ R-EMP-003 (supervisie vereist)
- ✅ R-EMP-004 (supervisor bevoegd)
- ✅ R-TEAM-001 (behandelaar aanwezig)
- ✅ R-ROOM-001 (primary conflict)
- ✅ R-ROOM-003 (venue match)

### Phase 2 (Na procedures/skills seed)
- R-SKILL-001 (skill requirements)
- R-SKILL-002 (delegatie)
- R-TEAM-002 (assistent vereist)

### Phase 3 (Advanced)
- R-EMP-002 (werkdagen)
- R-EMP-005 (onboarding)
- R-TEAM-003 (2e assistent)
- R-ROOM-002 (secondary conflicts)
- R-ASSET-001 (tickets)
- R-ASSET-002 (asset status)
- R-TIME-001 (rusttijd)
- R-TIME-002 (max dagen)

### Phase 4 (Management features)
- R-FIN-001 (cost coverage)

---

## DATABASE SUPPORT CHECKLIST

| Regel | Database Ready | Seed Data | Views/Functions |
|-------|---------------|-----------|-----------------|
| R-EMP-001 | ✅ | ✅ | - |
| R-EMP-002 | ✅ | ✅ | - |
| R-EMP-003 | ✅ | ✅ | ✅ vw_employee_supervision_snapshot |
| R-EMP-004 | ✅ | ✅ | ✅ vw_employee_supervision_snapshot |
| R-EMP-005 | ✅ | ✅ | - |
| R-TEAM-001 | ✅ | ✅ | - |
| R-TEAM-002 | ✅ | ✅ | - |
| R-TEAM-003 | ✅ | ✅ | - |
| R-ROOM-001 | ✅ | ✅ | - |
| R-ROOM-002 | ✅ | ✅ | - |
| R-ROOM-003 | ✅ | ✅ | - |
| R-SKILL-001 | ✅ | ⚠️ Leeg | ⏳ skill_level_ordinal() |
| R-SKILL-002 | ✅ | ⚠️ Leeg | - |
| R-ASSET-001 | ✅ | ✅ | ⏳ v_tickets_blocking_rooms |
| R-ASSET-002 | ✅ | ✅ | - |
| R-TIME-001 | ✅ | ⏳ constraints | - |
| R-TIME-002 | ✅ | ⏳ constraints | - |
| R-FIN-001 | ✅ | ✅ 8 procedures | - |

**Legenda:**
- ✅ Compleet en ready
- ⚠️ Schema ready, data leeg (moet nog geconfigureerd worden)
- ⏳ Moet nog gemaakt worden

---

## VOORBEELD VALIDATIE FLOW

```typescript
// Voorbeeld: valideer een shift_group voor opslaan
async function validateShiftGroup(shiftGroupId: string) {
  const results: ValidationResult[] = [];

  // Run alle BLOCK regels eerst
  results.push(await runRule('R-EMP-001', shiftGroupId));
  results.push(await runRule('R-EMP-003', shiftGroupId));
  results.push(await runRule('R-TEAM-001', shiftGroupId));
  results.push(await runRule('R-ROOM-001', shiftGroupId));

  // Als BLOCK failures: stop
  const blockFailures = results.filter(r =>
    !r.valid && r.severity === 'BLOCK'
  );
  if (blockFailures.length > 0) {
    return { canSave: false, errors: blockFailures };
  }

  // Run WARN regels
  results.push(await runRule('R-EMP-002', shiftGroupId));
  results.push(await runRule('R-TEAM-003', shiftGroupId));
  results.push(await runRule('R-FIN-001', shiftGroupId));

  const warnings = results.filter(r =>
    !r.valid && r.severity === 'WARN'
  );

  return {
    canSave: true,
    errors: blockFailures,
    warnings: warnings
  };
}
```

---

## AUDIT LOGGING

Bij override van regels:
```sql
INSERT INTO hq.validation_overrides (
  shift_group_id,
  rule_code,
  overridden_by_user_id,
  reason,
  original_severity,
  created_at
) VALUES (
  :shift_group_id,
  'R-TEAM-002',
  :user_id,
  'Solo consulten, geen behandeling gepland',
  'BLOCK',
  NOW()
);
```

---

## TOEKOMSTIGE UITBREIDINGEN

- **R-EMP-006** - Verlof/afwezigheid check (koppeling met verlof-module)
- **R-EMP-007** - Contract uren limiet (max uren per week)
- **R-SKILL-003** - Auto-suggestie optimaal team op basis van skills
- **R-EQUIP-001** - Specifieke apparatuur vereist voor procedure
- **R-PATIENT-001** - Patient speciale requirements (bv. rolstoel → geschikte kamer)
- **R-PROTO-001** - Protocol compliance (specifieke workflows per procedure)

---

## CHANGELOG

| Datum | Versie | Wijziging |
|-------|--------|-----------|
| 2026-01-10 | 1.0 | Initial release - 17 regels gedefinieerd |

---

**Einde Validatie-Matrix v1.0**
