# HQ Master Inventory - DNMZ+ Assist 3.0

**Versie:** 1.0
**Datum:** 2025-12-16
**Scope:** Complete inventarisatie HQ Super Admin module

---

## 1. BASISPRINCIPES

### Source of Truth
- **Personeel:** `hq.employees` is ENIGE bron - geen nieuwe staff tabellen
- **Roosters:** `hq.roster_entries` - geen dubbele systemen
- **Documenten:** `hq.documents` met storage in `hr-documents` bucket
- **Bekwaamheden:** `hq.skills` + `hq.employee_skills` + certificaat koppeling

### Data Access Strategy
- **RLS Enabled:** Alle hq tabellen hebben RLS policies
- **Veilige Reads:** SECURITY DEFINER RPC's voor cross-schema access
- **Frontend Access:** Via public views of RPC gateways (NOOIT direct naar hq schema)

---

## 2. SCHEMA OVERZICHT

### HR Module (Core)

#### **hq.employees** - MASTER PERSONEEL TABLE ✅ KEEP
**Status:** Source of truth voor ALL personeel
**Kolommen:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → public.users) - koppeling naar auth
- `voornaam`, `achternaam`, `roepnaam` (text)
- `geboortedatum` (date)
- `email`, `telefoon` (text)
- `functie` (text, required) - bijv. Tandarts, Mondhygiënist, Assistente
- `afdeling` (text)
- `locatie_id` (uuid, FK → hq.venues)
- `dienstverband_type` (text)
- `in_dienst_vanaf`, `uit_dienst_per` (date)
- `fte` (numeric, default 1.00)
- `status` (text, default 'actief') - actief/inactief/verlof
- `is_leidinggevend` (boolean)
- `toestemming_beeldmateriaal` (boolean)
- `notities` (text)
- `created_at`, `updated_at` (timestamptz)

**Constraints:**
- UNIQUE constraint op email (als ingevuld)
- CHECK constraint op status IN ('actief', 'inactief', 'verlof', 'proeftijd')

**RLS:** Owner + Super Admin access

---

#### **hq.documents** - HR DOCUMENTEN ✅ KEEP
**Status:** Centrale document store
**Kolommen:**
- `id` (uuid, PK)
- `employee_id` (uuid, FK → hq.employees, required)
- `document_type` (text, required) - auto-determined from category
- `category_id` (uuid, FK → hq.document_categories, required)
- `document_category_id` (uuid, FK → hq.document_categories) - legacy duplicate
- `titel` (text, required)
- `omschrijving` (text)
- `file_url` (text, required) - storage path in hr-documents bucket
- `file_naam`, `file_type` (text)
- `file_size_bytes` (bigint)
- `geldig_vanaf`, `geldig_tot`, `valid_until` (date) - valid_until is duplicate
- `vertrouwelijk` (boolean, default false) - extra privacy protection
- `zichtbaar_voor_medewerker` (boolean, default false)
- `status` (text, default 'actief')
- `geupload_door` (uuid, FK → public.users)
- `created_at`, `updated_at` (timestamptz)

**Known Issues:**
- Dubbele category kolommen: `category_id` EN `document_category_id` (beide required!)
- Dubbele validity kolommen: `geldig_tot` EN `valid_until`

**RLS:** Strict - employee_id match + super admin bypass

---

#### **hq.document_categories** - DOCUMENT CATEGORIEËN ✅ KEEP
**Status:** Master lijst van document types
**Kolommen:**
- `id` (uuid, PK)
- `code` (text, unique, required) - bijv. CONTRACT, CERTIFICATE, DIPLOMA
- `label` (text, required) - Nederlandse weergave naam
- `omschrijving` (text)
- `hr_only` (boolean, default false) - alleen voor HR/management
- `allowed_for_skills` (boolean, default false) - kan gekoppeld aan bekwaamheid
- `sort_order` (integer, required)
- `is_active` (boolean, default true)
- `created_at` (timestamptz)

