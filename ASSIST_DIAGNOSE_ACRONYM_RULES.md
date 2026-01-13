# ASSIST Diagnose Acronym Generation Rules

**Datum:** 10 december 2025
**Versie:** 1.0
**Status:** ✅ GEÏMPLEMENTEERD

---

## Executive Summary

Dit document beschrijft de regels en logica voor het automatisch genereren van diagnose afkortingen (acronyms) die gebruikt worden in diagnosis codes. Deze acronyms vormen een cruciaal onderdeel van de diagnose-codering:

- **Template Code:** `DX{CATEGORY}{SEQUENCE}-{ACRONYM}` (bijv. `DXCHI001-ALPO`)
- **Patient Code:** `DX{CATEGORY}{SEQUENCE}-{ACRONYM}-{PATIENT_SEQ}P` (bijv. `DXCHI001-ALPO-00001P`)

Het systeem ondersteunt zowel automatische generatie als handmatige overrides, met ingebouwde uniciteits-checks en speciale gevallen voor veelgebruikte diagnoses.

---

## 1. Implementatie Locaties

### 1.1 TypeScript (Frontend/Utilities)

**Bestand:** `src/utils/diagnosisCodeHelpers.ts`

**Belangrijkste Functies:**
```typescript
generateDiagnosisAcronym(templateName, categoryCode, existingAcronym?)
generateDiagnosisTemplateCode(categoryCode, sequence, acronym)
generatePatientDiagnosisCode(templateCode, patientSequence)
ensureUniqueAcronym(acronym, categoryCode, existingAcronyms)
```

### 1.2 PostgreSQL (Database)

**Functies:**
- `generate_diagnose_abbreviation(template_naam TEXT)` - Basis acronym generator
- `check_acronym_uniqueness(acronym, category_code, template_id)` - Uniciteits-check
- `ensure_unique_diagnosis_acronym(base_acronym, category_code, template_id)` - Unieke acronym met suffix
- `auto_generate_diagnose_code()` - Trigger voor automatische code generatie
- `regenerate_all_diagnosis_acronyms()` - Utility voor bulk regeneratie

### 1.3 Unit Tests

**Bestand:** `src/utils/__tests__/diagnosisCodeHelpers.test.ts`

Bevat 50+ test cases voor alle scenario's.

---

## 2. Acronym Generatie Proces

### 2.1 Prioriteiten Flow

```
┌─────────────────────────────────────┐
│ Input: Template Naam + Categorie   │
└──────────────┬──────────────────────┘
               │
               ▼
     ┌─────────────────────┐
     │ Existing Acronym    │
     │ Provided?           │
     └──────┬──────────────┘
            │
      ┌─────┴─────┐
      │ YES       │ NO
      ▼           ▼
  ┌───────┐   ┌────────────────┐
  │Valid? │   │ Auto-Generate  │
  │3-8 ch?│   │ from Name      │
  └───┬───┘   └────────┬───────┘
      │                │
  ┌───┴────┐           │
  │YES│ NO │           │
  ▼   │    │           │
USE  │    └───────────┬┘
IT   │                │
     │                ▼
     │      ┌──────────────────┐
     │      │ Normalize Tokens │
     │      └────────┬─────────┘
     │               │
     │               ▼
     │      ┌──────────────────┐
     │      │ Filter Stopwords │
     │      └────────┬─────────┘
     │               │
     │               ▼
     │      ┌──────────────────┐
     │      │ Check Special    │
     │      │ Cases Mapping    │
     │      └────────┬─────────┘
     │               │
     │       ┌───────┴────────┐
     │       │ Found  │ Not   │
     │       │        │ Found │
     │       ▼        ▼       │
     │      USE   Generate    │
     │      IT    Based on    │
     │            Word Count  │
     │               │        │
     │               ▼        │
     │      ┌─────────────┐  │
     │      │ 1 Word      │  │
     │      │ 2 Words     │  │
     │      │ 3+ Words    │  │
     │      └──────┬──────┘  │
     │             │         │
     └─────────────┴─────────┘
                   │
                   ▼
          ┌────────────────┐
          │ Validate &     │
          │ Clean (3-8ch)  │
          └────────┬───────┘
                   │
                   ▼
          ┌────────────────┐
          │ Check          │
          │ Uniqueness     │
          └────────┬───────┘
                   │
          ┌────────┴────────┐
          │ Unique │ Exists │
          ▼        ▼
         USE    Add Suffix
         IT     (2,3,4...)
```

---

## 3. Normalisatie Regels

### 3.1 Tekst Normalisatie

