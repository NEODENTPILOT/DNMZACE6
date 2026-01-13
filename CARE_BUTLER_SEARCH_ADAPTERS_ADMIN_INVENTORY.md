# CARE BUTLER SEARCH ADAPTERS — BEHEER INVENTARISATIE

**Datum:** 2024-12-25
**Scope:** Search Adapters configuratie-systeem voor Care Butler Ask
**Status:** ✅ Geïmplementeerd met kritieke defecten

---

## 1. UI ENTRY POINTS & ACCESS CONTROL

### Admin Interface
**Locatie:** `src/pages/admin/SearchAdapters.tsx` (418 regels)
**Route:** `search-adapters`
**Menu item:** Layout.tsx:239
```typescript
{ id: 'search-adapters', label: '🔍 Search Adapters', icon: Search, badge: 'NEW' }
```

**Rendering:** App.tsx:400
```typescript
{currentPage === 'search-adapters' && <SearchAdapters />}
```

### Access Control
**RLS Policies:**
- **Beheer (ALL):** Alleen `super_admin` en `admin` rollen
- **View (SELECT):** Alle authenticated users kunnen `enabled = true` adapters zien

**Policy definitie:** `supabase/migrations/20251225162701_create_search_adapters_system.sql:57-74`

### Functionaliteit
De admin UI biedt:
- ✅ Lijst van alle adapters (enabled/disabled, system/custom)
- ✅ Toggle enabled/disabled per adapter
- ✅ Edit mode voor niet-systeem velden
- ✅ Cache clear na wijzigingen (`clearAdapterCache()`)
- ✅ Create nieuwe adapter (standaard disabled)
- ❌ **ONTBREEKT:** Validatie of `table_name` bestaat
- ❌ **ONTBREEKT:** Validatie of `search_fields` (title/snippet) bestaan in tabel
- ❌ **ONTBREEKT:** Test query functie per adapter
- ❌ **ONTBREEKT:** Adapter health check dashboard

---

## 2. DATABASE SCHEMA

### Tabel: `search_adapters`
**Migratie:** `20251225162701_create_search_adapters_system.sql`

| Kolom | Type | Constraint | Default | Beschrijving |
|-------|------|------------|---------|--------------|
| `id` | uuid | PRIMARY KEY | gen_random_uuid() | Unieke identifier |
| `name` | text | UNIQUE NOT NULL | - | Interne adapter naam (snake_case) |
| `display_name` | text | NOT NULL | - | UI weergave naam |
| `description` | text | - | NULL | Wat deze adapter doorzoekt |
| `table_name` | text | NOT NULL | - | Bron tabel naam |
| `enabled` | boolean | - | true | Is adapter actief |
| `icon_name` | text | - | 'FileText' | Lucide icon naam |
| `search_fields` | jsonb | NOT NULL | {...} | title_field, snippet_field, etc. |
| `route_template` | text | NOT NULL | - | Frontend route (e.g. "/protocols/{id}") |
| `filters` | jsonb | - | {} | Default filters voor queries |
| `order_by` | text | - | 'created_at DESC' | Sorteer veld + richting |
| `scope_tags` | text[] | - | ['auto'] | Scopes: auto, care_best, care_max, etc. |
| `relevance_weights` | jsonb | - | {...} | Custom scoring weights |
| `is_system` | boolean | - | false | Systeem adapters: niet verwijderbaar |
| `created_at` | timestamptz | - | now() | Aanmaakdatum |
| `updated_at` | timestamptz | - | now() | Update timestamp (auto-trigger) |
| `created_by` | uuid | FK auth.users | NULL | Aanmaker |

### Indexes
```sql
idx_search_adapters_enabled  ON (enabled) WHERE enabled = true
idx_search_adapters_name     ON (name)
idx_search_adapters_scope_tags USING gin(scope_tags)
```

### RLS Policies
1. **"Admins can manage search adapters"** (FOR ALL)
   - USING: `users.rol IN ('super_admin', 'admin')`
2. **"Users can view enabled adapters"** (FOR SELECT)
   - USING: `enabled = true`

### Triggers
- `trigger_update_search_adapters_updated_at` → auto-update `updated_at` kolom

---

## 3. RUNTIME USAGE & ADAPTER LOADING

