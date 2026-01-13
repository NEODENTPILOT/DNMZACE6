## FASE 3B — STEP 2: Frontend Validation + Override COMPLETE ✅

**Date:** December 21, 2024
**Status:** Complete and ready for integration

---

## 📋 Overview

Complete frontend implementation for CliniDoc encounter forms with:
- ✅ Inline validation (non-blocking)
- ✅ Auto-save with debounce (600ms)
- ✅ Completion bar showing progress
- ✅ Inline override panel (no modals)
- ✅ Comprehensive audit logging
- ✅ Type-safe encounter registry

---

## 🗂️ File Structure

```
src/
├── features/
│   └── clinidoc/
│       ├── encounters/
│       │   └── encounterRegistry.ts          # Central encounter definitions
│       ├── validation/
│       │   └── validateEncounter.ts          # Validation logic
│       └── components/
│           ├── EncounterCompletionBar.tsx    # Progress bar component
│           ├── EncounterOverridePanel.tsx    # Inline override panel
│           └── EncounterFormContainer.tsx    # Main form container
└── services/
    └── clinidocEncounterService.ts           # CRUD + override logging
```

---

## 1️⃣ Encounter Registry

**File:** `src/features/clinidoc/encounters/encounterRegistry.ts`

### Type Definitions

```typescript
export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'boolean' | 'enum';

export interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  enumOptions?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  maxLength?: number;
  defaultValue?: any;
}

export interface SectionDefinition {
  id: string;
  title: string;
  description?: string;
  fields: FieldDefinition[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export interface EncounterDefinition {
  id: string;
  name: string;
  description: string;
  category: 'consult' | 'emergency' | 'implantology' | 'informed_consent' | 'treatment' | 'assessment';
  sections: SectionDefinition[];
  legalStrict?: boolean; // Extra warnings for legal documents
  estimatedMinutes?: number;
}
```

### Encounters Defined

**1. Pijnklacht Acute** (`pijnklacht_acute`)
- Category: `emergency`
- Sections: 3 (Anamnese Pijn, Onderzoek, Diagnose & Beleid)
- Total fields: 23
- Required fields: 9
- Estimated time: 30 minutes

**2. Informed Consent Implantologie** (`informed_consent_implantologie`)
- Category: `informed_consent`
- Legal strict: ✅ (extra warnings)
- Sections: 6 (Patiëntgegevens → Kosten & Toestemming)
- Total fields: 23
- Required fields: 18
- Estimated time: 20 minutes

### Public API

```typescript
// Get encounter by ID
function getEncounter(encounterId: string): EncounterDefinition | null

// Get all available encounter IDs
function getAvailableEncounterIds(): string[]

// Get all encounters
function getAllEncounters(): EncounterDefinition[]

// Get encounters by category
function getEncountersByCategory(category: string): EncounterDefinition[]

// Count required fields
function countRequiredFields(encounter: EncounterDefinition): number

// Get required field keys
function getRequiredFieldKeys(encounter: EncounterDefinition): string[]
```

---

## 2️⃣ Validation Logic

**File:** `src/features/clinidoc/validation/validateEncounter.ts`

### Validation Result

```typescript
export interface ValidationResult {
  isValid: boolean;
  missingRequired: string[];      // Field keys that are required but missing
  warnings: string[];              // Additional warnings (legal documents)
  fieldErrors: Record<string, string>; // Specific field validation errors
}
```

### Core Function

```typescript
export function validateEncounter(
  encounterDef: EncounterDefinition,
  values: Record<string, any>
): ValidationResult
```

**Rules:**
- ✅ Required fields → `missingRequired`
- ✅ Legal strict encounters → extra `warnings`
- ✅ Field-level validation (min/max, length, format)
- ✅ Fail-safe: never crashes, always returns result

**Extra Warnings for Legal Strict:**
- "Dit is een juridisch document. Ontbrekende verplichte velden kunnen leiden tot ongeldigheid van de toestemming."
- "Zorg ervoor dat alle risico's en behandelfasen besproken zijn met de patiënt voordat u doorgaat."

### Helper Functions

```typescript
// Get human-readable field label
function getFieldLabel(encounterDef: EncounterDefinition, fieldKey: string): string

// Get all labels for missing fields
function getMissingFieldLabels(encounterDef: EncounterDefinition, missingKeys: string[]): string[]

// Calculate completion percentage
function calculateCompletionPercentage(encounterDef: EncounterDefinition, values: Record<string, any>): number
```

---

## 3️⃣ Encounter Service

**File:** `src/services/clinidocEncounterService.ts`

### CRUD Operations

