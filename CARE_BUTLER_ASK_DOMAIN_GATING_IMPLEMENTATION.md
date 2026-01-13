# Care Butler Ask - Domain Gating Implementation

**Datum:** 2025-12-26
**Versie:** V2 met Hard Domain-Gating

## Overzicht Aanpassingen

De Care Butler Ask pipeline is volledig gerefactored met **harde domein-gating**, **adapter limiting**, en **transparante pipeline logging**.

---

## 1. Hard Domein-Gating ✅

### VOOR (Soft Filtering):
```typescript
// Clinical queries kregen BEIDE domeinen
if (intent === 'clinical') {
  return [...clinicalAdapters, ...operationalAdapters]; // 9 adapters!
}
```

### NA (Hard Domain-Gating):
```typescript
// Detect primary domain FIRST
const domain = detectQueryDomain(query); // 'clinical' | 'operational'

if (domain === 'clinical') {
  // ALLEEN clinical adapters + max 1 fallback
  primary: ['behandeloptie_templates', 'interventie_templates', 'ice_templates']
  fallback: ['protocols'] // Single fallback only
}
```

### Nieuwe Functies:
- `detectQueryDomain(query)` - Telt clinical vs operational keywords
- `getAdaptersWithDomainGating()` - Hard filtert op basis van domein
- `hasICEWorkflowContext(input)` - Checkt of diagnose/behandeloptie context beschikbaar is

### Domein Definities:
```typescript
CLINICAL_ADAPTERS = [
  'behandeloptie_templates',
  'interventie_templates',
  'ice_templates',
  'ice_workflows', // Conditional on context
]

OPERATIONAL_ADAPTERS = [
  'protocols',
  'checklists',
  'timeline_events',
  'inventory',
  'tasks',
]
```

---

## 2. Adapter Limiting ✅

### Regels:
1. **Max 1 domein per query** - Clinical OF operational, niet beide
2. **Alle adapters binnen domein** - Geen cherry-picking
3. **Max 1 fallback adapter** - Cross-domain fallback alleen voor clinical queries
4. **ICE workflows conditional** - Alleen met diagnose/behandeloptie context

### Voorbeeld Clinical Query:
```
Query: "Hoe behandel ik diepe caries?"

Domain: CLINICAL
Primary adapters (3): [behandeloptie_templates, interventie_templates, ice_templates]
Fallback adapter: protocols
Excluded adapters: [checklists, timeline_events, inventory, tasks, ice_workflows]
Total active: 4
```

### Voorbeeld Operational Query:
```
Query: "Hoe reinig ik de autoclaaf?"

Domain: OPERATIONAL
Primary adapters (5): [protocols, checklists, timeline_events, inventory, tasks]
Fallback adapter: NONE
Excluded adapters: [behandeloptie_templates, interventie_templates, ice_templates, ice_workflows]
Total active: 5
```

---

## 3. ICE Workflows Hiding ✅

### Context Check:
```typescript
function hasICEWorkflowContext(input: CareButlerAskInput): boolean {
  if (input.context) {
    // Has diagnosis context
    if (ctx.patient_diagnoses && ctx.patient_diagnoses.length > 0) return true;

    // Has behandelplan context
    if (ctx.behandelplan_id || ctx.zorgplan_id) return true;

    // Has behandeloptie context
    if (ctx.behandeloptie_id) return true;
  }
  return false;
}
```

### Gedrag:
- **ZONDER context**: ICE workflows adapter wordt NIET geladen
- **MET context**: ICE workflows adapter wordt geladen en kan matchen
- **In verfijnvragen**: ICE workflow suggesties worden gefilterd als geen context

---

## 4. Verfijnvragen Filtering ✅

### VOOR:
```typescript
// Genereerde suggesties vanuit alle citations
function generateCitationBasedSuggestions(citations, query) {
  // Geen filtering op ICE workflows
}
```

### NA:
```typescript
// Filtert ICE workflows op basis van context
function generateCitationBasedSuggestions(citations, query, hasContext) {
  for (const citation of topCitations) {
    // FILTER: Skip ICE workflows if no context
    if (sourceType === 'ice_workflows' && !hasContext) {
      iceWorkflowsFiltered++;
      continue;
    }
    // ...
  }
}
```

### Resultaat:
- ICE workflow suggesties worden NIET getoond tot diagnose/behandeloptie gekozen
- Logging toont hoeveel workflow suggesties gefilterd zijn
- Alleen bronnen met context worden voorgesteld

---

## 5. Pipeline Transparantie Logging ✅

### Console Output Structuur:
```
[CareButlerAsk Pipeline] Query: "Hoe behandel ik diepe caries?"

[Pipeline] Step 1: Intent & Domain Detection
  - Detected intent: clinical
  - Detected domain: CLINICAL
  - Clinical keywords matched: [caries, behandel]
  - Operational keywords matched: []
  - Has diagnosis/behandeloptie context: NO

[Pipeline] Step 2: Domain-Gated Adapter Selection
  - Primary domain: clinical
  - Primary adapters (3): [behandeloptie_templates, interventie_templates, ice_templates]
  - Fallback adapter: protocols
  - Excluded adapters (5): [checklists, timeline_events, inventory, tasks, ice_workflows]
  - Reason: Clinical query: 3 clinical adapters + 1 fallback, ICE workflows disabled (no context)
  - Total active adapters: 4

[Pipeline] Step 3: Parallel Search Execution
  - Adapters searched: 4
    • behandeloptie_templates: 3 results
    • interventie_templates: 2 results
    • ice_templates: 1 result
    • protocols: 1 result
  - Total raw citations: 7

[Pipeline] Step 4: Ranking & Source Weighting
  - Ranked citations: 7
  - Top 5 results:
    1. [behandeloptie_templates] "Diepe caries behandeling" (relevance: 0.920, weight: 120)
    2. [interventie_templates] "Endodontische behandeling" (relevance: 0.870, weight: 120)
    3. [ice_templates] "Cariës intake template" (relevance: 0.760, weight: 115)
    4. [protocols] "Cariëspreventie protocol" (relevance: 0.680, weight: 105)
    5. [behandeloptie_templates] "Pulpitis behandeling" (relevance: 0.650, weight: 120)

[Pipeline] Final Results: 5 citations returned
```

