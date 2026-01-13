# QUICKSCAN LOGIC INVENTORY
## Zorghoofdrichtingen Beslislogica - Complete Inventarisatie

**Datum:** 2025-12-21
**Doel:** Inventarisatie van de bestaande ACE+ logica voor zorghoofdrichtingen beslissing

---

## 1. ZORGHOOFDRICHTINGEN (4 TYPES)

De 4 zorgrichtingen zoals gedefinieerd in het systeem:

| Zorgrichting | String waarde | Nederlands Label | Beschrijving |
|--------------|---------------|------------------|--------------|
| **Behoud** | `'behoud'` | Behoud | De huidige situatie is goed en kan behouden blijven met regulier onderhoud |
| **Veiligstellen** | `'veiligstellen'` | Veiligstellen | Er zijn verhoogde risicos. Focus op stabiliseren en beschermen van de huidige situatie |
| **Tijdelijke Afbouw** | `'tijdelijke_afbouw'` | Tijdelijke Afbouw | De situatie is instabiel. Tijdelijke oplossingen zijn nodig als tussenstap naar definitieve behandeling |
| **Afbouw** | `'afbouw'` | Afbouw | Structurele problemen vereisen afbouw en reconstructie voor herstel van functie en comfort |

**Type definitie locatie:** `src/utils/intelligentCareEngine.ts:4`
```typescript
export type Zorgrichting = 'behoud' | 'veiligstellen' | 'tijdelijke_afbouw' | 'afbouw';
```

---

## 2. RISICONIVEAUS (4 TYPES)

| Risiconiveau | String waarde | Label | Kleur classificatie |
|--------------|---------------|-------|---------------------|
| **Laag** | `'laag'` | Laag | Groen (text-green-700 bg-green-100) |
| **Verlaagd** | `'verlaagd'` | Verlaagd | Blauw (text-blue-700 bg-blue-100) |
| **Verhoogd** | `'verhoogd'` | Verhoogd | Oranje (text-orange-700 bg-orange-100) |
| **Hoog** | `'hoog'` | Hoog | Rood (text-red-700 bg-red-100) |

**Type definitie locatie:** `src/utils/intelligentCareEngine.ts:3`
```typescript
export type RisicoNiveau = 'laag' | 'verlaagd' | 'verhoogd' | 'hoog';
```

---

## 3. PROCESGEBIEDEN (9 AREAS)

De 9 procesgebieden voor risico-analyse:

| # | Naam | Beschrijving | Database ID (volgorde) |
|---|------|--------------|------------------------|
| 1 | **Slijmvliezen** | Beoordeling van de oraal-mucosale gezondheid | volgorde: 1 |
| 2 | **Stand/Occlusie/Articulatie** | Beoordeling van de positie, bijtrelatie en kaakgewrichtsfunctie | volgorde: 2 |
| 3 | **Parodontaal** | Beoordeling van de gezondheid van het tandvlees en kaakbot | volgorde: 3 |
| 4 | **Cariologisch** | Beoordeling van cariësrisico en -activiteit | volgorde: 4 |
| 5 | **Slijtage** | Beoordeling van tandenslijtage (attritie, erosie, abrasie) | volgorde: 5 |
| 6 | **Endodontisch** | Beoordeling van de pulpa- en wortelkanaalstatus | volgorde: 6 |
| 7 | **Prothetisch** | Beoordeling van bestaande prothetische voorzieningen | volgorde: 7 |
| 8 | **Restauratief** | Beoordeling van de kwaliteit en prognose van restauraties | volgorde: 8 |
| 9 | **Muskulo-skeletaal** | Beoordeling van spier- en gewrichtsfunctie | volgorde: 9 |

**Database tabel:** `procesgebieden`
**Seeding migration:** `supabase/migrations/20251207142519_seed_procesgebieden_ice_v1_0.sql`

---

## 4. SINGLE SOURCE OF TRUTH: BESLISLOGICA

