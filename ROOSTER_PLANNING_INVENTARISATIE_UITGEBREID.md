# COMPLETE INVENTARISATIE: ROOSTER/PLANNING + LEGACY DETECTIE + ONBOARDING
**Datum:** 2026-01-10
**Status:** Analyse-only (geen refactors/migrations)
**Doel:** Legacy expliciet uitsluiten, max 8 bronnen van waarheid definiëren

---

# HOOFDSTUK 1: ACTIEF — BRON VAN WAARHEID (MAX 8 TABELLEN)

## 1.1 Medewerkers & Skills

### `hq.employees` ✅ BRON VAN WAARHEID
**Schema:** hq
**Rows:** 11 (waarvan 10 NIET gekoppeld aan users!)
**Primaire key relaties:**
- `user_id` → `public.users.id` (nullable, slechts 1 van 11 ingevuld)
- `locatie_id` → deprecated, gebruik `hq.employee_locations`

**Belangrijkste kolommen:**
- `functie`: Tandarts, Assistent, Manager, etc (text, vrij veld)
- `arbeidsrelatie_type`: 'loondienst' / 'zzp' (default: loondienst)
- `status`: 'actief' / 'inactief' / 'uit dienst' (default: actief)
- `work_days`: integer array [1,2,3,4,5] (ma-vr)
- `fte`: numeric (0.0-1.0)
- `in_dienst_vanaf`, `uit_dienst_per`: date
- `big_nummer`, `agb_persoonlijk`: text (registratie nummers)

**FK's naar andere bronnen van waarheid:**
- `hq.employee_locations` (1:N) → multi-locatie
- `hq.employee_skills` (1:N) → bekwaamheden

**Waarom bron van waarheid:**
- Compleet HR model met arbeidsrelatie, FTE, werkdagen
- Multi-locatie support via junction table
- Skills koppeling
- Contract koppeling (via hq.contracts)

---

### `hq.employee_skills` ✅ BRON VAN WAARHEID
**Schema:** hq
**Rows:** 13 (5 unieke medewerkers)

**Kolommen:**
- `skill_id` → `hq.skills.id`
- `level`: 'beginner'/'intermediate'/'expert'/'master'
- `gecertificeerd`: boolean
- `certificaat_datum`, `certificaat_verloopt_op`: date (geldigheid tracking!)
- `is_actief`: boolean (skill nog geldig/actief)
- `document_id` → `hq.documents.id` (certificaat opslag)

**Waarom bron van waarheid:**
- Volledig competentie systeem met levels
- Certificaat geldigheid tracking (essentieel voor planning!)
- Document bewijs koppeling
- Actief/inactief status per skill

---

### `hq.skills` ✅ BRON VAN WAARHEID
**Schema:** hq
**Kolommen:**
- `code`, `naam`, `categorie`
- `opleiding_vereist`, `certificaat_vereist`: boolean
- `certificaat_geldigheid_jaren`: integer (automatische herinnering)
- `required_document_category_id` → `hq.document_categories.id`

**Waarom bron van waarheid:**
- Master data voor alle bekwaamheden
- Gekoppeld aan document vereisten
- Bevat compliance regels (certificaat vereist ja/nee)

---

## 1.2 Locaties & Kamers

### `hq.venues` ✅ BRON VAN WAARHEID
**Schema:** hq
**Rows:** 3
**Type enum:** 'practice' / 'storage' / 'other'

**Kolommen:**
- `name`, `venue_type`
- `address_street`, `address_city`, `address_postal_code`
- `phone`, `email`, `active`

**FK's van andere tabellen:**
- `hq.employee_locations.location_id` → `venues.id`
- `schedule_shifts.venue_id` → `venues.id`

**Waarom bron van waarheid:**
- Modern locatie model met typing
- Gebruikt door schedule_shifts (rooster)
- Multi-locatie medewerkers koppelen hieraan

---

### `rooms` ⚠️ GEMENGD (bevat legacy + moderne velden)
**Schema:** public
**Rows:** 34
**Status:** GEBRUIK MET VOORZICHTIGHEID

**Kolommen:**
- `naam`, `code`, `type` ('Behandelkamer', 'Backoffice', 'Frontoffice')
- `vestiging` (text) ← LEGACY, niet FK
- `praktijk_locatie_id` (UUID) ← Modern, maar 0/34 ingevuld!
- `actief`, `qr_code`

**Problemen:**
- 34/34 rooms gebruiken text `vestiging` ipv FK
- 0/34 hebben `praktijk_locatie_id` ingevuld
- Geen koppeling naar `hq.venues`

