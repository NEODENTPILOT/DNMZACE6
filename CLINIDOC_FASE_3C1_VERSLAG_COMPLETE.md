# CliniDoc FASE 3C.1 - Verslag Generatie COMPLEET ✅

**Datum:** 22 december 2024
**Status:** PRODUCTIE-KLAAR

---

## 🎯 DOEL BEHAALD

EncounterFormPremium kan nu rechtstreeks Verslag documenten genereren:
1. ✅ Encounter draft wordt opgeslagen (auto-save)
2. ✅ Template wordt gekozen en gerenderd met encounter data
3. ✅ Document wordt opgeslagen in document_store
4. ✅ DocumentEditor kan worden geopend (inline integratie)
5. ✅ Volledige error handling + geen crashes

---

## 📦 DELIVERABLES

### 1. Template Variable System - Encounter Support
**File:** `src/utils/templateVariables.ts`

**Wat toegevoegd:**
- `encounter?: Record<string, any>` in `TemplateVariableContext`
- `getValueByPath()` helper voor veilig nested path lezen
- `replaceNestedVariables()` voor dynamische `{{encounter.*}}` replacement
- Ondersteunt alle nested paths: `{{encounter.soortPijn}}`, `{{encounter.pijnScore}}`, etc.

**Backwards compatible:** Alle bestaande patient.*, behandelaar.*, locatie.* variabelen werken nog steeds.

---

### 2. Template Render Service Update
**File:** `src/services/templateRenderService.ts`

**Wat toegevoegd:**
- `encounterData?: Record<string, any>` in `RenderContext`
- `encounterDraftId?: string` in `RenderContext`
- Encounter data wordt toegevoegd aan variableContext in `buildVariableContext()`

**Example usage:**
```typescript
const result = await renderTemplate(templateContent, {
  patientId: '123',
  encounterData: { soortPijn: 'Scherp', pijnScore: 8 },
  documentRef: 'DOC-XYZ'
});
```

---

### 3. Encounter to Document Service (NEW)
**File:** `src/services/clinidocEncounterToDocumentService.ts`

**Main function:**
```typescript
generateDocumentFromEncounterDraft(params: {
  encounterDraftId: string;
  documentTypeCode: string; // 'verslag'
  patientId?: string | null;
  zorgplanId?: string | null;
  behandelplanId?: string | null;
  behandeloptieId?: string | null;
  allowOverride?: boolean;
  overrideReason?: string | null;
}): Promise<GenerateDocumentResult>
```

**Flow:**
1. Fetch encounter draft from `clinidoc_encounter_drafts`
2. Resolve template via `resolveDefaultTemplate('verslag')`
3. Build render context with encounter values
4. Render template with `renderTemplate()`
5. Insert document in `document_store` with:
   - `bron = 'ENCOUNTER'`
   - `bron_ref_id = encounterDraftId`
   - `tag` with metadata (template_id, override info)

**Error handling:** Returns `{ success, documentId?, error?, details? }`

---

### 4. EncounterFormPremium - "Genereer Verslag" Button
**File:** `src/components/clinidoc/EncounterFormPremium.tsx`

**Wat toegevoegd:**
- Props: `zorgplanId`, `behandelplanId`, `behandeloptieId`, `onDocumentCreated`
- State: `isGeneratingDocument`, `documentGenerationError`
- Function: `handleGenerateVerslag(withOverride, overrideReason)`
- Sticky footer button: "Genereer Verslag" met FileText icon + Loader state
- Error display: Inline error banner boven footer
- Override integration: Override panel → log override → generate document

**Button states:**
- Normal: "Genereer Verslag" (met FileText icon)
- Loading: "Verslag genereren..." (met Loader spinner)
- Disabled: Tijdens auto-save of generatie

**Validation flow:**
- Missing required fields → Open OverridePanel
- Override bevestigd → Log override → Generate document
- All valid → Direct generate document

---

### 5. Demo/Test Page (NEW)
**File:** `src/pages/care/CliniDocVerslagDemo.tsx`

**Features:**
- Split view: EncounterFormPremium ↔ DocumentEditor
- Auto-switch naar DocumentEditor na document generatie
- "Terug naar formulier" button
- Dev info footer met view state + document ID

**Usage:**
Navigate to `/care/clinidoc-verslag-demo` to test the complete flow.

---

### 6. Encounter-Aware Template (NEW)
**Database:** Template toegevoegd in `templates` table

