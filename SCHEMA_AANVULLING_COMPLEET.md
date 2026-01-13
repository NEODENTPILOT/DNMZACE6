# SCHEMA AANVULLING COMPLEET ✅

**Datum:** 2026-01-10
**Status:** Database schema volledig aangevuld + seed data

---

## WAT IS TOEGEVOEGD

### STAP 2: Database Schema Gaps (6 migrations) ✅
1. **gap_fix_01** - Employee supervisie & onboarding (5 kolommen)
2. **gap_fix_02** - Procedures & skill requirements (2 tabellen)
3. **gap_fix_03** - Shift groups voor team planning (2 tabellen)
4. **gap_fix_04** - Rooms → venue proper FK (1 kolom)
5. **gap_fix_05** - Tickets → room/venue links (2 kolommen)
6. **gap_fix_06** - Financiële basis: room costs + revenue (2 tabellen)

### STAP 3: Seed Data + Views (3 migrations) ✅
7. **seed_procedures_basic_set** - 8 basis procedures
8. **seed_revenue_assumptions_basic** - 8 revenue assumptions
9. **create_employee_supervision_snapshot_view** - Supervision view

---

## NIEUWE DATABASE STRUCTUUR

### A. hq.employees (uitgebreid)
- `employment_stage` - regulier/stagiair/werkstudent/onder_supervisie
- `supervision_required` - boolean flag
- `supervisor_employee_id` - FK naar supervisor
- `can_supervise` - mag supervisor zijn
- `onboarding_status` - start/in_progress/done/paused

### B. hq.procedures (nieuw)
- 8 procedures: CONSULT, FILLING, ENDO, SURG_EXT, IMPL, IOSCAN, ANEST, WOUND
- Codes, namen, categorieën, complexity levels, tijden

### C. hq.procedure_skill_requirements (nieuw)
- Mapping tussen procedures en skills
- Required levels: beginner/intermediate/expert/master
- Leeg (nog geen mappings), ready voor configuratie

### D. hq.shift_groups (nieuw)
- Groepering van shifts voor team planning
- venue_id, date, start/end times, status

### E. hq.shift_group_assignments (nieuw)
- Wie zit in welke groep
- Rol: behandelaar/assistent/preventie/balie/etc
- Multi-room support: primary_room_id + secondary_room_ids[]
- Supervisie: is_supervisor + supervises_employee_id

### F. rooms (uitgebreid)
- `venue_id` - FK naar hq.venues
- 34 rooms gemigreerd naar proper FK

### G. tickets (uitgebreid)
- `room_id` - FK naar rooms
- `venue_id` - FK naar hq.venues

### H. hq.room_costs (nieuw)
- Kosten per kamer (per dag/uur)
- Breakdown: huur, energie, onderhoud, afschrijving
- 🔒 Alleen zichtbaar voor Admin/Manager/Directie

### I. hq.planning_revenue_assumptions (nieuw)
- Verwachte omzet per procedure
- 8 seeded: €25-€1200 per procedure
- 🔒 Alleen zichtbaar voor Admin/Manager/Directie

### J. hq.vw_employee_supervision_snapshot (nieuw view)
- Snelle lookup supervisie status
- Computed fields: needs_supervisor, has_supervisor, supervision_requirement_met
- Onboarding status

---

## SEED DATA OVERZICHT

| Tabel | Records | Details |
|-------|---------|---------|
| hq.procedures | 8 | CONSULT, FILLING, ENDO, SURG_EXT, IMPL, IOSCAN, ANEST, WOUND |
| hq.planning_revenue_assumptions | 8 | €25 - €1200 per procedure |
| hq.procedure_skill_requirements | 0 | Ready voor configuratie |
| hq.shift_groups | 0 | Wordt gevuld via UI |
| hq.room_costs | 0 | Wordt geconfigureerd door management |

---

## VALIDATIE MAPPING

Alle 13 validatie regels uit de Validatie-Matrix kunnen nu geïmplementeerd worden:

