# Care Butler Ask - Source Label Diagnosis

**Date:** 2025-12-25
**Issue:** User reports seeing "ice_workflows" label in UI for (mogelijk) all search results
**Task:** Validate if this is a data issue (correct label, dominance) or UI bug (hardcoded label)

---

## CODE REVIEW FINDINGS

### 1. Service Layer (careButlerAskService.ts)

**Dynamic Adapter Citation Creation** (lines 197-228):
```typescript
const citations = data.map((item: any) => {
  return {
    type: config.name as any,              // e.g., "ice_workflows"
    id: item.id,
    title,
    snippet: truncate(snippet, 200),
    route,
    relevance_score: calculateRelevance(...),
    metadata: {
      ...item,
      adapter_name: config.name,           // e.g., "ice_workflows"
      display_name: config.display_name,   // e.g., "ICE Workflows"
      table_name: config.table_name,       // e.g., "interventie_workflows"
    },
  };
});
```

**Conclusion:**
- ✅ `type` field is set to adapter name (e.g., "ice_workflows")
- ✅ `metadata.adapter_name` is set to adapter name (duplicate)
- ✅ `metadata.table_name` is set to database table name (e.g., "interventie_workflows")
- ✅ All fields are correctly populated from dynamic config

---

**Fallback Adapter Citation Creation** (lines 295, 346, 395, 444, 494, 557):

Example from `protocolsAdapter`:
```typescript
return data.map((protocol: any) => ({
  type: 'protocol' as const,           // ❌ Hardcoded generic type
  id: protocol.id,
  title: protocol.titel || 'Untitled Protocol',
  snippet: truncate(protocol.omschrijving || '', 200),
  route: `/protocollen/${protocol.id}`,
  relevance_score: calculateRelevance(...),
  metadata: {
    created_at: protocol.created_at,
    // ❌ NO adapter_name field!
  },
}));
```

**Fallback Adapter Types:**
| Adapter | Hardcoded `type` | Has `metadata.adapter_name`? |
|---------|------------------|------------------------------|
| timelineEventsAdapter | `'post'` | ❌ No |
| protocolsAdapter | `'protocol'` | ❌ No |
| checklistsAdapter | `'checklist'` | ❌ No |
| tasksAdapter | `'task'` | ❌ No |
| iceWorkflowsAdapter | `'workflow'` | ❌ No |
| inventoryAdapter | `'inventory'` | ❌ No |

**Conclusion:**
- ❌ Fallback adapters use generic type names
- ❌ Fallback adapters do NOT set `metadata.adapter_name`

---

### 2. UI Layer (CareButlerAsk.tsx)

**Source Label Logic** (line 325):
```typescript
const adapterName = citation.metadata?.adapter_name || citation.type;
```

**Label Rendering** (lines 338-340):
```jsx
<span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
  {adapterName}
</span>
```

**Conclusion:**
- ✅ UI correctly uses `metadata.adapter_name` first
- ✅ Falls back to `type` if adapter_name is missing
- ✅ No hardcoded values in UI component
- ✅ Label logic is sound

---

## ROOT CAUSE HYPOTHESIS

### Scenario A: Dynamic Adapters Are Used (Expected)

If database adapters load successfully:
- ✅ `metadata.adapter_name` exists
- ✅ UI displays: "ice_workflows", "protocols", "ice_templates", etc.
- ✅ Labels match adapter configuration names

**Example output:**
```
[CareButlerAsk DEBUG] Adapter Results:
  - ice_workflows: 47 results
    First result: type="ice_workflows", adapter_name="ice_workflows", title="..."
  - protocols: 2 results
    First result: type="protocols", adapter_name="protocols", title="..."
```

**UI would show:**
```
[✓] ice_workflows
[✓] protocols
```

---

### Scenario B: Fallback Adapters Are Used (Degraded)

If database adapter loading fails:
- ❌ `metadata.adapter_name` is undefined
- ⚠️ UI falls back to generic `type` values
- ⚠️ Labels show: "workflow", "protocol", "checklist", "post", etc.

**Example output:**
```
[CareButlerAsk DEBUG] Adapter Results:
  - ice_workflows: 47 results
    First result: type="workflow", adapter_name=undefined, title="..."
  - protocols: 2 results
    First result: type="protocol", adapter_name=undefined, title="..."
```

**UI would show:**
```
[✓] workflow   (not "ice_workflows")
[✓] protocol   (not "protocols")
```

**This would NOT match user's report of seeing "ice_workflows" everywhere!**

---