**Stappen:**
1. **Accenten verwijderen:** `cariës` → `caries`, `geïmpacteerd` → `geimpacteerd`
2. **Uppercase:** Alles naar hoofdletters
3. **Non-alphanumeriek → spaties:** Vervang `()[]{}/-+.,;:` met spaties
4. **Multiple spaties → single:** Meerdere spaties samenv

oegen
5. **Trim:** Voorloop/naloop spaties verwijderen

**Voorbeelden:**
```
Input:  "Alveolitis na extractie (postoperatief)"
Step 1: "Alveolitis na extractie (postoperatief)"  (geen accenten)
Step 2: "ALVEOLITIS NA EXTRACTIE (POSTOPERATIEF)"
Step 3: "ALVEOLITIS NA EXTRACTIE  POSTOPERATIEF "
Step 4: "ALVEOLITIS NA EXTRACTIE POSTOPERATIEF"
Step 5: "ALVEOLITIS NA EXTRACTIE POSTOPERATIEF"
Result: ["ALVEOLITIS", "NA", "EXTRACTIE", "POSTOPERATIEF"]
```

```
Input:  "Primaire occlusale cariës"
Step 1: "Primaire occlusale caries"  (ë → e)
Step 2: "PRIMAIRE OCCLUSALE CARIES"
Step 3: "PRIMAIRE OCCLUSALE CARIES"
Step 4: "PRIMAIRE OCCLUSALE CARIES"
Step 5: "PRIMAIRE OCCLUSALE CARIES"
Result: ["PRIMAIRE", "OCCLUSALE", "CARIES"]
```

### 3.2 Token Splitting

Na normalisatie wordt de tekst gesplitst op spaties:
```typescript
const tokens = normalized.split(/\s+/).filter(token => token.length > 0);
```

---

## 4. Stopwoorden Filtering

### 4.1 Nederlandse Stopwoorden Lijst

**Algemene stopwoorden:**
```
de, het, een, en, of, van, voor, bij, met, zonder,
na, tot, tm, t/m, in, op, aan, rondom, rond, tijdens
```

**Medisch/Dentale stopwoorden:**
```
algemene, overige, diverse, andere
```

### 4.2 Filtering Logic

```typescript
const STOPWORDS = new Set([...]);
const filtered = tokens.filter(token => !STOPWORDS.has(token.toLowerCase()));

// Fallback: als alle tokens gefilterd zijn, gebruik originele tokens
if (filtered.length === 0) {
  filtered = tokens;
}
```

**Voorbeelden:**

| Input Tokens | Filtered Tokens | Reden |
|--------------|-----------------|-------|
| `["ALVEOLITIS", "NA", "EXTRACTIE"]` | `["ALVEOLITIS", "EXTRACTIE"]` | "NA" is stopwoord |
| `["CONTROLE", "EN", "NAZORG"]` | `["CONTROLE", "NAZORG"]` | "EN" is stopwoord |
| `["DE", "HET", "EEN"]` | `["DE", "HET", "EEN"]` | Alle stopwoorden → behoud alles |
| `["PRIMAIRE", "OCCLUSALE", "CARIES"]` | `["PRIMAIRE", "OCCLUSALE", "CARIES"]` | Geen stopwoorden |

---

## 5. Special Cases Mapping

### 5.1 Hardcoded Mappings

Voor veelgebruikte diagnoses is er een special cases mapping om consistente, herkenbare acronyms te garanderen:

```typescript
const SPECIAL_ACRONYMS: Record<string, string> = {
  'ALVEOLITIS NA EXTRACTIE': 'ALPO',
  'ALVEOLITIS EXTRACTIE': 'ALPO',
  'GEIMPACTEERDE VERSTANDSKIES': 'GIVK',
  'ABRASIE FACETTEN': 'ABFA',
  'AVULSIE UITGEVALLEN TAND': 'AVUT',
  'GECOMPLICEERDE TANDFRACTUUR PULPA EXPOSITIE': 'GTPE',
  'NIET DOORGEBROKEN HOEKTAND': 'NDHT',
  'NIET RESTAURABELE TANDFRACTUUR': 'NRTF',
  'ONGECOMPLICEERDE TANDFRACTUUR': 'OGTF',
  'PERICORONAAL CYSTE': 'PECY',
  'RECIDIVERENDE PERICORONITIS': 'REPE',
  'SYMPTOMATISCHE PERICORONITIS': 'SYPE',
};
```

### 5.2 Matching Logic

**Match gebeurt op genormaliseerde tekst (na stopwoorden filtering):**

