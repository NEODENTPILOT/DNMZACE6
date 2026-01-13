# Care Butler Ask - Search Fields Fix

**Datum:** 2025-12-26
**Probleem:** Adapter config had geen search_fields voor clinical adapters → undefined.ilike errors
**Oplossing:** Fallback values + DB seed voor clinical adapters

---

## Probleem

### **Symptoom:**
```
Error: undefined.ilike.%keyword%
→ Query builder crasht omdat search_fields undefined is
```

### **Root Cause:**
```typescript
// VOOR (FOUT):
const titleField = config.search_fields.title_field;  // ← undefined!
const snippetField = config.search_fields.snippet_field;  // ← undefined!

// Query builder:
`${titleField}.ilike.%${keyword}%`  // ← "undefined.ilike.%keyword%"
```

**Waarom?**
- Database seed `20251225162722_seed_search_adapters_initial_data.sql` bevat ALLEEN:
  - `timeline_events`
  - `protocols`
  - `checklists`
  - `tasks`
  - `ice_workflows`
  - `inventory`

- **MISSING:**
  - `behandeloptie_templates`
  - `ice_templates`
  - `interventie_templates`

→ Deze adapters worden dynamisch geladen via `createDynamicAdapter()` maar hadden geen config in DB
→ `config.search_fields` was `undefined`

---

## Oplossing

### **1️⃣ Fallback Values in Code**

```typescript
function createDynamicAdapter(config: AdapterConfig): SearchAdapter {
  search: async (query: string, filters?: SearchFilters): Promise<Citation[]> => {
    // CRITICAL: Ensure search_fields always has fallback values
    const titleField = config.search_fields?.title_field || 'naam';
    const snippetField = config.search_fields?.snippet_field || 'omschrijving';
    const dateField = config.search_fields?.date_field;

    // Debug logging
    console.debug(
      `[AdapterSearch] ${config.name} using fields:`,
      `title="${titleField}"`,
      `snippet="${snippetField}"`,
      `date="${dateField || 'created_at'}"`
    );

    // Query builder now ALWAYS has valid field names
    if (keywords.length > 0) {
      const titleConditions = keywords.map(kw => `${titleField}.ilike.%${kw}%`).join(',');
      const snippetConditions = keywords.map(kw => `${snippetField}.ilike.%${kw}%`).join(',');
      queryBuilder = queryBuilder.or(`${titleConditions},${snippetConditions}`);
    }
  }
}
```

**Voordeel:**
- ✅ NOOIT meer `undefined.ilike` errors
- ✅ Graceful fallback naar standaard veldnamen
- ✅ Debug logging toont welke velden gebruikt worden

---

### **2️⃣ Database Seed voor Clinical Adapters**

**Migration:** `20251226000000_add_clinical_search_adapters.sql`

```sql
-- Behandeloptie Templates Adapter
INSERT INTO search_adapters (
  name,
  display_name,
  description,
  table_name,
  enabled,
  icon_name,
  search_fields,
  route_template,
  filters,
  order_by,
  scope_tags,
  is_system
)
VALUES (
  'behandeloptie_templates',
  'Behandelopties',
  'Behandelopties en therapieën',
  'behandeloptie_templates',
  true,
  'Stethoscope',
  '{"title_field": "naam", "snippet_field": "omschrijving", "date_field": "created_at"}'::jsonb,
  '/ice-template-builder',
  '{}'::jsonb,
  'naam ASC',
  ARRAY['auto', 'care_best', 'behandeloptie'],
  true
)
ON CONFLICT (name) DO UPDATE SET ...;

-- ICE Templates Adapter
INSERT INTO search_adapters (...) VALUES (
  'ice_templates',
  'ICE Templates',
  'Behandelplan templates (ICE)',
  'behandelplan_templates',
  ...
  '{"title_field": "naam", "snippet_field": "omschrijving", "date_field": "created_at"}'::jsonb,
  ...
);

-- Interventie Templates Adapter
INSERT INTO search_adapters (...) VALUES (
  'interventie_templates',
  'Interventies',
  'Interventies en behandelstappen',
  'interventie_templates',
  ...
  '{"title_field": "naam", "snippet_field": "omschrijving", "date_field": "created_at"}'::jsonb,
  ...
);
```

**Voordeel:**
- ✅ Clinical adapters nu officieel in database
- ✅ `search_fields` expliciet geconfigureerd
- ✅ Scope tags voor intent filtering (`'behandeloptie'`, `'protocol'`)
- ✅ `ON CONFLICT DO UPDATE` voor idempotentie

---

## Field Mapping

### **Clinical Adapters (naam/omschrijving)**