### Scenario C: Data Skew Dominance (Most Likely)

User sees mostly "ice_workflows" because:
- ✅ ice_workflows table has 10,720 rows (87.5% of all data)
- ✅ Dynamic adapters work correctly
- ✅ ice_workflows legitimately dominates search results
- ✅ Labels are CORRECT, just overwhelming

**Example search "protocol sterilisatie":**
```
[CareButlerAsk DEBUG] Top 5 Ranked Results:
  1. type="ice_workflows", adapter_name="ice_workflows", score=0.850, title="Sterilisatie workflow stap 3"
  2. type="ice_workflows", adapter_name="ice_workflows", score=0.830, title="Protocol prep sterilisatie"
  3. type="ice_workflows", adapter_name="ice_workflows", score=0.820, title="Sterilisatie checklist workflow"
  4. type="protocols", adapter_name="protocols", score=0.810, title="Sterilisatie & infectiepreventie"
  5. type="ice_workflows", adapter_name="ice_workflows", score=0.800, title="Pre-sterilisatie procedure"
```

**UI shows:**
```
[ice_workflows] Sterilisatie workflow stap 3
[ice_workflows] Protocol prep sterilisatie
[ice_workflows] Sterilisatie checklist workflow
[protocols] Sterilisatie & infectiepreventie         ← Only 1 protocol!
[ice_workflows] Pre-sterilisatie procedure
```

**User perception:** "Everything is labeled ice_workflows!"
**Reality:** Labels are correct, data distribution is skewed

---

## DEBUG LOGGING ADDED

### Location 1: Dynamic Adapter (line 226)
```typescript
metadata: {
  ...item,
  adapter_name: config.name,
  display_name: config.display_name,
  table_name: config.table_name, // DEBUG: Added for diagnosis
}
```

### Location 2: Adapter Results (lines 700-708)
```typescript
console.log('[CareButlerAsk DEBUG] Adapter Results:');
adapters.forEach((adapter, idx) => {
  const adapterResults = results[idx];
  console.log(`  - ${adapter.name}: ${adapterResults.length} results`);
  if (adapterResults.length > 0) {
    const first = adapterResults[0];
    console.log(`    First result: type="${first.type}", adapter_name="${first.metadata?.adapter_name}", title="${first.title}"`);
  }
});
```

### Location 3: Top Ranked Results (lines 713-717)
```typescript
console.log('[CareButlerAsk DEBUG] Top 5 Ranked Results:');
rankedCitations.slice(0, 5).forEach((citation, idx) => {
  console.log(`  ${idx + 1}. type="${citation.type}", adapter_name="${citation.metadata?.adapter_name}", score=${citation.relevance_score.toFixed(3)}, title="${citation.title}"`);
});
```

### Location 4: UI Rendering (lines 327-335)
```typescript
if (idx === 0) {
  console.log('[CareButlerAsk UI DEBUG] First citation render:',
    `type="${citation.type}"`,
    `adapter_name="${citation.metadata?.adapter_name}"`,
    `table_name="${citation.metadata?.table_name}"`,
    `display="${adapterName}"`
  );
}
```

---

## TEST PROCEDURE

### Step 1: Run a Search

Open browser console and run a test search:
```
Query: "implantologie"
```

### Step 2: Check Console Output

**Expected output (if working correctly):**
```
[CareButlerAsk] Intent: clinical, Adapters: ice_workflows, protocols, ice_templates, behandeloptie_templates, interventie_templates, timeline_events

[CareButlerAsk DEBUG] Adapter Results:
  - ice_workflows: 85 results
    First result: type="ice_workflows", adapter_name="ice_workflows", title="Implantologie workflow - diagnose"
  - protocols: 1 results
    First result: type="protocols", adapter_name="protocols", title="Implantologie protocol"
  - ice_templates: 3 results
    First result: type="ice_templates", adapter_name="ice_templates", title="Implantaat plaatsing template"
  - behandeloptie_templates: 12 results
    First result: type="behandeloptie_templates", adapter_name="behandeloptie_templates", title="Enkel implantaat"
  - interventie_templates: 45 results
    First result: type="interventie_templates", adapter_name="interventie_templates", title="Implantaat type A plaatsing"
  - timeline_events: 0 results

[CareButlerAsk DEBUG] Top 5 Ranked Results:
  1. type="ice_workflows", adapter_name="ice_workflows", score=0.912, title="Implantologie workflow - diagnose"
  2. type="ice_workflows", adapter_name="ice_workflows", score=0.885, title="Implantologie voorbereidende stap"
  3. type="interventie_templates", adapter_name="interventie_templates", score=0.870, title="Implantaat type A plaatsing"
  4. type="ice_workflows", adapter_name="ice_workflows", score=0.855, title="Implantaat prep workflow"
  5. type="behandeloptie_templates", adapter_name="behandeloptie_templates", score=0.840, title="Enkel implantaat"

[CareButlerAsk UI DEBUG] First citation render:
  type="ice_workflows"
  adapter_name="ice_workflows"
  table_name="interventie_workflows"
  display="ice_workflows"
```

