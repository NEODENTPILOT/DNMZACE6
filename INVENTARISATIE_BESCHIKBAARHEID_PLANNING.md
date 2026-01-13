# INVENTARISATIE RAPPORT: BESCHIKBAARHEID & PLANNING MODULE
**Datum:** 2026-01-11
**Status:** ✅ STAP 1 COMPLEET - READ-ONLY ANALYSE

---

## 📋 EXECUTIVE SUMMARY

De huidige rooster/planning implementatie is **functioneel maar beperkt**. Er is GEEN dedicated beschikbaarheid module. Werkdagen worden wel opgeslagen maar nauwelijks gebruikt. Het systeem is niet AI-ready en bevat legacy structuren die risico's vormen.

### Kritieke bevindingen
1. ❌ **Geen beschikbaarheid module** - Medewerkers kunnen nergens voorkeuren/blokkades aangeven
2. ⚠️ **Alleen werkdagen, geen tijden** - `work_days` array zonder start/eind tijden per dag
3. ⚠️ **Validatie is soft** - work_days check geeft alleen WARNING, blokkeert niet
4. ❌ **Niet AI-ready** - Geen historische data, patterns, of voorspellingsdata
5. ⚠️ **Legacy tabellen aanwezig** - hq.shift_groups, hq.roster_entries (leeg maar bestaan nog)

---

## 🗄️ DATABASE STRUCTUUR ANALYSE

### A. ACTIEVE TABELLEN (Bron van waarheid)

#### 1. `hq.employees` - Medewerker basisdata
**Status:** ✅ ACTIEF - 208 KB, 11+ medewerkers

**Beschikbaarheid gerelateerde velden:**
```sql
fte                 numeric      DEFAULT 1.00        -- Full-time equivalent (0.60, 0.80, 1.00)
work_days           integer[]    DEFAULT [1,2,3,4,5] -- Werkdagen (1=ma, 5=vr)
dienstverband_type  text                             -- vast / tijdelijk / null
arbeidsrelatie_type text                             -- loondienst / zzp
```

**✅ Sterke punten:**
- FTE wordt consistent bijgehouden
- work_days heeft sensibele default (ma-vr)
- Arbeidsrelatie types zijn duidelijk

**❌ Zwakke punten:**
- Geen start/eind tijden per werkdag
- Geen voorkeuren (liever ochtend/middag)
- Geen uitzonderingen (vakantie, vrij)
- Geen historische tracking van wijzigingen

---

#### 2. `schedule_shift_groups` - Roosters/diensten
**Status:** ✅ ACTIEF - 64 shifts ingepland

```sql
CREATE TABLE schedule_shift_groups (
  id         uuid PRIMARY KEY,
  venue_id   uuid NOT NULL,              -- Locatie
  date       date NOT NULL,              -- Datum
  start_at   timestamptz NOT NULL,       -- Start tijd
  end_at     timestamptz NOT NULL,       -- Eind tijd
  group_name text,                       -- "Ochtend", "Middag", etc.
  status     text NOT NULL               -- draft / published / archived
);
```

**✅ Sterke punten:**
- Duidelijke tijd structuur
- Status workflow
- Gekoppeld aan venue (multi-locatie ready)

**❌ Zwakke punten:**
- Geen link naar beschikbaarheid van medewerkers
- Geen AI metadata (verwachte drukte, omzet estimatie)
- Geen template/pattern herkenning

---

#### 3. `shift_group_members` - Toewijzingen medewerker ↔ shift
**Status:** ✅ ACTIEF - 197 assignments

```sql
CREATE TABLE shift_group_members (
  id                     uuid PRIMARY KEY,
  shift_group_id         uuid NOT NULL REFERENCES schedule_shift_groups(id),
  employee_id            uuid NOT NULL REFERENCES hq.employees(id) ON DELETE CASCADE,
  role                   text NOT NULL,            -- behandelaar / assistent / etc
  is_lead                boolean,                  -- Team lead?
  notes                  text,
  assigned_assistant_ids uuid[],                   -- 🆕 RECENT TOEGEVOEGD
  assigned_room_ids      uuid[]                    -- 🆕 RECENT TOEGEVOEGD
);
```

**✅ Sterke punten:**
- Correcte FK naar hq.employees met CASCADE
- Rol systeem flexibel
- Recent uitgebreid met assistent/kamer koppelingen

**❌ Zwakke punten:**
- Geen check of medewerker beschikbaar is op die dag/tijd
- Geen reden vastlegging (waarom deze toewijzing?)
- Geen voorkeur score (match met beschikbaarheid)

---

#### 4. `roster_constraints` - Planning constraints
**Status:** ⚠️ BEPERKT ACTIEF - 5 constraints

```sql
CREATE TABLE roster_constraints (
  id                              uuid PRIMARY KEY,
  naam                            text NOT NULL,
  constraint_type                 text NOT NULL,
  weekday                         integer,
  min_rest_hours_between_shifts   integer,
  max_consecutive_days            integer,
  vereist_rol_combination         jsonb DEFAULT '[]',
  metadata                        jsonb DEFAULT '{}'
);
```

