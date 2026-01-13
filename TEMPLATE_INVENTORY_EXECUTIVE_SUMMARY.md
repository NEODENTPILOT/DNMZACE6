# TEMPLATE INVENTORY - EXECUTIVE SUMMARY
## Quick Reference Guide

**Date:** December 21, 2024
**Full Report:** See `COMPLETE_TEMPLATE_CONTENT_INVENTORY.md`

---

## CRITICAL FINDING

**The application's clinical text content is primarily HARDCODED in TypeScript files, not stored in the database.**

- **Database templates:** 113 (mostly legacy quick texts)
- **Hardcoded templates:** 16 (all actively used for modern document generation)
- **ICE templates:** Metadata-driven, no full text storage

---

## QUICK STATS

| Category | Count | Content Status |
|----------|-------|----------------|
| **Database - Tekst** | 94 | 83% have content (mostly behandelnotitie quick texts) |
| **Database - Verslag** | 13 | Status unclear, needs UI audit |
| **Database - Formulier** | 6 | Only 2 have content (short placeholders), 4 are empty |
| **Hardcoded - aiTemplateGenerator.ts** | 7 | All active, used for document generation |
| **Hardcoded - dummyAI.ts** | 6 | All active, used as AI fallback |
| **Hardcoded - caseAI.ts** | 3 | All active, used for case management |
| **ICE - behandelplan_templates** | Variable | Metadata only, no full text |

**Total templates: 129**
**Actively used: 16 hardcoded + unknown % of database templates**

---

## WHERE IS CONTENT STORED?

### 1. Hardcoded in TypeScript (PRIMARY SOURCE)

**File: `/src/utils/aiTemplateGenerator.ts`**
- KlinischeNote (Clinical Note)
- InformedConsent (Informed Consent)
- PatiëntenInformatie (Patient Information)
- Recept (Prescription)
- Behandelplan (Treatment Plan)
- Verwijsbrief (Referral Letter)
- Verslag (Report)

**File: `/src/utils/dummyAI.ts`**
- Clinical note (fallback version)
- Informed Consent (fallback version)
- Verwijsbrief (fallback version)
- Patiënteninformatie (fallback version)
- Behandelplan (fallback version)
- PMO Samenvatting (PMO Summary)

**File: `/src/services/caseAI.ts`**
- Case Samenvatting (Case Summary)
- Case Overdracht (Case Handover)
- Case Afsluitrapport (Case Closure Report)

### 2. Database (SECONDARY SOURCE)

**Table: `templates`**
- 94 Tekst templates (primarily "Behandelnotitie" quick texts from CSV import)
- 13 Verslag templates (unclear usage)
- 6 Formulier templates (mostly empty placeholders)

**Usage:** Selectable in UI for quick text insertion, not used for modern document generation

### 3. ICE Metadata (STRUCTURED DATA)

**Table: `behandelplan_templates`**
- NO full document templates
- Stores structured metadata (diagnoses, rationale, risks)
- Documents assembled from fragments at runtime
- Uses `default_diagnoses`, `template_rationale`, `prognose_text`, etc.

**Table: `interventie_templates`**
- NO full text content
- Stores structured treatment data (UPT codes, care requirements)
- Linked to behandelplan_templates

---

## DOCUMENT GENERATION FLOWS

### Flow 1: AI-Generated Documents (PRIMARY)
1. User selects document type
2. System uses template from `aiTemplateGenerator.ts`
3. Variables substituted
4. Document saved

**Templates used:** 7 from aiTemplateGenerator.ts

### Flow 2: Fallback Documents
1. AI unavailable or specific use case
2. System uses template from `dummyAI.ts`
3. Variables substituted
4. Document saved

**Templates used:** 6 from dummyAI.ts

### Flow 3: CliniDoc Templates (RARE)
1. User selects template from database
2. Database template loaded
3. User edits
4. Document saved

**Templates used:** Variable, from database `templates` table

### Flow 4: ICE Clinical Reasoning (METADATA)
1. User creates behandelplan from ICE template
2. System loads structured metadata
3. Document assembled from fragments
4. NO template substitution, direct data rendering

**Templates used:** None, metadata-driven

### Flow 5: PMO Documentation
1. User completes Status Praesens form
2. System calls `dummyAI.ts` → `generatePMOSummary()`
3. Structured summary generated
4. Saved to document store

**Templates used:** 1 from dummyAI.ts (PMO)

### Flow 6: Case Documentation
1. User creates/closes case
2. System calls `caseAI.ts` template functions
3. Document generated
4. Saved to case records

**Templates used:** 3 from caseAI.ts

---

## VARIABLES INVENTORY

**Total unique variables:** 45

