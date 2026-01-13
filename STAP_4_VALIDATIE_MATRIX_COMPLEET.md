# STAP 4: VALIDATIE-MATRIX v1.0 ✅ COMPLEET

**Datum:** 2026-01-10
**Status:** Ready voor implementatie
**Deliverables:** 100% compleet

---

## WAT IS GELEVERD

### 1. Complete Regelcatalogus
**File:** `VALIDATIE_MATRIX_V1.md` (620 regels, volledig gedocumenteerd)

- ✅ 17 validatieregels volledig gespecificeerd
- ✅ SQL queries voor elke database check
- ✅ TypeScript logic voor client-side checks
- ✅ Severity levels (BLOCK/WARN/INFO)
- ✅ Override rules per user role
- ✅ Fail messages (gebruikersvriendelijk)
- ✅ Database support checklist
- ✅ Implementatie prioriteit (4 fases)

### 2. TypeScript Type Definities
**File:** `src/types/validation.ts` (480 regels)

Volledige type safety voor:
- `ValidationResult` - Result van een regel
- `ValidationBatchResult` - Result van alle regels
- `ValidationContext` - Context data voor validaties
- `ValidationRuleDefinition` - Regel definitie
- `IValidationService` - Service interface
- Helper types voor employees, rooms, skills, etc.

### 3. Machine-Readable Config
**File:** `src/config/validationRules.json` (280 regels)

JSON schema met:
- Alle 17 regels configureerbaar
- Override permissions per role
- Category metadata (colors, icons)
- Phase grouping (1-4)
- SQL queries (waar van toepassing)

### 4. Service Skeleton
**File:** `src/services/shiftValidationService.ts` (540 regels)

Complete service structuur met:
- Registry pattern voor regels
- Batch validation functie
- Override management
- Context builder
- 17 validator stubs (ready voor implementatie)
- Helper functions

### 5. Implementatie Guide
**File:** `VALIDATIE_IMPLEMENTATIE_GUIDE.md` (400 regels)

Developer guide met:
- Implementatie roadmap (4 fases)
- Code examples voor elke validator
- UI integration patterns
- Testing examples
- Database queries
- Troubleshooting tips

---

## VALIDATIE REGELS OVERZICHT

### A. MEDEWERKERSTATUS & SUPERVISIE (5 regels)

| Code | Naam | Severity | Phase | Override |
|------|------|----------|-------|----------|
| R-EMP-001 | Medewerker mag ingepland worden | BLOCK | 1 | Admin/Manager |
| R-EMP-002 | Werkdagen beschikbaarheid | WARN | 3 | Manager+ |
| R-EMP-003 | Supervisie vereist | BLOCK | 1 | Geen |
| R-EMP-004 | Supervisor bevoegd | BLOCK | 1 | Geen |
| R-EMP-005 | Onboarding beperkingen | BLOCK/WARN | 3 | Admin |

### B. TEAMSAMENSTELLING (3 regels)

| Code | Naam | Severity | Phase | Override |
|------|------|----------|-------|----------|
| R-TEAM-001 | Behandelaar aanwezig | BLOCK | 1 | Geen |
| R-TEAM-002 | Assistent vereist | BLOCK | 2 | Manager+ |
| R-TEAM-003 | 2e assistent aanbevolen | WARN | 3 | Altijd |

### C. KAMERREGELS (3 regels)

| Code | Naam | Severity | Phase | Override |
|------|------|----------|-------|----------|
| R-ROOM-001 | Primary room uniek | BLOCK | 1 | Geen |
| R-ROOM-002 | Secondary vs primary conflict | BLOCK | 3 | Geen |
| R-ROOM-003 | Room venue match | BLOCK | 1 | Geen |

### D. SKILLS & PROCEDURES (2 regels)

| Code | Naam | Severity | Phase | Override |
|------|------|----------|-------|----------|
| R-SKILL-001 | Procedure skill requirements | BLOCK | 2 | Admin |
| R-SKILL-002 | Delegatie skills | BLOCK | 2 | Geen |

### E. ASSETS & TICKETS (2 regels)

| Code | Naam | Severity | Phase | Override |
|------|------|----------|-------|----------|
| R-ASSET-001 | Kamer geblokkeerd door ticket | BLOCK | 3 | Admin |
| R-ASSET-002 | Asset status warning | WARN | 3 | Altijd |

### F. TIJDREGELS (2 regels)

| Code | Naam | Severity | Phase | Override |
|------|------|----------|-------|----------|
| R-TIME-001 | Minimum rusttijd | BLOCK | 3 | Admin |
| R-TIME-002 | Max consecutieve dagen | WARN | 3 | Altijd |

### G. FINANCIEEL (1 regel)