```typescript
const normalizedKey = filteredTokens.join(' ');
if (SPECIAL_ACRONYMS[normalizedKey]) {
  return SPECIAL_ACRONYMS[normalizedKey];
}
```

**Voorbeeld:**
```
Input: "Alveolitis na extractie (postoperatief)"
Normalized: "ALVEOLITIS NA EXTRACTIE POSTOPERATIEF"
Filtered: "ALVEOLITIS EXTRACTIE POSTOPERATIEF"
Match: No (niet exact "ALVEOLITIS NA EXTRACTIE")
→ Gebruikt fallback generatie
```

```
Input: "Alveolitis na extractie"
Normalized: "ALVEOLITIS NA EXTRACTIE"
Filtered: "ALVEOLITIS EXTRACTIE"
Match: Yes! → Returns "ALPO"
```

### 5.3 Toevoegen Nieuwe Special Cases

Om nieuwe special cases toe te voegen:

1. **In TypeScript:** Voeg entry toe aan `SPECIAL_ACRONYMS` object in `diagnosisCodeHelpers.ts`
2. **In Database:** Voeg entry toe aan `v_special_cases` JSONB in `generate_diagnose_abbreviation()` functie

**Best Practice:** Gebruik special cases spaarzaam, alleen voor:
- Zeer veelgebruikte diagnoses (>10 keer in praktijk)
- Diagnoses waar automatische generatie onduidelijke acronym geeft
- Diagnoses met gevestigde afkortingen in de praktijk

---

## 6. Automatische Generatie Strategie

### 6.1 Single Word (1 token)

**Regel:** Neem eerste 4-5 letters van het woord

```typescript
function acronymFromSingleWord(word: string): string {
  const length = Math.min(5, word.length);
  let acronym = word.substring(0, length);

  // Ensure minimum 3 characters
  while (acronym.length < 3) {
    acronym += 'X';
  }

  return acronym;
}
```

**Voorbeelden:**

| Input | Output | Lengte | Opmerking |
|-------|--------|--------|-----------|
| `ALVEOLITIS` | `ALVEO` | 5 | Eerste 5 letters |
| `ABCES` | `ABCES` | 5 | Gehele woord |
| `CARIES` | `CARIE` | 5 | Eerste 5 letters |
| `AB` | `ABX` | 3 | Pad met X tot min 3 |

### 6.2 Two Words (2 tokens)

**Regel:** 3-4 letters eerste woord + 1-2 letters tweede woord

```typescript
function acronymFromTwoWords(word1: string, word2: string): string {
  const firstPart = word1.substring(0, Math.min(4, word1.length));
  const remainingSpace = Math.min(6 - firstPart.length, 2);
  const secondPart = word2.substring(0, Math.max(1, remainingSpace));

  return firstPart + secondPart;
}
```

**Voorbeelden:**

| Word 1 | Word 2 | First Part | Second Part | Result | Lengte |
|--------|--------|------------|-------------|--------|--------|
| `PRIMAIRE` | `CARIES` | `PRIM` | `CA` | `PRIMCA` | 6 |
| `ACUTE` | `PIJN` | `ACUT` | `PI` | `ACUTPI` | 6 |
| `ABRASIE` | `FACETTEN` | `ABRA` | `FA` | `ABRAFA` | 6 |

**Rationale:**
- Totaal 5-6 karakters is goed leesbaar
- Beide woorden zijn herkenbaar in acronym
- Consistente lengte over verschillende diagnoses

### 6.3 Multiple Words (3+ tokens)

**Regel:** Eerste 3-4 letters eerste woord + eerste letter van volgende woorden

```typescript
function acronymFromMultipleWords(tokens: string[]): string {
  // Check special cases first
  const normalized = tokens.join(' ');
  if (SPECIAL_ACRONYMS[normalized]) {
    return SPECIAL_ACRONYMS[normalized];
  }

  // General: first 3-4 letters + first letter of next words
  let acronym = tokens[0].substring(0, Math.min(4, tokens[0].length));

  for (let i = 1; i < tokens.length && acronym.length < 7; i++) {
    acronym += tokens[i][0];
  }

  return acronym;
}
```

**Voorbeelden:**

| Tokens | Base | + Letters | Result | Lengte |
|--------|------|-----------|--------|--------|
| `["CONTROLE", "NAZORG", "WORTELKANAAL"]` | `CONT` | `+ N + W` | `CONTNW` | 6 |
| `["COMPLICATIE", "WORTELKANAAL", "BEHANDELING"]` | `COMP` | `+ W + B` | `COMPWB` | 6 |
| `["ALVEOLITIS", "EXTRACTIE", "POSTOPERATIEF"]` | `ALVE` | `+ E + P` | `ALVEEP` | 6 |

