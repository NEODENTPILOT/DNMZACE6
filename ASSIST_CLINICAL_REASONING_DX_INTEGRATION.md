# Clinical Reasoning → Diagnose Code Integratie

**Datum:** 2025-12-10
**Status:** ✅ Geïmplementeerd
**Versie:** 1.0

---

## 📋 Overzicht

Clinical Reasoning is succesvol gekoppeld aan het nieuwe diagnosecode systeem. De integratie ondersteunt:

- **Template diagnoses** (bijv. `DXCHI001-ALPO`)
- **Patiëntspecifieke diagnoses** (bijv. `DXCHI001-ALPO-00001P`)
- **AI-gedreven template matching**
- **Confidence-based suggesties**
- **Automatische code generatie**

---

## 🔄 Datamodel Integratie

### Nieuw Diagnose Model

```typescript
interface DiagnosisInfo {
  template_id?: string | null;          // UUID van ICE Template
  diagnosis_code?: string | null;       // Template code: DXCHI001-ALPO
  patient_diagnosis_code?: string | null; // Patient code: DXCHI001-ALPO-00001P
  name: string;                         // Diagnose naam
  category?: string | null;             // Categorie (bijv. "Chirurgie")
}
```

### AI Suggestie Model

```typescript
interface AIDiagnosisSuggestion {
  template_id: string | null;
  template_diagnosis_code: string | null;
  patient_diagnosis_code?: string | null;
  category_code: string | null;         // CHI, END, RES, etc.
  acronym: string | null;               // ALPO, ENDO, etc.
  name: string;
  confidence: number;                   // 0–1 score
  explanation?: string;                 // AI reasoning
}
```

### Backwards Compatibiliteit

De `ReasoningCheckInput` ondersteunt nu **beide formaten**:

```typescript
interface ReasoningCheckInput {
  behandelplan_id: string;
  diagnose: string | DiagnosisInfo;           // ✅ Backwards compatible
  bijkomende_diagnoses?: (string | DiagnosisInfo)[];
  // ... rest van de velden
}
```

---

## 🧠 Diagnose Matching Service

### Kern Functionaliteit

**Bestand:** `src/services/diagnosisMatchingService.ts`

De `DiagnosisMatchingService` biedt:

1. **Template Loading** - Laadt actieve ICE Templates met cache (5 min TTL)
2. **Text Matching** - Fuzzy matching met Levenshtein distance
3. **Synonym Support** - Extensible synoniemenlijst
4. **Confidence Scoring** - 0-1 score op basis van match kwaliteit

### Matching Algoritme

```typescript
async matchDiagnosis(aiText: string): Promise<DiagnosisMatch>
```

**Match Types:**
- **Exact** - 1.0 confidence (perfecte naam match)
- **Synonym** - 0.85 confidence (via synoniemenlijst)
- **Fuzzy** - 0.6-0.99 confidence (Levenshtein similarity)
- **None** - 0 confidence (geen match)

### Voorbeelden

```typescript
// Voorbeeld 1: Exact match
await diagnosisMatchingService.matchDiagnosis("Alveolitis na extractie");
// → template: DXCHI001-ALPO, confidence: 1.0

// Voorbeeld 2: Synonym
await diagnosisMatchingService.matchDiagnosis("dry socket");
// → template: DXCHI001-ALPO, confidence: 0.85

// Voorbeeld 3: Fuzzy
await diagnosisMatchingService.matchDiagnosis("alveolitis extractie");
// → template: DXCHI001-ALPO, confidence: ~0.75

// Voorbeeld 4: Geen match
await diagnosisMatchingService.matchDiagnosis("onbekende diagnose xyz");
// → template: null, confidence: 0
```

### Synoniemen Extensie

De service bevat een uitbreidbare synoniemenlijst:

```typescript
const SYNONYMS: Record<string, string[]> = {
  'alveolitis': ['dry socket', 'socket infection', 'alveolitis sicca'],
  'pulpitis': ['tandvleesontsteking', 'pulpanecrose', 'zenuwontsteking'],
  'parodontitis': ['tandvleesziekte', 'paro', 'parodontale aandoening'],
  // ... meer synoniemen
};
```

**Uitbreiden:**
Voeg nieuwe synoniemen toe aan dit object om matching te verbeteren.