### Service Integratie
**Locatie:** `src/services/careButlerAskService.ts`

### Adapter Loading Flow
```typescript
loadDynamicAdapters() [115-145]
  ↓
  SELECT * FROM search_adapters WHERE enabled = true
  ↓
  IF error OR empty → getFallbackAdapters() [247-256]
  ↓
  createDynamicAdapter(config) per row [150-242]
  ↓
  Cache in cachedAdapters (session-level)
```

### Cache Management
- **Cache variabele:** `cachedAdapters: SearchAdapter[] | null` (regel 100)
- **Cache clear:** `clearAdapterCache()` (regel 106)
- **Clear triggers:**
  - Na toggle enabled/disabled (SearchAdapters.tsx:74)
  - Na save edit (SearchAdapters.tsx:115)
  - Na create nieuwe adapter (SearchAdapters.tsx:146)

### Dynamic Adapter Creation
**Functie:** `createDynamicAdapter(config)` (regel 150-242)

**Proces:**
1. Extract `title_field` en `snippet_field` uit `search_fields`
2. Build dynamic query:
   ```typescript
   supabase.from(config.table_name).select('*')
   ```
3. Apply `filters` (config.filters) via `.eq(key, value)`
4. Text search via OR conditions:
   ```typescript
   keywords.map(kw => `${titleField}.ilike.%${kw}%`).join(',')
   ```
5. Order by `config.order_by` (split op spatie)
6. Map results naar `Citation[]` met:
   - `route` = `config.route_template.replace('{id}', item.id)`
   - `relevance_score` = calculateRelevance(...)
   - `metadata.adapter_name` = config.name

### Fallback Mechanism
**Functie:** `getFallbackAdapters()` (regel 247-256)

**Hardcoded adapters (als DB faalt):**
1. timelineEventsAdapter
2. protocolsAdapter
3. checklistsAdapter
4. tasksAdapter
5. iceWorkflowsAdapter
6. inventoryAdapter

⚠️ **RISICO:** Fallback adapters zijn hardcoded en NIET gesynchroniseerd met DB seed data

### Scope Filtering
**Functie:** `getAdapters(scope, intent, query)` (regel 589-667)

**Logica:**
- Als `scope !== 'auto'`: filter adapters op `scope_tags` (regel 594-615)
- Fallback scope map (regel 601-610) gebruikt hardcoded adapter namen
- **PROBLEEM:** Hardcoded scope map refereert naar adapters die NIET in seed data zitten

**Intent-based prioritering:**
- **Clinical intent** (regel 618-646):
  - Priority: `ice_workflows`, `protocols`, `ice_templates`, `behandeloptie_templates`, `interventie_templates`
  - Fallback: `timeline_events`
  - Operational (if needed): `checklists`, `inventory`

- **General intent** (regel 648-666):
  - Priority: `protocols`, `checklists`, `timeline_events`, `tasks`, `inventory`, workflows, templates

⚠️ **KRITIEK DEFECT:** Adapters `ice_templates`, `behandeloptie_templates`, `interventie_templates` bestaan NIET in seed data maar worden WEL verwacht in code!

---

## 4. GESEEDE ADAPTERS (ACTUEEL)

### Seed Migratie
**Locatie:** `supabase/migrations/20251225162722_seed_search_adapters_initial_data.sql`

| # | name | display_name | table_name | scope_tags | is_system |
|---|------|--------------|------------|------------|-----------|
| 1 | `timeline_events` | Timeline Posts | `timeline_events` | auto, posts, care_best | ✅ true |
| 2 | `protocols` | Protocollen | `protocols` | auto, protocols, care_best | ✅ true |
| 3 | `checklists` | Checklists | `checklist_instances` | auto, checklists, care_best | ✅ true |
| 4 | `tasks` | Taken | `hq.tasks` | auto, tasks, care_max | ✅ true |
| 5 | `ice_workflows` | ICE Workflows | `interventie_workflows` | auto, workflows, care_best | ✅ true |
| 6 | `inventory` | Inventaris | `inventory_assets` | auto, inventory, care_max | ✅ true |

### Detail per Adapter

