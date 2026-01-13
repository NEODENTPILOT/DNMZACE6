# 🧠 ASSIST STAP 6: Diagnose Synoniemenbank

## 📋 Overzicht

De diagnose synoniemenbank is een uitbreidbaar systeem dat AI-gegenereerde diagnostische teksten (Nederlands en Engels) automatisch koppelt aan gestructureerde diagnose-codes uit de behandelplan templates database.

### Doel
AI-teksten zoals:
- **"dry socket"** → `DXCHI001-AE` (Alveolitis na extractie)
- **"post-operative socket infection"** → `DXCHI001-AE`
- **"zenuwontsteking"** → `DXEND001-PA` (Pulpitis acuta)
- **"acute pulpitis"** → `DXEND001-PA`

---

## 🏗️ Architectuur

### Database Schema

**Tabel: `diagnosis_synonyms`**

| Kolom | Type | Beschrijving |
|-------|------|--------------|
| `id` | uuid | Primary key |
| `template_diagnosis_code` | text | Link naar `behandelplan_templates.diagnose_code_base` (bijv. DXCHI001-AE) |
| `language` | text | Taal: `'nl'` of `'en'` |
| `synonym` | text | De synoniemtekst |
| `priority` | integer | Matching prioriteit (1=hoogste, 3=laagste) |
| `is_active` | boolean | Aan/uit toggle |
| `created_at` | timestamptz | Aanmaakdatum |
| `updated_at` | timestamptz | Laatste wijziging |

**Constraints:**
- Uniek per combinatie: `(template_diagnosis_code, language, synonym)`
- `language` moet `'nl'` of `'en'` zijn
- `priority` moet tussen 1-3 zijn

**Indexen:**
- `idx_diagnosis_synonyms_code` - Snelle lookup per diagnose code
- `idx_diagnosis_synonyms_synonym` - Text matching op synonym
- `idx_diagnosis_synonyms_language` - Filter op taal

---

## 🔄 Matching Flow

De `DiagnosisMatchingService` volgt deze matching strategie (in volgorde):

```
1. EXACT MATCH (1.0)
   ↓ geen match
2. DATABASE SYNONYM - Exact (0.9)
   ↓ geen match
3. DATABASE SYNONYM - Partial (0.85)
   ↓ geen match
4. FALLBACK SYNONYM - Hardcoded (0.85)
   ↓ geen match
5. FUZZY MATCH - Levenshtein (0.6-0.99)
   ↓ geen match
6. NO MATCH (0.0)
```

### Confidence Levels

| Match Type | Confidence | Beschrijving |
|------------|-----------|--------------|
| Exact | 1.0 | Exacte match met template naam |
| Synonym-DB Exact | 0.9 | Exacte match met database synonym |
| Synonym-DB Partial | 0.85 | Gedeeltelijke match (contains) |
| Synonym-Fallback | 0.85 | Hardcoded fallback synonym |
| Fuzzy | 0.6-0.99 | Levenshtein distance similarity |
| None | 0.0 | Geen match gevonden |

---

## 📚 Huidige Synoniemen (92 totaal, 10 diagnoses)

### DXCHI001-AE: Alveolitis na extractie
**Nederlands (7):**
- alveolitis
- alveolitis na extractie
- postoperatieve alveolitis
- droge socket
- socket infectie
- alveolitis sicca
- post-extractie infectie

**Engels (6):**
- dry socket
- alveolar osteitis
- post-operative alveolitis
- socket infection
- post-extraction socket infection
- alveolitis sicca dolorosa

---

### DXCHI004-GV: Geïmpacteerde verstandskies
**Nederlands (5):**
- geïmpacteerde verstandskies
- verstandskies vast
- impactie verstandskies
- ingesloten verstandskies
- verstandskies extractie

**Engels (4):**
- impacted wisdom tooth
- impacted third molar
- wisdom tooth impaction
- impacted molar

---