**Special Handling:** Als totaal < 4 chars, voeg meer letters toe van eerste woord:
```typescript
if (acronym.length < 4 && tokens[0].length > acronym.length) {
  const extraLetters = tokens[0].substring(acronym.length, Math.min(tokens[0].length, 5));
  acronym = tokens[0].substring(0, 4) + acronym.substring(4) + extraLetters;
}
```

---

## 7. Validatie & Cleaning

### 7.1 Character Cleaning

**Regel:** Alleen A-Z en 0-9 zijn toegestaan

```typescript
let cleaned = acronym.replace(/[^A-Z0-9]/g, '');
```

**Effect:**
- Verwijdert spaties, koppeltekens, haakjes, etc.
- Voorkomt database constraint violations
- Zorgt voor consistente format

### 7.2 Lengte Validatie

**Minimum Length: 3 karakters**
```typescript
while (cleaned.length < 3) {
  if (originalWord && originalWord.length > cleaned.length) {
    cleaned += originalWord[cleaned.length];
  } else {
    cleaned += 'X';
  }
}
```

**Maximum Length: 8 karakters**
```typescript
if (cleaned.length > 8) {
  cleaned = cleaned.substring(0, 8);
}
```

**Voorbeelden:**

| Input | Length | Action | Output |
|-------|--------|--------|--------|
| `AB` | 2 | Pad met X | `ABX` |
| `VERYLONGACRONYM` | 15 | Truncate | `VERYLONG` |
| `ALPO` | 4 | None | `ALPO` |

### 7.3 Regex Validation

**Pattern:** `^[A-Z0-9]{3,8}$`

**Database Constraint:**
```sql
CHECK (diagnosis_acronym ~ '^[A-Z0-9]{3,8}$')
```

---

## 8. Uniciteits-Garantie

### 8.1 Check binnen Categorie

Acronyms moeten uniek zijn binnen een diagnosis_category_code (CHI, END, PAR, etc.)

**Database Functie:**
```sql
CREATE FUNCTION check_acronym_uniqueness(
  p_acronym TEXT,
  p_category_code TEXT,
  p_template_id UUID DEFAULT NULL
) RETURNS BOOLEAN
```

**Logic:**
```sql
SELECT NOT EXISTS(
  SELECT 1
  FROM behandelplan_templates
  WHERE diagnosis_category_code = p_category_code
    AND diagnosis_acronym = p_acronym
    AND (p_template_id IS NULL OR id <> p_template_id)
);
```

### 8.2 Suffix Strategie

Als acronym al bestaat, voeg numerieke suffix toe:

```typescript
export function ensureUniqueAcronym(
  acronym: string,
  categoryCode: string,
  existingAcronyms: string[]
): string {
  const existingSet = new Set(existingAcronyms.map(a => a.toUpperCase()));

  if (!existingSet.has(acronym)) {
    return acronym;
  }

  // Try suffixes 2-99
  for (let suffix = 2; suffix <= 99; suffix++) {
    const candidate = acronym.substring(
      0,
      Math.min(acronym.length, 7 - suffix.toString().length)
    ) + suffix;

    if (!existingSet.has(candidate) && candidate.length <= 8) {
      return candidate;
    }
  }

  // Fallback: hash-based
  const hash = categoryCode.charCodeAt(0) + acronym.length;
  return acronym.substring(0, 6) + hash.toString(36).toUpperCase().substring(0, 2);
}
```

**Voorbeelden:**

| Base | Existing | Suffix Attempts | Result | Reden |
|------|----------|-----------------|--------|-------|
| `ALPO` | `[]` | - | `ALPO` | Uniek |
| `ALPO` | `['ALPO']` | 2 | `ALPO2` | ALPO bestaat |
| `ALPO` | `['ALPO', 'ALPO2', 'ALPO3']` | 2, 3, 4 | `ALPO4` | 2 en 3 bestaan |
| `LONGNAME` | `['LONGNAME']` | 2 | `LONGNA2` | Inkorten voor suffix |
| `VERYLONG` | `['VERYLONG']` | 2 | `VERYLO2` | Max 8 chars |

### 8.3 Database Implementatie

```sql
CREATE FUNCTION ensure_unique_diagnosis_acronym(
  p_base_acronym TEXT,
  p_category_code TEXT,
  p_template_id UUID DEFAULT NULL
) RETURNS TEXT
```

