# FASE 3B — STEP 1: Database Layer COMPLETE ✅

## 📋 Overview

Database foundation for CliniDoc encounter forms with non-blocking validation and comprehensive audit logging.

---

## 🗄️ Tables Created

### 1. `clinidoc_encounter_drafts`

**Purpose:** Store draft/submitted form data for clinical encounters

**Columns:**
```sql
id                  uuid PRIMARY KEY
created_at          timestamptz NOT NULL DEFAULT now()
updated_at          timestamptz NOT NULL DEFAULT now()
created_by          uuid NOT NULL REFERENCES auth.users(id)
patient_id          uuid NULL
epd_placeholder_id  text NULL
encounter_id        text NOT NULL (e.g., 'pijnklacht_acute', 'informed_consent_implantologie')
status              text NOT NULL DEFAULT 'draft' CHECK (draft|submitted|archived)
payload             jsonb NOT NULL DEFAULT '{}'
linked_doc_id       uuid NULL
```

**Constraints:**
- Must have either `patient_id` OR `epd_placeholder_id` (at least one)

**Indexes:**
- `created_by` (for user queries)
- `patient_id` (partial, where NOT NULL)
- `encounter_id` (for encounter type filtering)
- `status` (for draft/submitted filtering)
- `linked_doc_id` (partial, where NOT NULL)
- `created_at DESC` (for recent drafts)

---

### 2. `clinidoc_validation_overrides`

**Purpose:** Audit log when users bypass validation requirements

**Columns:**
```sql
id               uuid PRIMARY KEY
created_at       timestamptz NOT NULL DEFAULT now()
created_by       uuid NOT NULL REFERENCES auth.users(id)
scope            text NOT NULL CHECK (encounter|document)
draft_id         uuid NULL REFERENCES clinidoc_encounter_drafts(id) ON DELETE CASCADE
doc_id           uuid NULL
encounter_id     text NULL
reason           text NOT NULL
missing_required jsonb NOT NULL DEFAULT '[]'
snapshot         jsonb NOT NULL DEFAULT '{}'
```

**Constraints:**
- Must have either `draft_id` OR `doc_id` (at least one)

**Indexes:**
- `created_by` (for user queries)
- `draft_id` (partial, where NOT NULL)
- `doc_id` (partial, where NOT NULL)
- `scope` (for encounter vs document filtering)
- `created_at DESC` (for recent overrides)

---

## 🔒 RLS Policies

### `clinidoc_encounter_drafts`

| Action | Policy | Logic |
|--------|--------|-------|
| SELECT | Users view own, Admins/Managers view all | `created_by = auth.uid()` OR `users.rol IN ('Admin', 'Manager')` |
| INSERT | Users create own | `created_by = auth.uid()` |
| UPDATE | Users update own, Admins update all | `created_by = auth.uid()` OR `users.rol = 'Admin'` |
| DELETE | Users delete own drafts, Admins delete all | `(created_by = auth.uid() AND status = 'draft')` OR `users.rol = 'Admin'` |

### `clinidoc_validation_overrides`

| Action | Policy | Logic |
|--------|--------|-------|
| SELECT | Users view own, Admins/Managers view all | `created_by = auth.uid()` OR `users.rol IN ('Admin', 'Manager')` |
| INSERT | Users create own | `created_by = auth.uid()` |
| UPDATE | ❌ Not allowed | Audit logs are immutable |
| DELETE | Only Admins | `users.rol = 'Admin'` |

---

## ⚙️ Triggers

### Auto-update `updated_at`

```sql
CREATE TRIGGER trigger_update_encounter_drafts_timestamp
  BEFORE UPDATE ON clinidoc_encounter_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_clinidoc_encounter_drafts_updated_at();
```

**Effect:** Automatically sets `updated_at = now()` on every UPDATE to `clinidoc_encounter_drafts`

---

## 🎯 Frontend Usage Guide

### 1. Create Draft (Auto-Save)

```typescript
import { supabase } from '@/lib/supabase';

async function createOrUpdateDraft(
  patientId: string | null,
  epdPlaceholderId: string | null,
  encounterId: string,
  formData: Record<string, any>
) {
  const { data: { user } } = await supabase.auth.getUser();

  // Check if draft exists
  const { data: existingDraft } = await supabase
    .from('clinidoc_encounter_drafts')
    .select('id')
    .eq('created_by', user.id)
    .eq('encounter_id', encounterId)
    .eq('patient_id', patientId)
    .eq('status', 'draft')
    .maybeSingle();

  if (existingDraft) {
    // Update existing draft
    const { error } = await supabase
      .from('clinidoc_encounter_drafts')
      .update({ payload: formData })
      .eq('id', existingDraft.id);

    return { draftId: existingDraft.id, error };
  } else {
    // Create new draft
    const { data, error } = await supabase
      .from('clinidoc_encounter_drafts')
      .insert({
        created_by: user.id,
        patient_id: patientId,
        epd_placeholder_id: epdPlaceholderId,
        encounter_id: encounterId,
        status: 'draft',
        payload: formData
      })
      .select('id')
      .single();

    return { draftId: data?.id, error };
  }
}
```