### DXEND001-PA: Pulpitis acuta
**Nederlands (6):**
- pulpitis acuta
- acute pulpitis
- zenuwontsteking
- pulpaontsteking
- irreversibele pulpitis
- tandzenuw ontsteking

**Engels (4):**
- acute pulpitis
- irreversible pulpitis
- pulp inflammation
- symptomatic pulpitis

---

### DXEND002-ADA: Tandabces
**Nederlands (6):**
- tandabces
- acute dento-alveolair abces
- periapicaal abces
- abces tand
- dentoalveolair abces
- zwelling tand

**Engels (5):**
- dental abscess
- tooth abscess
- acute dentoalveolar abscess
- periapical abscess
- apical abscess

---

### DXEND003-NC: Necrose (pulpa)
**Nederlands (5):**
- necrose
- pulpanecrose
- dode tand
- afgestorven tand
- niet-vitale tand

**Engels (4):**
- pulp necrosis
- necrotic pulp
- non-vital tooth
- dead tooth

---

### DXREST001-DC: Diepe cariës
**Nederlands (6):**
- diepe cariës
- diepe caries
- groot gaatje
- ernstige cariës
- tandbederf
- caviteit

**Engels (4):**
- deep caries
- deep cavity
- extensive caries
- deep dental decay

---

### DXPARO001-PC: Parodontitis (chronisch)
**Nederlands (6):**
- parodontitis
- chronische parodontitis
- tandvleesziekte
- paro
- parodontale aandoening
- periodontitis

**Engels (4):**
- periodontitis
- chronic periodontitis
- periodontal disease
- gum disease

---

### DXIMPL001-MI: Ontbrekende tanden
**Nederlands (6):**
- ontbrekende tand
- ontbrekende tanden
- missing tooth
- edentaat
- gap
- implantatie indicatie

**Engels (5):**
- missing tooth
- missing teeth
- edentulous
- tooth gap
- implant indication

---

## 🔧 API & Gebruik

### TypeScript Interface

```typescript
interface DiagnosisSynonym {
  id: string;
  template_diagnosis_code: string;
  language: 'nl' | 'en';
  synonym: string;
  priority: number;
  is_active: boolean;
}

interface DiagnosisMatch {
  template: DiagnosisTemplate | null;
  confidence: number;
  matchedOn: 'exact' | 'fuzzy' | 'synonym-db' | 'synonym-fallback' | 'none';
  matchedSynonym?: string;
  language?: 'nl' | 'en';
}
```

### Service Usage

```typescript
import { diagnosisMatchingService } from '@/services/diagnosisMatchingService';

// Enkele match
const match = await diagnosisMatchingService.matchDiagnosis("dry socket");

if (match.template && match.confidence >= 0.7) {
  console.log(`Gevonden: ${match.template.naam}`);
  console.log(`Code: ${match.template.diagnose_code_base}`);
  console.log(`Confidence: ${match.confidence}`);
  console.log(`Via: ${match.matchedOn}`);
  if (match.matchedSynonym) {
    console.log(`Synonym: ${match.matchedSynonym} (${match.language})`);
  }
}

// Meerdere diagnoses
const aiDiagnoses = ["dry socket", "pulpitis", "deep cavity"];
const matches = await diagnosisMatchingService.matchMultipleDiagnoses(aiDiagnoses);
```

### AI Suggestion Generator

```typescript
const suggestion = await diagnosisMatchingService.generateAISuggestion(
  "dry socket",
  "AI detected post-extraction complication"
);

// Returns: AIDiagnosisSuggestion
{
  template_id: "uuid...",
  template_diagnosis_code: "DXCHI001-AE",
  category_code: "CHI",
  acronym: "AE",
  name: "Alveolitis na extractie",
  confidence: 0.9,
  explanation: "AI detected post-extraction complication"
}
```

---

## ➕ Synoniemen Toevoegen

### Optie 1: Direct SQL (Snelst)

```sql
INSERT INTO diagnosis_synonyms
  (template_diagnosis_code, language, synonym, priority)
VALUES
  ('DXCHI001-AE', 'nl', 'nieuwe nederlandse term', 2),
  ('DXCHI001-AE', 'en', 'new english term', 2);
```

