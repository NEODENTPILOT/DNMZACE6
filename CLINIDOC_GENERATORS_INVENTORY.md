# CliniDoc Generators Inventory & Dependency Map

**Generated:** 2025-12-20
**Purpose:** Identify all text composer/generator modules before consolidation into unified "CliniDoc" system

---

## Executive Summary

Two separate text generation/composition systems exist in the codebase:

1. **AI Generator** - Legacy procedure-based text generator with dummy AI
2. **Clinical Note Composer** - Modern unified editor with template system and AI integration

**Key Finding:** ClinicalNoteComposer is the clear successor. AIGenerator is legacy code using dummy AI, while ClinicalNoteComposer has modern features, real AI integration points, and proper template variable system.

---

## Module 1: AI Generator (Legacy)

### File Path
`src/pages/AIGenerator.tsx`

### Exports
- Default export: `AIGenerator` (React component)

### Route Configuration
- **Route Key:** `'ai-generator'`
- **Navigation Path:** App.tsx line 232: `{currentPage === 'ai-generator' && <AIGenerator />}`
- **Import Location:** App.tsx line 13: `import { AIGenerator } from './pages/AIGenerator';`

### Props
No props (standalone page component)

### Database Usage

**Supabase Client:** Standard `supabase` client (from `../lib/supabase`)

**Tables Queried:**
1. `procedure_categories` - SELECT (filters, ordering)
   - Columns: `id, naam, code`
   - Filter: `actief = true`

2. `procedures` - SELECT with JOIN
   - Columns: `id, naam, interne_code, beschrijving, categorie_id`
   - Join: `procedure_categories!inner(naam)`
   - Filter: `actief = true`

3. `procedure_upt_codes` - SELECT
   - Columns: `upt_code, is_primair`
   - Filter: `procedure_id = ?`

4. `templates` - SELECT
   - Columns: `id, titel, tekst_inhoud, categorie`
   - Filter: `is_actief = true`
   - Note: Filters by category matching

5. `procedure_medications` - SELECT with JOIN
   - Columns: All columns + join to `medicatie_master`
   - Filter: `procedure_id = ?, actief = true`

**Tables Written:** None (read-only)

### Storage Usage
None

### AI Services
- **Service:** `generateClinicalNote` from `../utils/dummyAI.ts`
- **Type:** Dummy/mock AI (template-based string concatenation)
- **Generates:** Clinical note, Informed Consent, Verwijsbrief, Patiënteninformatie, Behandelplan

### Shared Components Used
1. `AICompleteDocumentSetModal` - Advanced AI document generation modal
   - Import: `import AICompleteDocumentSetModal from '../components/AICompleteDocumentSetModal'`

### Template System
- Uses `templates` table directly
- Reads `tekst_inhoud` field
- No variable substitution
- Category-based filtering

### Key Features
- Procedure category selection (DNMZ 2.0)
- Procedure selection with internal codes
- UPT code display (read-only)
- Medication suggestions display
- Template selection (standaardteksten)
- Output type selector (Clinical note, IC, Verwijsbrief, etc.)
- Copy to clipboard
- Patient code input (no patient lookup)

### State Management
- Local component state
- No external state management
- No localStorage usage

---

## Module 2: Clinical Note Composer (Modern)

### File Paths
1. `src/pages/ClinicalNoteComposer.tsx` (overview page)
2. `src/components/ClinicalNoteComposerInline.tsx` (main editor)
3. `src/components/ClinicalNoteComposerModal.tsx` (modal variant)

### Exports
**ClinicalNoteComposer.tsx:**
- Default export: `ClinicalNoteComposer` (React component)

**ClinicalNoteComposerInline.tsx:**
- Default export: `ClinicalNoteComposerInline` (React component)

**ClinicalNoteComposerModal.tsx:**
- Default export: `ClinicalNoteComposerModal` (React component)

### Route Configuration
- **Route Key:** `'clinical-note-composer'`
- **Navigation Path:** App.tsx line 251: `{currentPage === 'clinical-note-composer' && <ClinicalNoteComposer />}`
- **Import Location:** App.tsx line 32: `import { ClinicalNoteComposer } from './pages/ClinicalNoteComposer'`

