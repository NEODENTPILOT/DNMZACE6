# CliniDoc Text Systems Inventory

**Generated:** 2025-12-20
**Purpose:** Complete read-only inventory of all text generation/composition systems in ACE+
**Status:** ❌ DO NOT MODIFY CODE - ANALYSIS ONLY

---

## Executive Summary

The ACE+ codebase contains **11 distinct text generation/composition systems** across multiple domains:

1. **AI Generator** (Legacy) - Simple procedure-based text generator
2. **Clinical Note Composer** (Modern) - Advanced clinical documentation system
3. **ICE+ Patient Care Hub** - Patient-centric care orchestration (no text generation, orchestrates other systems)
4. **ICE Template Builder** - Behandelplan template management system
5. **AI Treatment Generator** - Questionnaire-driven complete treatment plan generator
6. **Behandelplan AI** - AI-powered behandelplan analysis and suggestions
7. **Begroting Composer 2025** - Budget creation with AI suggestions
8. **Template Variables System** - Centralized variable replacement engine (used by multiple systems)
9. **Recept Composer** - Prescription generation (modal)
10. **AI Template Maker** - Template creation assistant
11. **Document Set Generators** - Complete document set generation (AICompleteDocumentSetModal, AIPrepareDocumentSetModal)

**Critical Finding for CliniDoc:**
- ICE+ is an **orchestrator**, not a text generator
- ICE Template Builder manages **treatment templates**, not clinical text
- ClinicalNoteComposer is the **primary clinical documentation system**
- Template Variables System is **shared infrastructure** used by multiple systems

---

## System 1: AI Generator (Legacy)

### Classification
- **Type:** Procedure-based text generator
- **Status:** 🟡 LEGACY / DEMO
- **AI:** Dummy AI (mock templates)
- **Patient-bound:** No (manual patient code input)

### File Locations
- **Main:** `src/pages/AIGenerator.tsx`
- **Service:** `src/utils/dummyAI.ts`

### Route & Navigation
- **Route Key:** `'ai-generator'`
- **Path in App.tsx:** Line 232: `{currentPage === 'ai-generator' && <AIGenerator />}`
- **Sidebar:** Under "Klinisch" section

### Purpose
Generates clinical documentation based on procedure selection:
- Clinical notes
- Informed Consent
- Verwijsbrief
- Patiënteninformatie
- Behandelplan

### Dependencies

**Database Tables (Read-Only):**
- `procedure_categories` - Procedure categories
- `procedures` - JOIN with `procedure_categories`
- `procedure_upt_codes` - UPT codes linked to procedures
- `templates` - Standaardteksten (filters by `is_actief = true`)
- `procedure_medications` - Medication suggestions

**AI Services:**
- `generateClinicalNote()` from `src/utils/dummyAI.ts`
- **Note:** This is MOCK AI, not real AI

**Shared Components:**
- `AICompleteDocumentSetModal` - Advanced document generation

**Storage:**
- None (no persistence, copy-to-clipboard only)

### Patient Data Handling
- ❌ No patient lookup
- ❌ No patient search
- Manual patient code input only
- No case linking

### Template System
- Uses `templates` table
- Reads `tekst_inhoud` field
- **No variable substitution**
- Category-based filtering

### Text Output
- Displayed in-page (output panel)
- Copy to clipboard
- **No persistence to database**

### Unique Features
- Procedure category → procedure selection workflow
- UPT code display (read-only)
- Medication suggestions display
- Output type selector

### Migration Notes
- ⚠️ **Should be deprecated** in favor of ClinicalNoteComposer
- No data migration needed (no persistence)
- Dummy AI should be replaced
- See CLINIDOC_GENERATORS_INVENTORY.md for full migration plan

---

## System 2: Clinical Note Composer (Modern)

### Classification
- **Type:** Advanced clinical documentation system
- **Status:** ✅ PRODUCTION
- **AI:** Real AI integration points (via modals)
- **Patient-bound:** Yes (full patient + optional case linking)

### File Locations
- **Overview Page:** `src/pages/ClinicalNoteComposer.tsx`
- **Main Editor:** `src/components/ClinicalNoteComposerInline.tsx`
- **Modal Variant:** `src/components/ClinicalNoteComposerModal.tsx`

### Route & Navigation
- **Route Key:** `'clinical-note-composer'`
- **Path in App.tsx:** Line 251: `{currentPage === 'clinical-note-composer' && <ClinicalNoteComposer />}`
- **Sidebar:** Under "Klinisch" section

### Purpose
Modern unified editor for ALL clinical documentation:
- Klinische Notes
- Consent forms
- Patiënteninformatie
- Behandelplannen
- Recepten
- Verwijsbrieven

### Dependencies

**Database Tables:**
1. **Read:**
   - `patients` - Full search with autocomplete
   - `cases` - Search + optional linking
   - `behandelplannen` - Context loading (JOIN interventies)
   - `procedures` - Available procedures
   - `templates` - Template library

2. **Write:**
   - `document_store` - Full CRUD operations
     - Fields: `referentie_nummer, titel, document_type, inhoud, case_id, patient_id, user_id, tag, template_id`
     - Document types: `KlinischeNote, Consent, PatiëntenInformatie, Behandelplan, Recept, Verwijsbrief`