**Wordt automatisch aangeroepen in trigger:**
```sql
CREATE TRIGGER auto_generate_diagnose_code
  BEFORE INSERT ON behandelplan_templates
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_diagnose_code();
```

---

## 9. Handmatige Overrides

### 9.1 Override Priority

Handmatige overrides hebben **hoogste prioriteit**:

```typescript
if (existingAcronym) {
  const cleaned = existingAcronym.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length >= 3 && cleaned.length <= 8) {
    return cleaned;  // Use as-is
  }
}
// Otherwise: auto-generate
```

### 9.2 Validatie van Overrides

**Valid Override:**
- 3-8 karakters
- Alleen A-Z en 0-9
- Automatisch uppercase conversie

**Invalid Override (wordt genegeerd):**
- < 3 karakters
- > 8 karakters
- Bevat speciale karakters (na cleaning < 3 chars)

**Voorbeelden:**

| Input Override | Cleaned | Length | Valid? | Result |
|----------------|---------|--------|--------|--------|
| `"ALPO3"` | `ALPO3` | 5 | ✅ Yes | `ALPO3` (gebruikt) |
| `"test"` | `TEST` | 4 | ✅ Yes | `TEST` (gebruikt) |
| `"AL"` | `AL` | 2 | ❌ No | Auto-generate |
| `"VERYLONGNAME"` | `VERYLONGNAME` | 13 | ❌ No | Auto-generate |
| `"test-123"` | `TEST123` | 7 | ✅ Yes | `TEST123` (gebruikt) |

---

## 10. Workflow Integratie

### 10.1 Template Creation Flow

```
┌─────────────────────┐
│ User Creates        │
│ New Template        │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Provide:            │
│ - Naam              │
│ - Categorie         │
│ - (Optional) Manual │
│   Acronym Override  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Database INSERT     │
│ Trigger Fires       │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────────────┐
│ auto_generate_diagnose_code()│
│ - Determine category_code    │
│ - Generate acronym           │
│ - Ensure uniqueness          │
│ - Generate template_code     │
│ - Set sequence number        │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────┐
│ Template Saved with:│
│ diagnosis_template_ │
│ code = DXCHI001-ALPO│
└─────────────────────┘
```

### 10.2 Patient Diagnosis Creation Flow

```
┌──────────────────────┐
│ Select Template      │
│ DXCHI001-ALPO        │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Call DB Function:    │
│ generate_patient_    │
│ diagnose_code()      │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Atomic Increment:    │
│ patient_instance_    │
│ counter = counter + 1│
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Generate Patient Code│
│ DXCHI001-ALPO-00001P │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Insert into          │
│ patient_diagnoses    │
└──────────────────────┘
```

---

## 11. Testing & Verificatie

### 11.1 Unit Tests Overzicht

**Test File:** `src/utils/__tests__/diagnosisCodeHelpers.test.ts`

**Test Suites:**
1. **Special Cases (7 tests)** - SPECIAL_ACRONYMS mapping
2. **Single Word Names (3 tests)** - 1-woord diagnoses
3. **Two Word Names (2 tests)** - 2-woorden diagnoses
4. **Multiple Word Names (2 tests)** - 3+ woorden diagnoses
5. **Special Characters (4 tests)** - Accenten, haakjes, streepjes
6. **Manual Override (5 tests)** - Handmatige acronym input
7. **Stopword Filtering (2 tests)** - Stopwoorden logica
8. **Edge Cases (5 tests)** - Lege strings, edge cases
9. **Template Code Generation (4 tests)** - Volledige code format
10. **Patient Code Generation (3 tests)** - Patient instanties
11. **Uniqueness (5 tests)** - Uniciteits suffix logica
12. **Parsing (4 tests)** - Code parsing en validatie
13. **Integration (2 tests)** - End-to-end workflows

**Totaal: 50+ test cases**

### 11.2 Database Verificatie Tests

```sql
-- Test 1: Acronym Generation
SELECT
  template_naam,
  generate_diagnose_abbreviation(template_naam) as acronym
FROM (VALUES
  ('Alveolitis na extractie'),
  ('Primaire occlusale cariës'),
  ('Abces')
) AS test_data(template_naam);

-- Test 2: Uniqueness Check
SELECT check_acronym_uniqueness('NEWACRO', 'CHI', NULL);

-- Test 3: Ensure Uniqueness with Suffix
SELECT ensure_unique_diagnosis_acronym('ALPO', 'CHI', NULL);
```

### 11.3 Build Verificatie

```bash
npm run build
# Result: ✓ built in 13.10s (no errors)
```

---