```typescript
// Create or update draft (auto-detects existing draft)
async function upsertDraft(params: UpsertDraftParams): Promise<{
  data: EncounterDraft | null;
  error: Error | null;
  draftId: string | null;
}>

// Load draft by ID
async function loadDraft(draftId: string): Promise<{
  data: EncounterDraft | null;
  error: Error | null;
}>

// Load latest draft for patient + encounter
async function loadLatestDraftForPatient(
  encounterId: string,
  patientId: string | null,
  epdPlaceholderId: string | null
): Promise<{
  data: EncounterDraft | null;
  error: Error | null;
}>

// Mark draft as submitted
async function markSubmitted(draftId: string): Promise<{
  success: boolean;
  error: Error | null;
}>

// Link draft to generated document
async function linkDraftToDocument(draftId: string, documentId: string): Promise<{
  success: boolean;
  error: Error | null;
}>
```

### Override Logging

```typescript
// Log validation override
async function logOverride(params: LogOverrideParams): Promise<{
  success: boolean;
  overrideId: string | null;
  error: Error | null;
}>

// Get override history for a draft
async function getOverrideHistoryForDraft(draftId: string): Promise<{
  data: ValidationOverride[];
  error: Error | null;
}>

// Get all overrides (Admin/Manager only)
async function getAllOverrides(filters?: {...}): Promise<{
  data: ValidationOverride[];
  error: Error | null;
}>
```

**Override Snapshot Contains:**
- Complete form values
- Validation result (missing fields, warnings)
- User ID (automatically filled)
- Timestamp

---

## 4️⃣ UI Components

### EncounterCompletionBar

**File:** `src/features/clinidoc/components/EncounterCompletionBar.tsx`

**Features:**
- Progress bar (0-100%)
- X of Y required fields filled
- Status chip: Concept / In uitvoering / Compleet
- Inline warnings display

**Status Logic:**
- **Compleet** (green): 0 missing required
- **In uitvoering** (amber): ≥50% complete
- **Concept** (gray): <50% complete

---

### EncounterOverridePanel

**File:** `src/features/clinidoc/components/EncounterOverridePanel.tsx`

**Features:**
- Inline panel (NOT a modal)
- Shows missing field list
- Shows warnings (if legal strict)
- Required textarea for override reason
- "Doorgaan met override" button (disabled until reason filled)
- "Annuleren" button

**Design:**
- Amber background with amber border
- Warning icon (⚠)
- White inset card for missing fields
- Red inset card for critical warnings

---

### EncounterFormContainer

**File:** `src/features/clinidoc/components/EncounterFormContainer.tsx`

**Main container** that orchestrates the entire encounter form flow.

**Features:**
- ✅ Loads encounter definition from registry
- ✅ Auto-save with debounce (600ms)
- ✅ Real-time validation
- ✅ Completion bar at top
- ✅ Form sections with all field types
- ✅ Inline override panel (shown when validation fails)
- ✅ Footer with actions

**Props:**
```typescript
interface EncounterFormContainerProps {
  encounterId: string;
  patientId?: string | null;
  epdPlaceholderId?: string | null;
  initialValues?: Record<string, any>;
  onSaveComplete?: (draftId: string) => void;
  onGenerateDocument?: (values: Record<string, any>, draftId: string) => void;
}
```

**Auto-Save Flow:**
1. User types in field
2. `onChange` updates state
3. Debounce timer starts (600ms)
4. After 600ms, `upsertDraft()` called
5. Success: "Laatste opslag: HH:MM:SS"
6. Error: logged to console

**Proceed Flow:**
1. User clicks "Verder naar document generatie"
2. Validation runs
3. If valid → calls `onGenerateDocument()`
4. If invalid → shows `EncounterOverridePanel`
5. User provides reason → `logOverride()` → `onGenerateDocument()`

---

## 🎨 Field Types Supported

| Type | Input | Validation |
|------|-------|------------|
| `text` | Single-line input | maxLength |
| `textarea` | Multi-line input | maxLength |
| `number` | Number input | min, max |
| `date` | Date picker | ISO 8601 format |
| `boolean` | Checkbox | true/false |
| `enum` | Select dropdown | enumOptions |

---

## 📊 User Flow

```
┌─────────────────────────────────────────────────────────┐
│          User opens encounter form                      │
│   (CliniDocCreatePanel calls EncounterFormContainer)   │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│   Load encounter definition from registry               │
│   Initialize form with default values                   │
│   Show EncounterCompletionBar                           │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│   User fills out form fields                            │
│   • Every change triggers debounced auto-save (600ms)   │
│   • Validation runs in real-time                        │
│   • Completion bar updates                              │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│   User clicks "Verder naar document generatie"          │
└─────────────────────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│ Validation OK    │          │ Validation FAIL  │
│ (no missing)     │          │ (missing fields) │
└──────────────────┘          └──────────────────┘
         │                               │
         │                               ▼
         │              ┌──────────────────────────────┐
         │              │ Show EncounterOverridePanel  │
         │              │ • List missing fields        │
         │              │ • Show warnings              │
         │              │ • Require reason             │
         │              └──────────────────────────────┘
         │                               │
         │              User provides reason ───┐
         │                               │      │
         │                               ▼      │
         │              ┌──────────────────────────────┐
         │              │ logOverride()                │
         │              │ • Save to DB                 │
         │              │ • Audit log created          │
         │              └──────────────────────────────┘
         │                               │
         └───────────────┬───────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│   Call onGenerateDocument(values, draftId)             │
│   • Parent component handles document generation        │
│   • Draft is linked to generated document               │
└─────────────────────────────────────────────────────────┘
```