**Waarom toch opnemen als bron:**
- Schedule_shifts.ruimte_id verwijst hiernaar
- Essentieel voor kamer assignment in rooster
- Enige tabel voor kamers (geen alternatief)

**ACTIE VEREIST (niet nu uitvoeren):**
- Migreer `vestiging` text → `venue_id` FK
- Vul `praktijk_locatie_id` in OF migreer naar `venue_id`

---

## 1.3 Planning & Roosters

### `schedule_shifts` ✅ BRON VAN WAARHEID
**Schema:** public
**Rows:** 0 (LEEG - geen productiedata!)

**Kolommen (modern):**
- `employee_id` → `hq.employees.id` ✅
- `venue_id` → `hq.venues.id` ✅
- `start_at`, `end_at`: timestamptz ✅
- `shift_type`, `notes`
- `ruimte_id` → `rooms.id` ✅

**Kolommen (legacy, backward compatibility):**
- `vestiging` (text)
- `start_time`, `end_time` (time without zone)
- `datum` (date)
- `rol` (text)

**Waarom bron van waarheid:**
- PRIMARY tabel voor rooster
- Heeft moderne FK's naar employees + venues
- Shiftbase export gebruikt deze tabel
- HQRoosters UI gebruikt deze tabel

**KRITIEK:** 0 rows - geen data om mee te testen/valideren!

---

### `roster_constraints` ✅ BRON VAN WAARHEID
**Schema:** public
**Kolommen:**
- `constraint_type`: 'require_combination' / 'min_rest_hours' / 'max_consecutive_days'
- `vereist_rol_combination`: jsonb (bv: behandelaar + assistent)
- `min_rest_hours_between_shifts`: integer
- `max_consecutive_days`: integer
- `actief`: boolean

**Waarom bron van waarheid:**
- Bevat alle validatie regels voor roosters
- Rolcombinatie vereisten (behandelaar + assistent)
- Rusttijd en max werkdagen regels
- Niet geïmplementeerd, maar data structuur is compleet

---

## 1.4 Onboarding & Supervisie

### `hq.onboarding_instances` ✅ BRON VAN WAARHEID
**Schema:** hq
**Rows:** 4

**Kolommen:**
- `employee_id` → `hq.employees.id`
- `template_id` → `hq.onboarding_templates.id`
- `buddy_employee_id` → `hq.employees.id` (buddy/mentor)
- `manager_employee_id` → `hq.employees.id` (leidinggevende)
- `start_datum`, `verwachte_eind_datum`, `werkelijke_eind_datum`
- `status`: 'actief' / 'afgerond' / 'geannuleerd'
- `voortgang_percentage`: integer (0-100)

**Waarom bron van waarheid:**
- Volledig onboarding systeem met buddy + manager
- Voortgang tracking
- AI guidance support (via hq.onboarding_ai_guidance)

---

### `hq.onboarding_templates` ✅ BRON VAN WAARHEID
**Schema:** hq
**Rows:** 8

**Kolommen:**
- `naam`, `voor_functie` (Tandarts, Assistent, etc)
- `omschrijving`, `duur_dagen`
- `taken`: jsonb (oude format) - gebruik `hq.onboarding_template_tasks` (nieuwe FK)
- `ai_enabled`: boolean

**Waarom bron van waarheid:**
- Templates per functie
- Gekoppeld aan `hq.onboarding_template_tasks` voor gestructureerde taken

---

## 1.5 Assets (voor storing impact op planning)

### `assets` ✅ BRON VAN WAARHEID
**Schema:** public
**Rows:** 3

**Kolommen:**
- `asset_tag`, `qr_code`
- `category`, `brand`, `model`
- `assigned_room` → `rooms.id` ✅ FK
- `status`: 'Actief' / 'Onderhoud' / 'Storing'
- `opslag_locatie_id` → `opslag_locaties.id`

**Waarom bron van waarheid:**
- Heeft FK naar rooms (koppeling!)
- Status tracking (storing → kamer onbruikbaar)
- QR code systeem
- Onderhoud tracking via `equipment_maintenance_*`

**Relevantie planning:**
- Asset status 'Storing' → kamer/apparaat niet beschikbaar
- Via `tickets.asset_id` koppeling naar storingen

---

## SAMENVATTING: 8 BRONNEN VAN WAARHEID