---

## 🎯 Clinical Reasoning Engine Update

### Aangepaste Functies

**Bestand:** `src/services/clinicalReasoningEngine.ts`

Nieuwe helper functies voor backwards compatibility:

```typescript
private getDiagnosisName(diagnosis: string | DiagnosisInfo): string {
  if (typeof diagnosis === 'string') return diagnosis;
  return diagnosis.name;
}

private getDiagnosisCategory(diagnosis: string | DiagnosisInfo): string | null {
  if (typeof diagnosis === 'string') return null;
  return diagnosis.category || null;
}
```

### Check Methods

Alle check methods zijn bijgewerkt om met beide formaten te werken:

- `checkDiagnoseProcessgebieden()` - Gebruikt `getDiagnosisName()`
- `checkKaakScope()` - Gebruikt `getDiagnosisName()`
- Alle andere checks werken transparant met beide formaten

**Geen breaking changes** - Bestaande code blijft werken!

---

## 🎨 AI Diagnosis Suggestion UI

### Component: AIDiagnosisSuggestionCard

**Bestand:** `src/components/AIDiagnosisSuggestion.tsx`

**Features:**
- 🎨 Modern gradient design (purple/pink)
- 📊 Visuele confidence indicator
- 🏷️ Diagnosecode badge (monospace)
- 🔘 Actie knoppen: Accepteren, Aanpassen, Negeren
- ⚡ Automatische patient diagnosis code generatie

**Props:**
```typescript
interface AIDiagnosisSuggestionProps {
  suggestion: AISuggestion;
  patientId: string;
  zorgplanId?: string | null;
  behandelplanId?: string | null;
  onAccept: (patientDiagnosisCode: string) => void;
  onReject: () => void;
  onEdit?: () => void;
}
```

### Component: AIDiagnosisSuggestionsList

Wrapper component voor meerdere suggesties:

```typescript
<AIDiagnosisSuggestionsList
  suggestions={aiSuggestions}
  patientId={patientId}
  zorgplanId={zorgplanId}
  onAccept={(suggestion, code) => {
    // Handle accepted diagnosis
  }}
  onReject={(suggestion) => {
    // Handle rejected diagnosis
  }}
/>
```

### Confidence Visuele Feedback

| Confidence | Label | Kleur | Badge |
|------------|-------|-------|-------|
| ≥ 0.9 | Zeer hoog | Groen | `bg-green-100 text-green-600` |
| ≥ 0.7 | Hoog | Blauw | `bg-blue-100 text-blue-600` |
| ≥ 0.5 | Gemiddeld | Oranje | `bg-amber-100 text-amber-600` |
| < 0.5 | Laag | Rood | `bg-red-100 text-red-600` |

---

## 🔄 Integratie Workflow

### 1. AI Genereert Diagnose (als tekst)

```typescript
// AI output: "Dry socket na extractie element 36"
const aiDiagnosisText = "dry socket";
```

### 2. Match met ICE Template

```typescript
import { diagnosisMatchingService } from './services/diagnosisMatchingService';

const match = await diagnosisMatchingService.matchDiagnosis(aiDiagnosisText);

if (match.confidence >= 0.6) {
  console.log(`Match found: ${match.template?.diagnose_code_base}`);
  // → "DXCHI001-ALPO"
}
```

### 3. Genereer AI Suggestie

```typescript
const suggestion = await diagnosisMatchingService.generateAISuggestion(
  aiDiagnosisText,
  "AI gedetecteerde post-extractie complicatie"
);

// suggestion = {
//   template_id: "uuid-...",
//   template_diagnosis_code: "DXCHI001-ALPO",
//   category_code: "CHI",
//   acronym: "ALPO",
//   name: "Alveolitis na extractie",
//   confidence: 0.85,
//   explanation: "AI gedetecteerde post-extractie complicatie"
// }
```

### 4. Toon in UI (Care Hub)

```tsx
import { AIDiagnosisSuggestionCard } from './components/AIDiagnosisSuggestion';

<AIDiagnosisSuggestionCard
  suggestion={suggestion}
  patientId={patientId}
  zorgplanId={zorgplanId}
  onAccept={async (patientCode) => {
    console.log(`Accepted: ${patientCode}`);
    // → "DXCHI001-ALPO-00001P"

    // Refresh diagnoses list
    await loadDiagnoses();
  }}
  onReject={() => {
    // Remove suggestion from view
  }}
/>
```

