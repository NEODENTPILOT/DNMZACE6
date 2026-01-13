# Temporiseerde Afbouw Workflow

**Complete 4-staps flow voor gefaseerde behandeling met shared decision making**

---

## Overview

Wanneer de AI `zorgrichting === 'temporiseerde_afbouw'` adviseert, wordt automatisch een uitgebreide 4-staps workflow geactiveerd voor klinische besluitvorming.

### Trigger
```typescript
zorgdoelenZorgwens.zorgdoelen?.behandelstrategieType === 'temporiseerde_afbouw'
```

### Components
1. **ElementPrognoseMatrix** - Element-level clinical assessment
2. **TemporisatieDoelPanel** - Goals and rationale for temporization
3. **BehandeloptiesPanel** - Multiple parallel treatment scenarios
4. **BesluitvormingPanel** - Shared decision making and final judgment

---

## Step 1: Element Prognose Matrix

**File:** `src/components/clinidoc/ElementPrognoseMatrix.tsx`

### Purpose
Per-element assessment of current status, prognosis, and clinical decision.

### Data Structure
```typescript
interface ElementPrognoseRow {
  element_nummer: number;           // FDI notation
  huidige_status?: 'gezond' | 'restauratie' | 'endodontisch' | 'parodontaal_gecompromitteerd' | 'niet_te_beoordelen';
  prognose?: 'goed' | 'twijfelachtig' | 'slecht' | 'verloren';  // REQUIRED
  beslissing?: 'behouden' | 'tijdelijk_behouden' | 'extraheren';  // REQUIRED
  timing?: 'direct' | 'kort_termijn' | 'middellang' | 'lang_termijn';
  notities?: string;
}
```

### Features
- Full dentition (32 elements) in FDI notation
- Required fields: `prognose` and `beslissing`
- Desktop: Full table view
- Mobile: Collapsible per quadrant
- Real-time validation with completion tracking
- Auto-save on field change (600ms debounce)

### Completion Tracking
- Orange highlighting for incomplete elements
- Progress indicator: "X/32 elementen compleet"
- Percentage badge with color coding

---

## Step 2: Doel van Temporisatie

**File:** `src/components/clinidoc/TemporisatieDoelPanel.tsx`

### Purpose
Capture WHY temporization is the chosen strategy.

### Data Structure
```typescript
interface TemporisatieDoelValue {
  doelen: string[];        // Multi-select, REQUIRED (min 1)
  toelichting: string;     // Textarea, REQUIRED
}
```

### Available Goals (Multi-select)
- `pijnreductie` - Pijnreductie
- `infectiecontrole` - Infectiecontrole
- `functiebehoud` - Functiebehoud
- `esthetiek` - Esthetiek
- `besluitvorming_uitstellen` - Besluitvorming uitstellen
- `voorbereiding_prothetiek` - Voorbereiding prothetiek

### Requirements
- At least 1 goal must be selected
- Clinical rationale (toelichting) is mandatory
- Real-time completion status indicator

---

## Step 3: Behandelopties (Parallel)

**File:** `src/components/clinidoc/BehandeloptiesPanel.tsx`

### Purpose
Create MULTIPLE parallel treatment scenarios for shared decision making.

### Data Structure
```typescript
interface BehandeloptieItem {
  id: string;                           // Auto-generated
  optieNaam: string;                    // REQUIRED
  beschrijving: string;                 // REQUIRED
  welkeElementenVerwijderd: string;     // Optional, e.g., "11, 12, 13"
  welkeElementenBehouden: string;       // Optional, e.g., "14, 15, 16"
  tijdelijkeVoorziening: 'geen' | 'tijdelijke_prothese' | 'noodbrug' | 'tijdelijke_kroon' | '';  // REQUIRED
  geschatteDuur: string;                // Optional, e.g., "3-6 maanden"
  geschatteKostenIndicatie: string;     // Optional, e.g., "€2000-€3000"
}

interface BehandeloptiesValue {
  opties: BehandeloptieItem[];
}
```

### Features
- **Minimum:** 1 optie vereist
- **Maximum:** Onbeperkt aantal opties
- Collapsible cards per optie
- "Add optie" button in header
- Completion tracking per optie
- Individual delete buttons (min 1 blijft behouden)

### UI Patterns
- Collapsed state: Shows optie naam and completion badge
- Expanded state: Full form with all fields
- Orange border for incomplete options
- Numbered badges: "Optie 1", "Optie 2", etc.

---

## Step 4: Besluitvorming