| # | Tabel | Schema | Doel | Status |
|---|-------|--------|------|--------|
| 1 | `employees` | hq | Medewerkers (HR, FTE, functie, arbeidsrelatie) | ✅ Compleet |
| 2 | `employee_skills` | hq | Bekwaamheden + certificaat geldigheid | ✅ Compleet |
| 3 | `skills` | hq | Master data skills + compliance regels | ✅ Compleet |
| 4 | `venues` | hq | Locaties (praktijk/opslag) | ✅ Compleet |
| 5 | `rooms` | public | Kamers (⚠️ text vestiging, geen venue FK) | ⚠️ Mixed |
| 6 | `schedule_shifts` | public | Rooster entries (⚠️ 0 rows!) | ⚠️ Leeg |
| 7 | `roster_constraints` | public | Validatie regels (niet enforced) | ✅ Data compleet |
| 8 | `onboarding_instances` | hq | Onboarding tracking + buddy | ✅ Compleet |

**Bonus ondersteunend (niet meetellend):**
- `assets` (public) - voor storing impact op planning
- `tickets` (public) - voor urgent storingen
- `hq.onboarding_templates` - voor onboarding templates

---

# HOOFDSTUK 2: LEGACY/NIET GEBRUIKEN (met redenen)

## 2.1 Locaties (DUPLICAAT)

### `praktijk_locaties` 🔴 LEGACY - NIET GEBRUIKEN
**Schema:** public
**Rows:** 2
**Waarom legacy:**
- Duplicaat van `hq.venues` (practice type)
- Text-based, geen enum voor type
- Geen sync met `hq.venues`
- `rooms.praktijk_locatie_id` FK bestaat maar wordt niet gebruikt (0/34)

**Vervangen door:** `hq.venues`

---

## 2.2 Assets/Inventory (MEERDERE SYSTEMEN)

### `equipment` 🔴 LEGACY - NIET GEBRUIKEN
**Schema:** public
**Rows:** 9
**Waarom legacy:**
- Text `vestiging` (geen FK)
- Text `ruimte_naam` (geen FK naar rooms)
- Duplicaat functionaliteit van `assets` (modernere tabel met FKs)
- UI heeft LegacyBanner: "vervangen door Inventory Hub"

**Vervangen door:** `assets` (heeft wel FK naar rooms)

**Route:** `inventaris` → `<Inventaris />` 🔴 LEGACY UI

---

### `inventory` 🔴 LEGACY - NIET GEBRUIKEN
**Schema:** public
**Waarom legacy:**
- Oude inventory tabel (waarschijnlijk pre-taxonomy)
- `inventory_items` is de moderne variant met taxonomie

**Vervangen door:** `inventory_items` (taxonomy based)

---

## 2.3 Onboarding (DUPLICAAT SCHEMA)

### `public.onboarding_*` tabellen 🔴 LEGACY - NIET GEBRUIKEN
**Tabellen:**
- `public.onboarding_instances` (0 rows)
- `public.onboarding_templates` (3 rows)
- `public.onboarding_template_steps`
- `public.onboarding_instance_steps`

**Waarom legacy:**
- Duplicaat van `hq.onboarding_*` (hq schema is bron van waarheid)
- `public` variant heeft 0 instances (niet actief gebruikt)
- `hq` variant heeft 4 instances + 8 templates (ACTIEF)
- Geen sync tussen beide schema's

**Vervangen door:** `hq.onboarding_instances`, `hq.onboarding_templates`

---

## 2.4 Roosters (LEGE LEGACY TABELLEN)

### `hq.roster_entries` 🔴 NIET GEBRUIKEN (leeg)
**Schema:** hq
**Rows:** 0
**Waarom niet gebruiken:**
- Alternatieve rooster tabel (duplicaat concept van schedule_shifts)
- 0 rows - nooit gebruikt
- `schedule_shifts` is de gekozen bron van waarheid

**Vervangen door:** `schedule_shifts`

---

### `schedules` 🔴 NIET GEBRUIKEN (leeg)
**Schema:** public
**Rows:** 0
**Waarom niet gebruiken:**
- Wrapper tabel voor schedules
- 0 rows, niet gebruikt
- `schedule_shifts` werkt zonder deze wrapper

---

### `shift_templates` ⚠️ ONDUIDELIJK
**Schema:** public
**Rows:** 5
**Status:** Heeft data, maar onduidelijk of actief gebruikt

**Advies:** Markeer als "OPTIONEEL - niet essentieel voor planning"

---

## 2.5 Tickets/Storingen (LEGACY UI's)

### `Storingen.tsx` 🔴 LEGACY UI - NIET GEBRUIKEN
**Route:** `storingen`
**Tabel:** `equipment_incidents` (legacy)
**LegacyBanner:** "vervangen door Tickets & Orders systeem"