**Seeded Categories (MUST EXIST):**
1. CONTRACT - Contracten
2. ADDENDUM - Addenda
3. CERTIFICATE - Diploma's & Certificaten (allowed_for_skills=true)
4. IDENTIFICATION - Identificatie
5. PERFORMANCE_REVIEW - Gesprekken & Beoordelingen
6. POP - Persoonlijk Ontwikkelplan
7. ONBOARDING - Onboarding Docs
8. FINANCIAL_HR - Financieel (HR)

**RLS:** Public read (filtered by is_active), admin write

---

#### **hq.contracts** - ARBEIDSCONTRACTEN ✅ KEEP
**Status:** Contract management
**Kolommen:**
- `id` (uuid, PK)
- `employee_id` (uuid, FK → hq.employees, required)
- `contract_type` (text, required) - bepaalde tijd/onbepaalde tijd/oproep/zzp
- `ingangsdatum` (date, required)
- `einddatum` (date) - NULL voor onbepaalde tijd
- `fte` (numeric, default 1.00)
- `salaris_schaal` (text) - CAO schaal
- `bruto_uurloon` (numeric) - PRIVACY: owner only
- `document_url` (text) - link naar document in hq.documents of storage
- `getekend` (boolean, default false)
- `getekend_datum` (date)
- `status` (text, default 'concept') - concept/actief/verlopen/beëindigd
- `notities` (text)
- `created_by` (uuid)
- `created_at`, `updated_at` (timestamptz)

**Privacy:** Salaris velden zijn OWNER/SUPER_ADMIN only

**RLS:** Strict owner + super admin

---

### Bekwaamheden Module

#### **hq.skills** - MASTER BEKWAAMHEDEN ✅ KEEP
**Status:** Definitie van alle bekwaamheden/vaardigheden
**Kolommen:**
- `id` (uuid, PK)
- `code` (text, unique, required) - bijv. BIG_TANDARTS, RONTGEN_CERT
- `naam` (text, required) - Nederlandse naam
- `categorie` (text, required) - CLINICAL/TECHNICAL/ADMINISTRATIVE/SOFT_SKILLS
- `opleiding_vereist` (boolean, default false)
- `certificaat_vereist` (boolean, default false)
- `certificaat_geldigheid_jaren` (integer) - bijv. 5 jaar voor röntgen
- `omschrijving` (text)
- `required_document_category_id` (uuid, FK → hq.document_categories)
- `is_actief` (boolean, default true)
- `created_at`, `updated_at` (timestamptz)

**RLS:** Public read, admin write

---

#### **hq.employee_skills** - MEDEWERKER BEKWAAMHEDEN ✅ KEEP
**Status:** Koppeling employee ↔ skill met details
**Kolommen:**
- `id` (uuid, PK)
- `employee_id` (uuid, FK → hq.employees, required)
- `skill_id` (uuid, FK → hq.skills, required)
- `level` (text, required) - basis/gevorderd/bekwaam/expert
- `gecertificeerd` (boolean, default false)
- `certificaat_datum` (date)
- `certificaat_verloopt_op` (date) - CRITICAL voor expiry warnings
- `certificaat_url` (text) - legacy, prefer document_id
- `document_id` (uuid, FK → hq.documents) - primary certificate link
- `training_voltooid_datum` (date)
- `training_door` (text)
- `is_actief` (boolean, default true)
- `notities` (text)
- `toegekend_door` (uuid)
- `created_at`, `updated_at` (timestamptz)

**Business Logic:**
- Als `gecertificeerd = true`, dan `certificaat_verloopt_op` MOET ingevuld zijn
- Expiry status: groen (>60d), oranje (≤60d), rood (verlopen)

**RLS:** Employee can read own, admin can all

---

#### **hq.employee_skill_documents** - SKILL ↔ DOCUMENT LINKS ✅ KEEP
**Status:** Many-to-many koppeling skill instance aan documenten
**Kolommen:**
- `id` (uuid, PK)
- `employee_skill_id` (uuid, FK → hq.employee_skills, required)
- `document_id` (uuid, FK → hq.documents, required)
- `is_primair` (boolean, default false) - primair bewijs certificaat
- `notities` (text)
- `toegevoegd_door` (uuid)
- `created_at`, `updated_at` (timestamptz)

