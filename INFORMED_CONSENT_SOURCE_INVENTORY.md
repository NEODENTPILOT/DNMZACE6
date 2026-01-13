# INFORMED CONSENT SOURCE INVENTARISATIE

**Datum:** 21 december 2024
**Doel:** Complete inventarisatie van waar Informed Consent document content vandaan komt in de ARMIN codebase

---

## EXECUTIVE SUMMARY

**Conclusie:** De huidige implementatie gebruikt **HARDCODED PLACEHOLDER TEXT (D)**, ondanks dat er een **UITGEBREIDE TEMPLATE DATABASE (B)** beschikbaar is die NIET wordt gebruikt.

### Huidige Status
- ✅ Database bevat 7 Informed Consent templates met volledige content
- ❌ UI gebruikt deze templates NIET
- ❌ Document creatie gebruikt generieke placeholder tekst
- ⚠️ DISCONNECTED: Template systeem en document creatie werken niet samen

---

## 1. DATA FLOW ANALYSE

### 1.1 Huidige Document Creatie Flow

```
User clicks "Nieuwe CliniDoc"
  → Selecteert "Informed Consent" in CliniDocCreatePanel
    → CliniDocCreatePanel.tsx:725
      → Hardcoded placeholder: "# ${docLabel}\n\nDatum: ...\n\n[Vul hier de inhoud van het document in]"
        → Wordt opgeslagen in document_store.inhoud
          → Geen template lookup
          → Geen template_id koppeling
```

**Locatie:** `src/components/care/CliniDocCreatePanel.tsx:720-728`

```typescript
const docData = {
  titel: `${docLabel} - ${new Date().toLocaleString('nl-NL')}`,
  document_type: dbDocType,
  patient_id: selectedPatient?.id || null,
  user_id: user.id,
  inhoud: `# ${docLabel}\n\nDatum: ${new Date().toLocaleDateString('nl-NL')}\n\n---\n\n[Vul hier de inhoud van het document in]`,  // ← HARDCODED!
  referentie_nummer: generateReferenceNumber(),
  tag: JSON.stringify(tagData)
};
```

### 1.2 Database Schema: document_store

**Tabel:** `document_store`
**Relevante Kolommen:**
- `inhoud` (text, NOT NULL) - De document content
- `template_id` (uuid, NULLABLE) - **Link naar templates tabel - WORDT NIET GEBRUIKT!**
- `document_type` (text, NOT NULL) - Check constraint: 'Consent' is een toegestane waarde

**Database Constraint:**
```sql
CHECK (document_type = ANY (ARRAY[
  'KlinischeNote'::text,
  'Consent'::text,        -- ← Informed Consent type
  'Verwijsbrief'::text,
  'Verslag'::text,
  'Recept'::text,
  'Formulier'::text,
  'AITekst'::text
]))
```

---

## 2. BESCHIKBARE TEMPLATE SYSTEMEN

### 2.1 Templates Tabel - NIET GEBRUIKT

**Database:** `templates` tabel
**Statistieken:**
- Total templates: **113**
- Informed Consent templates: **7**
- Templates met content: **100**

**Informed Consent Templates in Database:**

| Template Naam | Type | Inhoud Preview | Status |
|---------------|------|----------------|--------|
| **Informed consent – algemene behandeling** | Tekst | "Toestemmingsverklaring Tandheelkundige Behandeling\n\nPatiëntgegevens:\nNaam: {{patientNaam}}..." | ✅ Actief |
| **Informed consent – implantaatbehandeling** | Tekst | "Toestemmingsverklaring Implantaatbehandeling\n\nPatiëntgegevens:\nNaam: {{patientNaam}}..." | ✅ Actief |
| **Informed Consent Implantologie** | Formulier | (Form-based) | ✅ Actief |
| **Formulier – Informed consent implantologie** | Formulier | "Gebruik dit formulier voor schriftelijke vastlegging..." | ✅ Actief |
| **Informed consent bw's** | Behandelnotitie | "Patiënt geeft toestemming voor het maken van bitewings..." | ✅ Actief |
| **Informed consent OPT** | Behandelnotitie | "Patiënt geeft toestemming voor het maken van een panorama foto..." | ✅ Actief |
| **Informed consent solo** | Behandelnotitie | "Patiënt geeft toestemming voor het maken van solo opname..." | ✅ Actief |

### 2.2 Template Content Voorbeeld

**Template:** "Informed consent – algemene behandeling"
**Locatie:** Migration `20251118222332_populate_standard_templates.sql:191-236`

```markdown
**Toestemmingsverklaring Tandheelkundige Behandeling**