| Code | Naam | Severity | Phase | Override |
|------|------|----------|-------|----------|
| R-FIN-001 | Cost coverage check | WARN | 4 | Altijd |

**Totaal: 17 regels**

---

## IMPLEMENTATIE FASES

### Phase 1: MVP (Week 1-2) - 6 regels
Direct implementeerbaar, database compleet:
- ✅ R-EMP-001 - Status check
- ✅ R-EMP-003 - Supervisie
- ✅ R-EMP-004 - Supervisor bevoegd
- ✅ R-TEAM-001 - Behandelaar
- ✅ R-ROOM-001 - Room conflict
- ✅ R-ROOM-003 - Room venue

**Database Ready:** 100%
**Effort:** 2-3 dagen implementatie + 2 dagen testing

### Phase 2: Skills (Week 3-4) - 3 regels
Vereist skill configuratie:
- ⏳ R-SKILL-001 - Skills vereist
- ⏳ R-SKILL-002 - Delegatie
- ⏳ R-TEAM-002 - Assistent

**Database Ready:** Schema compleet, data leeg
**Actie vereist:** Configure `hq.procedure_skill_requirements`
**Effort:** 1 dag configuratie + 2-3 dagen implementatie

### Phase 3: Advanced (Week 5-6) - 7 regels
Geavanceerde checks:
- ⏳ R-EMP-002, R-EMP-005 - Werkdagen, onboarding
- ⏳ R-TEAM-003 - 2e assistent
- ⏳ R-ROOM-002 - Secondary conflicts
- ⏳ R-ASSET-001, R-ASSET-002 - Tickets/assets
- ⏳ R-TIME-001, R-TIME-002 - Tijdregels

**Database Ready:** Schema compleet
**Actie vereist:** Seed `hq.roster_constraints`
**Effort:** 4-5 dagen implementatie + 2 dagen testing

### Phase 4: Management (Later) - 1 regel
Informatief:
- ⏳ R-FIN-001 - Cost coverage

**Database Ready:** 100%
**Effort:** 1 dag implementatie

---

## OVERRIDE MATRIX

| Rol | BLOCK Override | WARN Override | Vereisten |
|-----|----------------|---------------|-----------|
| **Admin** | ✅ Altijd (geen reden) | ✅ Altijd | Geen |
| **Manager** | ✅ Met reden | ✅ Altijd | Reason text verplicht |
| **Planner** | ❌ Geen | ⚠️ Acknowledge only | - |
| **User** | ❌ Geen | ⚠️ Acknowledge only | - |

**Uitzonderingen (NOOIT override):**
- R-EMP-003 - Supervisie (compliance)
- R-EMP-004 - Supervisor bevoegd (compliance)
- R-SKILL-002 - Delegatie (wettelijk)
- R-ROOM-001/002/003 - Room conflicts (fysiek onmogelijk)
- R-TEAM-001 - Behandelaar (logisch vereist)

---

## DATABASE SUPPORT STATUS

| Component | Status | Details |
|-----------|--------|---------|
| **hq.employees** | ✅ | Alle supervisie kolommen aanwezig |
| **hq.procedures** | ✅ | 8 procedures seeded |
| **hq.procedure_skill_requirements** | ⚠️ | Schema ready, data leeg |
| **hq.shift_groups** | ✅ | Compleet |
| **hq.shift_group_assignments** | ✅ | Multi-room support |
| **rooms** | ✅ | venue_id FK toegevoegd |
| **tickets** | ✅ | room_id, venue_id FK's |
| **hq.room_costs** | ✅ | Schema ready |
| **hq.planning_revenue_assumptions** | ✅ | 8 procedures seeded |
| **hq.vw_employee_supervision_snapshot** | ✅ | View beschikbaar |

**Legenda:**
- ✅ Ready voor gebruik
- ⚠️ Schema ready, configuratie nodig
- ❌ Nog niet beschikbaar

---

## CODE USAGE EXAMPLES

### Basic Validation

```typescript
import { shiftValidationService } from '@/services/shiftValidationService';

// Valideer shift group
const result = await shiftValidationService.validateShiftGroup(shiftGroupId);

if (!result.canSave) {
  alert('Cannot save: ' + result.errors.map(e => e.message).join('\n'));
} else if (result.warnings.length > 0) {
  confirm('Warnings found. Continue anyway?');
}
```

### Check Single Rule

```typescript
const context = await buildValidationContext(shiftGroupId);
const result = await shiftValidationService.validateRule('R-EMP-001', context);

if (!result.valid) {
  console.log('Rule failed:', result.message);
}
```

### Override Rule