#### 1. Timeline Events
```json
{
  "table_name": "timeline_events",
  "search_fields": {
    "title_field": "titel",
    "snippet_field": "body",
    "date_field": "created_at",
    "author_field": "user_id"
  },
  "route_template": "/tzone/post/{id}",
  "filters": {"event_type": "post"},
  "order_by": "created_at DESC",
  "scope_tags": ["auto", "posts", "care_best"]
}
```
**Status:** ✅ Correct
**Validatie:** Tabel bestaat, velden bestaan

#### 2. Protocols
```json
{
  "table_name": "protocols",
  "search_fields": {
    "title_field": "titel",
    "snippet_field": "omschrijving",
    "date_field": "created_at"
  },
  "route_template": "/protocollen/{id}",
  "filters": {},
  "order_by": "created_at DESC",
  "scope_tags": ["auto", "protocols", "care_best"]
}
```
**Status:** ⚠️ **RISICO:** `snippet_field = "omschrijving"` — moet `content` zijn voor volledige tekst
**Validatie:** Tabel bestaat, velden bestaan (maar suboptimaal)

#### 3. Checklists
```json
{
  "table_name": "checklist_instances",
  "search_fields": {
    "title_field": "titel",
    "snippet_field": "notities",
    "date_field": "created_at",
    "status_field": "status"
  },
  "route_template": "/checklists",
  "filters": {},
  "order_by": "created_at DESC",
  "scope_tags": ["auto", "checklists", "care_best"]
}
```
**Status:** ⚠️ **DEFECT:** `snippet_field = "notities"` is vaak NULL/leeg
**Oplossing:** Gebruik combinatie van `template.naam` + `status` voor betere snippets
**Route probleem:** Route `/checklists` heeft geen `{id}` — gebruiker kan niet direct naar checklist

#### 4. Tasks
```json
{
  "table_name": "hq.tasks",
  "search_fields": {
    "title_field": "title",
    "snippet_field": "description",
    "date_field": "created_at",
    "status_field": "status"
  },
  "route_template": "/hq/tasks",
  "filters": {},
  "order_by": "created_at DESC",
  "scope_tags": ["auto", "tasks", "care_max"]
}
```
**Status:** ⚠️ **RISICO:** Schema prefix `hq.` kan problemen geven
**Route probleem:** Route `/hq/tasks` heeft geen `{id}` — gebruiker kan niet direct naar task

#### 5. ICE Workflows
```json
{
  "table_name": "interventie_workflows",
  "search_fields": {
    "title_field": "naam",
    "snippet_field": "omschrijving",
    "date_field": "created_at",
    "fase_field": "fase",
    "rol_field": "rol"
  },
  "route_template": "/ice-workflows",
  "filters": {"is_actief": true},
  "order_by": "created_at DESC",
  "scope_tags": ["auto", "workflows", "care_best"]
}
```
**Status:** ⚠️ **DEFECT:**
- `title_field = "naam"` → moet `titel` zijn (conform tabel schema)
- `snippet_field = "omschrijving"` → OK
- Route `/ice-workflows` heeft geen `{id}` — gebruiker kan niet direct naar workflow

#### 6. Inventory
```json
{
  "table_name": "inventory_assets",
  "search_fields": {
    "title_field": "naam",
    "snippet_field": "omschrijving",
    "date_field": "created_at",
    "location_field": "locatie_naam"
  },
  "route_template": "/inventaris",
  "filters": {},
  "order_by": "created_at DESC",
  "scope_tags": ["auto", "inventory", "care_max"]
}
```
**Status:** ⚠️ **DEFECT:**
- `title_field = "naam"` → moet `asset_name` zijn (conform tabel schema)
- `snippet_field = "omschrijving"` → moet `notes` zijn
- Route `/inventaris` heeft geen `{id}` — gebruiker kan niet direct naar asset

---

## 5. ONTBREKENDE ADAPTERS (KRITIEKE GAP)

De code refereert naar adapters die **NIET** in de seed data zitten:

### 5.1 `ice_templates`
**Verwacht door code:**
- careButlerAskService.ts:55 (SOURCE_WEIGHTS)
- careButlerAskService.ts:602 (scopeMap care_best)
- careButlerAskService.ts:625 (clinicalPriority)
- careButlerAskService.ts:656 (generalPriority)