### 4.1 Hoofdmodule: `src/utils/intelligentCareEngine.ts`

Dit is de **leidende module** voor alle zorgrichtingenbeslissingen.

#### Functie: `berekenZorgrichting()`

**Locatie:** `src/utils/intelligentCareEngine.ts:87-129`

**Input:**
- `risicoAnalyses: RisicoAnalyse[]` - Array met risico per procesgebied

**Output:**
```typescript
interface ZorgrichtingBeslissing {
  zorgrichting: Zorgrichting;
  rationale: string;
  confidence: 'hoog' | 'middel' | 'laag';
}
```

**Beslisboom logica:**

```
STAP 1: Tel risico-niveaus
├─ hoogCount = aantal procesgebieden met 'hoog'
├─ verhoogdCount = aantal procesgebieden met 'verhoogd'
└─ verlaagdCount = aantal procesgebieden met 'verlaagd'

STAP 2: Pas beslisregels toe (in volgorde):

REGEL 1: hoogCount >= 2
├─ Resultaat: 'afbouw'
├─ Rationale: "{hoogCount} procesgebieden met hoog risico gedetecteerd. Afbouw is geïndiceerd om verdere schade te voorkomen."
└─ Confidence: 'hoog'

REGEL 2: hoogCount === 1 && verhoogdCount >= 2
├─ Resultaat: 'tijdelijke_afbouw'
├─ Rationale: "Eén procesgebied met hoog risico en {verhoogdCount} met verhoogd risico. Tijdelijke afbouw voorgesteld."
└─ Confidence: 'middel'

REGEL 3: verhoogdCount >= 2 || (hoogCount === 1 && verhoogdCount >= 1)
├─ Resultaat: 'veiligstellen'
├─ Rationale: "Meerdere procesgebieden met verhoogd risico. Veiligstellen van huidige situatie geadviseerd."
└─ Confidence: 'middel'

REGEL 4: verlaagdCount >= (totaalAantal / 2)
├─ Resultaat: 'behoud'
├─ Rationale: "Meerderheid van procesgebieden met laag of verlaagd risico. Behoud van huidige situatie mogelijk."
└─ Confidence: 'hoog'

DEFAULT: (als geen van bovenstaande matcht)
├─ Resultaat: 'veiligstellen'
├─ Rationale: "Op basis van de risicoanalyse wordt veiligstellen geadviseerd."
└─ Confidence: 'laag'
```

### 4.2 Speciale functie voor Afbouw-diagnoses

**Functie:** `bepaalZorgrichtingVoorAfbouwDiagnose()`
**Locatie:** `src/utils/intelligentCareEngine.ts:131-156`

Deze functie wordt gebruikt voor structurele afbouw-diagnoses:

```
INPUT: diagnoseNaam (string)

LOGICA:
├─ IF diagnoseNaam.includes('desolate dentitie')
│  └─ Return: 'afbouw' (confidence: 'hoog')
│     Rationale: "Desolate dentitie: Situatie vereist volledige reconstructie na extractie van niet-behoudbare elementen."
│
├─ IF diagnoseNaam.includes('extractierijpe dentitie')
│  └─ Return: 'afbouw' (confidence: 'hoog')
│     Rationale: "Extractierijpe dentitie: Preventieve afbouw geïndiceerd om toekomstige problemen te voorkomen."
│
└─ ELSE
   └─ Return: 'afbouw' (confidence: 'middel')
      Rationale: "Structurele afbouw-diagnose gedetecteerd."
```

---

## 5. MAPPING TABEL: INPUT → ZORGRICHTING

### Scenario A: Normale Risicoanalyse (geen structurele afbouw diagnose)

| Hoog | Verhoogd | Verlaagd/Laag | → Zorgrichting | Confidence |
|------|----------|---------------|----------------|------------|
| ≥ 2 | - | - | **Afbouw** | hoog |
| 1 | ≥ 2 | - | **Tijdelijke Afbouw** | middel |
| 1 | 1 | - | **Veiligstellen** | middel |
| 0 | ≥ 2 | - | **Veiligstellen** | middel |
| 0 | 0-1 | ≥ 50% | **Behoud** | hoog |
| Andere | Andere | Andere | **Veiligstellen** (default) | laag |