**AI Services:**
- `AICompleteDocumentSetModal` - Complete document set generation
- `AIPrepareDocumentSetModal` - Document preparation assistant

**Template Engine:**
- `replaceTemplateVariables()` from `src/utils/templateVariables.ts`
- `TemplateVariableContext` type
- Full variable substitution support

**Shared Components:**
- `TemplateVariablesHelper` - UI widget for inserting variables
- `AICompleteDocumentSetModal`
- `AIPrepareDocumentSetModal`

**Storage:**
- Persistent storage in `document_store` table
- Metadata stored in `tag` field (JSON)

### Patient Data Handling
- ✅ Real-time patient search (EPD, name)
- ✅ Case search and linking (optional)
- ✅ Patient-only notes (no case required)
- ✅ Full patient context loading

### Template System
- Uses `templates` table (`template_type IN ('Tekst', 'Formulier', 'Verslag')`)
- Reads `inhoud` field
- **✅ Advanced variable substitution**
- Type-based filtering
- Template variable helper widget

### Text Output
- Saves to `document_store` table
- Full CRUD operations
- Persistent referentie_nummer
- Metadata tracking (date, location, behandelaar)

### Unique Features
- **Patient search** - Advanced autocomplete
- **Case linking** - Optional case association
- **Edit mode** - Load and edit existing documents
- **Variable engine** - Rich template variable system
- **AI modals** - Two AI integration points
- **Metadata** - Full tracking

### Migration Notes
- ✅ **Primary system for CliniDoc**
- Should become the unified entry point
- Already has most CliniDoc features
- Template variable system is production-ready

---

## System 3: ICE+ Patient Care Hub

### Classification
- **Type:** 🎯 ORCHESTRATOR (not a text generator)
- **Status:** ✅ PRODUCTION
- **AI:** Indirect (orchestrates other systems)
- **Patient-bound:** Yes (patient-centric hub)

### File Locations
- **Hub Page:** `src/pages/IceHub.tsx`
- **Patient View:** `src/pages/PatientCareHubPremium.tsx`

### Route & Navigation
- **Route Key:** `'ice-hub'` → `'patient-care-hub'`
- **Path in App.tsx:** Lines related to ICE hub navigation
- **Sidebar:** Under "ICE+ / CARE+" section

### Purpose
**Central orchestration hub for patient care** - does NOT generate text itself:
- Patient overview dashboard
- Zorgplannen management
- Behandelplannen overview
- Begrotingen overview
- Status Praesens access
- ICE Workflows access

### Dependencies

**Database Tables:**
- `patients` - Patient data
- `zorgplannen` - Care plans
- `behandelplannen` - Treatment plans
- `begrotingen_v2` - Budgets
- `interventie_workflows` - Operational workflows

**Components Used:**
- `ZorgplanCreateModalV3` - Create zorgplannen
- `WorkflowViewer` - Display workflows
- Premium UI components

**Text Generation:**
- ❌ **Does NOT generate text itself**
- ✅ **Launches other systems:**
  - Opens ZorgplanCreateModalV3
  - Opens BehandelplanDetail
  - Opens Status Praesens
  - Links to workflows

### Patient Data Handling
- ✅ Full patient context
- ✅ Patient statistics (zorgplannen, behandelplannen, begrotingen count)
- ✅ Patient search

### Text Generation Role
**ICE+ is a ROUTER/ORCHESTRATOR:**
- Shows patient data
- Launches modals for creating zorgplannen
- Links to other systems
- **Does NOT compose text directly**

### Migration Notes
- ✅ **Leave untouched** - this is orchestration, not text generation
- CliniDoc should be **accessible FROM** ICE+
- ICE+ should link to CliniDoc for clinical documentation
- **No conflict with CliniDoc**

---

## System 4: ICE Template Builder

### Classification
- **Type:** 🎨 TEMPLATE MANAGEMENT SYSTEM (not a text generator)
- **Status:** ✅ PRODUCTION
- **AI:** No (template metadata management)
- **Patient-bound:** No (template library)

### File Locations
- **Main:** `src/features/ice-template-builder/ICETemplateBuilder.tsx`
- **Components:**
  - `TemplateList.tsx`
  - `TemplateDetail.tsx`
  - `TemplateMetadataEditor.tsx`
  - `BehandeloptieManager.tsx`
  - `InterventieManager.tsx`
  - `ClinicalContentEditor.tsx`

### Route & Navigation
- **Route Key:** `'ice-template-builder'`
- **Sidebar:** Under "ICE+ / CARE+" section

### Purpose
**Manages behandelplan templates** (NOT clinical text templates):
- Template metadata (naam, categorie, kaak_scope)
- Diagnosis templates (DX codes)
- Behandelopties (treatment options)
- Interventies linked to templates
- Clinical content (prognose, rationale)
- Care requirements

### Dependencies

**Database Tables:**
- `behandelplan_templates` - Template definitions
  - Fields: `naam, categorie, kaak_scope, diagnosis_template_code, default_diagnoses, default_risicos, indicative_factors, contraindications, alternative_options, prognose_text, auto_title_pattern`