### 5. Accepteren → Database Record

Bij klikken op "Accepteren":

```typescript
const result = await diagnosisMatchingService.createPatientDiagnosis(
  patientId,
  templateId,
  zorgplanId,
  behandelplanId,
  notities
);

// Roept database functie aan: generate_patient_diagnose_code()
// Genereert: DXCHI001-ALPO-00001P
// Slaat op in: patient_diagnoses tabel
```

---

## ✅ Test Cases

### Test 1: AI Herkent Diagnose → Template Match

**Input:**
```typescript
AI output: "Dry socket"
ICE Templates: "Alveolitis na extractie" (DXCHI001-ALPO)
```

**Verwacht:**
```typescript
{
  template_id: "uuid-alpo",
  template_diagnosis_code: "DXCHI001-ALPO",
  confidence: 0.85,
  matchedOn: "synonym"
}
```

**Status:** ✅ Getest en werkend

---

### Test 2: Diagnose Accepteren in Care Hub

**Stappen:**
1. AI genereert suggestie
2. Gebruiker klikt "Accepteren"
3. Patiënt diagnosecode wordt aangemaakt

**Verwacht:**
```typescript
patient_diagnosis_code: "DXCHI001-ALPO-00001P"
status: "actief"
```

**Status:** ✅ Getest en werkend

---

### Test 3: Diagnose Verschijnt in Zorgplan

**Stappen:**
1. Diagnose geaccepteerd en gekoppeld aan zorgplan
2. Navigeer naar ZorgplanDetailV3
3. Diagnoses lijst toont volledige code

**Verwacht:**
- Code: `DXCHI001-ALPO-00001P`
- Naam: "Alveolitis na extractie"
- Categorie badge: "Chirurgie"
- Tooltip met code uitleg

**Status:** ✅ DiagnosesPanel component klaar

---

### Test 4: Clinical Reasoning Geen Errors

**Stappen:**
1. Voer Clinical Reasoning checks uit met nieuwe DiagnosisInfo
2. Check console voor errors
3. Verifieer backwards compatibility met oude string format

**Verwacht:**
- ✅ Geen null-pointer errors
- ✅ Geen diagnosis_code errors
- ✅ Beide formaten werken

**Status:** ✅ Backwards compatible

---

## 🚫 Niet Geïmplementeerd (Volgens Requirements)

De volgende modules zijn **NIET** aangepast (zoals gevraagd):

- ❌ **Begrotingen 3.0 logica** - Geen wijzigingen
- ❌ **Interventie-engine** - Geen wijzigingen
- ❌ **Verrichtingen 2.0** - Geen wijzigingen
- ❌ **Oude CASE modules** - Niet meer gebruikt

---

## 📝 Gebruik Voorbeelden

### Voorbeeld 1: Simpel Gebruik in Component

```tsx
import { diagnosisMatchingService } from './services/diagnosisMatchingService';
import { AIDiagnosisSuggestionsList } from './components/AIDiagnosisSuggestion';

function MyComponent({ patientId }: { patientId: string }) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);

  // AI genereert diagnose tekst
  const aiDiagnoses = ["dry socket", "parodontitis", "caries element 36"];

  // Match met templates
  useEffect(() => {
    async function matchDiagnoses() {
      const matches = await Promise.all(
        aiDiagnoses.map(text =>
          diagnosisMatchingService.generateAISuggestion(text)
        )
      );
      setSuggestions(matches.filter(m => m.confidence >= 0.5));
    }
    matchDiagnoses();
  }, []);

  return (
    <AIDiagnosisSuggestionsList
      suggestions={suggestions}
      patientId={patientId}
      onAccept={(suggestion, code) => {
        console.log(`Accepted: ${code}`);
      }}
      onReject={(suggestion) => {
        console.log(`Rejected: ${suggestion.name}`);
      }}
    />
  );
}
```

### Voorbeeld 2: Met Clinical Reasoning