**Patiëntgegevens:**
Naam: {{patientNaam}}
Geboortedatum: {{geboortedatum}}

**Voorgestelde behandeling:**
{{behandeling}}

**Doel van de behandeling:**
{{doel}}

**Mogelijke alternatieven:**
{{alternatieven}}

**Risico's en bijwerkingen:**
{{risicos}}

**Prognose:**
{{prognose}}

**Verklaring patiënt:**
Ik verklaar dat bovenstaande informatie met mij is besproken en dat ik de gelegenheid heb gehad om vragen te stellen. Ik geef toestemming voor de voorgestelde behandeling.

Datum: {{datum}}
Handtekening patiënt: ________________
Handtekening behandelaar: ________________
```

**Template Variabelen Systeem:** Volledig geïmplementeerd met `{{variableName}}` syntax

### 2.3 Template Instantiation Service

**Locatie:** `src/services/templateInstantiationService.ts`
**Functie:** Behandelplan templates instantiëren
**Status:** ⚠️ Werkt alleen voor behandelplannen, NIET voor documenten

---

## 3. BESTANDSLOCATIES OVERZICHT

### 3.1 Frontend Components

| File | Regels | Functie | Informed Consent Referenties |
|------|--------|---------|------------------------------|
| **src/components/care/CliniDocCreatePanel.tsx** | 69, 725 | Document creatie UI | `informed_consent` type definitie, hardcoded inhoud |
| **src/config/cliniDocRequirements.ts** | 1-54 | Type definitie & validatie | `informed_consent` type met vereisten |
| src/components/CareRequirementsEditor.tsx | Multiple | Care requirements UI | Consent requirements beheer |
| src/components/BehandeloptieRequirements.tsx | Multiple | Treatment consent UI | Consent checklist |
| src/components/FormTemplateEditor.tsx | Multiple | Form editor | Informed consent formulieren |

### 3.2 Database Migrations

| Migration File | Inhoud |
|----------------|--------|
| **20251118222332_populate_standard_templates.sql** | Hoofdtemplate "Informed consent – algemene behandeling" en "implantaatbehandeling" |
| **20251118024312_populate_starter_templates.sql** | IC templates voor starter data |
| **20251117225218_add_forms_system.sql** | Form-based Informed Consent systeem |
| 20251118023253_add_template_system.sql | Template categorieën inclusief 'InformedConsent' |
| 20251118023411_populate_template_categories.sql | Category "Informed Consent" met subcategorieën |

### 3.3 Services & Utilities

| File | Functie |
|------|---------|
| src/services/careRequirementsService.ts | Consent requirements logic |
| src/services/templateInstantiationService.ts | Template instantiation (behandelplan only) |
| src/utils/aiTemplateGenerator.ts | AI template generation |
| src/utils/templateVariables.ts | Template variable substitution |
| src/utils/documentHelpers.ts | Document helper functies |

---

## 4. TYPE DEFINITIES

### 4.1 CliniDoc Requirements Config

**File:** `src/config/cliniDocRequirements.ts:1-54`

```typescript
export type CliniDocType =
  | 'klinische_note'
  | 'informed_consent'  // ← Type definitie
  | 'verslag'
  | 'verwijzing'
  | 'verklaring'
  | 'overig';