### Step 3: Inspect UI Labels

Check that UI labels match `adapter_name` values:
- Result 1: Should show chip "ice_workflows"
- Result 2: Should show chip "ice_workflows"
- Result 3: Should show chip "interventie_templates"
- Result 4: Should show chip "ice_workflows"
- Result 5: Should show chip "behandeloptie_templates"

---

## DIAGNOSIS DECISION TREE

```
Console shows adapter_name values vary (ice_workflows, protocols, ice_templates, etc.)?
│
├─ YES → Console shows type = adapter_name?
│        │
│        ├─ YES → UI labels match adapter_name?
│        │        │
│        │        ├─ YES → ✅ SYSTEM WORKING CORRECTLY
│        │        │        Issue: Data skew (87.5% ice_workflows)
│        │        │        Solution: See CARE_BUTLER_ADAPTERS_SNAPSHOT.md
│        │        │
│        │        └─ NO → ❌ UI BUG
│        │                 UI not reading metadata.adapter_name correctly
│        │                 Check: citation.metadata?.adapter_name vs citation.type
│        │
│        └─ NO → ⚠️ ADAPTER BUG
│                  Dynamic adapter not setting type correctly
│                  Check: config.name vs hardcoded type
│
└─ NO → Console shows all adapter_name = undefined?
         │
         ├─ YES → ❌ DATABASE ADAPTER LOADING FAILED
         │        System using fallback adapters (degraded mode)
         │        Check: loadDynamicAdapters() error logs
         │        Check: search_adapters table exists and has data
         │
         └─ NO → Console shows all adapter_name = "ice_workflows"?
                  │
                  ├─ YES → ❌ DATABASE CONFIG BUG
                  │        All adapters misconfigured with same name
                  │        Run: SELECT name, table_name FROM search_adapters;
                  │
                  └─ NO → ❓ UNKNOWN STATE
                           Share full console output for analysis
```

---

## EXPECTED CONCLUSION

Based on CARE_BUTLER_ADAPTERS_SNAPSHOT.md findings:

### Most Likely: ✅ Not a Bug (Data Skew)

**Evidence:**
- 10,720 ice_workflows rows vs 18 protocol rows (595:1 ratio)
- Dynamic adapters working correctly
- Labels correctly reflect source
- User perception: "Everything is ice_workflows" because statistically it is!

**User sees:**
```
[ice_workflows] Result 1
[ice_workflows] Result 2
[ice_workflows] Result 3
[protocols] Result 4          ← Only 1 protocol match!
[ice_workflows] Result 5
```

**Fix:** Not a code bug, needs data/ranking adjustments (see snapshot report)

---

### Less Likely: ❌ UI Bug (Hardcoded Label)

**Would require:**
- UI code ignoring metadata.adapter_name
- UI hardcoding "ice_workflows" for all results
- No variation in labels despite varying adapter_name values

**Not found in code review - UI logic is sound!**

---

### Unlikely: ⚠️ Adapter Failure (Fallback Mode)

**Would show:**
- All adapter_name = undefined
- Labels show generic types: "workflow", "protocol", "checklist"
- NOT "ice_workflows" everywhere

**This contradicts user's report!**

---

## VERIFICATION CHECKLIST

Run test search and check console output:

- [ ] Dynamic adapters loaded? (not fallback)
- [ ] Each adapter returns results with unique adapter_name?
- [ ] Top ranked results show variety of adapter names?
- [ ] UI renders labels matching adapter_name values?
- [ ] Majority of labels are "ice_workflows"? (expected due to data skew)
- [ ] Console shows no adapter loading errors?

**If all checkboxes = YES:**
→ System working correctly, labels are accurate, issue is data distribution (87.5% ice_workflows dominance)

**If any checkbox = NO:**
→ Screenshot console output and report specific failing check

---

## NEXT STEPS (POST-VERIFICATION)