**Gebruik:**
- Eén skill kan meerdere documenten hebben (bijv. diploma + certificaat + herregistratie)
- Filter op `is_primair = true` voor main certificate

**RLS:** Follows employee_skill access

---

### Praktijkbeheer Module

#### **hq.venues** - LOCATIES/PRAKTIJKEN ✅ KEEP
**Status:** Master lijst praktijken + opslagplaatsen
**Kolommen:**
- `id` (uuid, PK)
- `name` (text, required)
- `venue_type` (enum: practice/storage, default 'practice')
- `address_street`, `address_city`, `address_postal_code` (text)
- `phone`, `email` (text)
- `active` (boolean, default true)
- `notes` (text)
- `created_at`, `updated_at` (timestamptz)

**Types:**
- `practice` - Praktijklocatie (2x voor DNMZ)
- `storage` - Opslagplaats (1x)

**RLS:** Public read (if active), admin write

---

### Roosters Module

#### **hq.roster_entries** - ROOSTERINVOER ✅ KEEP
**Status:** Centrale rooster entries (vervangt oude schedules)
**Kolommen:**
- `id` (uuid, PK)
- `employee_id` (uuid, FK → hq.employees, required)
- `locatie_id` (uuid, FK → hq.venues)
- `datum` (date, required)
- `start_tijd`, `eind_tijd` (time, required)
- `shift_type` (text) - ochtend/middag/avond/nacht
- `notities` (text)
- `created_by` (uuid)
- `created_at`, `updated_at` (timestamptz)

**Business Logic:**
- eind_tijd > start_tijd
- Geen overlapping voor zelfde employee op zelfde datum

**RLS:** Admin write, employee can read own

---

#### **hq.shiftbase_employee_map** - SHIFTBASE KOPPELING ✅ KEEP
**Status:** Mapping tussen Shiftbase IDs en hq.employees
**Kolommen:**
- `id` (uuid, PK)
- `employee_id` (uuid, FK → hq.employees, required)
- `shiftbase_id` (text, unique, required)
- `shiftbase_name` (text)
- `auto_matched` (boolean, default false)
- `verified` (boolean, default false)
- `created_at`, `updated_at` (timestamptz)

**Gebruik:** Import/export met Shiftbase

---

#### **hq.shiftbase_venue_map** - SHIFTBASE LOCATIE KOPPELING ✅ KEEP
**Status:** Mapping tussen Shiftbase location IDs en hq.venues
**Kolommen:**
- `id` (uuid, PK)
- `venue_id` (uuid, FK → hq.venues, required)
- `shiftbase_location_id` (text, unique, required)
- `shiftbase_location_name` (text)
- `auto_matched` (boolean)
- `verified` (boolean)
- `created_at`, `updated_at` (timestamptz)

---

### Onboarding Module

#### **hq.onboarding_templates** - ONBOARDING SJABLONEN ✅ KEEP
**Kolommen:**
- `id`, `naam`, `voor_functie`, `omschrijving`, `duur_dagen`, `taken` (jsonb), `is_actief`

#### **hq.onboarding_instances** - ONBOARDING TRAJECTEN ✅ KEEP
**Kolommen:**
- `id`, `employee_id`, `template_id`, `start_datum`, `verwachte_eind_datum`, `werkelijke_eind_datum`
- `buddy_employee_id`, `manager_employee_id`, `status`, `voortgang_percentage`, `notities`

#### **hq.onboarding_tasks** - ONBOARDING TAKEN ✅ KEEP
**Kolommen:**
- `id`, `instance_id`, `task_naam`, `omschrijving`, `verantwoordelijke`, `deadline`, `voltooid`, `voltooid_datum`, `notities`

---

### Performance & Beoordeling