**Naam:** "Verslag - Acute Pijnklacht (Encounter)"
**Code:** VERSLAG_PIJNKLACHT_ENC_*
**Template variables gebruikt:**
- `{{encounter.soortPijn}}`
- `{{encounter.pijnScore}}`
- `{{encounter.elementNummer}}`
- `{{encounter.duurKlachten}}`
- `{{encounter.aanleiding}}`
- `{{encounter.klinischeBevindingen}}`
- `{{encounter.diagnose}}`
- `{{encounter.directeBehandeling}}`
- `{{encounter.medicatie}}`
- `{{encounter.nazorgInstructies}}`
- `{{encounter.vervolgAfspraak}}`

Plus standaard variabelen:
- `{{patient.*}}`
- `{{behandelaar.*}}`
- `{{locatie.*}}`
- `{{document.*}}`

---

## 🔒 DATABASE SCHEMA

**document_store:**
- `document_type = 'Verslag'`
- `bron = 'ENCOUNTER'`
- `bron_ref_id = <encounterDraftId>`
- `tag` contains JSON:
  ```json
  {
    "encounter_id": "pijnklacht_acute",
    "encounter_draft_id": "uuid",
    "template_id": "uuid",
    "override_used": false,
    "override_reason": null
  }
  ```

**Link between tables:**
```
clinidoc_encounter_drafts.id
  ↓ (bron_ref_id)
document_store.id
  ↓ (document_id via props)
DocumentEditor component
```

---

## 🧪 TEST SCENARIO

### Happy Path
1. Open `/care/clinidoc-verslag-demo`
2. Fill in encounter form (pijnklacht_acute)
3. Auto-save kicks in → draft created
4. Click "Genereer Verslag"
5. Document created in document_store
6. DocumentEditor opens with rendered content
7. All `{{encounter.*}}` variables replaced with form values

### Validation Override Path
1. Fill encounter form partially (missing required fields)
2. Click "Genereer Verslag"
3. OverridePanel appears
4. Enter override reason
5. Confirm override
6. Override logged in `clinidoc_validation_overrides`
7. Document still generated with override flag
8. DocumentEditor opens

### Error Handling
1. No draft saved yet → Alert: "Sla eerst encounter op"
2. Template not found → Fallback template used
3. Render fails → Error banner shown, no crash
4. Insert fails → Error banner with details

---

## 🚀 PRODUCTION READY

✅ **Build:** Succeeds without errors
✅ **TypeScript:** No type errors
✅ **Error Handling:** Complete try/catch + user-friendly messages
✅ **Loading States:** Spinner + disabled states
✅ **Database:** Correct schema usage, no hardcoded IDs
✅ **Backwards Compatible:** Existing features unaffected
✅ **Logging:** Console.log statements for debugging

---

## 📋 ACCEPTANCE CRITERIA - VERIFIED

| Criterium | Status |
|-----------|--------|
| EncounterFormPremium → "Genereer Verslag" makes document_store record | ✅ |
| Template can use `{{encounter.diagnose}}` and `{{encounter.soortPijn}}` | ✅ |
| No white screen / crash | ✅ |
| Override possible with reason (audit in clinidoc_validation_overrides) | ✅ |
| DocumentEditor opens with new document ID | ✅ |
| Inline components (no modals) | ✅ |

---

## 🔮 FUTURE EXPANSION (Not in scope)

### Easy Additions:
1. **More document types:**
   - `documentTypeCode: 'informed_consent'` → Informed Consent
   - `documentTypeCode: 'verwijzing'` → Verwijsbrief
   - Just add template mapping in `resolveDefaultTemplate()`

2. **Encounter-specific templates:**
   - Use `getTemplatePreferenceForEncounter(encounterId)` to pick specific templates
   - Add mapping: `{ 'pijnklacht_acute': 'template-uuid' }`

3. **Template selector UI:**
   - Before generating, show dropdown with available templates
   - User picks template, then generates

4. **Multi-document generation:**
   - Generate Verslag + IC + Nazorg instructies in one click
   - Loop through document types

---

## 📝 CODE COMMENTS

All key functions have inline comments explaining:
- `// STEP 1: Fetch encounter draft`
- `// STEP 2: Resolve template`
- `// STEP 3: Build render context`
- etc.

Future developers can easily extend the system.

---

## ✅ DELIVERABLE CHECKLIST

- [x] Template variable system supports `{{encounter.*}}`
- [x] RenderContext accepts encounterData
- [x] clinidocEncounterToDocumentService.ts created
- [x] "Genereer Verslag" button in EncounterFormPremium
- [x] DocumentEditor integration callback (onDocumentCreated)
- [x] Error handling (no crashes, inline errors)
- [x] Loading states (spinner in button)
- [x] Override support (reason + audit log)
- [x] Demo page created
- [x] Encounter-aware template in database
- [x] Build passes
- [x] Documentation complete

---

**FASE 3C.1 STATUS: ✅ COMPLEET EN PRODUCTIE-KLAAR**