**Status:** ❌ **ONTBREEKT** in seed data
**Gevolg:** Adapter wordt NOOIT geladen, clinical queries missen behandelplan templates

**Voorgestelde configuratie:**
```json
{
  "name": "ice_templates",
  "display_name": "Behandelplan Templates",
  "description": "ICE behandelplan templates en diagnose-specifieke workflows",
  "table_name": "behandelplan_templates",
  "enabled": true,
  "icon_name": "Stethoscope",
  "search_fields": {
    "title_field": "naam",
    "snippet_field": "clinical_context",
    "date_field": "created_at"
  },
  "route_template": "/ice-workflows?template={id}",
  "filters": {"is_actief": true},
  "order_by": "diagnose_nummer ASC",
  "scope_tags": ["auto", "care_best", "workflows"],
  "is_system": true
}
```

### 5.2 `behandeloptie_templates`
**Verwacht door code:**
- careButlerAskService.ts:57 (SOURCE_WEIGHTS)
- careButlerAskService.ts:602 (scopeMap care_best)
- careButlerAskService.ts:626 (clinicalPriority)
- careButlerAskService.ts:657 (generalPriority)

**Status:** ❌ **ONTBREEKT** in seed data
**Gevolg:** Treatment options worden niet gevonden

**Voorgestelde configuratie:**
```json
{
  "name": "behandeloptie_templates",
  "display_name": "Behandelopties",
  "description": "Behandeloptie templates per diagnose",
  "table_name": "behandeloptie_templates",
  "enabled": true,
  "icon_name": "Activity",
  "search_fields": {
    "title_field": "naam",
    "snippet_field": "indicaties",
    "date_field": "created_at"
  },
  "route_template": "/ice-workflows?optie={id}",
  "filters": {"is_actief": true},
  "order_by": "volgorde ASC",
  "scope_tags": ["auto", "care_best"],
  "is_system": true
}
```

### 5.3 `interventie_templates`
**Verwacht door code:**
- careButlerAskService.ts:56 (SOURCE_WEIGHTS)
- careButlerAskService.ts:602 (scopeMap care_best)
- careButlerAskService.ts:627 (clinicalPriority)
- careButlerAskService.ts:658 (generalPriority)

**Status:** ❌ **ONTBREEKT** in seed data
**Gevolg:** Interventie templates worden niet doorzocht

**Voorgestelde configuratie:**
```json
{
  "name": "interventie_templates",
  "display_name": "Interventie Templates",
  "description": "Standaard interventies en verrichtingen",
  "table_name": "interventie_templates",
  "enabled": true,
  "icon_name": "Wrench",
  "search_fields": {
    "title_field": "naam",
    "snippet_field": "omschrijving",
    "date_field": "created_at"
  },
  "route_template": "/verrichtingen-v2?interventie={id}",
  "filters": {"is_actief": true},
  "order_by": "naam ASC",
  "scope_tags": ["auto", "care_best"],
  "is_system": true
}
```

---

## 6. BEKENDE DEFECTEN & RISICO'S

### KRITIEKE DEFECTEN (P0)

#### D1: Ontbrekende Clinical Adapters
**Ernst:** 🔴 BLOCKER
**Impact:** Clinical queries retourneren GEEN behandelplan templates, behandelopties, interventies
**Oorzaak:** Adapters `ice_templates`, `behandeloptie_templates`, `interventie_templates` ontbreken in seed data
**Gevolg:** Diagnosis-anchored search (nieuw geïmplementeerd) haalt WEL templates op via hardcoded queries, maar NIET via adapters
**Fix:** Voeg 3 ontbrekende adapters toe aan seed data (zie sectie 5)

#### D2: Incorrecte Field Mappings
**Ernst:** 🔴 HOOG
**Impact:** Queries falen of retourneren lege snippets
**Instanties:**
- `ice_workflows.title_field = "naam"` → moet `"titel"` zijn
- `inventory.title_field = "naam"` → moet `"asset_name"` zijn
- `inventory.snippet_field = "omschrijving"` → moet `"notes"` zijn

**Fix:** Update seed data met correcte veldnamen