### Props

**ClinicalNoteComposerInline:**
```typescript
interface ClinicalNoteComposerInlineProps {
  caseId?: string;
  noteId?: string;
  onBack?: () => void;
  onSaved?: () => void;
}
```

**ClinicalNoteComposerModal:**
```typescript
interface ClinicalNoteComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId?: string;
  noteId?: string;
}
```

### Database Usage

**Supabase Client:** Standard `supabase` client

**Tables Queried:**
1. `patients` - SELECT
   - Columns: `id, epd_nummer, voornaam, tussenvoegsel, achternaam, geboortedatum`
   - Search: OR query on `epd_nummer, voornaam, achternaam`
   - Filter: `actief = true`

2. `cases` - SELECT with JOIN
   - Columns: `id, case_code, patient_id, patient_naam, omschrijving, status, locatie`
   - Search: OR query on `case_code, patient_naam, omschrijving`
   - Join: `patients(...)` when loading by ID
   - Filter: `deleted_at IS NULL`

3. `behandelplannen` - SELECT with nested join
   - Columns: `id, interventies(id, naam, omschrijving)`
   - Filter: `case_id = ?, actief = true`

4. `procedures` - SELECT
   - Columns: `id, naam, interne_code`
   - Filter: `actief = true`

5. `templates` - SELECT
   - Columns: `id, naam, beschrijving, template_type, doel, inhoud, has_form_fields, form_fields, category_id`
   - Filter: `actief = true, template_type IN ('Tekst', 'Formulier', 'Verslag')`

6. `document_store` - SELECT, INSERT, UPDATE
   - **Columns (Read):** All columns
   - **Columns (Write):** `referentie_nummer, titel, document_type, inhoud, case_id, patient_id, user_id, tag, template_id, updated_at`
   - **Filter (Read):** `id = ?, document_type IN (...)`
   - **Document Types:** `KlinischeNote, Consent, PatiëntenInformatie, Behandelplan, Recept, Verwijsbrief`

**Tables Written:**
- `document_store` (INSERT, UPDATE)

### Storage Usage
None (no localStorage or app_settings)

### AI Services
- No direct AI service calls in composer
- Integrates with:
  - `AICompleteDocumentSetModal` (full document set generation)
  - `AIPrepareDocumentSetModal` (document preparation)

### Shared Components Used
1. `AICompleteDocumentSetModal`
   - Props: `isOpen, onClose, patiëntNaam, geboortedatum, defaultKlinischeBeschrijving?`

2. `AIPrepareDocumentSetModal`
   - Props: `isOpen, onClose, patiëntNaam, geboortedatum`

3. `TemplateVariablesHelper`
   - Props: `onInsertVariable: (variable: string) => void`
   - Import: `import { TemplateVariablesHelper } from './TemplateVariablesHelper'`

4. Template Variable System
   - Service: `replaceTemplateVariables` from `../utils/templateVariables`
   - Context type: `TemplateVariableContext`

### Template System
- Modern template engine with **variable substitution**
- Uses `templates` table (unified with other systems)
- Supports template variables:
  - `{{patient.voornaam}}`, `{{patient.achternaam}}`, etc.
  - `{{case.case_code}}`, `{{case.omschrijving}}`
  - `{{behandelaar.naam}}`
  - `{{locatie.naam}}`
  - `{{document.datum}}`, `{{document.titel}}`
- Template type filtering: Tekst, Formulier, Verslag
- Template variable helper widget

### Key Features
- **Patient Search:** Real-time EPD/name search with autocomplete
- **Case Linking:** Optional case association
- **Patient-centric:** Can save notes without case (patient-only)
- **Context Loading:** Loads interventies and procedures from case
- **Template Engine:** Advanced variable substitution
- **Document Types:** Full range (Clinical Note, Consent, Info, Plan, Prescription, Referral)
- **Metadata:** Date, location, behandelaar tracking
- **Edit Mode:** Load and edit existing notes
- **Document Store:** Persistent storage with referentie_nummer
- **AI Integration Points:** Two AI modals for advanced generation
- **Variable Helper:** UI widget to insert template variables