### Pipeline Log Object (in result):
```typescript
{
  query: "...",
  timestamp: "2025-12-26T...",
  steps: [
    {
      step: 1,
      name: "Intent & Domain Detection",
      intent: "clinical",
      domain: "clinical",
      hasContext: false,
      clinicalKeywords: ["caries", "behandel"],
      operationalKeywords: []
    },
    {
      step: 2,
      name: "Domain-Gated Adapter Selection",
      primaryAdapters: [...],
      fallbackAdapter: "protocols",
      excludedAdapters: [...],
      totalActive: 4,
      reason: "..."
    },
    // ... steps 3 & 4
  ]
}
```

---

## 6. Type Updates ✅

### CareButlerAskInput (nieuw):
```typescript
{
  question: string;
  user_id: string;
  scope?: SearchScope;
  locationScope?: LocationScope;
  context?: {                        // NIEUW
    patient_diagnoses?: any[];
    behandelplan_id?: string;
    zorgplan_id?: string;
    behandeloptie_id?: string;
  };
}
```

### CareButlerAskResult (uitgebreid):
```typescript
{
  // Bestaande velden...
  domain?: 'clinical' | 'operational';  // NIEUW
  pipeline_log?: any;                   // NIEUW
}
```

---

## Impact & Voordelen

### ✅ Verbeterde Relevantie
- Clinical queries krijgen **ALLEEN** clinical bronnen (+ 1 fallback)
- Operational queries krijgen **ALLEEN** operational bronnen
- Geen meer cross-contamination tussen domeinen

### ✅ Reduced Adapter Overhead
- VOOR: Tot 9 adapters tegelijk actief voor clinical queries
- NA: Max 4 adapters voor clinical, max 5 voor operational
- **~40-50% minder adapter calls** voor clinical queries

### ✅ Context-Aware Workflows
- ICE workflows worden NIET getoond zonder diagnose context
- Voorkomt premature disclosure van workflows
- Gebruiker ziet workflows pas als behandelrichting duidelijk is

### ✅ Transparante Decision Making
- Elke stap in de pipeline is zichtbaar
- Developers kunnen exact zien waarom bepaalde adapters gekozen/excluded zijn
- Debugging is triviaal door structured logging

### ✅ Better User Experience
- Relevantere resultaten (geen operational noise in clinical queries)
- Contextuele suggesties (workflows alleen als relevant)
- Snellere responses (minder adapters = sneller)

---

## Backward Compatibility

### Breaking Changes:
- **GEEN** - CareButlerAskInput context is optioneel
- **GEEN** - CareButlerAskResult domain/pipeline_log zijn optioneel

### Migratie:
- Bestaande consumers werken zonder wijzigingen
- Nieuwe consumers kunnen context meegeven voor ICE workflow filtering
- Pipeline log is opt-in via result.pipeline_log

---

## Testing Scenarios

### Test 1: Clinical Query Zonder Context
```typescript
const result = await careButlerAsk({
  question: "Hoe behandel ik diepe caries?",
  user_id: "...",
  // GEEN context
});

// Expected:
// - domain: 'clinical'
// - adapters: behandeloptie_templates, interventie_templates, ice_templates, protocols
// - ice_workflows: EXCLUDED (no context)
// - suggested_questions: NO workflow suggestions
```

### Test 2: Clinical Query Met Context
```typescript
const result = await careButlerAsk({
  question: "Wat zijn de workflow stappen voor cariës behandeling?",
  user_id: "...",
  context: {
    patient_diagnoses: [{ code: 'K02.1' }], // Diepe caries
  }
});

// Expected:
// - domain: 'clinical'
// - adapters: behandeloptie_templates, interventie_templates, ice_templates, ice_workflows, protocols
// - ice_workflows: INCLUDED (has context)
// - suggested_questions: CAN include workflow suggestions
```

### Test 3: Operational Query
```typescript
const result = await careButlerAsk({
  question: "Hoe reinig ik de autoclaaf?",
  user_id: "...",
});

// Expected:
// - domain: 'operational'
// - adapters: protocols, checklists, timeline_events, inventory, tasks
// - NO clinical adapters
// - NO fallback
```

---

## Volgende Stappen

### Optioneel - Toekomstige Verbeteringen:
1. **ML-based Domain Detection** - Train model op query patterns
2. **Dynamic Fallback Selection** - Choose best fallback based on query
3. **Context Auto-Detection** - Infer context from user's current page
4. **A/B Testing** - Compare old vs new domain-gating performance

---

## Conclusie

De Care Butler Ask pipeline heeft nu:
- ✅ Harde domein-gating (clinical vs operational)
- ✅ Adapter limiting (1 domein + max 1 fallback)
- ✅ Context-aware ICE workflows filtering
- ✅ Citation-based verfijnvragen (geen generische vragen)
- ✅ Transparante pipeline logging

**Resultaat:** Relevantere zoekresultaten, snellere responses, en volledige transparantie voor debugging.