**File:** `src/components/clinidoc/BesluitvormingPanel.tsx`

### Purpose
Document shared decision making, AI advice, and clinician judgment.

### Data Structure
```typescript
interface BesluitvormingValue {
  voorkeurPatientOptieId?: string;     // Optional: Patient's preferred option
  adviesAI?: string;                   // Optional: AI-generated advice
  oordeelBehandelaar: string;          // REQUIRED: Clinician's judgment
  gekozenRichtingOptieId?: string;     // Optional: Final chosen option (may remain open)
}
```

### Features

#### Patient Preference (Optional)
- Dropdown populated from behandelopties
- Default: "Geen voorkeur geuit"

#### AI Advice (Optional)
- "Genereer advies" button
- Clearly labeled as "AI suggestie"
- Blue info box with warning banner
- Warning: "Dit is een AI-suggestie en moet altijd worden geëvalueerd door de behandelend professional"

#### Clinician Judgment (REQUIRED)
- Large textarea (5 rows)
- Professional reasoning and considerations
- Risks and benefits as discussed with patient
- **Medico-legal traceability requirement**

#### Final Decision (OPTIONAL)
- Dropdown: "Besluit nog niet genomen" (default)
- Can remain open for follow-up consultation
- Multiple options may stay viable

### Important Rules
1. **Definitief besluit is NIET verplicht** - Options can remain open
2. **Behandelaar oordeel is WEL verplicht** - Always required for documentation
3. AI advice is supplementary, not binding

---

## Integration in IntegraleQuickscanForm

### Location
**File:** `src/components/clinidoc/IntegraleQuickscanForm.tsx`

### Conditional Rendering
```tsx
{zorgdoelenZorgwens.zorgdoelen?.behandelstrategieType === 'temporiseerde_afbouw' && (
  <>
    {/* STEP 1: Element Prognose Matrix */}
    <div className="bg-white rounded-[12px] border border-gray-200 shadow-premium p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-[14px] font-bold">
          1
        </div>
        <h4 className="text-[16px] font-semibold text-gray-900">
          Element Prognose Matrix
        </h4>
      </div>
      <ElementPrognoseMatrix ... />
    </div>

    {/* STEP 2: Doel van Temporisatie */}
    ...

    {/* STEP 3: Behandelopties */}
    ...

    {/* STEP 4: Besluitvorming */}
    ...
  </>
)}
```

### State Management
```typescript
const [elementPrognose, setElementPrognose] = useState<ElementPrognoseRow[]>([]);
const [temporisatieDoel, setTemporisatieDoel] = useState<TemporisatieDoelValue>({ doelen: [], toelichting: '' });
const [behandelopties, setBehandelopties] = useState<BehandeloptiesValue>({ opties: [] });
const [besluitvorming, setBesluitvorming] = useState<BesluitvormingValue>({ oordeelBehandelaar: '' });
```

### Auto-save Integration
All 4 steps are included in the auto-save payload:

```typescript
const payload = {
  ...values,
  _computed: advies,
  elementSchema: elementSchema.length > 0 ? elementSchema : undefined,
  zorgdoelenZorgwens: Object.keys(zorgdoelenZorgwens).length > 0 ? zorgdoelenZorgwens : undefined,
  elementPrognose: elementPrognose.length > 0 ? elementPrognose : undefined,
  temporisatieDoel: temporisatieDoel.doelen.length > 0 || temporisatieDoel.toelichting ? temporisatieDoel : undefined,
  behandelopties: behandelopties.opties.length > 0 ? behandelopties : undefined,
  besluitvorming: besluitvorming.oordeelBehandelaar ? besluitvorming : undefined,
};
```

---

## Clinical Use Case Flow

### Example Scenario: 58-year-old with periodontal disease

#### Step 1: Element Assessment
Dentist assesses all 32 elements:
- Elements 11-13: `prognose: 'slecht'`, `beslissing: 'extraheren'`, `timing: 'kort_termijn'`
- Elements 14-18: `prognose: 'twijfelachtig'`, `beslissing: 'tijdelijk_behouden'`, `timing: 'middellang'`
- Elements 21-28: `prognose: 'goed'`, `beslissing: 'behouden'`
- Lower jaw: Mixed assessment

#### Step 2: Temporization Goals
Selected goals:
- ✓ Pijnreductie
- ✓ Infectiecontrole
- ✓ Voorbereiding prothetiek

Rationale:
"Patiënt heeft acute infectie in bovenfront. We temporiseren om infectie te behandelen en de zachte weefsels te laten genezen voor optimale prothetische uitkomst."

