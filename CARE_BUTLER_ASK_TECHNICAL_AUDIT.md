# Care Butler Ask - Technical Pipeline Audit

**Datum:** 2025-12-26
**Versie:** Pre-refactor audit

## Huidige Architectuur

### 1. Intent Detectie (regel 776-789)

```typescript
function detectQueryIntent(query: string): QueryIntent {
  // Simpele keyword matching
  // Output: 'clinical' | 'general'
}
```

**Problemen:**
- ❌ **GEEN harde domein-gating**: Intent wordt niet gebruikt om domein hard af te grenzen
- ❌ **Alleen 2 categorieën**: Geen onderscheid tussen clinical/operational binnen zelfde domein
- ❌ **Soft filtering**: Intent wordt gebruikt voor prioriteit, niet voor exclusion

### 2. Adapter Selectie (regel 594-687)

```typescript
async function getAdapters(scope: string, intent: QueryIntent, query: string)
```

**Huidige gedrag:**
- Clinical intent → laadt **clinical + operational** adapters (regel 606-608)
- Operational intent → laadt alleen operational adapters
- **ASYMMETRISCH**: Clinical queries krijgen beide domeinen!

**Actieve adapters bij 'clinical' intent:**
```javascript
clinicalAdapters = ['behandeloptie_templates', 'interventie_templates', 'ice_templates', 'ice_workflows']
operationalAdapters = ['protocols', 'checklists', 'timeline_events', 'inventory', 'tasks']

// Clinical query krijgt BEIDE!
return [...clinicalAdapters, ...operationalAdapters]  // 9 adapters actief!
```

**Problemen:**
- ❌ **Multi-domein overlap**: Clinical queries doorzoeken ook operational bronnen
- ❌ **Geen maximum**: Tot 9 adapters tegelijk actief
- ❌ **Geen fallback limiet**: Geen "+1 fallback max" regel

### 3. Ranking & Source Weights (regel 875-910)

```typescript
const SOURCE_WEIGHTS = {
  behandeloptie_templates: 120,   // Highest
  interventie_templates: 120,
  ice_templates: 115,
  protocols: 105,
  ice_workflows: 80,
  timeline_events: 40,
  // ...
}
```

**Gedrag:**
- Source weights worden toegepast op alle gevonden resultaten
- Geen filtering op basis van domein VOOR ranking
- Ranking is post-hoc prioritization, niet pre-filtering

**Probleem:**
- ❌ **Late filtering**: Domein wordt niet gefilterd voor search, alleen na search via weights

### 4. Verfijnvragen Generatie (regel 1151-1158)

```typescript
function generateSuggestedQuestions(citations: Citation[], query: string, intent: QueryIntent) {
  // Genereert suggesties vanuit citations (goed!)
  return generateCitationBasedSuggestions(citations, query);
}
```

**Gedrag:**
- Genereert suggesties uit top 6 citations
- Bron-type specifieke templates:
  - Protocols → "Toon protocol stappen voor: X"
  - ICE workflows → "Toon workflow fases/rollen voor: X"
  - Behandeloptie templates → "Toon behandelopties + interventies voor: X"

**Problemen:**
- ❌ **ICE workflows altijd zichtbaar**: Geen filtering op diagnose/behandeloptie context
- ❌ **Geen context-awareness**: Toont workflows zelfs als diagnose nog niet gekozen
- ✅ **Wel citation-based**: Genereert alleen vanuit gevonden bronnen (correct!)

### 5. ICE Workflows Visibility (regel 477-526)

```typescript
const iceWorkflowsAdapter: SearchAdapter = {
  name: 'ice_workflows',
  enabled: true,  // Altijd enabled
  search: async (query: string, filters?: SearchFilters) => {
    // Zoekt workflows zonder context-check
  }
}
```

**Probleem:**
- ❌ **Altijd zichtbaar**: Workflows worden getoond zodra ze matchen met keywords
- ❌ **Geen diagnose/behandeloptie check**: Wordt niet verborgen tot context beschikbaar is
- ❌ **Premature disclosure**: Gebruiker ziet workflows voordat behandelrichting duidelijk is

### 6. Logging Transparantie (regel 1217-1245)