| Adapter | Table | Title Field | Snippet Field | Date Field |
|---------|-------|-------------|---------------|------------|
| `behandeloptie_templates` | `behandeloptie_templates` | `naam` | `omschrijving` | `created_at` |
| `ice_templates` | `behandelplan_templates` | `naam` | `omschrijving` | `created_at` |
| `interventie_templates` | `interventie_templates` | `naam` | `omschrijving` | `created_at` |
| `ice_workflows` | `interventie_workflows` | `naam` | `omschrijving` | `created_at` |

### **System Adapters (titel/omschrijving of body)**

| Adapter | Table | Title Field | Snippet Field | Date Field |
|---------|-------|-------------|---------------|------------|
| `timeline_events` | `timeline_events` | `titel` | `body` | `created_at` |
| `protocols` | `protocols` | `titel` | `omschrijving` | `created_at` |
| `checklists` | `checklist_instances` | `titel` | `notities` | `created_at` |
| `tasks` | `hq.tasks` | `title` | `description` | `created_at` |
| `inventory` | `inventory_assets` | `naam` | `omschrijving` | `created_at` |

---

## Debug Logging Output

### Console Output (Per Adapter)

```
[AdapterSearch] behandeloptie_templates using fields: title="naam" snippet="omschrijving" date="created_at"
[AdapterSearch] ice_templates using fields: title="naam" snippet="omschrijving" date="created_at"
[AdapterSearch] interventie_templates using fields: title="naam" snippet="omschrijving" date="created_at"
[AdapterSearch] protocols using fields: title="titel" snippet="omschrijving" date="created_at"
[AdapterSearch] timeline_events using fields: title="titel" snippet="body" date="created_at"
```

**Voordeel:**
- Developer ziet exact welke velden gebruikt worden
- Makkelijk debuggen bij zoekproblemen
- Transparant welke fallbacks actief zijn

---

## Testing

### Test 1: Query zonder search_fields config

**Scenario:** Adapter bestaat maar heeft geen `search_fields` in DB

```typescript
const config = {
  name: 'test_adapter',
  table_name: 'test_table',
  search_fields: undefined,  // ← Missing!
  ...
};
```

**Expected:**
```
[AdapterSearch] test_adapter using fields: title="naam" snippet="omschrijving" date="created_at"
✅ Query: naam.ilike.%keyword% OR omschrijving.ilike.%keyword%
```

---

### Test 2: Query met search_fields config

**Scenario:** Adapter heeft expliciete `search_fields` in DB

```typescript
const config = {
  name: 'protocols',
  search_fields: {
    title_field: 'titel',
    snippet_field: 'omschrijving',
    date_field: 'created_at'
  },
  ...
};
```

**Expected:**
```
[AdapterSearch] protocols using fields: title="titel" snippet="omschrijving" date="created_at"
✅ Query: titel.ilike.%keyword% OR omschrijving.ilike.%keyword%
```

---

### Test 3: Clinical adapter zoekt op "implantologie"

**Query:** `"implantologie"`

**Expected Output:**
```
[AdapterSearch] behandeloptie_templates using fields: title="naam" snippet="omschrijving" date="created_at"
[AdapterSearch] ice_templates using fields: title="naam" snippet="omschrijving" date="created_at"
[AdapterSearch] interventie_templates using fields: title="naam" snippet="omschrijving" date="created_at"

Results:
1. [behandeloptie_templates] "Implantologie intake" (weight: 130)
2. [ice_templates] "Implantologie volledige kaak" (weight: 120)
3. [interventie_templates] "Implantaat plaatsing" (weight: 100)
```

✅ Geen `undefined.ilike` errors
✅ Alle clinical adapters zoeken op `naam` en `omschrijving`
✅ Results ranked op basis van intent boosts

---

## Conclusie

### ✅ Fixes

1. **Fallback values** in `createDynamicAdapter()`:
   - `title_field` → fallback `'naam'`
   - `snippet_field` → fallback `'omschrijving'`
   - `date_field` → fallback `'created_at'` (implicit)

2. **Database seed** voor clinical adapters:
   - `behandeloptie_templates`
   - `ice_templates`
   - `interventie_templates`

3. **Debug logging** voor transparantie:
   - Console output toont welke velden gebruikt worden
   - Makkelijk debuggen bij zoekproblemen

### ✅ Resultaat

- NOOIT meer `undefined.ilike` errors
- Clinical adapters werken out-of-the-box
- Graceful fallback naar standaard veldnamen
- Transparant welke adapters welke velden gebruiken

### ✅ Build Status

```
✓ 1789 modules transformed
✓ built in 16.67s
```

TypeScript compileert zonder errors.