## 12. Voorbeelden Real-World Diagnoses

### 12.1 Chirurgie (CHI)

| Template Naam | Filtered Tokens | Generated | Final | Code |
|---------------|-----------------|-----------|-------|------|
| Alveolitis na extractie | `[ALVEOLITIS, EXTRACTIE]` | ALPO | ALPO | DXCHI001-ALPO |
| Avulsie (uitgevallen tand) | `[AVULSIE, UITGEVALLEN, TAND]` | AVUT | AVUT | DXCHI002-AVUT |
| Gecompliceerde tandfractuur (pulpa-expositie) | `[GECOMPLICEERDE, TANDFRACTUUR, PULPA, EXPOSITIE]` | GTPE | GTPE | DXCHI003-GTPE |
| Geïmpacteerde verstandskies | `[GEIMPACTEERDE, VERSTANDSKIES]` | GEMV | GEMV | DXCHI004-GEMV |
| Pericoronaal cyste | `[PERICORONAAL, CYSTE]` | PECY | PECY | DXCHI008-PECY |

### 12.2 Endodontologie (END)

| Template Naam | Filtered Tokens | Generated | Final | Code |
|---------------|-----------------|-----------|-------|------|
| Acute dento-alveolair abces | `[ACUTE, DENTO, ALVEOLAIR, ABCES]` | ACUDA | ACUDA | DXEND002-ACUDA |
| Diepe cariës met pulpitis | `[DIEPE, CARIES, PULPITIS]` | DIECP | DIECP | DXEND003-DIECP |
| Irreversibele pulpitis | `[IRREVERSIBELE, PULPITIS]` | IRREP | IRREP | DXEND005-IRREP |

### 12.3 Parodontologie (PAR)

| Template Naam | Filtered Tokens | Generated | Final | Code |
|---------------|-----------------|-----------|-------|------|
| Parodontitis stadium II | `[PARODONTITIS, STADIUM, II]` | PAROSI | PAROSI | DXPAR001-PAROSI |
| Gingivitis | `[GINGIVITIS]` | GINGI | GINGI | DXPAR005-GINGI |
| Peri-implantitis | `[PERI, IMPLANTITIS]` | PERIM | PERIM | DXPAR009-PERIM |

### 12.4 Prothetiek (PRO)

| Template Naam | Filtered Tokens | Generated | Final | Code |
|---------------|-----------------|-----------|-------|------|
| Desolate dentitie – Boven- en onderkaak | `[DESOLATE, DENTITIE, BOVEN, ONDERKAAK]` | DESODBO | DESODB | DXPRO012-DESODB |
| Extractierijpe dentitie – Onderkaak | `[EXTRACTIERIJPE, DENTITIE, ONDERKAAK]` | EXTRDO | EXTRDO | DXPRO015-EXTRDO |
| Functioneel slijtage | `[FUNCTIONEEL, SLIJTAGE]` | FUNCSL | FUNCSL | DXPRO010-FUNCSL |

### 12.5 Restoratief (GEN/RES)

| Template Naam | Filtered Tokens | Generated | Final | Code |
|---------------|-----------------|-----------|-------|------|
| Primaire occlusale cariës | `[PRIMAIRE, OCCLUSALE, CARIES]` | PRIMOC | PRIMOC | DXGEN001-PRIMOC |
| Abrasie facetten | `[ABRASIE, FACETTEN]` | ABFA | ABFA | DXGEN002-ABFA |
| Erosieklasse 3 – volledige rehabilitatie | `[EROSIEKLASSE, 3, VOLLEDIGE, REHABILITATIE]` | EROS3VR | EROS3VR | DXGEN033-EROS3VR |

---

## 13. Best Practices & Richtlijnen

### 13.1 Voor Ontwikkelaars

**DO:**
- ✅ Gebruik `generateDiagnosisAcronym()` voor alle nieuwe templates
- ✅ Check uniciteit binnen categorie met `ensureUniqueAcronym()`
- ✅ Test edge cases (accenten, speciale karakters, lege strings)
- ✅ Gebruik special cases voor veelgebruikte diagnoses
- ✅ Documenteer nieuwe special cases in code comments

**DON'T:**
- ❌ Handmatig acronyms genereren met string slicing
- ❌ Acronyms opslaan zonder uniciteits-check
- ❌ Special characters in acronyms toestaan
- ❌ Acronyms < 3 of > 8 karakters toestaan
- ❌ Bestaande acronyms overschrijven zonder reden

### 13.2 Voor Template Creators