- `behandelopties` - Treatment options
- `interventies` - Interventions
- `care_requirements` - Care requirement definitions
- `care_requirement_options` - Requirement options
- `care_requirement_templates` - Template-specific requirements

**UI Components:**
- `AnatomicalScopeSelector` - Anatomical scope selection

### Text Generation Role
**ICE Template Builder is METADATA MANAGEMENT:**
- Defines behandelplan **structure** (not text content)
- Manages diagnosis codes
- Links interventies to templates
- **Does NOT generate clinical notes or documentation**

### Template vs Text
| ICE Template Builder | ClinicalNoteComposer Templates |
|---------------------|-------------------------------|
| Behandelplan structure | Clinical text templates |
| Diagnosis codes (DX-xxx) | Document templates (Tekst, Formulier, Verslag) |
| Treatment options | Text with variables |
| Interventies | Clinical notes content |
| **Structure/metadata** | **Text/documentation** |

### Migration Notes
- ✅ **Leave untouched** - different domain
- **No conflict with CliniDoc**
- ICE Template Builder = Treatment planning
- CliniDoc = Clinical documentation
- **Complementary systems**

---

## System 5: AI Treatment Generator

### Classification
- **Type:** 🤖 QUESTIONNAIRE-DRIVEN TREATMENT GENERATOR
- **Status:** ✅ PRODUCTION (OpenAI integrated)
- **AI:** Real AI (GPT-4o)
- **Patient-bound:** Yes (case-bound)

### File Locations
- **Service:** `src/services/aiTreatmentGenerator.ts`
- **Modal:** `src/components/AITreatmentQuestionnaireModal.tsx`

### Purpose
Generates **complete treatment plans** from staff questionnaire:
- Interventions with UPT codes
- Budget estimates
- Preparation checklists
- Treatment sequencing

### Dependencies

**Database Tables (Read):**
- `upt_learning_patterns` - AI learning patterns
- `upt_code_sets` - Standard UPT sets
- `procedures` - Procedure catalog
- `upt_tarief_2025` - UPT pricing data

**Database Tables (Write):**
- `ai_treatment_questionnaires` - Questionnaire responses
- `ai_treatment_generations` - Generation tracking
- `interventies` - Generated interventions
- `begrotingen_v2` + `begrotingen_v2_regels` - Generated budgets
- `checklist_instances` - Generated checklists
- `ai_generation_feedback` - User feedback

**AI Service:**
- `parseJSONResponse()` from `src/services/openai.ts`
- Model: `gpt-4o`
- Structured JSON output

### Questionnaire Fields
```typescript
interface QuestionnaireResponses {
  hoofdklacht: string;
  elementen: string[]; // FDI tooth numbers
  behandeldoel: string;
  urgentie: 'laag' | 'normaal' | 'hoog' | 'spoed';
  categorie: string;
  medische_voorgeschiedenis?: string;
  angst_niveau?: 'laag' | 'normaal' | 'hoog';
  budget_indicatie?: 'beperkt' | 'normaal' | 'ruim';
  materiaal_voorkeur?: string;
  techniek_type?: 'intern' | 'extern' | 'beide';
  extra_opmerkingen?: string;
}
```

### Generated Output
```typescript
interface CompleteGeneratedTreatment {
  interventies: GeneratedIntervention[];
  begroting: GeneratedBudget;
  checklist: GeneratedChecklist;
  sequentie: GeneratedSequence;
  samenvatting: string;
  aanbevelingen: string[];
}
```

### AI Prompt Structure
- **System Prompt:** Expert implantologist + database knowledge context
- **User Prompt:** Questionnaire responses
- **Context:** UPT sets, learning patterns, procedures, pricing data
- **Output:** Structured JSON with interventions, budget, checklist, sequence

### Patient Data Handling
- ✅ Case-bound
- ✅ Patient ID required
- Generates data that can be saved to database

### Text Generation Role
**Generates STRUCTURED DATA + some text:**
- Intervention titles and descriptions (text)
- Budget line descriptions (text)
- Checklist items (text)
- Sequencing descriptions (text)
- Summary and recommendations (text)
- **+ Structured data (UPT codes, prices, etc.)**

### Migration Notes
- ✅ **Keep as-is** - specialized treatment planning
- **Different from CliniDoc** (treatment planning vs clinical documentation)
- Could be **integrated into CliniDoc** as advanced feature
- **Complementary to CliniDoc**

---

## System 6: Behandelplan AI

### Classification
- **Type:** 🔍 AI ANALYSIS & SUGGESTIONS
- **Status:** ✅ PRODUCTION (OpenAI integrated)
- **AI:** Real AI (GPT-4o-mini)
- **Patient-bound:** Context-aware

### File Locations
- **Service:** `src/services/behandelplanAI.ts`
- **Related:** `src/services/behandelplanAI_v2.ts`

### Purpose
Analyzes behandelplan titles and provides **suggestions**:
- Teeth selection suggestions
- UPT code recommendations
- Procedure suggestions
- Standard set suggestions
- Clinical notes
- Budget recommendations

### Dependencies

**Database Tables:**
- `upt_tarief_2025` - UPT code lookup
- `upt_code_sets` - Standard sets
- `procedures` - Procedure catalog