#### **hq.performance_reviews** - FUNCTIONERINGSGESPREKKEN ✅ KEEP
**Status:** Beoordelingen en gesprekken
**Kolommen:**
- `id` (uuid, PK)
- `employee_id` (uuid, FK → hq.employees, required)
- `review_type` (text, required) - intake/proeftijd/jaargesprek/POP/verbetertraject
- `review_datum` (date, required)
- `volgende_review_datum` (date)
- `uitgevoerd_door` (uuid, FK → hq.employees) - leidinggevende
- `aanwezig_personen` (text[])
- `overall_score` (numeric)
- `competenties` (jsonb) - gestructureerde beoordeling
- `sterke_punten`, `verbeterpunten`, `doelen_afspraken` (text)
- `document_url` (text) - link naar formele verslaglegging
- `ondertekend` (boolean)
- `status` (text, default 'gepland') - gepland/afgerond/geannuleerd
- `notities` (text)
- `created_at`, `updated_at` (timestamptz)

**Privacy:** Owner + manager + super admin only

---

### Taken Module

#### **hq.tasks** - MANAGEMENT TAKEN ✅ KEEP
**Status:** Asana-light task management
**Kolommen:**
- `id` (uuid, PK)
- `title` (text, required)
- `description` (text)
- `status` (enum: open/in_progress/blocked/done)
- `priority` (enum: low/normal/high/urgent)
- `due_date` (date)
- `venue_id` (uuid, FK → hq.venues) - optioneel koppeling aan locatie
- `created_by` (uuid)
- `created_at`, `updated_at` (timestamptz)

#### **hq.task_assignees** - TAAK TOEWIJZINGEN ✅ KEEP
**Kolommen:**
- `task_id`, `employee_id` (composite PK)

#### **hq.task_labels** - TAAK LABELS ✅ KEEP
**Kolommen:**
- `id`, `name`, `color`

#### **hq.task_label_links** - TAAK ↔ LABEL ✅ KEEP
**Kolommen:**
- `task_id`, `label_id` (composite PK)

#### **hq.task_comments** - TAAK COMMENTS ✅ KEEP
**Kolommen:**
- `id`, `task_id`, `comment_text`, `created_by`, `created_at`

---

## 3. PUBLIC VIEWS (Gateway Layer)

### Purpose
Frontend MOET via deze views of RPC's - NOOIT direct naar hq schema.

### Active Views

| View Name | Source | Kolommen | Status |
|-----------|--------|----------|--------|
| `hq_employees_view` | hq.employees | Basis employee data (geen privacy velden) | ✅ KEEP |
| `hq_documents_view` | hq.documents | Document basics zonder joins | ✅ KEEP |
| `hq_employee_documents_view` | hq.documents + joins | Full document data met category & employee names | ✅ KEEP |
| `hq_document_categories_view` | hq.document_categories | Actieve categorieën (filtered by is_active) | ✅ KEEP |
| `hq_skills_view` | hq.skills | Actieve skills | ✅ KEEP |
| `hq_employee_skills_view` | hq.employee_skills | Basis skill assignments | ✅ KEEP |
| `hq_employee_skills_with_status_view` | hq.employee_skills + joins | Skills met skill naam & categorie | ✅ KEEP |
| `hq_contracts_view` | hq.contracts | Contract data (NO salary fields) | ✅ KEEP |
| `hq_performance_reviews_view` | hq.performance_reviews | Review data | ✅ KEEP |
| `hq_onboarding_templates_view` | hq.onboarding_templates | Templates | ✅ KEEP |
| `hq_onboarding_instances_view` | hq.onboarding_instances | Instances | ✅ KEEP |

**RLS op Views:** Alle views erven RLS van onderliggende tabellen.

---

## 4. RPC FUNCTIONS (API Gateway)

### Document Management

#### **hq_insert_document(...)** ✅ KEEP
**Purpose:** Veilige document upload via SECURITY DEFINER
**Parameters:**
- `p_employee_id` uuid (required)
- `p_category_id` uuid (required)
- `p_titel` text (required)
- `p_omschrijving` text
- `p_file_url` text (required)
- `p_file_naam` text
- `p_file_type` text
- `p_file_size_bytes` bigint
- `p_valid_until` date
- `p_vertrouwelijk` boolean
- `p_zichtbaar_voor_medewerker` boolean