export const cliniDocRequirements: Record<CliniDocType, Requirement> = {
  'informed_consent': {
    patientRequired: true,
    carePathRequired: true,
    diagnosisRequired: true,
    referrerRequired: false,
  },
  // ...
};
```

### 4.2 DOC_TYPES UI Mapping

**File:** `src/components/care/CliniDocCreatePanel.tsx:67-75`

```typescript
const DOC_TYPES = [
  // ...
  {
    id: 'informed_consent',
    label: 'Informed Consent',
    icon: FileSignature,
    color: 'teal',
    dbType: 'Consent'  // ← Maps to DB constraint
  },
  // ...
];
```

---

## 5. AI GENERATION SUPPORT

### 5.1 AI Template Generator

**File:** `src/utils/aiTemplateGenerator.ts`
**Status:** ✅ Geïmplementeerd maar niet actief gebruikt voor Informed Consent

**Capabilities:**
- Template generatie op basis van context
- Variable substitution
- AI-assisted content creation

**Current Usage:** Vooral voor behandelplan templates, niet voor documenten

### 5.2 AI Engines

**File:** `src/utils/aiEngines.ts`
**Consent Text Example:**
```typescript
`Ik, ${patient}, geef toestemming voor bovengenoemde behandeling na volledige uitleg.`
```

**Status:** ⚠️ Beperkte AI support, voornamelijk voor snippets

---

## 6. FORM-BASED INFORMED CONSENT

### 6.1 Form Templates Systeem

**Migration:** `20251117225218_add_forms_system.sql:407-461`

**Example Form:** "Informed Consent Implantologie"

**Form Fields:**
1. Patiëntnaam (text)
2. Geboortedatum (date)
3. Datum behandeling (date)
4. Type implantaat (select: Nobel Biocare, Straumann, MIS, Overig)
5. Locatie implantaat (text)
6. Risico's besproken (checkbox)
7. Alternatieven besproken (checkbox)
8. Toestemming voor behandeling (checkbox)
9. Handtekening patiënt (signature)
10. Opmerkingen (textarea)

**Status:** ✅ Volledig geïmplementeerd in database, ⚠️ UI integratie onduidelijk

---

## 7. TEMPLATE VARIABLE SYSTEEM

**File:** `src/utils/templateVariables.ts`
**Supported Variables:**

```typescript
{{patientNaam}}
{{geboortedatum}}
{{behandeling}}
{{doel}}
{{alternatieven}}
{{risicos}}
{{prognose}}
{{datum}}
{{behandelplan}}
{{aantalImplantaten}}
{{locatie}}
{{genezingstijd}}
{{contraIndicaties}}
{{kosten}}
// ... en meer
```

**Status:** ✅ Systeem volledig geïmplementeerd

---

## 8. DISCREPANTIES & MISSING LINKS

### 8.1 Kritieke Ontbrekende Integraties

1. **Template Lookup Ontbreekt**
   - CliniDocCreatePanel doet GEEN query naar `templates` tabel
   - Geen template selectie UI voor gebruiker
   - Template_id wordt NIET ingevuld bij document creatie

2. **Variable Substitution Ontbreekt**
   - Templates bevatten `{{variableName}}` placeholders
   - Geen runtime substitution bij document creatie
   - Gebruiker moet handmatig variabelen invullen

3. **Form Integration Ontbreekt**
   - Form-based templates bestaan in database
   - Geen UI om form templates te selecteren bij document creatie
   - form_instances tabel niet gekoppeld aan document_store

### 8.2 Template Categories

**Database:** template_categories tabel bevat:
- "Informed Consent" (id: cat_ic_id)
- Subcategorieën:
  - Algemene behandeling
  - Implantologie
  - Radiologie (OPT, BW's, solo)

**Status:** ✅ Categorieën bestaan, ❌ Niet gebruikt in UI

---

## 9. SEARCH TERM COVERAGE

Alle gevraagde zoektermen geanalyseerd:

| Zoekterm | Gevonden Locaties | Type |
|----------|-------------------|------|
| "informed" | 70 files | Config, UI, DB migrations |
| "consent" | 70 files | Config, UI, DB migrations |
| "toestemming" | 20+ files | Dutch translations, DB content |
| "informed_consent" | Config, CliniDocCreatePanel | Type definitie |
| "document_type" | CliniDocCreatePanel, DB schema | Type mapping |
| "docType" | CliniDocCreatePanel | UI internal |
| "template" | 40+ files | Template system |
| "standard_text" | standaardteksten table | Legacy system |
| "default content" | CliniDocCreatePanel:725 | **Hardcoded placeholder** |
| "placeholder" | CliniDocCreatePanel:725 | **Current implementation** |

---

## 10. CONCLUSIE & CLASSIFICATIE

### Content Source Classificatie

**Antwoord:** **(D) Leeg Placeholder - met (B) Template Database Beschikbaar maar NIET GEBRUIKT**

### Detailed Breakdown

| Aspect | Status | Details |
|--------|--------|---------|
| **Current Implementation** | (D) Hardcoded Placeholder | `[Vul hier de inhoud van het document in]` |
| **Available System** | (B) Template Database | 7 templates, volledig content, variabelen |
| **AI Support** | (C) Partially Available | Systeem bestaat, niet actief voor IC |
| **Integration** | ❌ Disconnected | Template systeem en document creatie niet gekoppeld |

### Data Flow Reality

```
┌──────────────────────────────────────┐
│  USER CREATES INFORMED CONSENT       │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  CliniDocCreatePanel                 │
│  • Hardcoded placeholder text        │
│  • NO template lookup                │
│  • NO template_id                    │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  document_store.inhoud               │
│  "# Informed Consent\n\n             │
│   Datum: 21-12-2024\n\n              │
│   ---\n\n                            │
│   [Vul hier de inhoud... in]"        │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  templates TABLE (UNUSED!)           │
│  • 7 Informed Consent templates      │
│  • Full content with variables       │
│  • NEVER QUERIED by UI               │
└──────────────────────────────────────┘
```

---

## 11. AANBEVELINGEN

### Prioriteit 1: Template Integratie
1. Voeg template lookup toe aan CliniDocCreatePanel
2. Laat gebruiker kiezen uit beschikbare IC templates
3. Vul template_id in bij document creatie

### Prioriteit 2: Variable Substitution
1. Implementeer template variable substitution bij instantiatie
2. Pre-fill bekende variabelen (patiëntnaam, datum, etc.)
3. Markeer onbekende variabelen voor gebruiker

### Prioriteit 3: Form Integration
1. Integreer form-based templates in document workflow
2. Link form_instances aan document_store
3. Generate document content from form data

### Quick Win
**Voeg template selectie toe:**
```typescript
// In CliniDocCreatePanel.tsx
const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