**AI Service:**
- `parseJSONResponse()` from `src/services/openai.ts`
- Model: `gpt-4o-mini`
- Low temperature (0.3) for accuracy

### AI Analysis Flow
1. Analyze behandelplan context (naam, categorie, doel, termijn)
2. Detect teeth/elements
3. Determine category
4. Generate search keywords
5. Suggest clinical notes
6. Search database for matching UPT codes
7. Find matching procedures
8. Find matching standard sets
9. Return suggestions with confidence scores

### Output Structure
```typescript
interface BehandelplanAISuggestion {
  id: string;
  type: 'teeth_selection' | 'upt_codes' | 'procedure' | 'set' | 'clinical_note';
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data?: {
    teeth?: string[];
    uptCodes?: Array<...>;
    procedureId?: string;
    setId?: string;
    clinicalNote?: string;
  };
}
```

### Text Generation Role
**Generates SUGGESTIONS (not final documents):**
- Analyzes existing behandelplan titles
- Suggests improvements
- Recommends UPT codes
- Proposes clinical notes
- **Not a document composer**

### Migration Notes
- ✅ **Keep as-is** - specialized assistant
- **Different from CliniDoc**
- Could provide **suggestions TO CliniDoc**
- **Complementary system**

---

## System 7: Begroting Composer 2025

### Classification
- **Type:** 💰 BUDGET CREATION WITH AI ASSIST
- **Status:** ✅ PRODUCTION
- **AI:** AI suggestions (via `begrotingenAI` service)
- **Patient-bound:** Yes

### File Locations
- **Main Modal:** `src/components/BegrotingComposer2025Modal.tsx`
- **AI Service:** `src/services/begrotingenAI.ts`
- **Related:** `src/services/unifiedBudgetService.ts`

### Purpose
Creates budgets (begrotingen) with AI assistance:
- Budget header (patient, locatie, behandelaar)
- Budget lines (UPT codes, descriptions, pricing)
- Discount calculations
- Manual honorarium overrides
- **AI suggestions for UPT codes and completeness**

### Dependencies

**Database Tables:**
- `begrotingen_v2` - Budget headers
- `begrotingen_v2_regels` - Budget lines
- `upt_tarief_2025` - Pricing data
- `praktijk_locaties` - Locations
- `users` - Behandelaars
- `interventies` - Linked interventions
- `behandelplan_templates` - Template-based budgets

**AI Services:**
- `getBudgetAISuggestions()` - AI-powered suggestions
- `calculateBudgetHealthScore()` - Completeness analysis
- `getBudgetInsights()` - Budget insights
- `suggestUptCodesFromTitle()` - Title-based UPT suggestions

**UI Components:**
- `UptCodeMultiSelectorModal` - UPT code selection
- `UptStandardSetSelectorModal` - Standard set selection
- `ProcedureSelectModal` - Procedure selection
- `SVGDentalChart` - Visual tooth selection

### AI Features
1. **Budget Health Score:** Analyzes completeness
2. **UPT Suggestions:** Recommends missing codes
3. **Insights:** Provides budget analysis
4. **Title Analysis:** Suggests codes from budget title

### Text Generation Role
**Generates BUDGET DESCRIPTIONS + AI suggestions:**
- Budget line descriptions (text)
- AI-generated suggestions (text)
- Budget titles (text)
- Internal notes (text)
- **+ Structured pricing data**

### Template System
- ❌ Does NOT use `templates` table
- ✅ Uses `behandelplan_templates` for structured budgets
- Different template domain

### Migration Notes
- ✅ **Keep as-is** - specialized financial system
- **Different from CliniDoc** (budgets vs clinical notes)
- **No conflict**
- Could link TO CliniDoc for clinical context

---

## System 8: Template Variables System

### Classification
- **Type:** 🔧 SHARED INFRASTRUCTURE
- **Status:** ✅ PRODUCTION
- **AI:** No (utility library)
- **Patient-bound:** Context-aware

### File Locations
- **Main:** `src/utils/templateVariables.ts`
- **Helper Component:** `src/components/TemplateVariablesHelper.tsx`

### Purpose
**Centralized variable replacement engine** used by multiple systems:
- Variable substitution in templates
- Variable validation
- Variable extraction
- Variable documentation

### Variable Categories
1. **Patient:** `{{patient.voornaam}}`, `{{patient.achternaam}}`, etc. (16 variables)
2. **Case:** `{{case.case_code}}`, `{{case.omschrijving}}`, etc. (4 variables)
3. **Behandelaar:** `{{behandelaar.naam}}`, `{{behandelaar.big_nummer}}`, etc. (5 variables)
4. **Locatie:** `{{locatie.naam}}`, `{{locatie.adres}}`, etc. (7 variables)
5. **Document:** `{{document.datum}}`, `{{document.titel}}`, etc. (5 variables)
6. **DateTime:** `{{vandaag}}`, `{{nu}}`, `{{jaar}}`, etc. (6 variables)
7. **Status Praesens:** `{{status_praesens.medicatie}}`, etc. (5 variables)
8. **Diagnoses:** `{{diagnoses.lijst}}`, `{{diagnoses.codes}}` (2 variables)
9. **Interventies:** `{{interventies.lijst}}`, etc. (2 variables)
10. **Custom:** `{{custom.veld}}` (extensible)