```tsx
import { ClinicalReasoningEngine } from './services/clinicalReasoningEngine';
import { DiagnosisInfo } from './types/reasoning';

async function runReasoningWithDiagnosis() {
  const engine = new ClinicalReasoningEngine();

  // Nieuwe manier: met DiagnosisInfo
  const diagnosisInfo: DiagnosisInfo = {
    template_id: "uuid-...",
    diagnosis_code: "DXCHI001-ALPO",
    name: "Alveolitis na extractie",
    category: "Chirurgie"
  };

  const result = await engine.runAllChecks({
    behandelplan_id: "tx-123",
    diagnose: diagnosisInfo,  // ✅ Nieuwe format
    bijkomende_diagnoses: [
      "parodontitis",         // ✅ Oude format (string) blijft werken
      {
        template_id: "uuid-...",
        diagnosis_code: "DXPAR002-PARO",
        name: "Parodontitis",
        category: "Parodontologie"
      }
    ],
    // ... rest
  });

  console.log(result.warnings);
}
```

---

## 🔧 Configuratie & Uitbreiding

### Synoniemen Toevoegen

**Bestand:** `src/services/diagnosisMatchingService.ts`

```typescript
const SYNONYMS: Record<string, string[]> = {
  // ... bestaande synoniemen
  'nieuwe-diagnose': ['synoniem1', 'synoniem2', 'synoniem3'],
};
```

### Cache TTL Aanpassen

```typescript
const CACHE_TTL = 10 * 60 * 1000; // 10 minuten (standaard: 5 min)
```

### Confidence Drempelwaarde

Pas aan in je code waar je `matchDiagnosis()` aanroept:

```typescript
const match = await diagnosisMatchingService.matchDiagnosis(text);

if (match.confidence >= 0.7) {  // Verhoog van 0.6 naar 0.7 voor strengere matching
  // Use match
}
```

---

## 🚀 Volgende Stappen (Suggesties)

1. **Synoniemen Uitbreiden**
   - Voeg meer tandheelkundige termen toe
   - Ondersteun meerdere talen

2. **Machine Learning Integration**
   - Train model op historische diagnoses
   - Verbeter confidence scoring met ML

3. **Template Suggesties Bij Geen Match**
   - Toon top 3 mogelijke matches bij lage confidence
   - Gebruiker kan handmatig juiste template kiezen

4. **Diagnose Feedback Loop**
   - Log acceptaties/rejecties
   - Gebruik voor synoniemen training

5. **Bulk Diagnose Import**
   - Importeer externe diagnose lijsten
   - Automatisch matchen en valideren

---

## ⚠️ Known Limitations

1. **Synoniemen Lijst Beperkt**
   - Huidige lijst bevat ~50 termen
   - Uitbreiding nodig voor vollere coverage

2. **Geen Multi-Language Support**
   - Alleen Nederlandse + enkele Engelse termen
   - Geen automatische vertaling

3. **Fuzzy Matching Basis**
   - Gebruikt simpel Levenshtein
   - Geen geavanceerde NLP

4. **Cache Invalidatie**
   - Cache wordt niet automatisch ge-invalideerd bij template updates
   - Workaround: `diagnosisMatchingService.clearCache()`

5. **Geen Template Voorstellen Bij Lage Confidence**
   - Bij confidence < 0.5 wordt geen alternatief voorgesteld
   - Gebruiker moet handmatig zoeken

---

## 📚 Gerelateerde Documentatie

- [TAXONOMY.md](./TAXONOMY.md) - ICE Template Structuur
- [AI_IMPLEMENTATION_SUMMARY.md](./AI_IMPLEMENTATION_SUMMARY.md) - AI Integratie Overzicht
- [ASSIST_DIAGNOSE_ACRONYM_RULES.md](./ASSIST_DIAGNOSE_ACRONYM_RULES.md) - Diagnosecode Regels

---

## ✅ Conclusie

**Status: Productie-ready**

Clinical Reasoning is succesvol geïntegreerd met het nieuwe diagnosecode systeem:

- ✅ AI → Template matching werkt
- ✅ Confidence-based suggesties
- ✅ Automatische patient diagnosis code generatie
- ✅ Backwards compatible met oude code
- ✅ Moderne UI met visuele feedback
- ✅ Geen breaking changes in bestaande modules

De implementatie volgt alle requirements uit de prompt en is klaar voor gebruik in productie.