```typescript
await shiftValidationService.overrideValidation(
  shiftGroupId,
  'R-TEAM-002',
  currentUser.id,
  'Solo consulten, geen behandeling gepland'
);
```

---

## UI INTEGRATION CHECKLIST

Planning module UI moet:
- [ ] Validation results tonen (errors/warnings/info)
- [ ] Save button disablen bij BLOCK errors
- [ ] Warning dialog tonen bij WARN
- [ ] Override button tonen (indien permissie)
- [ ] Reason field tonen voor managers
- [ ] Real-time validation bij wijzigingen
- [ ] Audit log tonen (overrides)
- [ ] Category colors gebruiken (zie JSON config)
- [ ] Icons tonen per category

---

## TESTING CHECKLIST

Voor elke regel:
- [ ] Happy path test (valid scenario)
- [ ] Failing test (invalid scenario)
- [ ] Edge case tests
- [ ] Override tests (alle roles)
- [ ] Performance test (batch validation)
- [ ] Database query tests
- [ ] Message interpolation tests

---

## AUDIT & COMPLIANCE

### Logging Vereist

Elke override moet gelogd worden:
```sql
INSERT INTO hq.validation_overrides (
  shift_group_id,
  rule_code,
  overridden_by_user_id,
  reason,
  original_severity
) VALUES (...);
```

### Audit Reports

Management moet kunnen zien:
- Welke regels meest overruled worden
- Door wie overruled (per user)
- Met welke redenen
- Trends over tijd

---

## PERFORMANCE TARGETS

| Metric | Target | Notes |
|--------|--------|-------|
| Single rule validation | < 100ms | Per regel |
| Batch validation (Phase 1) | < 500ms | 6 regels |
| Batch validation (All) | < 2s | 17 regels |
| Database queries | < 50ms | Per query |
| Cache hit rate | > 80% | Voor repeated validations |

**Optimalisaties:**
- Batch employee queries
- Use pre-computed views
- Cache validation results (30s TTL)
- Parallel execution waar mogelijk

---

## MIGRATION CHECKLIST

Voor productie deployment:
- [ ] Alle 9 database migrations toegepast
- [ ] Validation service gedeployed
- [ ] Override audit tabel gemaakt
- [ ] RLS policies getest
- [ ] Performance getest (production-like data)
- [ ] UI integration compleet
- [ ] User training gegeven
- [ ] Documentation gepubliceerd

---

## NEXT STEPS (DEVELOPMENT)

### Week 1
1. Review `VALIDATIE_MATRIX_V1.md` grondig
2. Setup development environment
3. Implementeer R-EMP-001 (eerste regel)
4. Setup testing framework
5. Implementeer overige Phase 1 regels

### Week 2
1. Integratie testing Phase 1
2. UI integration starten
3. Override functionaliteit bouwen
4. Performance testing

### Week 3-4
1. Skills configureren in database
2. Implementeer Phase 2 regels
3. Test skill validaties grondig

### Later
- Phase 3 & 4 implementatie
- Advanced features
- Reporting & analytics

---

## FILES CREATED

| File | Regels | Doel |
|------|--------|------|
| `VALIDATIE_MATRIX_V1.md` | 620 | Complete specificaties |
| `src/types/validation.ts` | 480 | TypeScript types |
| `src/config/validationRules.json` | 280 | Machine-readable config |
| `src/services/shiftValidationService.ts` | 540 | Service implementation |
| `VALIDATIE_IMPLEMENTATIE_GUIDE.md` | 400 | Developer guide |
| `STAP_4_VALIDATIE_MATRIX_COMPLEET.md` | 300 | Deze samenvatting |

**Totaal:** ~2620 regels documentatie + code

---

## BUILD STATUS

✅ **Project builds zonder errors**
✅ **Geen UI wijzigingen (zoals gevraagd)**
✅ **Geen refactors (zoals gevraagd)**
✅ **Alleen regelcatalogus + types + skeleton**

```bash
npm run build
# ✓ 1908 modules transformed
# ✓ built in 17.85s
```

---

## CONCLUSIE

STAP 4 is **100% compleet**. Alle deliverables zijn geleverd:

1. ✅ **Regelcatalogus** - 17 regels volledig gespecificeerd
2. ✅ **Type definities** - Volledige type safety
3. ✅ **JSON config** - Machine-readable
4. ✅ **Service skeleton** - Ready voor implementatie
5. ✅ **Developer guide** - Complete implementatie instructies

**Development kan nu starten:**
- Phase 1 (6 regels) kan direct geïmplementeerd worden
- Database support is 100% ready
- Alle specs zijn duidelijk gedocumenteerd
- Code patterns zijn gedefinieerd

**Geen blokkades, ready to code!**

---

**Einde STAP 4 Samenvatting**