**Vervangen door:** `tickets` tabel + `TicketOrder.tsx` / nieuw tickets systeem

---

### `Onderhoud.tsx` 🔴 LEGACY UI - NIET GEBRUIKEN
**Route:** `onderhoud`
**Tabel:** `equipment_maintenance_*`
**LegacyBanner:** "vervangen door Inventory Hub"

**Vervangen door:** Inventory Hub (`inventory-hub` route)

---

### `TicketEnquiry.tsx` 🔴 LEGACY UI - NIET GEBRUIKEN
**Route:** `ticket-enquiry`
**LegacyBanner:** "placeholder vervangen door Tickets & Orders"

**Vervangen door:** Nieuwe tickets systeem

---

## 2.6 Medewerkers (OUDE/DUPLICAAT UI's)

### `Medewerkersbeheer.tsx` 🔴 LEGACY UI - NIET GEBRUIKEN
**Route:** `medewerkersbeheer`
**Tabel:** Waarschijnlijk oude query naar users/employees

**Vervangen door:** `hq-employees` (HQEmployees.tsx) - moderne HR UI

---

### `PraktijkMedewerkerBeheer.tsx` 🔴 LEGACY UI - NIET GEBRUIKEN
**Route:** `praktijk-medewerker-beheer`

**Vervangen door:** `hq-employees`

---

## LEGACY OVERZICHT - NIET GEBRUIKEN

| Categorie | Legacy Tabel/UI | Rows | Reden | Vervangen Door |
|-----------|----------------|------|-------|----------------|
| **LOCATIES** | `praktijk_locaties` | 2 | Duplicaat, geen type enum | `hq.venues` ✅ |
| **ASSETS** | `equipment` | 9 | Text vestiging/ruimte, geen FK | `assets` ✅ |
| **ASSETS** | `inventory` (oud) | ? | Pre-taxonomy | `inventory_items` ✅ |
| **ONBOARDING** | `public.onboarding_*` | 0/3 | Duplicaat schema, niet actief | `hq.onboarding_*` ✅ |
| **ROOSTERS** | `hq.roster_entries` | 0 | Alternatief, nooit gebruikt | `schedule_shifts` ✅ |
| **ROOSTERS** | `schedules` | 0 | Wrapper, leeg | `schedule_shifts` ✅ |
| **UI** | `Inventaris.tsx` | - | LegacyBanner | Inventory Hub |
| **UI** | `Onderhoud.tsx` | - | LegacyBanner | Inventory Hub |
| **UI** | `Storingen.tsx` | - | LegacyBanner | Tickets systeem |
| **UI** | `TicketEnquiry.tsx` | - | LegacyBanner | Tickets systeem |
| **UI** | `Medewerkersbeheer.tsx` | - | Oude UI | `HQEmployees.tsx` ✅ |
| **UI** | `PraktijkMedewerkerBeheer.tsx` | - | Oude UI | `HQEmployees.tsx` ✅ |

---

# HOOFDSTUK 3: ONBOARDING / SUPERVISIE / STAGIAIRS

## 3.1 Wat Bestaat Al

### Onboarding Systeem (COMPLEET)
**Tabellen:**
- `hq.onboarding_instances` (4 rows) ✅
- `hq.onboarding_templates` (8 rows) ✅
- `hq.onboarding_tasks` ✅
- `hq.onboarding_template_tasks` ✅

**Features:**
- Buddy systeem: `buddy_employee_id` ✅
- Manager: `manager_employee_id` ✅
- Voortgang: `voortgang_percentage` ✅
- AI guidance: `hq.onboarding_ai_guidance` ✅

**Relaties:**
- `employee_id` → `hq.employees.id`
- `buddy_employee_id` → `hq.employees.id` (mentor/buddy)
- `manager_employee_id` → `hq.employees.id` (leidinggevende)

---

### Tutor/Competentie Assessment (COMPLEET)
**Tabellen:**
- `tutor_function_profiles` (functieprofielen)
- `tutor_competency_questions` (vragen per competentie)
- `tutor_competency_intakes` (intake per user)
- `tutor_competency_answers` (antwoorden)

**Doel:** Competentie assessment voor nieuwe medewerkers/stagiairs

**Relatie:**
- `user_id` → `public.users.id`
- Geen directe koppeling naar `hq.employees` (gap!)

---

## 3.2 Wat Ontbreekt

### 3.2.1 Employment Stage / Stagiair Status
**Status:** ❌ ONTBREEKT

**Beschrijving:**
Geen veld in `hq.employees` voor:
- Stagiair / werkstudent / trainee
- Behandelaar onder supervisie
- Junior vs senior status
- Onboarding fase