**✅ Sterke punten:**
- Flexibele constraint structuur
- JSONB voor complexe regels

**❌ Zwakke punten:**
- Slechts 5 constraints gedefinieerd
- Niet gekoppeld aan beschikbaarheid
- Geen AI leer-component

---

### B. LEGACY / ONGEBRUIKTE TABELLEN ⚠️

#### ❌ LEGACY - `hq.shift_groups` (0 rows)
**Risico:** MEDIUM - Verwarring met schedule_shift_groups
**Aanbeveling:** Verwijderen in STAP 2

#### ❌ LEGACY - `hq.shift_group_assignments` (0 rows)
**Risico:** MEDIUM - Verwarring met shift_group_members
**Aanbeveling:** Verwijderen in STAP 2

#### ❌ LEGACY - `hq.roster_entries` (0 rows)
**Risico:** LOW - Niet gebruikt
**Aanbeveling:** Verwijderen in STAP 2

#### ❌ ONGEBRUIKT - `staff_availability` (0 rows)
**Status:** Bestaat maar nooit gevuld
**Structuur:**
```sql
CREATE TABLE staff_availability (
  id                 uuid PRIMARY KEY,
  staff_profile_id   uuid,               -- ⚠️ Verwijst naar niet-bestaande tabel
  weekday            integer,
  start_time         time NOT NULL,
  end_time           time NOT NULL,
  voorkeurs_locatie  text
);
```

**Risico:** HIGH - FK naar niet-bestaande `staff_profiles`
**Aanbeveling:** Verwijderen en vervangen door nieuwe beschikbaarheid module

---

## 💻 FRONTEND ANALYSE

### Rooster pagina's

#### 1. `/hq/roosters` - HQRoosters.tsx
**Functionaliteit:**
- Overzicht van alle shifts
- Filter op status, datum, locatie
- Violation warnings
- Detail modal per shift

**Beschikbaarheid gebruik:** ❌ GEEN
- Geen check of medewerker werkt op die dag
- Geen visual feedback over beschikbaarheid
- Geen waarschuwing bij conflict

---

#### 2. `/hq/week-rooster` - HQWeekRooster.tsx
**Functionaliteit:**
- Week grid view per medewerker
- 7 dagen overzicht
- Compacte badges voor assistenten/kamers
- Export functionaliteit

**Beschikbaarheid gebruik:** ❌ GEEN
- Toont alle medewerkers zonder filter op work_days
- Geen indicatie of shift buiten vaste werkdagen valt
- Geen beschikbaarheid overlay

---

#### 3. `/rooster-regels` - RoosterRegels.tsx
**Functionaliteit:**
- Beheer roster_constraints
- Validatie regels

**Beschikbaarheid gebruik:** ⚠️ INDIRECT
- Definieert constraints maar gebruikt geen employee.work_days

---

### Validation Services

#### `planningValidationService.ts`
**✅ Gebruikt wel work_days:**
```typescript
// R-EMP-002: Werkdagen beschikbaarheid check
if (emp.work_days && Array.isArray(emp.work_days)) {
  if (!emp.work_days.includes(weekday)) {
    findings.push({
      code: 'R-EMP-002',
      severity: 'WARN',  // ⚠️ Alleen WARNING, geen BLOCK
      message: `${name} werkt normaliter niet op ${dayName}`
    });
  }
}
```

**❌ Beperkingen:**
- Alleen WARNING, blokkeert niet
- Geen tijd check (alleen dag)
- Geen historische patterns
- Geen FTE impact

---

#### `shiftValidationService.ts`
**Status:** Gebruikt ook work_days op vergelijkbare manier
**Beoordeling:** Functioneel maar beperkt

---

## 🤖 AI-READINESS ANALYSE

### Huidige situatie: ❌ NIET AI-READY

**Ontbrekende data voor AI:**

1. **Historische planning data**
   - Geen tracking van wie wanneer werkte
   - Geen success/failure metrics
   - Geen reden van wijzigingen

2. **Beschikbaarheid patterns**
   - Geen voorkeuren per medewerker
   - Geen seizoenspatronen
   - Geen vakantie/verlof history

3. **Omzet & drukte correlatie**
   - Geen koppeling shift → omzet
   - Geen patient flow data
   - Geen bezettingsgraad tracking

4. **FTE optimalisatie data**
   - work_days is statisch
   - Geen analyse welke dagen optimaal zijn
   - Geen kosten vs omzet berekening

5. **Nieuw personeel advies**
   - Geen data over gaps in planning
   - Geen analyse welke rollen/dagen tekort zijn
   - Geen voorspelling impact nieuwe medewerker

---

## 🎯 BRON VAN WAARHEID CONCLUSIE

### ✅ Gebruik deze:

| Entiteit | Tabel | Reden |
|----------|-------|-------|
| **Medewerkers** | `hq.employees` | Enige bron, 208KB data |
| **Shifts/Roosters** | `schedule_shift_groups` | 64 actieve shifts |
| **Toewijzingen** | `shift_group_members` | 197 actieve assignments |
| **Kamers** | `rooms` | Gebruikt in shift_group_rooms |
| **Locaties** | `hq.venues` | Multi-locatie support |
| **Constraints** | `roster_constraints` | 5 actieve regels |