// Query templates
const { data: templates } = await supabase
  .from('templates')
  .select('id, naam, inhoud')
  .or('teksttype.eq.InformedConsent,document_format.eq.InformedConsent')
  .eq('actief', true);

// Use template content instead of placeholder
const docData = {
  // ...
  inhoud: selectedTemplate?.inhoud || `# ${docLabel}\n\n[Placeholder]`,
  template_id: selectedTemplateId,
};
```

---

## APPENDIX A: ALLE INFORMED CONSENT FILES

### UI Components (Frontend)
- src/components/care/CliniDocCreatePanel.tsx
- src/config/cliniDocRequirements.ts
- src/components/CareRequirementsEditor.tsx
- src/components/BehandeloptieRequirements.tsx
- src/components/BehandeloptieRequirementsModal.tsx
- src/components/BehandeloptieRequirementsRuntimeModal.tsx
- src/components/ClinicalQualityManager.tsx
- src/components/FormTemplateEditor.tsx
- src/components/InterventieEditorPremium.tsx
- src/components/InterventieTemplateRequirementsModal.tsx
- src/components/AICompleteDocumentSetModal.tsx
- src/components/AIPrepareDocumentSetModal.tsx
- src/components/AITemplateMakerModal.tsx
- src/components/DocumentSetViewer.tsx

### Services & Utils
- src/services/careRequirementsService.ts
- src/services/iceWorkflowCoverageService.ts
- src/services/protocolAI.ts
- src/services/templateInstantiationService.ts (behandelplan only)
- src/utils/aiTemplateGenerator.ts
- src/utils/aiEngines.ts
- src/utils/documentHelpers.ts
- src/utils/dnmzDocumentLayout.ts
- src/utils/dummyAI.ts

### Database Migrations
- 20251117225218_add_forms_system.sql (Form-based IC)
- 20251118023253_add_template_system.sql (Template categories)
- 20251118023411_populate_template_categories.sql (IC category)
- 20251118024312_populate_starter_templates.sql (Starter IC templates)
- 20251118222057_extend_templates_for_full_document_system.sql (Document types)
- 20251118222219_create_full_template_category_structure_v2.sql (Structure)
- 20251118222332_populate_standard_templates.sql (**MAIN IC TEMPLATES**)
- 20251129221612_merge_templates_and_forms_system.sql (Template-form merge)
- 20251211141204_create_care_requirements_engine.sql (Consent requirements)

### Domain & Config
- src/domain/careRequirements.ts (Domain model)

---

**EINDE RAPPORT**
**Status:** ✅ Volledig geanalyseerd
**Next Action:** Implementeer template integratie in CliniDocCreatePanel