**Huidige situatie:**
- `hq.employees.functie` = text veld (vrij invulbaar)
- `hq.employees.status` = 'actief' / 'inactief' / 'uit dienst' (te grof)

**Voorstel (NIET IMPLEMENTEREN):**
Voeg toe aan `hq.employees`:

```sql
-- ALLEEN VOORSTEL, NIET UITVOEREN
ALTER TABLE hq.employees ADD COLUMN employment_stage text
  DEFAULT 'regulier'
  CHECK (employment_stage IN (
    'regulier',
    'stagiair',
    'werkstudent',
    'onboarding',
    'junior_onder_supervisie',
    'in_opleiding'
  ));
```

**Waarom hier:**
- `hq.employees` is bron van waarheid voor HR
- Niet in `public.users` (die is voor authenticatie)
- Nodig voor planning restrictie (stagiair mag niet alle taken)

---

### 3.2.2 Supervisie Vereist / Supervisor Relatie
**Status:** ❌ ONTBREEKT (deels wel: buddy/manager in onboarding)

**Beschrijving:**
Geen velden voor:
- "Medewerker X vereist supervisie voor taak Y"
- "Supervisor moet aanwezig/ingeroosterd zijn"
- Supervisor employee_id (wie superviseert wie)

**Huidige situatie:**
- `hq.onboarding_instances.buddy_employee_id` = buddy tijdens onboarding ✅
- `hq.onboarding_instances.manager_employee_id` = manager ✅
- Maar: na onboarding geen permanente supervisor relatie

**Voorstel (NIET IMPLEMENTEREN):**
Voeg toe aan `hq.employees`:

```sql
-- ALLEEN VOORSTEL, NIET UITVOEREN
ALTER TABLE hq.employees
  ADD COLUMN supervision_required boolean DEFAULT false,
  ADD COLUMN supervisor_employee_id uuid REFERENCES hq.employees(id),
  ADD COLUMN supervision_type text CHECK (supervision_type IN (
    'geen',
    'directe_supervisie',  -- supervisor moet aanwezig zijn
    'indirecte_supervisie', -- supervisor bereikbaar, niet ter plekke
    'peer_review'           -- achteraf review door senior
  ));
```

**Waarom hier:**
- Supervisor relatie is HR eigenschap, niet onboarding specifiek
- Nodig voor roster validatie ("behandelaar X mag alleen behandelen als supervisor Y ook ingeroosterd")

---

### 3.2.3 Onboarding Fase / Progression
**Status:** ⚠️ DEELS (voortgang_percentage, maar geen fasen)

**Huidige situatie:**
- `hq.onboarding_instances.voortgang_percentage` (0-100) ✅
- Maar: geen "fase 1/2/3" systeem

**Voorstel (ALLEEN ALS NODIG):**
Voeg toe aan `hq.onboarding_instances`:

```sql
-- ALLEEN VOORSTEL, NIET UITVOEREN
ALTER TABLE hq.onboarding_instances
  ADD COLUMN huidige_fase smallint DEFAULT 1 CHECK (huidige_fase BETWEEN 1 AND 5),
  ADD COLUMN fase_data jsonb DEFAULT '{}';
```

**Alternatief:**
- Gebruik `hq.onboarding_tasks.status` voor fase tracking per taak
- Geen aparte fase kolom nodig (huidige systeem is voldoende)

---

### 3.2.4 Skill Level Requirements voor Planning
**Status:** ❌ ONTBREEKT

**Beschrijving:**
Geen mapping:
- "Taak X vereist skill Y op level Z"
- "Kamer type vereist skill"
- "Stagiair mag alleen taak X met skill level ≥ intermediate"

**Huidige situatie:**
- `hq.employee_skills.level` bestaat (beginner/intermediate/expert/master) ✅
- Maar: geen tabel die zegt "interventie X vereist skill Y level Z"

**Voorstel (NIET IMPLEMENTEREN):**
Nieuwe tabel:

```sql
-- ALLEEN VOORSTEL, NIET UITVOEREN
CREATE TABLE hq.procedure_skill_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_code text, -- of interventie_id
  skill_id uuid REFERENCES hq.skills(id),
  minimum_level text CHECK (minimum_level IN ('beginner','intermediate','expert','master')),
  is_required boolean DEFAULT true,
  supervision_required_below_level text -- indien level < X, supervisie nodig
);
```

---

### 3.2.5 Room Type → Skill Requirements
**Status:** ❌ ONTBREEKT