**Returns:** uuid (document id)

**Logic:**
1. Validates all required fields
2. Looks up category_code from category_id
3. Auto-determines document_type via `hq.map_category_to_document_type()`
4. Inserts into hq.documents (fills BOTH category_id columns)
5. Sets geupload_door to current user
6. Returns new document id

**Security:** SECURITY DEFINER, safe search_path

---

#### **hq_list_employee_documents(p_employee_id uuid)** ✅ KEEP
**Purpose:** List all documents voor een employee
**Returns:** TABLE met 22 kolommen:
- id, employee_id, document_type, category_id, category_code, category_label
- titel, omschrijving, file_url, file_naam, file_type, file_size_bytes
- geldig_vanaf, geldig_tot, zichtbaar_voor_medewerker, vertrouwelijk
- status, geupload_door, created_at, updated_at
- employee_firstname, employee_lastname

**Filter:** `WHERE d.employee_id = p_employee_id`
**Order:** `ORDER BY d.created_at DESC`

**Security:** SECURITY DEFINER bypasses RLS

---

### Skills Management

#### **insert_employee_skill(...)** ✅ KEEP
**Purpose:** Create skill assignment
**Parameters:**
- `p_employee_id` uuid
- `p_skill_id` uuid
- `p_level` text
- `p_gecertificeerd` boolean
- `p_certificaat_verloopt_op` date
- `p_notities` text
- `p_document_id` uuid
- `p_is_actief` boolean

**Returns:** json (row_to_json van nieuwe record)

---

#### **insert_employee_skill_document(...)** ✅ KEEP
**Purpose:** Link document to skill
**Parameters:**
- `p_employee_skill_id` uuid
- `p_document_id` uuid
- `p_is_primair` boolean

**Returns:** json

---

## 5. HELPER FUNCTIONS

### **hq.map_category_to_document_type(category_code text)** ✅ KEEP
**Purpose:** Maps category code → document_type enum
**Logic:**
```
CONTRACT → CONTRACT
ADDENDUM → ADDENDUM
CERTIFICATE → CERTIFICATE
DIPLOMA → CERTIFICATE
IDENTIFICATION → IDENTIFICATION
PERFORMANCE_REVIEW → PERFORMANCE_REVIEW
POP → POP
ONBOARDING → ONBOARDING
FINANCIAL_HR → FINANCIAL_HR
```

---

## 6. STORAGE

### **hr-documents** Bucket ✅ KEEP
**Purpose:** Storage voor alle HR documenten
**Path Structure:** `/employee_{employee_id}/{filename}`
**Access:** Via storage.objects RLS policies
**RLS Status:** Currently DISABLED (moet gefixed!)

**Known Issue:** RLS policies op storage.objects zijn complex - momenteel disabled voor troubleshooting.

---

## 7. CONSTRAINTS & BUSINESS RULES

### Critical Constraints

1. **hq.documents**
   - `category_id` EN `document_category_id` beide required (duplicate!)
   - FK naar hq.document_categories moet bestaan
   - `file_url` required
   - `document_type` moet valid enum zijn

2. **hq.employee_skills**
   - Als `gecertificeerd = true` → `certificaat_verloopt_op` MOET ingevuld
   - `level` IN ('basis', 'gevorderd', 'bekwaam', 'expert')
   - Unique constraint: (employee_id, skill_id, is_actief=true) - één actieve skill per employee

3. **hq.roster_entries**
   - eind_tijd > start_tijd
   - Geen overlapping shifts voor zelfde employee

4. **hq.venues**
   - venue_type IN ('practice', 'storage')

---

## 8. KNOWN ISSUES

### High Priority Fixes Needed