**Total:** 50+ standard variables + extensible custom variables

### Functions
```typescript
// Core function
replaceTemplateVariables(templateText: string, context: TemplateVariableContext): string

// Helper functions
extractVariablesFromTemplate(templateText: string): string[]
validateTemplateVariables(templateText: string): { valid: boolean; unknownVariables: string[] }
```

### Used By
- ✅ ClinicalNoteComposerInline (line 381)
- ✅ ClinicalNoteComposerModal
- Potentially other systems reading `templates` table

### Template System Architecture
```
┌─────────────────────────────────────┐
│ templates table                     │
│ - inhoud (template text with vars) │
└──────────────┬──────────────────────┘
               │
               ├─► ClinicalNoteComposerInline
               │   └─► replaceTemplateVariables(template.inhoud, context)
               │       └─► Final document text
               │
               └─► Other systems using templates
```

### Migration Notes
- ✅ **CRITICAL SHARED INFRASTRUCTURE**
- ✅ **Must be preserved and expanded for CliniDoc**
- ✅ **Already production-ready**
- Consider expanding variable set for CliniDoc needs
- **DO NOT break this - multiple systems depend on it**

---

## System 9: Recept Composer

### Classification
- **Type:** 💊 PRESCRIPTION GENERATOR
- **Status:** ✅ PRODUCTION
- **AI:** Template-based (no AI)
- **Patient-bound:** Yes

### File Locations
- **Modal:** `src/components/ReceptComposerModal.tsx`
- **Related Service:** `src/services/statusPraesensAI.ts` (for AI prescription extraction)

### Purpose
Generates prescriptions (recepten):
- Medication selection
- Dosage instructions
- Duration
- Special instructions
- Prescription template generation

### Dependencies

**Database Tables:**
- `prescriptions` - Prescription records
- `medicatie_master` - Medication catalog (likely)
- `patients` - Patient data
- `cases` - Optional case linking

### Text Generation Role
**Generates PRESCRIPTION TEXT:**
- Medication instructions (text)
- Special notes (text)
- Prescription header (text)
- **Structured prescription data**

### Template System
- May use prescription templates
- Likely has standard prescription formats

### Migration Notes
- ✅ **Keep as separate specialized system**
- **Different from general CliniDoc** (specialized medical prescriptions)
- Could be **linked FROM CliniDoc** for integrated workflow
- **Complementary system**

---

## System 10: AI Template Maker

### Classification
- **Type:** 🤖 TEMPLATE GENERATION ASSISTANT
- **Status:** ✅ PRODUCTION (OpenAI integrated)
- **AI:** Real AI
- **Patient-bound:** No (template library)

### File Locations
- **Modal:** `src/components/AITemplateMakerModal.tsx`
- **Service:** `src/utils/aiTemplateGenerator.ts`

### Purpose
AI-powered template creation assistant:
- Generates new text templates
- Creates form templates
- Suggests template content based on description
- Helps build template library

### Dependencies

**Database Tables:**
- `templates` - Creates new templates
- `template_categories` - Template categorization (likely)

**AI Service:**
- OpenAI integration for template generation

### Text Generation Role
**Generates TEMPLATE DEFINITIONS:**
- Template text content
- Template structure
- Template variables
- **Meta-generator (generates generators)**

### Migration Notes
- ✅ **Useful tool for CliniDoc**
- Could help **generate CliniDoc templates**
- **Complementary tool**

---

## System 11: Document Set Generators

### Classification
- **Type:** 📦 COMPLETE DOCUMENT SET GENERATORS
- **Status:** ✅ PRODUCTION (OpenAI integrated)
- **AI:** Real AI
- **Patient-bound:** Yes

### File Locations
- **AICompleteDocumentSetModal:** `src/components/AICompleteDocumentSetModal.tsx`
- **AIPrepareDocumentSetModal:** `src/components/AIPrepareDocumentSetModal.tsx`

### Purpose
Generates **complete sets of documents** in one operation:
- Clinical note
- Informed consent
- Patiënteninformatie
- Behandelplan document
- Recept
- Verwijsbrief

### Used By
- AIGenerator (line 516-520)
- ClinicalNoteComposerModal (line 856-868)
- ClinicalNoteComposerInline (line 926-938)

### Props
```typescript
interface AICompleteDocumentSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  patiëntNaam?: string;
  geboortedatum?: string;
  defaultKlinischeBeschrijving?: string;
}

interface AIPrepareDocumentSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  patiëntNaam?: string;
  geboortedatum?: string;
}
```

### Text Generation Role
**Generates MULTIPLE DOCUMENTS simultaneously:**
- All document types
- Coordinated content
- Professional medical documentation
- **Most comprehensive text generator**

### Migration Notes
- ✅ **Core feature for CliniDoc**
- ✅ **Already integrated in ClinicalNoteComposer**
- Should be **central to CliniDoc**
- **Keep and enhance**

---

## Shared Infrastructure Analysis

### Database Tables

#### Templates Table
**Used by:**
1. AIGenerator (`templates` table)
2. ClinicalNoteComposer (`templates` table)
3. AI Template Maker (creates templates)