| Regel | Database Ondersteuning | Status |
|-------|----------------------|--------|
| R-EMP-001 | employment_stage + shift_group_assignments | ✅ |
| R-EMP-002 | supervision_required + supervisor_employee_id | ✅ |
| R-EMP-003 | onboarding_status | ✅ |
| R-SKILL-001 | procedures + procedure_skill_requirements | ✅ |
| R-SKILL-002 | employee_skills.certificaat_verloopt_op | ✅ |
| R-SKILL-003 | shift_group_assignments.role_in_group | ✅ |
| R-ROOM-001 | secondary_room_ids[] | ✅ |
| R-ROOM-002 | primary_room_id conflicts | ✅ |
| R-ASSET-001 | tickets.room_id + v_tickets_blocking_rooms | ✅ |
| R-ASSET-002 | tickets.room_id + maintenance | ✅ |
| R-TIME-001 | shift_groups + roster_constraints | ✅ |
| R-TIME-002 | shift_groups date tracking | ✅ |
| R-FIN-001 | room_costs + revenue_assumptions | ✅ |

---

## VIEWS VOOR SNELLE QUERIES

### 1. hq.vw_employee_supervision_snapshot
Supervisie status per medewerker:
```sql
SELECT * FROM hq.vw_employee_supervision_snapshot
WHERE needs_supervisor = true
  AND supervision_requirement_met = false;
```

### 2. v_shift_groups_overview
Shift groepen met team size:
```sql
SELECT * FROM v_shift_groups_overview
WHERE date = '2026-01-15';
```

### 3. v_shift_group_teams
Team samenstelling per shift:
```sql
SELECT * FROM v_shift_group_teams
WHERE shift_group_id = 'xxx';
```

### 4. v_tickets_blocking_rooms
Blokkerende tickets per kamer:
```sql
SELECT * FROM v_tickets_blocking_rooms
WHERE venue_id = 'xxx';
```

### 5. v_procedure_requirements
Skill requirements per procedure:
```sql
SELECT * FROM v_procedure_requirements
WHERE procedure_code = 'ENDO';
```

---

## SECURITY (RLS)

- ✅ Alle nieuwe tabellen hebben RLS enabled
- ✅ Read policies voor authenticated users (basis data)
- 🔒 Financiële tabellen ALLEEN voor Admin/Manager/Directie
- ✅ Write policies alleen voor Admin/Manager (waar relevant)

---

## NEXT STEPS (niet in deze sprint)

1. **Configuratie UI** - Procedures → Skills mapping configureren
2. **Shift Planning UI** - Shift groups composer bouwen
3. **Validatie Engine** - TypeScript service voor regel evaluatie
4. **Cost Coverage Dashboard** - Financiële overzichten (management only)
5. **Seed Data Productie** - Room costs voor alle venues

---

## BUILD STATUS

✅ **Project builds zonder errors**
✅ **Geen UI wijzigingen**
✅ **Geen service refactors**
✅ **Alleen database schema + seed data**

---

## GEBRUIKTE MIGRATIES

```
gap_fix_01_extend_employees_supervision.sql
gap_fix_02_create_procedures_skill_requirements.sql
gap_fix_03_create_shift_groups_system.sql
gap_fix_04_rooms_venue_proper_fk.sql
gap_fix_05_tickets_room_venue_links.sql
gap_fix_06_financial_cost_revenue_basis.sql
seed_procedures_basic_set.sql
seed_revenue_assumptions_basic.sql
create_employee_supervision_snapshot_view.sql
```

**Totaal: 9 migraties, 0 errors, 0 refactors**

---

## CONCLUSIE

Database schema is **volledig** voorbereid voor:
- Multi-person team planning met multi-room support
- Supervisie tracking en validatie
- Skill-based procedure requirements
- Cost coverage berekeningen
- Asset/ticket impact op planning

Alle 13 validatie regels kunnen nu geïmplementeerd worden in de frontend validation engine.