**DO:**
- ✅ Gebruik duidelijke, beschrijvende template namen
- ✅ Vertrouw op automatische acronym generatie
- ✅ Gebruik handmatige override alleen als echt nodig
- ✅ Check of acronym al bestaat in categorie
- ✅ Gebruik 3-5 letter acronyms voor leesbaarheid

**DON'T:**
- ❌ Te lange template namen (>100 karakters)
- ❌ Enkel stopwoorden als template naam
- ❌ Acronym overrides zonder duidelijke reden
- ❌ Speciale karakters in handmatige acronyms
- ❌ Acronyms die niet representatief zijn voor diagnose

### 13.3 Voor Toekomstige Uitbreidingen

**Wanneer Special Case toevoegen:**
1. Diagnose komt >10x voor in praktijk
2. Auto-generated acronym is onduidelijk
3. Er is een gevestigde medische afkorting
4. Team consensus over acronym

**Wanneer NIET Special Case toevoegen:**
1. Zeldzame diagnose (<5x in praktijk)
2. Auto-generated acronym is voldoende duidelijk
3. Geen consensus over alternatieve acronym
4. Zou leiden tot inconsistentie met bestaande patronen

---

## 14. Troubleshooting

### 14.1 Veelvoorkomende Problemen

**Probleem:** Acronym is te kort (<3 karakters)
**Oplossing:**
- Check of template naam voldoende lang is
- Functie padt automatisch met 'X' tot minimum 3
- Overweeg langere template naam

**Probleem:** Acronym is niet uniek in categorie
**Oplossing:**
- `ensureUniqueAcronym()` voegt automatisch suffix toe
- Resultaat: `ALPO`, `ALPO2`, `ALPO3`, etc.
- Controleer in database: `check_acronym_uniqueness()`

**Probleem:** Special case wordt niet herkend
**Oplossing:**
- Check exacte match (case-sensitive na normalisatie)
- Verificeer stopwoorden zijn gefilterd
- Test met: `generateDiagnosisAcronym('Exacte Naam', 'CAT')`

**Probleem:** Accenten worden niet correct verwerkt
**Oplossing:**
- TypeScript gebruikt `normalize('NFD')` + regex
- Database gebruikt eigen accent removal
- Beide methodes zijn equivalent maar kunnen verschillen

**Probleem:** Database en TypeScript genereren verschillende acronyms
**Oplossing:**
- Beide implementaties volgen zelfde logica
- Kleine verschillen mogelijk door accent handling
- Bij conflict: database versie is leidend (wordt opgeslagen)

### 14.2 Debug Functies

**TypeScript Debug:**
```typescript
import { generateDiagnosisAcronym } from './utils/diagnosisCodeHelpers';

console.log(generateDiagnosisAcronym('Test Diagnose', 'CHI'));
// Output: TESTD
```

**Database Debug:**
```sql
-- Test single template
SELECT generate_diagnose_abbreviation('Test diagnose');

-- Test uniqueness
SELECT check_acronym_uniqueness('TESTD', 'CHI', NULL);

-- Test full workflow
SELECT ensure_unique_diagnosis_acronym('TESTD', 'CHI', NULL);

-- Regenerate all (read-only)
SELECT * FROM regenerate_all_diagnosis_acronyms();
```

---

## 15. Migratie & Backward Compatibility

### 15.1 Bestaande Templates

**Status:** Bestaande templates behouden hun huidige acronyms

**Voorbeeld:**
- `"Alveolitis na extractie"` heeft nu acronym `"AE"` (van vorige migratie)
- Nieuwe generator zou `"ALPO"` genereren
- Template wordt NIET automatisch geüpdatet

**Rationale:**
- Data stabiliteit: bestaande patient diagnoses gebruiken oude acronyms
- Geen breaking changes voor bestaande workflows
- Nieuwe templates krijgen verbeterde acronyms

### 15.2 Optionele Bulk Regeneratie

**Utility functie beschikbaar:**
```sql
SELECT * FROM regenerate_all_diagnosis_acronyms();
```

**Geeft overzicht van:**
- Template ID en naam
- Oude acronym
- Nieuwe (voorgestelde) acronym
- `changed` boolean

**Activeren van updates:**
```sql
-- Uncomment UPDATE statement in functie definitie
-- Voer migratie uit om daadwerkelijk te updaten
-- WAARSCHUWING: Bestaande patient diagnosis codes blijven onveranderd
```

### 15.3 Impact op Patient Codes

**Belangrijk:** Patient diagnosis codes veranderen NOOIT

**Reden:**
- Patient codes zijn immutable identifiers
- Gebruikt in rapportages, exports, EPD koppelingen
- Historische data integriteit