1. **Documents Table Cleanup**
   - Dubbele category kolommen: `category_id` + `document_category_id`
   - Dubbele validity kolommen: `geldig_tot` + `valid_until`
   - **Action:** Consolidate to single columns, add migration to copy data

2. **Storage RLS**
   - hr-documents bucket heeft RLS disabled
   - **Action:** Implement proper storage policies met owner/admin access

3. **View Reliability**
   - Medewerkers pagina soms 404 / "Opnieuw proberen" nodig
   - **Root Cause:** Frontend probeert direct naar hq schema? RLS block?
   - **Action:** Verify frontend alleen via views/RPCs, niet direct hq queries

4. **Document Upload Flow**
   - Na upload niet altijd direct zichtbaar in lijst
   - **Action:** Force refresh na successful upload, verify RPC return

---

## 9. FRONTEND ACCESS PATTERNS

### ✅ CORRECT Patterns

```typescript
// Via RPC
const { data, error } = await supabase.rpc('hq_list_employee_documents', {
  p_employee_id: employeeId
});

// Via View
const { data, error } = await supabase
  .from('hq_employees_view')
  .select('*');
```

### ❌ INCORRECT Patterns

```typescript
// NOOIT DOEN - Direct naar hq schema
const { data, error } = await supabase
  .from('hq.employees')  // Dit faalt door RLS/schema access
  .select('*');
```

---

## 10. STABILITY CHECKLIST

### Must Pass 10/10 Times

- [ ] Medewerkers page loads zonder "Opnieuw proberen"
- [ ] Documenten tab loads en toont alle categorieën
- [ ] Document upload → immediate visibility in lijst
- [ ] Skills lijst loads
- [ ] Contract lijst loads
- [ ] Venues lijst loads
- [ ] Roster entries load
- [ ] Tasks load
- [ ] No 404 on any HQ rest endpoint
- [ ] No "schema must be public/graphql_public" errors

---

## 11. DEPRECATION CANDIDATES

### Legacy Tables (mogelijk verwijderen)

**Nog te beoordelen:**
- Oude staff/schedule tabellen buiten hq schema (als die bestaan)
- Legacy roster systeem tabellen

**DO NOT TOUCH:**
- Alles in bovenstaande inventaris is KEEP tenzij expliciet deprecated

---

## 12. FASE 2 REQUIREMENTS - BEKWAAMHEDEN

### Must Build

1. **Bekwaamheid Toevoegen UI**
   - Dropdown: selecteer skill uit hq.skills
   - Dropdown: niveau (basis/gevorderd/bekwaam/expert)
   - Checkbox: gecertificeerd
   - DatePicker: geldig_tot (conditionally required als gecertificeerd=true)
   - Textarea: notities
   - **Certificaat sectie:**
     - Toon alleen documenten met category CERTIFICATE
     - Selecteer bestaand document OF
     - Button "Upload nieuw certificaat" → roept document upload modal op met pre-select CERTIFICATE

2. **Expiry Warning System**
   - Calculate expiry status:
     - `certificaat_verloopt_op IS NULL` → geen status
     - `certificaat_verloopt_op > now() + 60 days` → GROEN
     - `certificaat_verloopt_op BETWEEN now() AND now() + 60 days` → ORANJE (expires soon)
     - `certificaat_verloopt_op < now()` → ROOD (expired)
   - Display badges op:
     - Employee card (skill tags)
     - Employee profile (skills tab)
     - Skills overview page
     - Later: Compliance dashboard

3. **RPC's Needed**
   - `insert_employee_skill(...)` - ALREADY EXISTS ✅
   - `insert_employee_skill_document(...)` - ALREADY EXISTS ✅
   - Mogelijk: `update_employee_skill(...)` - nog maken
   - Mogelijk: `get_employee_skills_with_expiry(employee_id)` - convenience query

---

## EINDE INVENTARIS

**Next Actions:**
1. Fix stability issues (Medewerkers 10/10 load, Documents 10/10)
2. Build FASE 2 Bekwaamheden UI
3. Test expiry warnings
4. Move to FASE 3+ after acceptance