**Most common variables:**
- Patient: `{{patientNaam}}`, `{{geboortedatum}}`, `{{dossierNummer}}`
- Provider: `{{eigenNaam}}`, `{{functie}}`, `{{bigNummer}}`
- Practice: `{{praktijkNaam}}`, `{{praktijkEmail}}`, `{{praktijkTelefoon}}`
- Clinical: `{{diagnose}}`, `{{behandeling}}`, `{{bevindingen}}`
- Date: `{{datum}}`, `{{datumBehandeling}}`

**Variable syntax:**
- Mustache style: `{{variableName}}` (used in aiTemplateGenerator.ts)
- Template literal style: `{variableName}` (used in dummyAI.ts)
- **INCONSISTENT - needs standardization**

---

## PROBLEMS IDENTIFIED

### 1. No Single Source of Truth
Three different systems coexist:
- Database templates (legacy)
- Hardcoded templates (modern)
- ICE metadata (structured)

**Impact:** Confusion about where to edit content, inconsistent governance

### 2. Formulier Templates Non-Functional
- 6 templates exist in database
- 4 have NO content (empty records)
- 2 have only short placeholder text
- Form rendering NOT implemented

**Impact:** Forms feature is placeholder-only, unusable

### 3. User Cannot Customize Templates
Modern templates are hardcoded in TypeScript.

**Impact:** Any template change requires:
- Code modification
- Testing
- Deployment
- Cannot be done by clinical staff

### 4. Variable Syntax Inconsistent
Two different syntaxes used: `{{var}}` and `{var}`

**Impact:** Confusion, potential bugs, harder to maintain

### 5. Database Templates Unclear Status
- 94 Tekst templates exist
- Usage unclear (needs UI audit)
- May be orphaned or rarely used

**Impact:** Maintenance burden, unclear which to keep/remove

---

## RECOMMENDATIONS

### Immediate (Quick Wins)

1. **Standardize variable syntax** across all templates
2. **Remove or complete empty Formulier templates**
3. **Document which templates are active** (UI audit needed)
4. **Add comments to hardcoded templates** indicating their purpose and usage

### Short-term (1-2 months)

1. **Migrate modern templates to database**
   - Move 16 hardcoded templates to editable database storage
   - Enable clinical staff to customize without code changes

2. **Implement template versioning**
   - Track changes
   - Enable rollback
   - Audit trail

3. **Build form definition system**
   - Replace text-based Formulier with structured form definitions
   - JSON schema for forms
   - Dynamic form rendering

### Long-term (Strategic)

1. **Choose ONE template architecture**
   - Consolidate database, hardcoded, and ICE metadata approaches
   - Establish clear governance
   - Document decision rationale

2. **Implement Template Builder UI**
   - Visual editor for templates
   - Variable picker
   - Preview functionality
   - No-code template creation

3. **Move to Form-First Approach**
   - Clinical encounters = structured forms
   - Documents generated FROM form data
   - Not template + variable substitution
   - Full audit trail and data extraction

---

## IMPACT ON REDESIGN PLANS

### For Form-Based Clinical Encounters

**Good News:**
- 16 modern templates provide excellent structure
- Variable inventory is comprehensive
- PMO template shows successful structured data approach

**Challenges:**
- Cannot leverage database templates (mostly legacy quick texts)
- Need to build form system from scratch
- Need to migrate hardcoded templates to editable storage

**Recommended Approach:**
1. Use hardcoded templates as baseline for form structure
2. Build new form builder (separate from legacy system)
3. Define forms as JSON schemas
4. Generate documents from form data (not template substitution)
5. Gradually deprecate legacy templates

---

## KEY CONTACTS / FILES

### Primary Files to Modify
- `/src/utils/aiTemplateGenerator.ts` - 7 modern document templates
- `/src/utils/dummyAI.ts` - 6 fallback templates + PMO
- `/src/services/caseAI.ts` - 3 case templates
- `/src/services/cliniDocTemplateService.ts` - Template matching logic

### Database Tables
- `templates` - 113 legacy templates
- `behandelplan_templates` - ICE metadata
- `interventie_templates` - ICE interventions
- `document_store` - Generated documents

### Configuration
- Variable substitution logic: In document generation services
- Template selection: Multiple locations (needs consolidation)

---

## NEXT STEPS

1. **Review this summary** with team
2. **Decide on template architecture** (database vs. code vs. hybrid)
3. **Prioritize recommendations** (immediate vs. short-term vs. long-term)
4. **Audit UI** to determine which database templates are actively used
5. **Plan migration** if moving to unified system

---

**For full details, variable lists, and complete template content, see:**
`COMPLETE_TEMPLATE_CONTENT_INVENTORY.md` (935+ lines, comprehensive extraction)