**Beschrijving:**
Geen mapping:
- "Behandelkamer implantologie vereist skill 'Implantologie' level expert"
- "Backoffice mag alleen door assistent niveau 2+"

**Voorstel (NIET IMPLEMENTEREN):**
Nieuwe tabel:

```sql
-- ALLEEN VOORSTEL, NIET UITVOEREN
CREATE TABLE room_skill_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id),
  skill_id uuid REFERENCES hq.skills(id),
  minimum_level text,
  created_at timestamptz DEFAULT now()
);
```

---

## SAMENVATTING ONTBREKENDE DATA: ONBOARDING/SUPERVISIE

| # | Validatie Regel | Data Aanwezig? | Waar Thuishoort | Voorstel Minimale Velden |
|---|-----------------|----------------|-----------------|--------------------------|
| 1 | Stagiair/werkstudent status | ❌ NEEN | `hq.employees` | `employment_stage` enum |
| 2 | Medewerker onder supervisie | ❌ NEEN (wel buddy) | `hq.employees` | `supervision_required` boolean, `supervisor_employee_id` FK, `supervision_type` enum |
| 3 | Onboarding fase tracking | ⚠️ DEELS (percentage) | `hq.onboarding_instances` | `huidige_fase` smallint (optioneel) |
| 4 | Skill → Taak vereisten | ❌ NEEN | Nieuwe tabel | `procedure_skill_requirements` |
| 5 | Room → Skill vereisten | ❌ NEEN | Nieuwe tabel | `room_skill_requirements` |
| 6 | Buddy/manager | ✅ JA | `hq.onboarding_instances` | Bestaat al ✅ |
| 7 | Tutor intake | ✅ JA | `tutor_*` tabellen | Bestaat al ✅ |

**ADVIES:**
- Voeg `employment_stage` + `supervision_required` + `supervisor_employee_id` toe aan `hq.employees` (bron van waarheid)
- NIET in `public.users` (dat is alleen voor auth)
- Skill/room requirements kunnen later als validatie uitbreiding

---

# HOOFDSTUK 4: GAP ANALYSE VALIDATIE-MATRIX (UITGEBREID)

## 4.1 Kamerregels (AANGEVULD)

| Validatie Regel | Data Aanwezig? | Tabel/Kolom | Enforcement? | Ontbreekt |
|-----------------|----------------|-------------|--------------|-----------|
| 1 behandelaar kan 2e/3e kamer | ⚠️ Schema ja, data nee | `schedule_shifts.ruimte_id` | ❌ | Data invullen + multi-room logic |
| 1 behandelaar + 2 assistenten | ⚠️ Schema ja | `schedule_shifts.rol` + `roster_constraints` | ❌ | Shift grouping + rol check |
| Assistent delegatie andere kamer | ⚠️ Deels | `employee_skills` | ❌ | Skill→task mapping + cross-room permission |
| **NIEUW: Stagiair beperkt tot kamer type** | ❌ NEEN | - | ❌ | `employment_stage` + `room_skill_requirements` |
| **NIEUW: Onder supervisie in specifieke kamer** | ❌ NEEN | - | ❌ | `supervision_required` + supervisor check in zelfde shift |

---

## 4.2 Bekwaamheden/Bevoegdheden (AANGEVULD)

| Validatie Regel | Data Aanwezig? | Tabel/Kolom | Enforcement? | Ontbreekt |
|-----------------|----------------|-------------|--------------|-----------|
| Skills per medewerker | ✅ JA | `hq.employee_skills` | ✅ Data entry | - |
| Certificaat geldigheid | ✅ JA | `certificaat_verloopt_op` | ❌ Auto-check | Alert systeem |
| Skill → taak mapping | ❌ NEEN | - | ❌ | `procedure_skill_requirements` tabel |
| **NIEUW: Skill level minimum check** | ⚠️ DEELS (level bestaat) | `employee_skills.level` | ❌ | Minimum level per taak/kamer |
| **NIEUW: Onder supervisie als level < X** | ❌ NEEN | - | ❌ | `supervision_required_below_level` logica |

---

## 4.3 Planning Checks (AANGEVULD)