### ❌ Vermijd deze:

| Tabel | Status | Actie |
|-------|--------|-------|
| `hq.shift_groups` | LEEG | Verwijderen STAP 2 |
| `hq.shift_group_assignments` | LEEG | Verwijderen STAP 2 |
| `hq.roster_entries` | LEEG | Verwijderen STAP 2 |
| `staff_availability` | LEEG + Broken FK | Verwijderen STAP 2 |
| `hq.shiftbase_*` | Import helpers | Optioneel behouden |

---

## ⚠️ RISICO'S & AANDACHTSPUNTEN

### 🔴 HIGH RISK

1. **staff_availability broken FK**
   - Verwijst naar niet-bestaande `staff_profiles`
   - Kan crashes veroorzaken als iemand deze probeert te gebruiken
   - **Impact:** App crash bij gebruik

2. **Geen beschikbaarheid enforcement**
   - Medewerkers kunnen toegewezen worden op elk moment
   - work_days check is alleen WARNING
   - **Impact:** Onhaalbare roosters, medewerker frustratie

### 🟡 MEDIUM RISK

3. **Legacy tabel verwarring**
   - hq.shift_groups vs schedule_shift_groups
   - Developers kunnen verkeerde tabel gebruiken
   - **Impact:** Data inconsistentie

4. **Geen tijd specificatie per werkdag**
   - work_days = [1,2,3] maar geen uren
   - 32-urige week (0.8 FTE) kan niet correct verdeeld worden
   - **Impact:** Onnauwkeurige planning

### 🟢 LOW RISK

5. **Validatie services niet geïntegreerd**
   - planningValidationService bestaat maar optioneel
   - Frontend kan omzeild worden
   - **Impact:** Inconsistente validatie

---

## 📊 DATA STATISTIEKEN

```
✅ ACTIEVE DATA:
- hq.employees:            11+ medewerkers
- schedule_shift_groups:   64 shifts
- shift_group_members:     197 toewijzingen
- roster_constraints:      5 regels

❌ LEGE TABELLEN:
- hq.shift_groups:         0 rows
- hq.shift_group_assignments: 0 rows
- hq.roster_entries:       0 rows
- staff_availability:      0 rows

🔗 FOREIGN KEYS:
- shift_group_members → hq.employees: ✅ CORRECT (CASCADE delete)
- shift_group_members → schedule_shift_groups: ✅ CORRECT
- shift_group_rooms → rooms: ✅ CORRECT
```

---

## 💡 AANBEVELINGEN VOOR STAP 2

### Prioriteit 1: Cleanup & Safety
1. ❌ Verwijder legacy tabellen (hq.shift_*, staff_availability)
2. ✅ Voeg beschikbaarheid constraints toe aan DB
3. ✅ Upgrade validatie van WARN → BLOCK

### Prioriteit 2: Beschikbaarheid Module
1. ✅ Nieuwe tabel: `employee_availability`
   - Vaste werkdagen + tijden
   - Voorkeuren (ochtend/middag)
   - Blokkades (vakantie, vrij)
   - Uitzonderingen (eenmalig beschikbaar)

2. ✅ Frontend: Beschikbaarheid beheer pagina
   - Medewerkers kunnen eigen voorkeuren aangeven
   - Managers zien overzicht beschikbaarheid
   - Visuele planning conflicten

### Prioriteit 3: AI-Ready Data Structuur
1. ✅ Planning history tracking
   - Wie werkte wanneer (snapshot per week)
   - Wijzigingen + redenen
   - Success metrics (volledig bemand?)

2. ✅ Omzet & drukte correlatie
   - shift → omzet koppeling
   - Bezettingsgraad per shift
   - Kosten vs opbrengst

3. ✅ Nieuw personeel advies engine
   - Gap analyse (waar tekorten?)
   - Optimale werkdagen berekening
   - FTE impact voorspelling

---

## ✅ STAP 1 CONCLUSIE

**Database status:**
- ✅ Bron van waarheid duidelijk (hq.employees, schedule_shift_groups, shift_group_members)
- ⚠️ Legacy tabellen aanwezig maar onschadelijk (0 rows)
- ❌ Geen beschikbaarheid module
- ❌ Niet AI-ready

**Frontend status:**
- ✅ Rooster pagina's functioneel
- ❌ Geen beschikbaarheid visualisatie
- ⚠️ Validatie bestaat maar is soft

**Risico's:**
- 🔴 staff_availability broken FK (HIGH)
- 🟡 Geen beschikbaarheid enforcement (MEDIUM)
- 🟡 Legacy tabel verwarring (MEDIUM)

**Gereed voor STAP 2:** ✅ JA
- Duidelijk beeld van huidige staat
- Legacy geïdentificeerd
- Risico's bekend
- Aanbevelingen klaar

---

**Volgende stap:** Wacht op goedkeuring voor STAP 2 (Design & Architecture)