### Optie 2: Nieuwe Migratie

```sql
-- supabase/migrations/YYYYMMDD_add_custom_synonyms.sql

/*
  # Add custom diagnosis synonyms

  Nieuwe synoniemen voor [diagnose naam]
*/

INSERT INTO diagnosis_synonyms
  (template_diagnosis_code, language, synonym, priority)
VALUES
  ('DXCODE', 'nl', 'synoniem', 2);
```

### Optie 3: Via TypeScript

```typescript
import { supabase } from '@/lib/supabase';
import { diagnosisMatchingService } from '@/services/diagnosisMatchingService';

const { data, error } = await supabase
  .from('diagnosis_synonyms')
  .insert([
    {
      template_diagnosis_code: 'DXCHI001-AE',
      language: 'nl',
      synonym: 'nieuwe term',
      priority: 2
    }
  ]);

// Clear cache zodat nieuwe synoniemen direct werken
diagnosisMatchingService.clearCache();
```

---

## 🐛 Development Logging

In development mode (`import.meta.env.DEV`), logt het systeem alle matching operaties:

```
[DiagnosisMatching] Matching input: "dry socket"
[DiagnosisMatching] Normalized: "dry socket"
[DiagnosisMatching] ✓ SYNONYM-DB match: "dry socket" → DXCHI001-AE via "dry socket" (en), confidence: 0.9

[DiagnosisMatching] Matching input: "Pulpitis acuta"
[DiagnosisMatching] Normalized: "pulpitis acuta"
[DiagnosisMatching] ✓ EXACT match: "Pulpitis acuta" → DXEND001-PA (Pulpitis acuta)

[DiagnosisMatching] Matching input: "alveolit"
[DiagnosisMatching] Normalized: "alveolit"
[DiagnosisMatching] ✓ FUZZY match: "alveolit" → DXCHI001-AE (Alveolitis na extractie), confidence: 0.85

[DiagnosisMatching] Matching input: "unknown diagnosis xyz"
[DiagnosisMatching] Normalized: "unknown diagnosis xyz"
[DiagnosisMatching] ✗ NO match found for: "unknown diagnosis xyz"
```

**Logging is automatisch uitgeschakeld in productie.**

---

## 🎯 Prioriteit Richtlijnen

Bij het toevoegen van synoniemen:

| Priority | Wanneer gebruiken | Voorbeeld |
|----------|------------------|-----------|
| **1** | Primaire medische term, officiële naam | "pulpitis acuta", "dry socket" |
| **2** | Veelvoorkomende synoniemen, straattaal | "zenuwontsteking", "gaatje", "paro" |
| **3** | Zeldzame/verouderde termen, zeer specifiek | "alveolitis sicca dolorosa", "endo nodig" |

**Tip:** Begin altijd met priority 2, pas later aan op basis van matching prestaties.

---

## 📊 Cache Strategie

De service cached beide:
- Templates (behandelplan_templates)
- Synoniemen (diagnosis_synonyms)

**Cache TTL:** 5 minuten

**Cache clearen:**
```typescript
diagnosisMatchingService.clearCache();
```

Cache wordt automatisch vernieuwd na TTL expiratie.

---

## ✅ Test Scenarios

### Test 1: Exacte Database Synonym Match
```typescript
const match = await diagnosisMatchingService.matchDiagnosis("dry socket");
// Verwacht: confidence = 0.9, matchedOn = 'synonym-db', code = DXCHI001-AE
```

### Test 2: Partial Match
```typescript
const match = await diagnosisMatchingService.matchDiagnosis("socket infectie na extractie");
// Verwacht: confidence = 0.85, matchedOn = 'synonym-db'
```

### Test 3: Exact Template Match (overruled DB)
```typescript
const match = await diagnosisMatchingService.matchDiagnosis("Alveolitis na extractie");
// Verwacht: confidence = 1.0, matchedOn = 'exact'
```