### State Management
- Local component state
- No external state management
- No localStorage

---

## Module 3: Shared AI Modals

### AICompleteDocumentSetModal

**File:** `src/components/AICompleteDocumentSetModal.tsx`

**Props:**
```typescript
interface AICompleteDocumentSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  patiëntNaam?: string;
  geboortedatum?: string;
  defaultKlinischeBeschrijving?: string;
}
```

**Purpose:** Advanced AI-powered complete document set generation

**Used By:**
- AIGenerator (line 516-520)
- ClinicalNoteComposerModal (line 856-861)
- ClinicalNoteComposerInline (line 926-931)

---

### AIPrepareDocumentSetModal

**File:** `src/components/AIPrepareDocumentSetModal.tsx`

**Props:**
```typescript
interface AIPrepareDocumentSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  patiëntNaam?: string;
  geboortedatum?: string;
}
```

**Purpose:** AI document preparation assistant

**Used By:**
- ClinicalNoteComposerModal (line 863-868)
- ClinicalNoteComposerInline (line 933-938)

---

## Usage Graph

```
┌─────────────────────────────────────────────────────────────┐
│ App.tsx (Route Dispatcher)                                  │
└───────────────┬─────────────────────────────────────────────┘
                │
                ├─► Route: 'ai-generator'
                │   └─► pages/AIGenerator.tsx
                │       ├─► Supabase: procedure_categories
                │       ├─► Supabase: procedures (JOIN procedure_categories)
                │       ├─► Supabase: procedure_upt_codes
                │       ├─► Supabase: templates
                │       ├─► Supabase: procedure_medications
                │       ├─► utils/dummyAI::generateClinicalNote
                │       └─► components/AICompleteDocumentSetModal
                │
                └─► Route: 'clinical-note-composer'
                    └─► pages/ClinicalNoteComposer.tsx
                        └─► components/ClinicalNoteComposerInline.tsx
                            ├─► Supabase: patients (search)
                            ├─► Supabase: cases (search + join patients)
                            ├─► Supabase: behandelplannen (join interventies)
                            ├─► Supabase: procedures
                            ├─► Supabase: templates
                            ├─► Supabase: document_store (READ/WRITE)
                            ├─► utils/templateVariables::replaceTemplateVariables
                            ├─► components/TemplateVariablesHelper
                            ├─► components/AICompleteDocumentSetModal
                            └─► components/AIPrepareDocumentSetModal
```

---

## Shared Dependencies

### Both Modules Use:
1. **AICompleteDocumentSetModal** - Advanced AI document generation
2. **Supabase** - Database client
3. **Templates Table** - Both query `templates` table (but different usage)
4. **React Hooks** - useState, useEffect
5. **AuthContext** - useAuth() for user data
6. **Lucide Icons** - Icon library

### Unique to AIGenerator:
1. `dummyAI.ts` service (mock AI)
2. `procedure_categories` table
3. `procedures` table (with joins)
4. `procedure_upt_codes` table
5. `procedure_medications` table

### Unique to ClinicalNoteComposer:
1. `patients` table with search
2. `cases` table with search
3. `document_store` table (write operations)
4. `behandelplannen` table
5. Template variable system (`templateVariables.ts`)
6. `TemplateVariablesHelper` component
7. `AIPrepareDocumentSetModal` component

---

## Duplication Analysis

### 1. Patient/Case Selection Logic
**Status:** DUPLICATED but different implementations

- **AIGenerator:** Simple text input for patient code (no lookup)
- **ClinicalNoteComposer:** Full patient search with autocomplete + case linking

**Recommendation:** ClinicalNoteComposer implementation is superior.

---

### 2. Template System
**Status:** PARTIALLY DUPLICATED

- **AIGenerator:**
  - Reads `templates.tekst_inhoud` directly
  - No variable substitution
  - Category-based filtering