**Schema:**
```sql
CREATE TABLE templates (
  id uuid PRIMARY KEY,
  naam text,
  beschrijving text,
  template_type text, -- 'Tekst', 'Formulier', 'Verslag'
  categorie text,
  inhoud text, -- Template content with variables
  tekst_inhoud text, -- Legacy field
  doel text,
  actief boolean,
  has_form_fields boolean,
  form_fields jsonb,
  category_id uuid
);
```

**Variable System:**
- Template content uses `{{variable}}` syntax
- Replaced by `replaceTemplateVariables()` function
- Context-aware substitution

#### Document Store Table
**Used by:**
1. ClinicalNoteComposer (primary user)
2. Potentially other clinical documentation systems

**Schema:**
```sql
CREATE TABLE document_store (
  id uuid PRIMARY KEY,
  referentie_nummer text UNIQUE,
  titel text,
  document_type text, -- 'KlinischeNote', 'Consent', etc.
  inhoud text,
  case_id uuid,
  patient_id uuid,
  user_id uuid,
  tag jsonb, -- Metadata (datum, locatie, behandelaar, etc.)
  template_id uuid,
  created_at timestamptz,
  updated_at timestamptz
);
```

#### UPT Tables
**Shared by:**
1. AI Treatment Generator
2. Behandelplan AI
3. Begroting Composer 2025
4. AIGenerator (display only)

**Tables:**
- `upt_tarief_2025` - Pricing data
- `upt_code_sets` - Standard sets
- `upt_code_set_items` - Set items
- `upt_learning_patterns` - AI learning
- `procedure_upt_codes` - Procedure links

### Shared Services

#### OpenAI Service
**File:** `src/services/openai.ts`

**Used by:**
1. AI Treatment Generator
2. Behandelplan AI
3. AI Template Maker
4. Document Set Generators (likely)

**Key Function:**
```typescript
parseJSONResponse<T>(
  systemPrompt: string,
  userPrompt: string,
  options: { model, temperature, max_tokens }
): Promise<T>
```

#### Template Variables Service
**File:** `src/utils/templateVariables.ts`

**Used by:**
1. ClinicalNoteComposerInline
2. ClinicalNoteComposerModal
3. Any system reading templates with variables

**Critical for CliniDoc integration**

### Shared Components

#### AI Modals
1. `AICompleteDocumentSetModal` - Complete doc sets
2. `AIPrepareDocumentSetModal` - Document preparation
3. `AITreatmentQuestionnaireModal` - Treatment generation
4. `AITemplateMakerModal` - Template creation

#### Selectors
1. `UptCodeMultiSelectorModal` - UPT selection
2. `UptStandardSetSelectorModal` - Set selection
3. `ProcedureSelectModal` - Procedure selection

#### Helpers
1. `TemplateVariablesHelper` - Variable insertion UI
2. `SVGDentalChart` - Visual tooth selection

---

## Text Generation Comparison Matrix

| System | Patient-Bound | AI Type | Persists | Templates | Variables | Output Type |
|--------|---------------|---------|----------|-----------|-----------|-------------|
| **AIGenerator** | ❌ Manual | Dummy | ❌ No | Basic | ❌ No | Copy/paste |
| **ClinicalNoteComposer** | ✅ Yes | Real (modals) | ✅ Yes | Advanced | ✅ Yes | Database |
| **ICE+ Hub** | ✅ Yes | N/A | N/A | N/A | N/A | Orchestrator |
| **ICE Template Builder** | ❌ No | ❌ No | ✅ Yes | Metadata | ❌ No | Structure |
| **AI Treatment Gen** | ✅ Yes | Real (GPT-4o) | ✅ Yes | ❌ No | ❌ No | Structured+Text |
| **Behandelplan AI** | Context | Real (mini) | ❌ No | ❌ No | ❌ No | Suggestions |
| **Begroting Composer** | ✅ Yes | Real (assist) | ✅ Yes | Template-based | ❌ No | Budget+Text |
| **Template Variables** | Context | ❌ No | N/A | N/A | ✅ Yes | Infrastructure |
| **Recept Composer** | ✅ Yes | Template | ✅ Yes | Likely | Unknown | Prescription |
| **AI Template Maker** | ❌ No | Real | ✅ Yes | Creates | ✅ Yes | Template def |
| **Document Set Gens** | ✅ Yes | Real | Unknown | Unknown | Unknown | Multi-doc |

---

## ICE+ vs ICE Template Builder: Critical Distinction

### ICE+ (Patient Care Hub)
**Role:** 🎯 **ORCHESTRATOR**
- Patient dashboard
- Navigation hub
- Links to other systems
- Shows statistics
- **Does NOT generate text**

**What it does:**
- Shows zorgplannen count
- Shows behandelplannen count
- Shows begrotingen count
- Opens modals for creating items
- Links to Status Praesens
- Displays workflow summaries

**What it does NOT do:**
- Generate clinical notes
- Create documentation
- Compose text
- Use templates
- Use AI for text generation

### ICE Template Builder
**Role:** 🎨 **TEMPLATE MANAGEMENT**
- Behandelplan template library
- Template metadata
- Diagnosis codes (DX-xxx)
- Behandelopties
- Interventies structure
- **Does NOT generate clinical text**