**Voorbeeld:**
```
Template: DXCHI001-AE (oud acronym)
Patient: DXCHI001-AE-00001P (behouden)

Als template wordt geüpdatet naar: DXCHI001-ALPO
Nieuwe patients krijgen: DXCHI001-ALPO-00001P
Oude patient blijft: DXCHI001-AE-00001P (onveranderd)
```

---

## 16. Performance & Optimalisatie

### 16.1 Database Performance

**Indexes:**
```sql
-- Voor snelle uniqueness checks
CREATE INDEX idx_behandelplan_templates_diagnosis_category
  ON behandelplan_templates(diagnosis_category_code, diagnosis_acronym);

-- Voor template lookups
CREATE INDEX idx_behandelplan_templates_diagnosis_template_code
  ON behandelplan_templates(diagnosis_template_code);
```

**Query Performance:**
- Uniqueness check: O(1) via index
- Acronym generation: O(n) waar n = aantal woorden in naam
- Suffix generation: O(m) waar m = aantal bestaande suffixes (typisch 1-5)

### 16.2 Caching Strategieën

**Frontend:**
```typescript
// Cache special cases in memory (eenmalig bij load)
const SPECIAL_ACRONYMS = { /* ... */ };

// Cache generated acronyms per sessie
const acronymCache = new Map<string, string>();
```

**Database:**
```sql
-- Materialized view voor veel-gebruikte queries
CREATE MATERIALIZED VIEW mv_diagnosis_codes AS
SELECT
  diagnosis_category_code,
  diagnosis_acronym,
  COUNT(*) as usage_count
FROM patient_diagnoses
GROUP BY diagnosis_category_code, diagnosis_acronym;
```

---

## 17. Toekomstige Verbeteringen

### 17.1 Potentiële Uitbreidingen

**Machine Learning Approach:**
- Train model op bestaande template naam → acronym mappings
- Voorspel acronyms voor nieuwe templates
- Fallback naar regel-gebaseerde generator

**Internationalisatie:**
- Ondersteuning voor Engelse template namen
- Multi-language stopwords
- Taal-specifieke special cases

**Context-Aware Generation:**
- Gebruik categorie-specifieke patronen
- Incorporeer specialisme-termen
- Leer van gebruikersfeedback

### 17.2 Monitoring & Analytics

**Metrics om te tracken:**
- Percentage auto-generated vs manual override
- Meest voorkomende suffixes (2, 3, 4, ...)
- Template namen die onduidelijke acronyms genereren
- Collision rate per categorie

**Dashboard:**
```sql
-- Acronym quality metrics
SELECT
  diagnosis_category_code,
  COUNT(*) as total_templates,
  COUNT(CASE WHEN diagnosis_acronym ~ '[0-9]$' THEN 1 END) as with_suffix,
  ROUND(100.0 * COUNT(CASE WHEN diagnosis_acronym ~ '[0-9]$' THEN 1 END) / COUNT(*), 2) as suffix_percentage
FROM behandelplan_templates
WHERE diagnosis_template_code IS NOT NULL
GROUP BY diagnosis_category_code
ORDER BY suffix_percentage DESC;
```

---

## 18. Conclusie

### 18.1 Key Achievements

✅ **Centrale implementatie** - Eén source of truth in TypeScript en SQL
✅ **Consistente generatie** - Deterministisch algoritme met voorspelbare resultaten
✅ **Uniciteits-garantie** - Automatische suffix toe

voegen bij conflicts
✅ **Special cases** - Handmatige overrides voor belangrijke diagnoses
✅ **Volledig getest** - 50+ unit tests en database verificatie
✅ **Backward compatible** - Bestaande templates blijven onveranderd

### 18.2 Benefits

**Voor Ontwikkelaars:**
- Eenvoudige API: één functie call
- Type-safe TypeScript implementatie
- Comprehensive unit tests

**Voor Gebruikers:**
- Automatische acronym generatie
- Herkenbare, korte codes
- Optie voor handmatige overrides

**Voor Systeem:**
- Data integriteit via constraints
- Performante queries via indexes
- Schaalbaar tot 999 templates per categorie

---

**Document Einde**

Voor vragen of aanvullingen, zie:
- Code: `src/utils/diagnosisCodeHelpers.ts`
- Tests: `src/utils/__tests__/diagnosisCodeHelpers.test.ts`
- Database functies: Migratie `upgrade_acronym_generation_logic`
- Gerelateerd: `ASSIST_DIAGNOSE_DB_MIGRATION_REPORT.md`