- **ClinicalNoteComposer:**
  - Reads `templates.inhoud` with variable substitution
  - Advanced template variable engine
  - Type-based filtering (Tekst, Formulier, Verslag)

**Recommendation:** ClinicalNoteComposer has modern template engine. AIGenerator's template usage is basic.

---

### 3. Procedure/Verrichting Logic
**Status:** COMPLETELY DIFFERENT

- **AIGenerator:** Core feature (category → procedure → UPT codes → medications)
- **ClinicalNoteComposer:** Context-only (loads from linked case/behandelplannen)

**Recommendation:** Not duplicated - different use cases.

---

### 4. AI Integration
**Status:** DIFFERENT MATURITY LEVELS

- **AIGenerator:**
  - Uses dummy AI (`dummyAI.ts`)
  - Simple string template generation
  - Mock implementation

- **ClinicalNoteComposer:**
  - Integration points for real AI (via modals)
  - Production-ready structure
  - Two AI modal variants

**Recommendation:** ClinicalNoteComposer has real AI integration architecture.

---

### 5. Document Generation
**Status:** OVERLAPPING PURPOSE, DIFFERENT APPROACH

- **AIGenerator:**
  - Generates text in-page (output panel)
  - Copy to clipboard
  - No persistence
  - Types: Clinical note, IC, Verwijsbrief, Patiënteninformatie, Behandelplan

- **ClinicalNoteComposer:**
  - Saves to `document_store` table
  - Full CRUD operations
  - Persistent storage with metadata
  - Types: KlinischeNote, Consent, PatiëntenInformatie, Behandelplan, Recept, Verwijsbrief

**Recommendation:** ClinicalNoteComposer is production system. AIGenerator is prototype/demo.

---

### 6. UPT Code Handling
**Status:** READ-ONLY vs CONTEXT

- **AIGenerator:** Displays UPT codes from procedures (read-only)
- **ClinicalNoteComposer:** No direct UPT code handling (delegated to AI modals)

**Recommendation:** Different contexts - not duplicated.

---

## Feature Comparison Matrix

| Feature | AI Generator | Clinical Note Composer |
|---------|-------------|------------------------|
| **Patient Search** | ❌ (manual input) | ✅ Full autocomplete |
| **Case Linking** | ❌ | ✅ Optional linking |
| **Template Variables** | ❌ | ✅ Advanced system |
| **Template Helper** | ❌ | ✅ UI widget |
| **Real AI** | ❌ (dummy) | ✅ Integration points |
| **Document Persistence** | ❌ (copy only) | ✅ Full CRUD |
| **Procedure Selection** | ✅ Core feature | Context-only |
| **UPT Code Display** | ✅ | Via AI modals |
| **Medication Info** | ✅ | ❌ |
| **Edit Existing** | ❌ | ✅ |
| **Document Types** | 5 types | 6 types |
| **Metadata Tracking** | ❌ | ✅ Full metadata |
| **Navigation** | Standalone page | Overview + Editor |
| **Production Ready** | ❌ Demo/prototype | ✅ Yes |

---

## SAFE Migration Plan

### Phase 1: Assessment Complete ✅
Status: This document

### Phase 2: Deprecation Notice (No Breaking Changes)
**Duration:** 1 sprint

1. Add deprecation banner to AIGenerator page:
   ```tsx
   <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
     <p className="text-yellow-900 font-semibold">
       ⚠️ Deze module wordt vervangen door Clinical Note Composer
     </p>
     <p className="text-yellow-800 text-sm">
       Gebruik Clinical Note Composer voor nieuwe documenten. Deze AI Generator blijft beschikbaar tot [datum].
     </p>
     <button onClick={() => navigate('clinical-note-composer')}>
       → Ga naar Clinical Note Composer
     </button>
   </div>
   ```

2. Update navigation menu in Layout.tsx:
   - Move 'ai-generator' to bottom of section
   - Add "(Legacy)" label
   - Highlight 'clinical-note-composer' as primary

### Phase 3: Feature Parity Check
**Duration:** 2 sprints

Ensure ClinicalNoteComposer has equivalent functionality:

1. ✅ **Patient selection** - Already superior
2. ✅ **Template system** - Already superior
3. ✅ **Document types** - Already covers all types
4. ⚠️ **Procedure selection workflow** - Currently missing
5. ⚠️ **UPT code display** - Currently delegated to modals
6. ⚠️ **Medication suggestions** - Currently missing

**Action Items:**
- Add optional "Quick Procedure Selection" panel to ClinicalNoteComposer
- Add collapsible "Context Info" panel showing UPT codes and medications if case/procedure selected
- Add template filter for procedure category

### Phase 4: Route Alias (Temporary Compatibility)
**Duration:** Until Phase 6 complete

```tsx
// In App.tsx
{(currentPage === 'ai-generator' || currentPage === 'clinical-note-composer-legacy') && (
  <DeprecatedPageNotice
    message="AI Generator is vervangen door Clinical Note Composer"
    redirectRoute="clinical-note-composer"
    onNavigate={setCurrentPage}
  />
)}
```

### Phase 5: Data Migration (if needed)
**Status:** NOT NEEDED

- AIGenerator does not persist data
- No migration required
- Users can continue using until Phase 6

### Phase 6: Removal
**Duration:** 1 sprint (after 2 months deprecation period)

1. Remove AIGenerator from routes:
   ```tsx
   // Delete from App.tsx
   // import { AIGenerator } from './pages/AIGenerator';
   // {currentPage === 'ai-generator' && <AIGenerator />}
   ```

2. Remove from navigation menu (Layout.tsx)

3. Move file to legacy folder:
   ```bash
   mv src/pages/AIGenerator.tsx src/legacy/_archived/AIGenerator.legacy.tsx
   ```

4. Keep `dummyAI.ts` if used elsewhere, otherwise move to legacy

5. Update documentation

### Phase 7: Cleanup
**Duration:** 1 sprint

1. Remove unused imports
2. Remove AICompleteDocumentSetModal from AIGenerator (if unused elsewhere)
3. Audit and remove any dead code
4. Update user documentation

---

## Risk Mitigation

### Risk 1: Users Lost in Migration
**Mitigation:**
- Keep both available during deprecation period (2 months minimum)
- Clear migration messaging
- Training materials
- In-app guidance

### Risk 2: Missing Feature Discovery
**Mitigation:**
- User testing before deprecation
- Feature comparison checklist
- Collect user feedback
- Add missing features before removal

### Risk 3: Workflow Disruption
**Mitigation:**
- Gradual rollout
- Optional adoption during transition
- Power user testing
- Rollback capability

---

## Recommended Next Steps

1. ✅ **Complete this inventory** (DONE)

2. **Create feature parity tasks:**
   - Add procedure selection panel to ClinicalNoteComposer (optional/collapsible)
   - Add UPT code context display
   - Add medication suggestions display
   - Test all document types

3. **User communication:**
   - Announce deprecation timeline
   - Create migration guide
   - Host training session

4. **Technical preparation:**
   - Add deprecation notice component
   - Update navigation menu
   - Create route alias

5. **Monitoring:**
   - Track usage metrics (AIGenerator vs ClinicalNoteComposer)
   - Collect user feedback
   - Monitor error rates

---

## Conclusion

**Clear Winner:** Clinical Note Composer is the modern, production-ready system.

**AI Generator Status:** Legacy prototype with dummy AI, should be deprecated.

**Migration Complexity:** LOW - No data migration needed, mainly UI/UX transition.

**Recommended Timeline:**
- Month 1: Add deprecation notice + feature parity
- Month 2-3: Parallel operation with user migration
- Month 4: Remove AI Generator

**Primary Entry Point for CliniDoc:**
- Route: `clinical-note-composer`
- Component: `ClinicalNoteComposerInline`
- Page: `ClinicalNoteComposer.tsx` (overview page)

**Deprecated Module:**
- Route: `ai-generator` (mark for removal)
- Component: `AIGenerator`
- Reason: Dummy AI, no persistence, inferior UX

---

**Document Status:** COMPLETE
**Next Action:** Review with team + create Phase 2 tasks