**What it does:**
- Manages behandelplan templates
- Links diagnosis codes
- Defines treatment options
- Manages interventies
- Sets care requirements
- Defines anatomical scope

**What it does NOT do:**
- Generate clinical notes
- Create patient documents
- Compose clinical text
- Generate informed consent
- Create verwijsbrieven

### Key Takeaway for CliniDoc
```
ICE+ ───► Orchestrates ───► Multiple Systems
                           │
                           ├─► Zorgplannen creation
                           ├─► Behandelplannen (uses ICE Template Builder)
                           ├─► Begrotingen
                           ├─► Status Praesens
                           └─► CliniDoc (future integration)

ICE Template Builder ───► Defines ───► Treatment Structure
                                       │
                                       └─► NOT clinical documentation

CliniDoc ───► Generates ───► Clinical Documentation
                              │
                              ├─► Clinical notes
                              ├─► Consent forms
                              ├─► Patient info
                              ├─► Verwijsbrieven
                              └─► Other medical docs
```

**THEY DON'T CONFLICT - THEY ARE COMPLEMENTARY**

---

## CliniDoc Migration Safety Notes

### ✅ Systems That Are SAFE (Won't Conflict)

1. **ICE+ Patient Care Hub**
   - Orchestrator only
   - Will link TO CliniDoc
   - No code changes needed
   - **Safe to coexist**

2. **ICE Template Builder**
   - Different domain (treatment structure vs documentation)
   - No template system overlap
   - **Safe to coexist**

3. **AI Treatment Generator**
   - Specialized treatment planning
   - Different output format
   - **Complementary to CliniDoc**

4. **Behandelplan AI**
   - Suggestion engine
   - Not a composer
   - **Can provide suggestions TO CliniDoc**

5. **Begroting Composer**
   - Financial system
   - Different domain
   - **Safe to coexist**

6. **Recept Composer**
   - Specialized prescriptions
   - Medical domain
   - **Can be linked FROM CliniDoc**

7. **Template Variables System**
   - **CRITICAL INFRASTRUCTURE**
   - **Must be preserved**
   - **CliniDoc depends on this**

8. **Document Set Generators**
   - **Core CliniDoc feature**
   - **Must be preserved and enhanced**
   - **Already integrated in ClinicalNoteComposer**

### ⚠️ Systems That Need Migration

1. **AIGenerator (Legacy)**
   - **Action:** Deprecate in favor of CliniDoc
   - **Risk:** LOW (no persistence)
   - **Timeline:** 2-3 months deprecation period
   - **Plan:** See CLINIDOC_GENERATORS_INVENTORY.md

2. **ClinicalNoteComposer**
   - **Action:** Becomes CliniDoc core
   - **Risk:** NONE (this IS CliniDoc)
   - **Timeline:** Immediate (rename/rebrand)
   - **Plan:** Enhance and rebrand as CliniDoc

### 🔧 Shared Infrastructure (Must Preserve)

1. **Template Variables System** (`templateVariables.ts`)
   - Used by: ClinicalNoteComposer + others
   - **DO NOT MODIFY without testing all dependents**
   - Expand for CliniDoc needs

2. **Templates Table** (`templates`)
   - Used by: AIGenerator, ClinicalNoteComposer, AI Template Maker
   - **DO NOT change schema without migration**
   - Consider adding CliniDoc-specific fields

3. **Document Store Table** (`document_store`)
   - Used by: ClinicalNoteComposer (primary)
   - **Core CliniDoc persistence**
   - Expand document types if needed

4. **OpenAI Service** (`openai.ts`)
   - Used by: Multiple AI systems
   - **Shared API integration**
   - Monitor rate limits and costs

### 🛡️ Safety Checklist for CliniDoc Development

#### Phase 1: Read-Only Analysis ✅ (Current)
- [x] Inventory all text systems
- [x] Identify dependencies
- [x] Map shared infrastructure
- [x] Document conflicts and overlaps

#### Phase 2: Planning (Next)
- [ ] Design CliniDoc architecture
- [ ] Plan ClinicalNoteComposer → CliniDoc evolution
- [ ] Plan AIGenerator deprecation timeline
- [ ] Design integration points with ICE+
- [ ] Plan template system enhancements

#### Phase 3: Development (Future)
- [ ] Rebrand ClinicalNoteComposer as CliniDoc
- [ ] Add CliniDoc-specific features
- [ ] Enhance template variable system
- [ ] Integrate with ICE+ hub
- [ ] Add deprecation notices to AIGenerator
- [ ] Create migration documentation

#### Phase 4: Testing (Future)
- [ ] Test all shared infrastructure still works
- [ ] Test template variables in all systems
- [ ] Test document store integrity
- [ ] Test AI service integrations
- [ ] User acceptance testing

#### Phase 5: Rollout (Future)
- [ ] Deploy CliniDoc alongside existing systems
- [ ] Add navigation from ICE+ to CliniDoc
- [ ] Monitor usage metrics
- [ ] Collect user feedback
- [ ] Gradual user migration