| Validatie Regel | Data Aanwezig? | Tabel/Kolom | Enforcement? | Ontbreekt |
|-----------------|----------------|-------------|--------------|-----------|
| Constraint regels | ✅ Data ja | `roster_constraints` | ❌ | Scheduler engine |
| Asset beschikbaar (geen storing) | ✅ Data ja | `tickets.asset_id`, `assets.status` | ❌ | Real-time check in validator |
| Min rusttijd tussen shifts | ✅ Data ja | `roster_constraints.min_rest_hours_between_shifts` | ❌ | Tijd berekening |
| Max opeenvolgende dagen | ✅ Data ja | `roster_constraints.max_consecutive_days` | ❌ | Dag telling |
| **NIEUW: Stagiair beperkt tot X uur/week** | ❌ NEEN | - | ❌ | Max uren constraint per `employment_stage` |
| **NIEUW: Supervisor aanwezig check** | ❌ NEEN | - | ❌ | Cross-shift check: `supervisor_employee_id` in zelfde tijdslot |
| **NIEUW: Werkstudent niet op bepaalde dagen** | ⚠️ DEELS | `employees.work_days` | ❌ | Enforcement in scheduler + `employment_stage` check |

---

## VALIDATIE MATRIX VOLLEDIG

| # | Validatie Regel | Data? | Tabel/Kolom | Enforcement? | Ontbreekt |
|---|-----------------|-------|-------------|--------------|-----------|
| **KAMER** |
| 1.1 | Behandelaar 2e/3e kamer | ⚠️ | `schedule_shifts.ruimte_id` | ❌ | Data + logic |
| 1.2 | Behandelaar + 2 assistenten | ⚠️ | `schedule_shifts.rol` | ❌ | Shift grouping |
| 1.3 | Assistent delegatie andere kamer | ⚠️ | `employee_skills` | ❌ | Skill→task + permission |
| 1.4 | **Stagiair beperkt kamer type** | ❌ | - | ❌ | `employment_stage` + room rules |
| 1.5 | **Onder supervisie kamer check** | ❌ | - | ❌ | `supervision_required` |
| **SKILLS** |
| 2.1 | Skills per medewerker | ✅ | `hq.employee_skills` | ✅ | - |
| 2.2 | Certificaat geldigheid | ✅ | `certificaat_verloopt_op` | ❌ | Alert systeem |
| 2.3 | Skill → taak mapping | ❌ | - | ❌ | `procedure_skill_requirements` |
| 2.4 | **Skill level minimum** | ⚠️ | `employee_skills.level` | ❌ | Min level per taak |
| 2.5 | **Supervisie bij level < X** | ❌ | - | ❌ | Conditional supervision |
| **PLANNING** |
| 3.1 | Constraint regels | ✅ | `roster_constraints` | ❌ | Scheduler engine |
| 3.2 | Kamer skill vereisten | ❌ | - | ❌ | `room_skill_requirements` |
| 3.3 | Asset beschikbaar | ✅ | `assets.status`, `tickets` | ❌ | Validator koppeling |
| 3.4 | Min rusttijd | ✅ | `roster_constraints` | ❌ | Tijd calc |
| 3.5 | Max opeenvolgende dagen | ✅ | `roster_constraints` | ❌ | Dag telling |
| 3.6 | **Stagiair max uur/week** | ❌ | - | ❌ | Uren constraint per stage |
| 3.7 | **Supervisor aanwezig** | ❌ | - | ❌ | Cross-shift check |
| 3.8 | **Werkstudent dag restrictie** | ⚠️ | `employees.work_days` | ❌ | Stage-aware check |

---

# HOOFDSTUK 5: LEGACY ROUTES INVENTARISATIE

## Routes die naar LEGACY modules leiden (VERBERGEN/MIGREREN)

| Route | Component | Tabel(len) | Status | Actie |
|-------|-----------|------------|--------|-------|
| `inventaris` | `Inventaris.tsx` | `equipment` | 🔴 LEGACY | Verberg, gebruik `inventory-hub` |
| `onderhoud` | `Onderhoud.tsx` | `equipment_maintenance_*` | 🔴 LEGACY | Verberg, gebruik `inventory-hub` |
| `storingen` | `Storingen.tsx` | `equipment_incidents` | 🔴 LEGACY | Verberg, gebruik tickets systeem |
| `ticket-enquiry` | `TicketEnquiry.tsx` | - (placeholder) | 🔴 LEGACY | Verberg, gebruik `ticket-order` |
| `medewerkersbeheer` | `Medewerkersbeheer.tsx` | `users`/`employees` | 🔴 LEGACY | Verberg, gebruik `hq-employees` |
| `praktijk-medewerker-beheer` | `PraktijkMedewerkerBeheer.tsx` | ? | 🔴 LEGACY | Verberg, gebruik `hq-employees` |