#### D3: Routes Zonder {id} Placeholder
**Ernst:** 🟠 MEDIUM
**Impact:** Gebruiker kan niet direct naar bron navigeren, citations openen algemene pagina
**Instanties:**
- `checklists` → route `/checklists` (moet `/checklists/{id}`)
- `tasks` → route `/hq/tasks` (moet `/hq/tasks/{id}`)
- `ice_workflows` → route `/ice-workflows` (moet `/ice-workflows/{id}`)
- `inventory` → route `/inventaris` (moet `/inventaris/{id}`)

**Fix:** Update `route_template` kolom met `{id}` placeholder

#### D4: Suboptimale Snippet Fields
**Ernst:** 🟡 LOW
**Impact:** Snippets zijn vaak leeg of weinig informatief
**Instanties:**
- `checklists.snippet_field = "notities"` → vaak NULL
- `protocols.snippet_field = "omschrijving"` → kort, gebruik `content` voor volledige tekst

**Fix:** Update `search_fields` naar betere velden

### TECHNISCHE RISICO'S

#### R1: Geen Validatie bij Adapter Configuratie
**Ernst:** 🟠 MEDIUM
**Impact:** Admins kunnen adapters configureren die crashen bij runtime
**Scenario's:**
- `table_name` verwijst naar niet-bestaande tabel
- `title_field` of `snippet_field` bestaan niet in tabel
- `order_by` verwijst naar niet-bestaand veld
- `filters` gebruiken ongeldige kolommen

**Mitigation:** Huidige graceful failure in `createDynamicAdapter()` catch-block voorkomt crashes
**Verbetering:** Voeg validatie toe in admin UI + health check endpoint

#### R2: Schema Prefix Handling (hq.tasks)
**Ernst:** 🟡 LOW
**Impact:** Mogelijk probleem met schema-prefixed tabelnamen
**Huidige status:** Werkt (Supabase ondersteunt `schema.table` notatie)
**Risico:** Bij toekomstige migraties kunnen access issues ontstaan

#### R3: Cache Invalidatie
**Ernst:** 🟡 LOW
**Impact:** Wijzigingen in DB worden niet zichtbaar zonder cache clear
**Huidige mitigatie:** Admin UI roept `clearAdapterCache()` aan na wijzigingen
**Risico:** Bij directe DB updates (via SQL) blijft cache stale
**Verbetering:** Implementeer TTL-based cache of DB-triggered invalidatie

#### R4: Hardcoded Fallback Divergentie
**Ernst:** 🟠 MEDIUM
**Impact:** Als DB faalt, gebruikt systeem hardcoded adapters die mogelijk niet gesynchroniseerd zijn
**Voorbeeld:** Fallback `iceWorkflowsAdapter` gebruikt mogelijk andere velden dan DB versie
**Verbetering:** Synchroniseer fallback adapters met seed data of verwijder fallback (fail loud)

### SCOPE TAG INCONSISTENTIES

#### S1: Clinical vs Operational Mixing
**Ernst:** 🟡 LOW
**Probleem:** `timeline_events` heeft zowel `posts` als `care_best` (clinical) scope
**Impact:** Posts verschijnen in clinical queries terwijl ze vaak operational zijn
**Discussie:** Dit kan gewenst zijn (clinical posts), maar is onduidelijk

#### S2: ICE Workflows Scope Redundantie
**Probleem:** `ice_workflows` heeft scopes `auto`, `workflows`, EN `care_best`
**Impact:** Adapter wordt dubbel gefilterd in clinical + workflow queries
**Gevolg:** Mogelijk dubbele prioriteit (goed voor relevantie, maar inefficiënt)

---

## 7. QUICK WINS (ZONDER REFACTOR)

### QW1: Voeg Ontbrekende Adapters Toe (P0)
**Actie:** Voeg 3 ontbrekende adapters toe aan seed data
**Files:** Nieuwe migratie met INSERT statements (zie sectie 5)
**Effort:** 15 minuten
**Impact:** ⭐⭐⭐⭐⭐ (Critical feature compleet)

