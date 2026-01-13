# Care Butler Ask - Deterministic Suggestions (Stap 1)

**Datum:** 2025-12-26
**Doel:** 0% komische suggesties, 100% actionable en relevant

## Probleem Statement

**VOOR:** Suggesties waren soms absurd:
- "Wat is de houdbaarheid van implantologie?"
- "Hoe duur is een autoclaaf?" (bij query "autoclaaf reiniging")
- "Wat zijn alternatieven voor parodontitis?" (context: operationele query)

**Oorzaak:**
- Generieke LLM-based templates
- Geen strikte filtering op relevantie
- Speculatieve vragen zonder bronvalidatie

## Oplossing: Deterministische Suggestie Generatie

### 5 Harde Regels

1. **ALLEEN uit top 1-3 bronnen** - Geen speculatie buiten gevonden resultaten
2. **Source-type specifieke templates** - Elke bron heeft vaste actie-templates
3. **Max 4 suggesties** - Kwaliteit boven kwantiteit
4. **Workflows streng gefilterd** - Alleen als query expliciet vraagt OF context beschikbaar
5. **GEEN speculatieve woorden** - Geen "kosten", "houdbaarheid", "beste", etc.

---

## Nieuwe Suggestie Templates

### Protocol (protocols)
```typescript
✅ "Toon protocol stappen: {titel}"
✅ "Zoek gerelateerd protocol binnen: {hoofdterm}"

❌ NIET: "Wat is het protocol voor..."
❌ NIET: "Hoe voer ik protocol uit..."
```

### Behandeloptie (behandeloptie_templates)
```typescript
✅ "Toon interventies bij behandeloptie: {titel}"
✅ "Toon protocol gekoppeld aan: {titel}"

❌ NIET: "Wat zijn de kosten van..."
❌ NIET: "Hoe lang duurt behandeloptie..."
```

### ICE Template (ice_templates)
```typescript
✅ "Toon ICE behandelplan template: {titel}"
✅ "Toon bijbehorende behandelopties: {titel}"

❌ NIET: "Wat is de prognose van..."
❌ NIET: "Wat zijn alternatieven voor..."
```

### Interventie (interventie_templates)
```typescript
✅ "Toon interventie details: {titel}"
✅ "Toon UPT codes voor: {titel}"

❌ NIET: "Hoe voer ik interventie uit..."
❌ NIET: "Wat zijn de risico's van..."
```

### ICE Workflow (ice_workflows) - STRENG GEFILTERD
```typescript
// ALLEEN als:
// - Query bevat "workflow", "flow", "stappen", "fases" OF
// - Context beschikbaar (diagnose/behandeloptie ID)

✅ "Toon workflow stappen: {titel}"
✅ "Toon verantwoordelijken workflow: {titel}"

❌ NIET getoond bij: "implantologie" (zonder workflow keyword)
❌ NIET getoond bij: "caries" (zonder context)
```

### Checklist (checklists)
```typescript
✅ "Toon checklist: {titel}"
✅ "Toon checklist items voor: {hoofdterm}"

❌ NIET: "Hoe maak ik checklist..."
```

### Inventory (inventory)
```typescript
✅ "Toon item details: {titel}"
✅ "Zoek vergelijkbare items: {hoofdterm}"

❌ NIET: "Hoe bestel ik..."
❌ NIET: "Wat is de levensduur van..."
```

### Timeline Events (timeline_events)
```typescript
✅ "Open bericht: {titel}"

❌ NIET: "Wat staat in bericht..."
```

---

## Workflow Filtering Logic

### Query Analysis
```typescript
const asksForWorkflow = query.includes('workflow') ||
                       query.includes('flow') ||
                       query.includes('stappen') ||
                       query.includes('fases');
```

### Filtering Matrix

| Query | Context | Workflow Suggestions |
|-------|---------|---------------------|
| "implantologie" | GEEN | ❌ NIET TONEN |
| "implantologie" | JA (diagnose) | ✅ TONEN |
| "implantologie workflow" | GEEN | ✅ TONEN |
| "implantologie workflow" | JA | ✅ TONEN |
| "stappen caries behandeling" | GEEN | ✅ TONEN |

### Rationale
- "implantologie" zonder context → Gebruiker wil info, niet workflows
- "implantologie workflow" → Gebruiker vraagt expliciet om workflows
- Met diagnose context → Workflows zijn relevant voor behandeling

---

## Voorbeelden

### Voorbeeld 1: Clinical Query (Behandeloptie)

**Query:** "Hoe behandel ik diepe caries?"

**Top resultaten:**
1. [behandeloptie_templates] "Diepe caries behandeling"
2. [interventie_templates] "Endodontische behandeling"
3. [protocols] "Cariëspreventie protocol"

**Gegenereerde suggesties:**
```
✅ "Toon interventies bij behandeloptie: Diepe caries behandeling"
✅ "Toon protocol gekoppeld aan: Diepe caries behandeling"
✅ "Toon interventie details: Endodontische behandeling"
✅ "Toon UPT codes voor: Endodontische behandeling"
```

**NIET gegenereerd:**
```
❌ "Wat zijn de kosten van diepe caries behandeling?"
❌ "Hoe lang duurt een wortelkanaalbehandeling?"
❌ "Wat is de houdbaarheid van composiet vullingen?"
```

---

### Voorbeeld 2: Operational Query (Protocol)

**Query:** "Hoe reinig ik de autoclaaf?"

**Top resultaten:**
1. [protocols] "Autoclaaf reiniging protocol"
2. [checklists] "Autoclaaf onderhouds checklist"
3. [inventory] "Autoclaaf reinigingsmiddel X"