---

### 2. Load Existing Draft

```typescript
async function loadDraft(draftId: string) {
  const { data, error } = await supabase
    .from('clinidoc_encounter_drafts')
    .select('*')
    .eq('id', draftId)
    .single();

  return { draft: data, error };
}

// Or load most recent draft for encounter type + patient
async function loadRecentDraft(patientId: string, encounterId: string) {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('clinidoc_encounter_drafts')
    .select('*')
    .eq('created_by', user.id)
    .eq('patient_id', patientId)
    .eq('encounter_id', encounterId)
    .eq('status', 'draft')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return { draft: data, error };
}
```

---

### 3. Submit with Override (When Validation Fails)

```typescript
async function submitWithOverride(
  draftId: string,
  overrideReason: string,
  missingFields: string[],
  fullSnapshot: Record<string, any>
) {
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Log the override
  const { error: overrideError } = await supabase
    .from('clinidoc_validation_overrides')
    .insert({
      created_by: user.id,
      scope: 'encounter',
      draft_id: draftId,
      encounter_id: fullSnapshot.encounter_id,
      reason: overrideReason,
      missing_required: missingFields,
      snapshot: fullSnapshot
    });

  if (overrideError) {
    console.error('Override log failed:', overrideError);
    return { success: false, error: overrideError };
  }

  // 2. Mark draft as submitted
  const { error: updateError } = await supabase
    .from('clinidoc_encounter_drafts')
    .update({ status: 'submitted' })
    .eq('id', draftId);

  if (updateError) {
    console.error('Draft update failed:', updateError);
    return { success: false, error: updateError };
  }

  // 3. Generate document in document_store (if applicable)
  // ... your document generation logic here ...

  return { success: true };
}
```

---

### 4. Link Draft to Generated Document

```typescript
async function linkDraftToDocument(draftId: string, documentId: string) {
  const { error } = await supabase
    .from('clinidoc_encounter_drafts')
    .update({ linked_doc_id: documentId })
    .eq('id', draftId);

  return { error };
}
```

---

### 5. Query Override History (Admin/Manager)

```typescript
async function getOverrideHistory(
  filters?: {
    userId?: string;
    encounterId?: string;
    scope?: 'encounter' | 'document';
    fromDate?: string;
  }
) {
  let query = supabase
    .from('clinidoc_validation_overrides')
    .select(`
      *,
      created_by_user:users!created_by(naam, rol)
    `)
    .order('created_at', { ascending: false });

  if (filters?.userId) {
    query = query.eq('created_by', filters.userId);
  }

  if (filters?.encounterId) {
    query = query.eq('encounter_id', filters.encounterId);
  }

  if (filters?.scope) {
    query = query.eq('scope', filters.scope);
  }

  if (filters?.fromDate) {
    query = query.gte('created_at', filters.fromDate);
  }

  const { data, error } = await query;

  return { overrides: data, error };
}
```

---

## 🧪 Test Queries

### Test 1: Insert and Retrieve Draft

```sql
-- Run as authenticated user
INSERT INTO clinidoc_encounter_drafts (
  created_by,
  epd_placeholder_id,
  encounter_id,
  status,
  payload
)
VALUES (
  auth.uid(),
  'ACE-EPD-TEST001',
  'pijnklacht_acute',
  'draft',
  '{
    "pijn_score": 8,
    "locatie": "element_46",
    "duur": "3 dagen",
    "karakter": "kloppend"
  }'::jsonb
)
RETURNING *;

-- Verify retrieval
SELECT * FROM clinidoc_encounter_drafts
WHERE encounter_id = 'pijnklacht_acute'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:** Draft created and retrieved successfully with all fields populated

---

### Test 2: Insert and Retrieve Override Log

```sql
-- First get a draft ID
WITH test_draft AS (
  SELECT id FROM clinidoc_encounter_drafts
  WHERE created_by = auth.uid()
  LIMIT 1
)
-- Log override
INSERT INTO clinidoc_validation_overrides (
  created_by,
  scope,
  draft_id,
  encounter_id,
  reason,
  missing_required,
  snapshot
)
SELECT
  auth.uid(),
  'encounter',
  id,
  'pijnklacht_acute',
  'Patient heeft urgentie, verwijzer informatie wordt later aangevuld',
  '["verwijzer_id", "verwijsbrief_datum"]'::jsonb,
  '{
    "payload": {"pijn_score": 8, "locatie": "element_46"},
    "validation_state": {"missing_count": 2}
  }'::jsonb
FROM test_draft
RETURNING *;