**SQL:**
```sql
INSERT INTO search_adapters (name, display_name, description, table_name, enabled, icon_name, search_fields, route_template, filters, order_by, scope_tags, is_system)
VALUES
  ('ice_templates', 'Behandelplan Templates', 'ICE behandelplan templates', 'behandelplan_templates', true, 'Stethoscope',
   '{"title_field": "naam", "snippet_field": "clinical_context", "date_field": "created_at"}'::jsonb,
   '/ice-workflows?template={id}', '{"is_actief": true}'::jsonb, 'diagnose_nummer ASC',
   ARRAY['auto', 'care_best', 'workflows'], true),

  ('behandeloptie_templates', 'Behandelopties', 'Behandeloptie templates per diagnose', 'behandeloptie_templates', true, 'Activity',
   '{"title_field": "naam", "snippet_field": "indicaties", "date_field": "created_at"}'::jsonb,
   '/ice-workflows?optie={id}', '{"is_actief": true}'::jsonb, 'volgorde ASC',
   ARRAY['auto', 'care_best'], true),

  ('interventie_templates', 'Interventie Templates', 'Standaard interventies en verrichtingen', 'interventie_templates', true, 'Wrench',
   '{"title_field": "naam", "snippet_field": "omschrijving", "date_field": "created_at"}'::jsonb,
   '/verrichtingen-v2?interventie={id}', '{"is_actief": true}'::jsonb, 'naam ASC',
   ARRAY['auto', 'care_best'], true)
ON CONFLICT (name) DO NOTHING;
```

### QW2: Fix Field Mappings (P0)
**Actie:** Update bestaande adapters met correcte veldnamen
**Effort:** 10 minuten
**Impact:** ⭐⭐⭐⭐ (Queries retourneren correcte data)

**SQL:**
```sql
-- Fix ice_workflows title field
UPDATE search_adapters
SET search_fields = jsonb_set(search_fields, '{title_field}', '"titel"')
WHERE name = 'ice_workflows';

-- Fix inventory fields
UPDATE search_adapters
SET search_fields = jsonb_set(
  jsonb_set(search_fields, '{title_field}', '"asset_name"'),
  '{snippet_field}', '"notes"'
)
WHERE name = 'inventory';
```

### QW3: Fix Routes Met {id} (P1)
**Actie:** Update route_template met {id} placeholders
**Effort:** 5 minuten
**Impact:** ⭐⭐⭐ (Direct navigation werkt)

**SQL:**
```sql
UPDATE search_adapters SET route_template = '/checklists/{id}' WHERE name = 'checklists';
UPDATE search_adapters SET route_template = '/hq/tasks/{id}' WHERE name = 'tasks';
UPDATE search_adapters SET route_template = '/ice-workflows/{id}' WHERE name = 'ice_workflows';
UPDATE search_adapters SET route_template = '/inventaris/{id}' WHERE name = 'inventory';
```

### QW4: Verbeter Protocol Snippet (P2)
**Actie:** Gebruik `content` in plaats van `omschrijving` voor vollere snippets
**Effort:** 2 minuten
**Impact:** ⭐⭐ (Betere context in results)

**SQL:**
```sql
UPDATE search_adapters
SET search_fields = jsonb_set(search_fields, '{snippet_field}', '"content"')
WHERE name = 'protocols';
```

### QW5: Voeg Health Check Knop Toe (P2)
**Actie:** Voeg "Test Adapter" knop toe in admin UI die probeert 1 query uit te voeren
**Location:** `src/pages/admin/SearchAdapters.tsx`
**Effort:** 30 minuten
**Impact:** ⭐⭐⭐ (Admins kunnen problemen detecteren voor productie)

**Pseudo-code:**
```typescript
const testAdapter = async (adapter: SearchAdapter) => {
  try {
    const { data, error } = await supabase
      .from(adapter.table_name)
      .select('*')
      .limit(1);

    if (error) throw error;

    // Check if fields exist
    const titleField = adapter.search_fields.title_field;
    const snippetField = adapter.search_fields.snippet_field;

    if (data[0] && (!data[0][titleField] || !data[0][snippetField])) {
      throw new Error(`Fields ${titleField} or ${snippetField} do not exist`);
    }

    setSuccess(`✅ Adapter "${adapter.name}" works correctly`);
  } catch (err) {
    setError(`❌ Adapter "${adapter.name}" failed: ${err.message}`);
  }
};
```

---

## 8. MONITORING & OBSERVABILITY

### Huidige Logging
**Locatie:** `careButlerAskService.ts`