### Scenario B: Structurele Afbouw Diagnoses (override logic)

| Diagnose Pattern | → Zorgrichting | Confidence |
|------------------|----------------|------------|
| "desolate dentitie" | **Afbouw** | hoog |
| "extractierijpe dentitie" | **Afbouw** | hoog |
| Andere "afbouw_structureel" | **Afbouw** | middel |

**Note:** Deze diagnoses triggeren ALTIJD 'afbouw' ongeacht risico-scores

---

## 6. DATABASE STRUCTUUR

### 6.1 Tabel: `diagnose_templates`

Bevat master lijst van diagnoses met standaard risico-suggesties.

**Relevante kolommen:**
- `naam` (text) - Diagnose naam
- `categorie` (text) - Categorie zoals 'afbouw_structureel', 'cariologisch', etc.
- `default_risico_suggesties` (jsonb) - Key-value pairs: procesgebied → risiconiveau
- `kaak_scope_toepasbaar` (boolean) - Of kaak-scope relevant is

**Voorbeeld data voor "Desolate dentitie - Bovenkaak":**
```json
{
  "Parodontaal": "hoog",
  "Cariologisch": "hoog",
  "Endodontisch": "hoog",
  "Restauratief": "hoog",
  "Prothetisch": "hoog",
  "Slijtage": "verhoogd",
  "Stand/Occlusie/Articulatie": "verhoogd",
  "Slijmvliezen": "verlaagd"
}
```

### 6.2 Tabel: `procesgebieden`

Master lijst van 9 procesgebieden (zie sectie 3).

### 6.3 Tabel: `behandelplan_risico_analyse`

Opslag van risico-analyse per behandelplan:

**Kolommen:**
- `behandelplan_id` (uuid FK)
- `procesgebied_id` (uuid FK)
- `risico_niveau` (text) - 'laag'|'verlaagd'|'verhoogd'|'hoog'
- `ai_suggestie` (text) - Optionele uitleg
- `handmatig_aangepast` (boolean) - Of gebruiker heeft override gedaan
- `toelichting` (text) - Optionele notitie

### 6.4 Tabel: `behandelplannen` (uitbreidingen)

**Zorgrichting velden:**
- `hoofddiagnose` (text) - Hoofddiagnose naam
- `bijkomende_diagnoses` (text[]) - Array van extra diagnoses
- `zorgrichting_ai` (text) - AI-voorgestelde zorgrichting
- `zorgrichting_gekozen` (text) - Definitieve gekozen zorgrichting
- `zorgrichting_override_reason` (text) - Reden bij afwijking van AI-advies
- `patient_keuze` (text) - Keuze van patiënt
- `patient_toelichting` (text) - Toelichting van patiënt
- `sdm_afgerond` (boolean) - Shared Decision Making voltooid
- `patient_uitleg` (text) - Gegenereerde uitleg voor patiënt
- `klinische_uitleg` (text) - Klinisch verslag
- `ice_versie` (text) - Versie van ICE gebruikt

**Check constraints:**
```sql
CHECK (zorgrichting_ai IN ('behoud', 'veiligstellen', 'tijdelijke_afbouw', 'afbouw'))
CHECK (zorgrichting_gekozen IN ('behoud', 'veiligstellen', 'tijdelijke_afbouw', 'afbouw'))
```

---

## 7. GERELATEERDE MODULES

### 7.1 Clinical Reasoning Engine

**Bestand:** `src/services/clinicalReasoningEngine.ts`

**Functie:** Valideert consistentie tussen gekozen zorgrichting en behandelopties.