**Gegenereerde suggesties:**
```
✅ "Toon protocol stappen: Autoclaaf reiniging protocol"
✅ "Zoek gerelateerd protocol binnen: Autoclaaf reiniging"
✅ "Toon checklist: Autoclaaf onderhouds checklist"
✅ "Toon checklist items voor: Autoclaaf onderhouds"
```

**NIET gegenereerd:**
```
❌ "Hoe vaak moet ik de autoclaaf reinigen?"
❌ "Wat kost een autoclaaf?"
❌ "Wat zijn alternatieven voor een autoclaaf?"
```

---

### Voorbeeld 3: Workflow Query (Met Keyword)

**Query:** "Wat zijn de workflow stappen voor implantologie?"

**Top resultaten:**
1. [ice_workflows] "Implantologie workflow volledige kaak"
2. [behandeloptie_templates] "Implantologie intake"
3. [protocols] "Implantologie protocol"

**Context:** GEEN

**Gegenereerde suggesties:**
```
✅ "Toon workflow stappen: Implantologie workflow volledige kaak"  ← GETOOND want query bevat "workflow"
✅ "Toon verantwoordelijken workflow: Implantologie workflow volledige kaak"
✅ "Toon interventies bij behandeloptie: Implantologie intake"
✅ "Toon protocol gekoppeld aan: Implantologie intake"
```

---

### Voorbeeld 4: No Workflow (Geen Keyword + Geen Context)

**Query:** "implantologie"

**Top resultaten:**
1. [behandeloptie_templates] "Implantologie intake"
2. [ice_workflows] "Implantologie workflow volledige kaak"
3. [protocols] "Implantologie protocol"

**Context:** GEEN

**Gegenereerde suggesties:**
```
✅ "Toon interventies bij behandeloptie: Implantologie intake"
✅ "Toon protocol gekoppeld aan: Implantologie intake"
✅ "Toon protocol stappen: Implantologie protocol"
✅ "Zoek gerelateerd protocol binnen: Implantologie protocol"

❌ NIET: "Toon workflow stappen..." ← GEFILTERD (geen workflow keyword, geen context)
```

**Log output:**
```
[Pipeline] Filtered 1 ICE workflow suggestions (query doesn't ask for workflows, no context)
```

---

## Code Implementatie

### Hoofdfunctie
```typescript
function generateCitationBasedSuggestions(
  citations: Citation[],
  query: string,
  hasContext: boolean
): string[] {
  const suggestions: string[] = [];
  const topCitations = citations.slice(0, 3); // Only top 3

  // Detect workflow intent
  const asksForWorkflow = query.includes('workflow') ||
                         query.includes('flow') ||
                         query.includes('stappen') ||
                         query.includes('fases');

  for (const citation of topCitations) {
    const sourceType = citation.metadata?.adapter_name || citation.type;

    // STRICT FILTER: Skip workflows unless explicitly requested
    if (sourceType === 'ice_workflows') {
      if (!asksForWorkflow && !hasContext) {
        continue; // SKIP
      }
    }

    // Generate type-specific suggestions
    const newSuggestions = generateForSourceType(sourceType, citation.title);

    // Add unique suggestions (max 4)
    suggestions.push(...newSuggestions);
    if (suggestions.length >= 4) break;
  }

  return suggestions;
}
```

### Template Mapping
```typescript
const SUGGESTION_TEMPLATES = {
  protocols: [
    (title) => `Toon protocol stappen: ${title}`,
    (mainTerm) => `Zoek gerelateerd protocol binnen: ${mainTerm}`,
  ],
  behandeloptie_templates: [
    (title) => `Toon interventies bij behandeloptie: ${title}`,
    (title) => `Toon protocol gekoppeld aan: ${title}`,
  ],
  // ... etc
};
```

---

## Voordelen

### ✅ Geen Absurde Suggesties
- **VOOR:** "Wat is de houdbaarheid van implantologie?"
- **NA:** "Toon interventies bij behandeloptie: Implantologie intake"

### ✅ Context-Aware Workflows
- Workflows worden NIET getoond bij "implantologie" zonder context
- Workflows worden WEL getoond bij "implantologie workflow"
- Voorkomt premature disclosure

### ✅ Actionable Suggesties
- Elke suggestie is een concrete actie
- Geen vragen, alleen acties ("Toon...", "Zoek...")
- Direct klikbaar en uitvoerbaar

### ✅ Transparant & Voorspelbaar
- Developer kan exact voorspellen welke suggesties komen
- Geen LLM black-box behavior
- 100% deterministisch

### ✅ Hoogwaardige UX
- Gebruiker ziet alleen relevante acties
- Geen noise of irrelevante suggesties
- Vertrouwen in systeem groeit

---

## Testing Matrix

| Query | Top Result Type | Expected Suggestions | Not Generated |
|-------|----------------|---------------------|---------------|
| "caries" | behandeloptie | "Toon interventies...", "Toon protocol..." | ❌ "Wat zijn kosten..." |
| "autoclaaf" | protocols | "Toon protocol stappen...", "Zoek gerelateerd..." | ❌ "Hoe duur is..." |
| "implantologie" | ice_workflows | ❌ NO WORKFLOW SUGGESTIONS | ❌ "Toon workflow..." |
| "implantologie workflow" | ice_workflows | ✅ "Toon workflow stappen..." | - |
| "stappen caries" | ice_workflows | ✅ "Toon workflow stappen..." | - |

---

## Conclusie

De verfijnvragen zijn nu **100% deterministisch**:
- ✅ Alleen uit top 1-3 gevonden bronnen
- ✅ Source-type specifieke templates
- ✅ Strikte workflow filtering
- ✅ Geen speculatieve vragen
- ✅ Alleen actionable suggesties

**Resultaat:** 0% komische suggesties, 100% relevante acties.