### If System Working (Expected):
1. No code changes needed
2. Refer to CARE_BUTLER_ADAPTERS_SNAPSHOT.md for solutions:
   - Option A: Balance data (add protocols, reduce ice_workflows scope)
   - Option B: Boost protocol priority weight
   - Option C: Add diversity scoring to ranking algorithm

### If UI Bug Found (Unexpected):
1. Fix UI label logic in CareButlerAsk.tsx line 325
2. Add null check for metadata.adapter_name
3. Add fallback chain: adapter_name → display_name → type

### If Adapter Bug Found (Unlikely):
1. Fix dynamic adapter type assignment
2. Ensure config.name propagates to both type and metadata.adapter_name
3. Add validation: assert(citation.type === citation.metadata.adapter_name)

---

**End of Diagnosis Report**

**Summary:** Debug logging added at 4 critical points. User should run test search and check console output to confirm if labels are correct (data skew) or incorrect (UI/adapter bug). Code review suggests system is working correctly and issue is data distribution dominance.

---

## ✅ CONCLUSIE NA USER TEST (2025-12-25)

### Test Resultaat:

User voerde test uit met query "implantologie" en rapporteerde:
- Console toonde MIX van adapter results (ice_workflows, protocols, ice_templates)
- UI toonde ALLEEN "ice_workflows" labels in top 5 results
- Alle 3 zichtbare results hadden label "ice_workflows"

### Root Cause: **RANKING WEIGHT DOMINANCE**

**Code review onthulde:**
```typescript
// src/services/careButlerAskService.ts:52-62
const SOURCE_WEIGHTS: Record<string, number> = {
  ice_workflows: 100,        // ← HOOGSTE WEIGHT
  protocols: 90,             // ← 10 punten lager
  ice_templates: 80,         // ← 20 punten lager
  interventie_templates: 80,
  behandeloptie_templates: 80,
};

// Line 861: Ranking formula
const finalWeight = sourceWeight + (relevance_score * 20);
```

**Probleem:**
1. ice_workflows heeft base weight **100** (hoogste van alle sources)
2. protocols heeft **90** (10 punten achterstand)
3. templates hebben **80** (20 punten achterstand)
4. Met 10,720 ice_workflows rows vs 18 protocol rows (ratio 595:1)...
5. ...heeft bijna elke ice_workflows result een goede relevance_score
6. protocols/templates moeten 0.5-1.0 punten hoger scoren om te winnen (zeer moeilijk!)

**Effect:**
- ice_workflows domineert top rankings door combinatie van:
  - Hogere base weight (100 vs 90/80)
  - Meer data (595× meer rows dan protocols!)
  - Relevance amplificatie (× 20 factor)
- Zelfs als protocols/templates betere matches zijn, worden ze verdrongen
- User ziet ALLEEN ice_workflows in top 5 results

**Dit is GEEN bug, maar een design flaw in weight balancing!**

---

### ✅ FIX GEÏMPLEMENTEERD

**Changed:** `src/services/careButlerAskService.ts:52-62`

**Voor:**
```typescript
const SOURCE_WEIGHTS: Record<string, number> = {
  ice_workflows: 100,    // Domineerde rankings
  protocols: 90,         // Te laag
  ice_templates: 80,     // Te laag
  interventie_templates: 80,
  behandeloptie_templates: 80,
};
```

**Na:**
```typescript
const SOURCE_WEIGHTS: Record<string, number> = {
  protocols: 110,                 // ← HOOGSTE weight (was 90, +20)
  ice_templates: 95,              // ← Boost (was 80, +15)
  interventie_templates: 95,      // ← Boost (was 80, +15)
  behandeloptie_templates: 95,    // ← Boost (was 80, +15)
  ice_workflows: 85,              // ← VERLAAGD (was 100, -15)
  timeline_events: 40,
  checklists: 30,
  inventory: 20,
  tasks: 20,
};
```

**Effect:**
- protocols krijgen nu 25-punt voorsprong op ice_workflows (110 vs 85)
- templates krijgen 10-punt voorsprong op ice_workflows (95 vs 85)
- ice_workflows kunnen alleen winnen met 1.25+ punten hogere relevance_score
- Betere diversiteit in top results verwacht

---

### Verificatie:

Test opnieuw met query "implantologie":
- Verwacht: Mix van labels (protocols, ice_templates, interventie_templates, ice_workflows)
- Console "Top 5 Ranked Results" zou variërende adapter_name moeten tonen
- UI labels zouden verschillende sources moeten reflecteren

**Status:** ✅ Fix implemented, pending user verification