**Log statements:**
- `[CareButlerAsk] Failed to load adapters` (regel 128)
- `[CareButlerAsk] Exception loading adapters` (regel 142)
- `[CareButlerAsk] ${name} search failed` (regel 191)
- `[CareButlerAsk] ${name} adapter exception` (regel 235)
- `[CareButlerAsk] Intent: ${intent}, Adapters: ${names}` (regel 686)
- `[CareButlerAsk] Adapter ${name} failed` (regel 691)

**Console logging:** Alleen in browser console, GEEN persistente logging

### Ontbrekende Monitoring
❌ Adapter performance metrics (query duration per adapter)
❌ Adapter success/failure rates
❌ Most used adapters analytics
❌ Zero-results queries per adapter
❌ Cache hit/miss ratio

### Verbetering Voorstel
**Low-hanging fruit:**
1. Log adapter errors naar `ai_gate_sessions` tabel (bestaat al)
2. Voeg `adapter_stats` kolom toe aan `ai_gate_sessions` met per-adapter metrics
3. Dashboard in admin UI met adapter health overview

---

## 9. ACCEPTATIE TEST SCENARIOS

### Scenario 1: Basis Adapter Functionaliteit
✅ **PASS:** Admin kan adapters bekijken
✅ **PASS:** Admin kan adapter toggle enabled/disabled
✅ **PASS:** Admin kan adapter bewerken (display_name, description)
✅ **PASS:** Cache wordt gecleared na wijzigingen
⚠️ **FAIL:** Nieuwe adapter zonder validatie kan crashen

### Scenario 2: Clinical Query Flow
```
Query: "diepe caries"
Expected adapters: ice_templates, protocols, ice_workflows
```
❌ **FAIL:** `ice_templates` adapter bestaat niet, wordt niet doorzocht
✅ **PASS:** `protocols` wordt doorzocht
⚠️ **PARTIAL:** `ice_workflows` heeft verkeerde title_field

### Scenario 3: Operational Query Flow
```
Query: "autoclaaf onderhoud"
Expected adapters: inventory, checklists, tasks
```
⚠️ **PARTIAL:** `inventory` heeft verkeerde field mappings
✅ **PASS:** `checklists` wordt doorzocht
✅ **PASS:** `tasks` wordt doorzocht
⚠️ **ISSUE:** Routes hebben geen {id}, gebruiker kan niet direct navigeren

### Scenario 4: Fallback Behavior
```
Simulate: DB connection failure
```
✅ **PASS:** getFallbackAdapters() werkt
⚠️ **RISK:** Fallback adapters mogelijk niet gesynchroniseerd met DB versie

---

## 10. CONCLUSIE & PRIORITEITEN

### Status: 🟡 FUNCTIONEEL MET KRITIEKE GAPS

**Werkt:**
- ✅ Admin UI voor adapter beheer
- ✅ Database-driven adapter configuratie
- ✅ Dynamic adapter loading met graceful failure
- ✅ Scope filtering en intent-based prioritering
- ✅ Cache management

**Kritieke Gaps:**
- 🔴 3 ontbrekende clinical adapters (ice_templates, behandeloptie_templates, interventie_templates)
- 🔴 Incorrecte field mappings (ice_workflows, inventory)
- 🟠 Routes zonder {id} placeholder (4 adapters)
- 🟠 Geen validatie in admin UI

### Aanbevolen Actie Plan

**Phase 1: Quick Fixes (30 minuten)**
1. Voeg 3 ontbrekende adapters toe (QW1) → BLOCKER FIX
2. Fix field mappings (QW2) → KRITIEK
3. Fix routes met {id} (QW3) → HIGH

**Phase 2: Stability (2 uur)**
4. Voeg adapter health check toe (QW5)
5. Implementeer test query functie
6. Voeg field validation toe bij edit

**Phase 3: Observability (4 uur)**
7. Implementeer adapter metrics logging
8. Bouw adapter health dashboard
9. Setup alerts voor failing adapters

### Success Metrics
- ✅ Alle verwachte adapters in code bestaan ook in DB
- ✅ Alle field mappings zijn correct gevalideerd
- ✅ Alle routes navigeren naar detail pagina's
- ✅ Zero adapter crashes in productie (2 weken)
- ✅ Admin kan zelfstandig nieuwe adapters toevoegen zonder dev support

---

**END OF REPORT**