**Relevante checks:**
- `checkZorgrichtingBehandelopties()` (regel 221-298)
  - Waarschuwt als behandelopties niet passen bij gekozen zorgrichting
  - Voorbeelden:
    - 'behoud' + extracties/implantaten → waarschuwing
    - 'tijdelijke_afbouw' + kronen/bruggen → waarschuwing
    - 'afbouw' + restauratieve behandelingen → info

**Gebruikt NIET voor beslissen van zorgrichting, alleen voor validatie!**

### 7.2 ICE Explanation Generator

**Bestand:** `src/utils/iceExplanationGenerator.ts`

**Functie:** Genereert uitleg teksten voor patiënt en klinisch dossier.

**Functies:**
- `generatePatientUitleg()` - Patiëntvriendelijke uitleg
- `generateKlinischeUitleg()` - Klinisch verslag met rationale
- `generateSDMSummary()` - Shared Decision Making samenvatting

**Gebruikt de zorgrichting, maar bepaalt deze NIET.**

### 7.3 Status Praesens Integration

**Relevante bestanden:**
- Geen directe integratie gevonden met zorghoofdrichtingen logica
- Status Praesens kan WEL input leveren voor risico-analyse (via bevindingen)

---

## 8. PROGNOSE & TIJD FACTOREN

### 8.1 Prognose vermeldingen in migrations

In template data zijn prognose-vermeldingen gevonden:

**Voorbeelden uit `20251207153844_*_populate_template_clinical_content_v2_0.sql`:**

```sql
-- Slijtage template:
prognose_text = 'Goede tot uitstekende prognose bij correcte diagnose, behandelplanning
                 en patiënt compliance. Succespercentage >90% over 10 jaar bij adequate
                 occlusale verdeling en nachtelijke splinttherapie.'

-- Directe implantaten:
prognose_text = 'Uitstekende prognose met implantaat-overlevingspercentage van 95-98%
                 over 10 jaar. Kwaliteit van leven verbetert significant.'

-- Desolate dentitie indicative_factors:
"Alle elementen hebben slechte prognose (<5 jaar)"

-- Parodontitis:
prognose_text = 'Goede prognose bij gemotiveerde patiënt en adequaat onderhoud.
                 Zonder onderhoud: recidief in 80% van de gevallen binnen 5 jaar.
                 Met onderhoud: stabilisatie in >85% van de gevallen.'
```

### 8.2 GEEN expliciete tijd/investering criteria in beslislogica

**BELANGRIJK:** De huidige `berekenZorgrichting()` functie gebruikt **GEEN**:
- Tijdshorizon (5 jaar, 10 jaar)
- Investering (tijd, geld)
- Prognose per element
- Schadelijke processen actief/inactief

De beslissing is **puur gebaseerd op aantal procesgebieden per risiconiveau**.

---

## 9. VOORSTEL: SINGLE SOURCE OF TRUTH

### 9.1 Leidende module (status quo)

**Module:** `src/utils/intelligentCareEngine.ts`

**Rationale:**
- Bevat alle type definities
- Bevat beslislogica (`berekenZorgrichting()`)
- Wordt al gebruikt in behandelplan flows
- Heeft helper functies voor labels, kleuren, beschrijvingen

### 9.2 Enums/Consts die leidend moeten zijn

```typescript
// Definitief - niet wijzigen zonder migratie
export type Zorgrichting = 'behoud' | 'veiligstellen' | 'tijdelijke_afbouw' | 'afbouw';
export type RisicoNiveau = 'laag' | 'verlaagd' | 'verhoogd' | 'hoog';

// Procesgebieden komen uit database - dynamisch
// Zie: procesgebieden tabel (9 entries)
```

### 9.3 Aanbevolen architectuur voor Quickscan