### Test 4: Fuzzy Fallback
```typescript
const match = await diagnosisMatchingService.matchDiagnosis("alveolit");
// Verwacht: confidence >= 0.6, matchedOn = 'fuzzy'
```

### Test 5: Engels + Nederlands
```typescript
const match1 = await diagnosisMatchingService.matchDiagnosis("dry socket");
const match2 = await diagnosisMatchingService.matchDiagnosis("droge socket");
// Beide verwacht: code = DXCHI001-AE
```

---

## 🔐 Security (RLS)

**Read:**
- Alle authenticated users kunnen active synoniemen lezen

**Write:**
- Alleen admins (`rol IN ('admin', 'super_admin')`) kunnen synoniemen aanmaken/wijzigen

---

## 🚀 Toekomstige Uitbreidingen

1. **Admin UI voor synoniemenbeheer**
   - CRUD interface voor synoniemen
   - Bulk import van CSV/JSON
   - Preview van matching resultaten

2. **AI-leersysteem**
   - Log onbekende termen die geen match hebben
   - Suggesties voor nieuwe synoniemen
   - Automatische prioriteit aanpassing

3. **Multi-taal uitbreiding**
   - Duits (`de`)
   - Frans (`fr`)
   - Spaans (`es`)

4. **Contextuele synoniemen**
   - Per specialisme/categorie
   - Regiospecifieke termen

5. **Versioning**
   - Track wijzigingen in synoniemen
   - Rollback functionaliteit

---

## 📈 Statistieken

**Huidige status (2025-12-10):**
- ✅ 92 actieve synoniemen
- ✅ 10 diagnose-codes ondersteund
- ✅ 2 talen (NL/EN)
- ✅ Database-backed systeem
- ✅ Dev-mode logging
- ✅ Caching (5 min TTL)
- ✅ Fallback naar hardcoded synoniemen

---

## 🛠️ Onderhoud

### Nieuwe Diagnose Toevoegen

1. Controleer of de diagnose bestaat in `behandelplan_templates` met een `diagnose_code_base`
2. Voeg Nederlandse synoniemen toe (minimaal 3-5)
3. Voeg Engelse synoniemen toe (minimaal 2-4)
4. Test met `diagnosisMatchingService.matchDiagnosis()`
5. Clear cache: `diagnosisMatchingService.clearCache()`

### Synoniem Deactiveren

```sql
UPDATE diagnosis_synonyms
SET is_active = false
WHERE synonym = 'oude term';
```

### Bulk Check

```sql
-- Toon alle synoniemen voor een diagnose
SELECT language, synonym, priority, is_active
FROM diagnosis_synonyms
WHERE template_diagnosis_code = 'DXCHI001-AE'
ORDER BY priority, language;

-- Toon alle diagnoses met aantal synoniemen
SELECT
  template_diagnosis_code,
  COUNT(*) as synonym_count,
  COUNT(CASE WHEN language = 'nl' THEN 1 END) as nl_count,
  COUNT(CASE WHEN language = 'en' THEN 1 END) as en_count
FROM diagnosis_synonyms
WHERE is_active = true
GROUP BY template_diagnosis_code
ORDER BY synonym_count DESC;
```

---

## ✨ Conclusie

De diagnose synoniemenbank is een flexibel, onderhoudbaar systeem dat:
- ✅ AI-teksten automatisch koppelt aan gestructureerde codes
- ✅ Nederlands en Engels ondersteunt
- ✅ Eenvoudig uitbreidbaar is (SQL/TypeScript/UI)
- ✅ Development logging biedt voor debugging
- ✅ Production-ready is met RLS security

Het systeem werkt als fundament voor intelligente diagnose-herkenning in alle AI-gestuurde workflows.

---

**Laatste update:** 2025-12-10
**Status:** ✅ Productie-ready
**Migraties:**
- `create_diagnosis_synonyms_system.sql`
- `seed_diagnosis_synonyms_initial_data.sql` (indien nodig)