#### Step 3: Treatment Options
**Optie 1: Conservatieve aanpak**
- Naam: "Stapsgewijze extractie met tijdelijke prothese"
- Beschrijving: "Eerst 11-13 extraheren, infectie behandelen, dan na 3 maanden evalueren"
- Elementen verwijderd: "11, 12, 13"
- Tijdelijke voorziening: "tijdelijke_prothese"
- Geschatte duur: "6-9 maanden"
- Kosten: "€3500-€4500"

**Optie 2: Versnelde extractie**
- Naam: "Directe extractie bovenfront met immediate prothese"
- Beschrijving: "Alle bovenfront direct extraheren en immediate prothese plaatsen"
- Elementen verwijderd: "11, 12, 13, 14, 15"
- Tijdelijke voorziening: "tijdelijke_prothese"
- Geschatte duur: "4-6 maanden"
- Kosten: "€4500-€5500"

#### Step 4: Decision Making
- Patient preference: **Optie 1** (stapsgewijs, minder ingrijpend)
- AI advice: "Op basis van de acute infectie en patiënt voorkeur wordt Optie 1 aanbevolen..."
- Clinician judgment: "Gezien de acute infectie en angst van patiënt voor uitgebreide ingreep, kies ik voor gefaseerde aanpak. Dit geeft weefsels tijd om te genezen en patiënt kan wennen aan prothese..."
- Final decision: **Optie 1 gekozen**

---

## Database Persistence

All data is saved in `encounter_drafts` table as JSONB:

```sql
SELECT
  id,
  encounter_id,
  patient_id,
  payload->'elementPrognose' as element_assessment,
  payload->'temporisatieDoel' as temporization_goals,
  payload->'behandelopties' as treatment_options,
  payload->'besluitvorming' as decision_making,
  updated_at
FROM encounter_drafts
WHERE encounter_id = 'integrale_quickscan'
  AND patient_id = ?;
```

---

## Validation & Completion Rules

### Per Step
1. **ElementPrognoseMatrix**: Prognose + Beslissing required per element (32 total)
2. **TemporisatieDoel**: Min 1 doel + Toelichting required
3. **Behandelopties**: Min 1 optie, each with Naam + Beschrijving + Tijdelijke voorziening
4. **Besluitvorming**: Oordeel behandelaar required, rest optional

### Overall Workflow
- Steps shown ONLY when `behandelstrategieType === 'temporiseerde_afbouw'`
- All steps are visible simultaneously (no wizard/stepper)
- Incomplete sections show orange warnings but don't block saving
- Document generation can proceed with warnings (controlled elsewhere)

---

## UX Features

### Visual Hierarchy
- Numbered step badges (1-4) with blue background
- Clear section headers with icons
- Consistent card styling with shadow-premium
- Orange highlighting for incomplete fields

### Auto-save Behavior
- 600ms debounce per component
- "Opslaan..." indicator during save
- "Opgeslagen" confirmation after success
- Global draft ID tracking

### Mobile Responsiveness
- ElementPrognoseMatrix: Collapsible quadrants on mobile
- BehandeloptiesPanel: Full-width cards stack vertically
- All inputs adjust to available width
- Touch-friendly button sizes

---

## Future Enhancements

### Potential Additions
1. **AI Element Assessment** - Pre-fill based on Status Praesens data
2. **Cost Calculator Integration** - Real-time cost updates per option
3. **Visual Treatment Timeline** - Gantt-style view of phases
4. **Option Comparison Matrix** - Side-by-side comparison table
5. **Patient Portal Integration** - Share options for at-home review
6. **Template Library** - Pre-configured options for common scenarios

---

## Related Files

### Components
- `src/components/clinidoc/ElementPrognoseMatrix.tsx`
- `src/components/clinidoc/TemporisatieDoelPanel.tsx`
- `src/components/clinidoc/BehandeloptiesPanel.tsx`
- `src/components/clinidoc/BesluitvormingPanel.tsx`
- `src/components/clinidoc/IntegraleQuickscanForm.tsx`

### Core Logic
- `src/utils/intelligentCareEngine.ts` - Zorgrichting computation
- `src/services/clinidocEncounterService.ts` - Draft persistence

### Related Docs
- `ZORGDOELEN_ZORGWENS_SYSTEM_README.md` - Zorgdoelen system
- `CLINIDOC_CONDITIONAL_FLOW_IMPLEMENTATION.md` - Conditional flow architecture

---

**Implementation Date:** 2025-12-21
**Status:** ✅ Complete and production-ready