```
NIEUWE ENCOUNTER: "Intake Integrale Behandelplan Quickscan"
├─ Input velden:
│  ├─ Hoofddiagnose (dropdown uit diagnose_templates)
│  ├─ Bijkomende diagnoses (multi-select)
│  └─ Handmatige risico-override per procesgebied (optioneel)
│
├─ Automatische processing:
│  ├─ Ophalen default_risico_suggesties uit diagnose_templates
│  ├─ Merge met handmatige overrides
│  ├─ Call: intelligentCareEngine.berekenZorgrichting(risicoAnalyses)
│  └─ Return: ZorgrichtingBeslissing
│
└─ Output weergave:
   ├─ Aanbevolen zorgrichting (met confidence)
   ├─ Rationale (waarom deze zorgrichting)
   ├─ Risico-overview (9 procesgebieden visualized)
   └─ Optie om override te doen + documenteren
```

---

## 10. EXACT MAPPING VOOR QUICKSCAN

### Input parameters (minimaal):

1. **Hoofddiagnose** (verplicht)
   - Source: `diagnose_templates.naam`
   - Bepaalt: Initiële risico-scores via `default_risico_suggesties`

2. **Bijkomende diagnoses** (optioneel)
   - Source: `diagnose_templates.naam[]`
   - Modifier: Kan risico-scores verhogen

3. **Handmatige risico overrides** (optioneel)
   - Per procesgebied: laag/verlaagd/verhoogd/hoog
   - Override: Vervangt AI-suggestie

### Processing flow:

```
STAP 1: Verzamel risico-suggesties
├─ Haal default_risico_suggesties op voor hoofddiagnose
├─ Merge met risico's van bijkomende diagnoses (hoogste wint)
└─ Pas handmatige overrides toe (indien aanwezig)

STAP 2: Bouw RisicoAnalyse array
├─ 1 entry per procesgebied (9 totaal)
└─ Elk met: { procesgebied, procesgebied_id, risico_niveau, ai_suggestie }

STAP 3: Bepaal zorgrichting
├─ IF hoofddiagnose.categorie === 'afbouw_structureel'
│  └─ Call: bepaalZorgrichtingVoorAfbouwDiagnose(hoofddiagnose.naam)
├─ ELSE
│  └─ Call: berekenZorgrichting(risicoAnalyses)

STAP 4: Return ZorgrichtingBeslissing
└─ { zorgrichting, rationale, confidence }
```

### Output format:

```typescript
interface QuickscanResult {
  zorgrichting: Zorgrichting;              // 'behoud'|'veiligstellen'|'tijdelijke_afbouw'|'afbouw'
  rationale: string;                        // Waarom deze zorgrichting
  confidence: 'hoog' | 'middel' | 'laag';  // Zekerheid van beslissing
  risicoAnalyses: RisicoAnalyse[];         // Alle 9 procesgebieden met scores
  hoofddiagnose: string;                    // Gebruikte hoofddiagnose
  bijkomende_diagnoses: string[];           // Gebruikte extra diagnoses
  timestamp: string;                        // Wanneer bepaald
}
```

---

## 11. GEBRUIKTE WAARDEN - COMPLETE LIJST

### Zorgrichting waarden (exact):
- `'behoud'`
- `'veiligstellen'`
- `'tijdelijke_afbouw'`
- `'afbouw'`

### Risiconiveau waarden (exact):
- `'laag'`
- `'verlaagd'`
- `'verhoogd'`
- `'hoog'`

### Procesgebied namen (exact):
- `'Slijmvliezen'`
- `'Stand/Occlusie/Articulatie'`
- `'Parodontaal'`
- `'Cariologisch'`
- `'Slijtage'`
- `'Endodontisch'`
- `'Prothetisch'`
- `'Restauratief'`
- `'Muskulo-skeletaal'`

### Diagnose categorieën (relevant):
- `'afbouw_structureel'` - Triggert speciale afbouw logica
- `'cariologisch'`
- `'parodontaal'`
- `'endodontisch'`
- `'restauratief'`
- `'prothetisch'`
- `'slijtage'`
- `'occlusie_articulatie'`
- `'slijmvliezen'`
- `'musculo_skeletaal'`

---

## 12. BELANGRIJKE BEVINDINGEN

### ✅ WAT ER IS:

1. **Solide beslislogica** in `intelligentCareEngine.ts`
2. **Database-backed risico-analyse** via `default_risico_suggesties`
3. **9 procesgebieden** systematiek is compleet geïmplementeerd
4. **Speciale handling** voor structurele afbouw diagnoses
5. **Validation logic** in Clinical Reasoning Engine
6. **Explanation generators** voor patiënt en klinisch gebruik

### ❌ WAT ER NIET IS:

1. **Tijd/prognose criteria** - NIET in beslislogica
   - Geen ">5 jaar" of "<5 jaar" checks
   - Prognose staat WEL in template teksten, maar wordt NIET gebruikt voor beslissing

2. **Investering criteria** - NIET in beslislogica
   - Geen tijd/geld investering overwegingen
   - Dit zou handmatig moeten in "override reason"

3. **Schadelijke processen** - NIET expliciet
   - Wordt indirect gemeten via hoog/verhoogd risico
   - Geen aparte "actief proces" boolean

4. **UI encounter** - NIET aanwezig
   - Er is GEEN bestaande "Intake Quickscan" encounter
   - Dit moet volledig nieuw gebouwd worden

---

## 13. CONCLUSIE & AANBEVELING

### Single Source of Truth voorstel:

**Module:** `src/utils/intelligentCareEngine.ts`

**Gebruik:**
- Alle zorgrichting beslissingen MOETEN via deze module
- Alle type definities komen hieruit
- Alle labels/beschrijvingen via helper functies

**Voor Quickscan:**
- Gebruik bestaande `berekenZorgrichting()` functie
- Gebruik bestaande `bepaalZorgrichtingVoorAfbouwDiagnose()` voor structurele diagnoses
- Database calls via `generateRisicoAnalyse()` en `saveRisicoAnalyse()`

**GEEN REFACTOR NODIG** - de logica is goed gestructureerd en compleet!

---

## BIJLAGEN

### A. Code locaties overzicht

```
PRIMARY DECISION LOGIC:
├─ src/utils/intelligentCareEngine.ts                    [MAIN]
│  ├─ berekenZorgrichting()                              [87-129]
│  ├─ bepaalZorgrichtingVoorAfbouwDiagnose()            [131-156]
│  ├─ generateRisicoAnalyse()                            [65-85]
│  └─ saveRisicoAnalyse()                                [158-181]

VALIDATION & HELPERS:
├─ src/services/clinicalReasoningEngine.ts               [VALIDATION]
│  └─ checkZorgrichtingBehandelopties()                  [221-298]
├─ src/utils/iceExplanationGenerator.ts                  [OUTPUT]
│  ├─ generatePatientUitleg()                            [13-89]
│  └─ generateKlinischeUitleg()                          [91-188]

DATABASE:
├─ supabase/migrations/20251207142504_*_ice_v1_0.sql    [SCHEMA]
├─ supabase/migrations/20251207142519_*_procesgebieden.sql [SEED]
└─ supabase/migrations/20251207142644_*_afbouw.sql      [DIAGNOSES]

TYPE DEFINITIONS:
└─ src/types/reasoning.ts                                [INTERFACES]
```

### B. Database queries voor testing

```sql
-- Check all diagnoses with afbouw_structureel category
SELECT naam, default_risico_suggesties
FROM diagnose_templates
WHERE categorie = 'afbouw_structureel';

-- Get all procesgebieden
SELECT * FROM procesgebieden ORDER BY volgorde;

-- Check existing risico analyses
SELECT
  b.titel,
  p.naam as procesgebied,
  r.risico_niveau
FROM behandelplan_risico_analyse r
JOIN behandelplannen b ON b.id = r.behandelplan_id
JOIN procesgebieden p ON p.id = r.procesgebied_id
ORDER BY b.created_at DESC, p.volgorde;
```

---

**EINDE INVENTARISATIE**
**Status:** VOLLEDIG - Klaar voor STAP 2 (Design & Implementation)