```typescript
async function logSession(input: CareButlerAskInput, result: CareButlerAskResult) {
  // Logt naar care_butler_ask_sessions
  // Bevat: user_id, question, outcome, sources_searched, result_data
}
```

**Huidige logging:**
- ✅ Logt outcome en sources
- ⚠️ Minimale console logging
- ❌ **GEEN per-query pipeline transparantie**
- ❌ **GEEN intent → domein → adapters → top results flow zichtbaar**

**Console logs:**
```javascript
// Regel 706: Intent + adapters
console.log(`[CareButlerAsk] Intent: ${intent}, Adapters: ${adapters.map(a => a.name).join(', ')}`);

// Regel 720-728: Adapter results (DEBUG)
// Regel 734-737: Top 5 ranked results (DEBUG)
```

Maar NIET:
- Welk domein actief is (clinical vs operational)
- Waarom bepaalde adapters gefilterd zijn
- Hoe domein-gating werkt
- Welke verfijnvragen gefilterd zijn en waarom

---

## Vereiste Aanpassingen

### 1. Hard Domein-Gating
- ✅ Introduceer `clinical` en `operational` als harde domeinen
- ✅ Intent detectie moet **exclusief** filteren
- ✅ Clinical query → **ALLEEN** clinical adapters (+ 1 fallback max)
- ✅ Operational query → **ALLEEN** operational adapters (+ 1 fallback max)

### 2. Adapter Limiting
- ✅ Max 1 domein per query
- ✅ Binnen domein: alle relevante adapters
- ✅ Cross-domain: max 1 fallback adapter

### 3. Verfijnvragen Filtering
- ✅ ICE workflows NIET tonen in suggesties tot diagnose/behandeloptie gekozen
- ✅ Check metadata voor behandelplan/zorgplan context
- ✅ Filter workflow-suggesties op basis van context

### 4. ICE Workflow Hiding
- ✅ Workflows NIET zoeken tot diagnose/behandeloptie context beschikbaar
- ✅ Check input.context voor patient_diagnoses of behandelplan_id
- ✅ Conditionally enable ice_workflows adapter

### 5. Pipeline Logging
- ✅ Log per query: `intent → domein → adapters → top results`
- ✅ Structured console output voor debugging
- ✅ Transparent decision-making zichtbaar

---

## Implementation Plan

1. ✅ Add domain detection function
2. ✅ Modify getAdapters() voor harde domein-filtering
3. ✅ Add fallback adapter selection (max 1)
4. ✅ Add context checking voor ICE workflows
5. ✅ Filter verfijnvragen op basis van context
6. ✅ Add comprehensive pipeline logging

## Expected Output Example

```
[CareButlerAsk] Query: "Hoe behandel ik diepe caries?"

[Pipeline] Step 1: Intent Detection
  - Detected intent: clinical
  - Keywords matched: ['caries', 'behandel']
  - Domain: CLINICAL

[Pipeline] Step 2: Domain Gating
  - Primary domain: clinical
  - Clinical adapters: ['behandeloptie_templates', 'interventie_templates', 'ice_templates']
  - Fallback adapter: 'protocols' (1 max)
  - Total adapters: 4

[Pipeline] Step 3: Context Check
  - Has diagnosis context: NO
  - Has behandelplan context: NO
  - ICE workflows: DISABLED (waiting for diagnosis)

[Pipeline] Step 4: Adapter Search
  - behandeloptie_templates: 3 results
  - interventie_templates: 2 results
  - ice_templates: 1 result
  - protocols: 1 result (fallback)

[Pipeline] Step 5: Ranking
  - Top 5 results:
    1. [behandeloptie] "Diepe caries behandeling" (score: 0.92)
    2. [interventie] "Endodontische behandeling" (score: 0.87)
    3. [ice_template] "Cariës intake template" (score: 0.76)
    4. [protocol] "Cariëspreventie protocol" (score: 0.68)
    5. [behandeloptie] "Pulpitis behandeling" (score: 0.65)

[Pipeline] Step 6: Refinement Questions
  - Generated: 4 suggestions from citations
  - Filtered ICE workflow suggestions: 2 (no diagnosis context)
  - Final suggestions: 2
```