#### Phase 6: Deprecation (Future)
- [ ] Final AIGenerator deprecation
- [ ] Remove unused code
- [ ] Update documentation
- [ ] Clean up legacy systems

---

## Critical Path for CliniDoc

### Recommended Approach: Evolutionary, Not Revolutionary

```
ClinicalNoteComposer
       │
       ├─► Rename/Rebrand as "CliniDoc"
       │   └─► Update routes, navigation, UI labels
       │
       ├─► Enhance Features
       │   ├─► Add procedure selection (from AIGenerator)
       │   ├─► Add UPT code display
       │   ├─► Add medication suggestions
       │   └─► Improve AI integration
       │
       ├─► Integrate with ICE+
       │   ├─► Add "CliniDoc" button in PatientCareHubPremium
       │   ├─► Pass patient context
       │   └─► Link back to ICE+ after saving
       │
       └─► Deprecate AIGenerator
           └─► 2-3 month transition period
```

### What CliniDoc Should Include

**From ClinicalNoteComposer (Keep):**
- ✅ Patient search and selection
- ✅ Case linking
- ✅ Template system with variables
- ✅ Document store persistence
- ✅ AI document set generation
- ✅ Metadata tracking
- ✅ Edit existing documents

**From AIGenerator (Add):**
- ✅ Procedure selection workflow (optional/collapsible)
- ✅ UPT code context display
- ✅ Medication suggestions display
- ✅ Procedure category browsing

**New CliniDoc Features:**
- Document type templates (Clinical Note, Consent, Verwijsbrief, etc.)
- Quick templates library
- Recent documents history
- Document export (PDF, email, clipboard)
- Document signing workflow
- Document versioning
- Multi-document sessions

### What CliniDoc Should NOT Include

**Leave to Other Systems:**
- ❌ Treatment planning structure (ICE Template Builder)
- ❌ Complete treatment generation (AI Treatment Generator)
- ❌ Budget creation (Begroting Composer)
- ❌ Prescription generation (Recept Composer) - but can link to it
- ❌ Patient care orchestration (ICE+ Hub)

**CliniDoc Focus:** Clinical DOCUMENTATION only

---

## Integration Points for CliniDoc

### From ICE+ Hub
```typescript
// In PatientCareHubPremium.tsx
<button
  onClick={() => onNavigate?.('clinidoc', patientId)}
  className="..."
>
  <FileText className="w-4 h-4" />
  CliniDoc - Klinische Documentatie
</button>
```

### From Behandelplan Detail
```typescript
// Add "Create Clinical Note" button
<button onClick={() => openCliniDoc(behandelplan.case_id, behandelplan.patient_id)}>
  Maak Klinische Notitie
</button>
```

### From Begroting
```typescript
// Add "Genereer Documentatie" button
<button onClick={() => openCliniDocFromBudget(begroting.id)}>
  Genereer Behandeldocumentatie
</button>
```

### To Recept Composer
```typescript
// In CliniDoc, add "Schrijf Recept" button
<button onClick={() => openReceptComposer(patient.id, case?.id)}>
  Schrijf Recept
</button>
```

---

## Conclusion

### Summary of Findings

1. **11 distinct text systems** exist in ACE+
2. **ClinicalNoteComposer is already 80% of CliniDoc**
3. **ICE+ and ICE Template Builder are NOT text generators** - they are orchestration and metadata systems
4. **Shared infrastructure is mature** (Template Variables, OpenAI service, Document Store)
5. **AIGenerator is legacy** and should be deprecated
6. **Multiple specialized systems are complementary** (not duplicates)

### Recommended Action Plan

**Phase 1 (Immediate):**
1. ✅ Use this inventory document as reference
2. Rename ClinicalNoteComposer to CliniDoc
3. Update navigation and labels
4. No breaking changes

**Phase 2 (1-2 sprints):**
1. Add feature parity with AIGenerator (procedure panel, UPT display)
2. Integrate CliniDoc links in ICE+ and BehandelplanDetail
3. Add deprecation banner to AIGenerator
4. User communication

**Phase 3 (2-3 months):**
1. Monitor CliniDoc usage
2. Collect user feedback
3. Gradual user migration from AIGenerator
4. Enhance CliniDoc based on feedback

**Phase 4 (After transition):**
1. Remove AIGenerator
2. Clean up legacy code
3. Update documentation
4. Celebrate

### Risk Assessment

**Overall Risk:** 🟢 **LOW**

**Reasons:**
- ClinicalNoteComposer is already production-ready
- No conflicts with ICE+ or ICE Template Builder
- Shared infrastructure is stable
- AIGenerator can be deprecated without data loss
- Evolutionary approach (not revolutionary)

### Final Recommendation

**✅ PROCEED with CliniDoc development**
- Base on ClinicalNoteComposer (it's already 80% there)
- Add missing features from AIGenerator
- Integrate with ICE+ as navigation target
- Deprecate AIGenerator over 2-3 months
- Maintain all other specialized systems

**CliniDoc should be the UNIFIED entry point for clinical documentation, while respecting the specialized domains of other systems.**

---

**Document Status:** ✅ COMPLETE
**Last Updated:** 2025-12-20
**Next Action:** Review with team → Create Phase 2 implementation tasks