-- Verify retrieval
SELECT
  vo.*,
  u.naam as created_by_naam,
  u.rol as created_by_rol
FROM clinidoc_validation_overrides vo
JOIN users u ON u.id = vo.created_by
ORDER BY vo.created_at DESC
LIMIT 1;
```

**Expected Result:** Override log created with reason, missing fields, and complete snapshot

---

### Test 3: Update Draft (Auto-updates `updated_at`)

```sql
-- Update payload
UPDATE clinidoc_encounter_drafts
SET payload = payload || '{"extra_field": "nieuwe waarde"}'::jsonb
WHERE created_by = auth.uid()
AND encounter_id = 'pijnklacht_acute'
AND status = 'draft'
RETURNING id, updated_at, payload;
```

**Expected Result:** `updated_at` timestamp is automatically updated, payload merged correctly

---

### Test 4: Admin Views All Overrides

```sql
-- Run as user with rol = 'Admin' or 'Manager'
SELECT
  vo.id,
  vo.created_at,
  vo.encounter_id,
  vo.reason,
  vo.missing_required,
  u.naam as user_naam,
  u.rol as user_rol,
  jsonb_array_length(vo.missing_required) as missing_count
FROM clinidoc_validation_overrides vo
JOIN users u ON u.id = vo.created_by
ORDER BY vo.created_at DESC;
```

**Expected Result:** Admin/Manager can see all overrides from all users

---

### Test 5: Verify RLS (Non-Owner Cannot Update)

```sql
-- Try to update someone else's draft (should fail)
UPDATE clinidoc_encounter_drafts
SET status = 'archived'
WHERE created_by != auth.uid()
LIMIT 1;
```

**Expected Result:** 0 rows updated (RLS blocks unauthorized access)

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    USER FILLS FORM                      │
│              (Pijnklacht / Informed Consent)            │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│        AUTO-SAVE TO clinidoc_encounter_drafts           │
│    status: 'draft', payload: {...form values...}       │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│           USER CLICKS "GENEREREN" / "SUBMIT"            │
└─────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
   ┌────────────────┐              ┌────────────────┐
   │ VALIDATION OK  │              │ VALIDATION FAIL│
   └────────────────┘              └────────────────┘
            │                               │
            │                               ▼
            │              ┌─────────────────────────────┐
            │              │  USER CHOOSES OVERRIDE      │
            │              │  Provides reason + missing  │
            │              └─────────────────────────────┘
            │                               │
            │                               ▼
            │              ┌─────────────────────────────┐
            │              │ INSERT INTO                 │
            │              │ clinidoc_validation_overrides│
            │              │ (audit log)                 │
            │              └─────────────────────────────┘
            │                               │
            └───────────────┬───────────────┘
                            ▼
┌─────────────────────────────────────────────────────────┐
│         UPDATE clinidoc_encounter_drafts                │
│              status: 'draft' → 'submitted'              │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│       GENERATE DOCUMENT → document_store                │
│    (optional, if document output required)              │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│     UPDATE clinidoc_encounter_drafts.linked_doc_id      │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Verification Checklist

- [x] Table `clinidoc_encounter_drafts` created
- [x] Table `clinidoc_validation_overrides` created
- [x] All indexes created (12 total)
- [x] RLS enabled on both tables
- [x] RLS policies created (SELECT/INSERT/UPDATE/DELETE)
- [x] Trigger for `updated_at` created
- [x] Constraints enforced (patient_id OR epd_placeholder_id)
- [x] Constraints enforced (draft_id OR doc_id)
- [x] Foreign keys configured with CASCADE
- [x] Default values set correctly
- [x] Check constraints for enums (status, scope)

---

## 🚀 Next Steps (FASE 3B — STEP 2)

1. **Frontend Component:** Build `EncounterFormContainer` component
2. **Form Definitions:** Define encounter form schemas (Pijnklacht, Informed Consent, etc.)
3. **Validation Logic:** Implement field-level validation with override UI
4. **Auto-Save:** Implement debounced auto-save to `clinidoc_encounter_drafts`
5. **Override Modal:** Build `ValidationOverrideModal` component
6. **Document Generation:** Link submitted encounters to `document_store`

---

## 📝 Notes

### Non-Breaking Design
- No changes to existing `document_store` table
- No changes to existing CliniDoc flows
- New tables are completely isolated
- Can be adopted incrementally per encounter type

### Security
- All RLS policies respect user ownership
- Admins/Managers have read access for audit purposes
- Override logs are immutable (no UPDATE policy)
- Cascade deletes protect referential integrity

### Performance
- Partial indexes on nullable columns (patient_id, linked_doc_id)
- DESC index on created_at for recent queries
- JSONB columns for flexible payload storage

---

**DATABASE LAYER COMPLETE** ✅

Ready for frontend integration in FASE 3B — STEP 2.