**Actieve routes (BLIJVEN):**
| Route | Component | Status |
|-------|-----------|--------|
| `hq-roster` | `HQRoosters.tsx` | ✅ ACTIEF (bron van waarheid) |
| `hq-employees` | `HQEmployees.tsx` | ✅ ACTIEF (bron van waarheid) |
| `hq-skills` | `HQSkills.tsx` | ✅ ACTIEF (bron van waarheid) |
| `hq-onboarding` | `HQOnboarding.tsx` | ✅ ACTIEF (bron van waarheid) |
| `hq-venues` | `HQVenues.tsx` | ✅ ACTIEF (bron van waarheid) |
| `rooster-regels` | `RoosterRegels.tsx` | ✅ ACTIEF (constraints) |
| `inventory-hub` | `InventoryHub.tsx` | ✅ ACTIEF (modern assets) |
| `ruimtes` | `Ruimtes.tsx` | ✅ ACTIEF (kamers) |
| `ticket-order` | `TicketOrder.tsx` | ✅ ACTIEF (nieuwe tickets) |

---

# HOOFDSTUK 6: EXECUTIVE SUMMARY

## 6.1 Wat Werkt (GEBRUIK DIT)

**8 Bronnen van Waarheid:**
1. ✅ `hq.employees` - Compleet HR model, FTE, functie, arbeidsrelatie
2. ✅ `hq.employee_skills` - Skills + certificaat geldigheid
3. ✅ `hq.skills` - Master data skills
4. ✅ `hq.venues` - Moderne locaties (practice/storage)
5. ⚠️ `rooms` - Kamers (mixed: text vestiging, FK niet gebruikt)
6. ⚠️ `schedule_shifts` - Rooster (modern schema, 0 data!)
7. ✅ `roster_constraints` - Validatie regels (data compleet, niet enforced)
8. ✅ `hq.onboarding_instances` - Onboarding + buddy/manager

---

## 6.2 Wat Legacy Is (NIET GEBRUIKEN)

**Tabellen:**
- 🔴 `praktijk_locaties` (duplicaat van venues)
- 🔴 `equipment` (text vestiging, geen FK)
- 🔴 `public.onboarding_*` (duplicaat schema, 0 rows)
- 🔴 `hq.roster_entries` (alternatief, 0 rows)
- 🔴 `schedules` (wrapper, 0 rows)

**UI's:**
- 🔴 `Inventaris.tsx` (LegacyBanner)
- 🔴 `Onderhoud.tsx` (LegacyBanner)
- 🔴 `Storingen.tsx` (LegacyBanner)
- 🔴 `TicketEnquiry.tsx` (LegacyBanner)
- 🔴 `Medewerkersbeheer.tsx` (oude UI)
- 🔴 `PraktijkMedewerkerBeheer.tsx` (oude UI)

---

## 6.3 Wat Ontbreekt (voor validatie-matrix)

**Onboarding/Supervisie:**
1. ❌ `employment_stage` (stagiair/werkstudent/onder supervisie) → `hq.employees`
2. ❌ `supervision_required` + `supervisor_employee_id` → `hq.employees`
3. ❌ Skill → Taak requirements → nieuwe tabel `procedure_skill_requirements`
4. ❌ Room → Skill requirements → nieuwe tabel `room_skill_requirements`

**Planning Enforcement:**
5. ❌ Scheduler engine die `roster_constraints` enforced
6. ❌ Asset status check in shift validator
7. ❌ Certificaat verloop waarschuwing systeem

**Data:**
8. ❌ Schedule_shifts data (0 rows - geen productiedata)
9. ❌ Rooms venue FK invullen (0/34 gekoppeld)
10. ❌ Employees user_id koppeling (10/11 niet gekoppeld)

---

## 6.4 Kritieke Acties (NIET NU UITVOEREN)

**Prioriteit 1 (DATA):**
1. Koppel 10 employees aan users (`user_id`)
2. Migreer rooms `vestiging` text → `venue_id` FK
3. Voeg testdata toe aan `schedule_shifts` (nu 0 rows)

**Prioriteit 2 (SCHEMA):**
4. Voeg toe: `hq.employees.employment_stage` enum
5. Voeg toe: `hq.employees.supervision_required` boolean
6. Voeg toe: `hq.employees.supervisor_employee_id` FK

**Prioriteit 3 (OPRUIMEN):**
7. Verberg legacy routes in sidebar/router
8. Markeer `public.onboarding_*` als deprecated
9. Documenteer: `equipment` tabel niet gebruiken

**Prioriteit 4 (ENFORCEMENT):**
10. Bouw constraint validator engine
11. Implementeer certificaat verloop alerts
12. Maak skill-taak requirement systeem

---

## EINDE INVENTARISATIE - LEGACY DETECTIE & ONBOARDING/SUPERVISIE COMPLEET