---

## 🔗 Integration Example

```typescript
import { EncounterFormContainer } from '@/features/clinidoc/components/EncounterFormContainer';

function CliniDocCreatePanel({ patientId }: { patientId: string }) {
  const [selectedEncounter, setSelectedEncounter] = useState('pijnklacht_acute');

  const handleGenerateDocument = async (values: Record<string, any>, draftId: string) => {
    console.log('Generate document with values:', values);
    console.log('Draft ID:', draftId);

    // Your document generation logic here
    // Example: call AI service, create document in document_store, etc.
  };

  return (
    <div className="h-full">
      <EncounterFormContainer
        encounterId={selectedEncounter}
        patientId={patientId}
        onGenerateDocument={handleGenerateDocument}
      />
    </div>
  );
}
```

---

## 🧪 Testing Checklist

### Manual Testing

**1. Auto-Save**
- [ ] Fill out a field
- [ ] Wait 600ms
- [ ] Verify "Laatste opslag: HH:MM:SS" appears
- [ ] Check database: draft exists in `clinidoc_encounter_drafts`

**2. Validation (Valid)**
- [ ] Fill all required fields
- [ ] Completion bar shows 100%
- [ ] Status chip shows "Compleet"
- [ ] Click "Verder naar document generatie"
- [ ] Verify no override panel shown
- [ ] Verify `onGenerateDocument` called

**3. Validation (Invalid - Override)**
- [ ] Leave some required fields empty
- [ ] Completion bar shows <100%
- [ ] Status chip shows "Concept" or "In uitvoering"
- [ ] Click "Verder naar document generatie"
- [ ] Override panel appears inline
- [ ] Missing fields listed
- [ ] Try clicking "Doorgaan met override" (disabled)
- [ ] Enter reason text
- [ ] Click "Doorgaan met override" (enabled)
- [ ] Verify override logged in `clinidoc_validation_overrides`
- [ ] Verify `onGenerateDocument` called

**4. Legal Strict Warnings**
- [ ] Use `informed_consent_implantologie`
- [ ] Leave required fields empty
- [ ] Click proceed
- [ ] Verify extra legal warnings shown in red box

**5. Field Types**
- [ ] Test text input
- [ ] Test textarea
- [ ] Test number input (min/max validation)
- [ ] Test date picker
- [ ] Test checkbox (boolean)
- [ ] Test select dropdown (enum)

---

## 📝 Code Quality

### Type Safety
- ✅ All components fully typed with TypeScript
- ✅ Strict null checks
- ✅ No `any` types except in payload/values objects (intentionally flexible)

### Error Handling
- ✅ All service calls have try-catch
- ✅ Fail-safe validation (never crashes)
- ✅ Errors logged to console
- ✅ User-friendly error messages

### Performance
- ✅ Debounced auto-save (600ms)
- ✅ Minimal re-renders (useCallback, useEffect deps)
- ✅ No unnecessary API calls

---

## 🚀 Next Steps (FASE 3B — STEP 3)

**Document Generation Integration:**
1. Connect `onGenerateDocument` to CliniDoc template engine
2. Map encounter values to template variables
3. Generate PDF/document output
4. Link to `document_store`
5. Update draft status to 'submitted'

**Additional Encounters:**
1. Add PMO Uitgebreid
2. Add PMO Kort
3. Add Consult Algemeen
4. Add remaining 7 encounters from CLINICAL_ENCOUNTER_DEFINITIONS.md

**Advanced Features:**
1. Conditional fields (show/hide based on other field values)
2. Field dependencies (enable/disable)
3. Section collapsing/expanding
4. Draft recovery on crash
5. Offline support

---

## 📊 Summary

**Lines of Code:** ~1,500
**Components Created:** 3
**Services Created:** 1
**Registries Created:** 1
**Type Definitions:** 10+
**Encounters Defined:** 2 (ready for 8 more)

**Key Achievement:** Complete non-blocking validation system with comprehensive audit logging.

**No Breaking Changes:** All code is isolated in `src/features/clinidoc/`. Can be integrated incrementally.

---

## ✅ Deliverables

- [x] `encounterRegistry.ts` with 2 encounters + types
- [x] `validateEncounter.ts` with fail-safe validation
- [x] `clinidocEncounterService.ts` with CRUD + logging
- [x] `EncounterCompletionBar.tsx` component
- [x] `EncounterOverridePanel.tsx` component
- [x] `EncounterFormContainer.tsx` main container
- [x] Complete documentation
- [x] Integration examples
- [x] Testing checklist

**FASE 3B — STEP 2 COMPLETE** ✅

Ready for integration and testing.
