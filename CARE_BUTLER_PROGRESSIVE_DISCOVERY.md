# Care Butler Progressive Discovery Feature

**Implemented:** 2025-12-25
**Purpose:** Help users refine broad queries into specific, targeted questions

---

## 🎯 Problem Statement

**Before:** Butler parsed entire complex questions like "Wat is behandeloptie bij diep caries?" and searched ALL terms together. This caused:
- Irrelevant results (workflows with "behandeloptie" in text dominated)
- No guidance for users to narrow down their search
- Inefficient one-shot search without refinement

**User insight:** "Butler keek naar gehele zin. Twee termen zijn belangrijk: 'diep caries' en 'behandelopties'. We kunnen Butler en gebruiker samen laten werken in stappen."

---

## ✨ Solution: Smart Query Refinement

### 1. Clinical Term Extraction

Butler now extracts the **core clinical term** from queries:

**Examples:**
- "Wat is behandeloptie bij diep caries?" → extracts **"diep caries"**
- "Hoe doe ik wortelkanaalbehandeling?" → extracts **"wortelkanaal"**
- "Implantologie protocollen" → extracts **"implantaat"**

**Algorithm:**
```typescript
// Step 1: Match against clinical keywords (longest match wins)
CLINICAL_KEYWORDS = ['caries', 'implantaat', 'endodontie', 'extractie', ...]

// Step 2: Fallback to noun phrase extraction if no keyword found
// Extract 2-word phrases or single significant word
```

### 2. Context-Aware Question Templates

Based on query context, Butler generates relevant follow-up questions:

**Template Categories:**

**A) Behandeloptie queries:**
- Query contains: "behandeloptie", "behandeling", "therapie", "aanpak"
- Suggestions:
  - "Welke behandelopties zijn er voor {term}?"
  - "Wat zijn de protocollen bij {term}?"
  - "Wat zijn de kosten (UPT codes) voor {term}?"
  - "Wat is de prognose bij {term}?"

**B) Diagnose queries:**
- Query contains: "diagnose", "symptoom", "herken", "detectie"
- Suggestions:
  - "Wat zijn de symptomen van {term}?"
  - "Hoe diagnosticeer je {term}?"
  - "Welke behandelingen zijn er voor {term}?"
  - "Wat is de prognose van {term}?"

**C) Procedure queries:**
- Query contains: "workflow", "procedure", "protocol", "stappen", "hoe", "doen"
- Suggestions:
  - "Wat is de workflow voor {term}?"
  - "Welke materialen heb je nodig voor {term}?"
  - "Wat zijn de UPT codes voor {term}?"
  - "Wat is de duur van {term}?"

**D) General queries:**
- Fallback for all other queries
- Suggestions:
  - "Wat is {term}?"
  - "Waar vind ik informatie over {term}?"
  - "Zijn er protocollen voor {term}?"
  - "Wat zijn de kosten voor {term}?"

### 3. Two-Tier UI Presentation

**Tier 1: Quick Refinement Panel (NEW)**
- Appears **immediately** after search, ABOVE main answer
- Prominent gradient card with "Verfijn je vraag" title
- 2-column grid layout (responsive)
- Click → fills search box + auto-searches refined query
- Purpose: **Progressive disclosure** - narrow down before diving into answer

**Tier 2: Related Questions (existing, enhanced)**
- Appears **after** reading main answer
- Same smart suggestions
- Amber-themed card at bottom
- Purpose: **Exploration** - discover related topics after understanding current answer

---

## 📐 Implementation Details

### Backend: `src/services/careButlerAskService.ts`

#### New Function: `generateSmartSuggestions()`
```typescript
function generateSmartSuggestions(
  query: string,
  intent: QueryIntent
): string[] {
  // 1. Extract clinical term (longest keyword match)
  // 2. Detect question type (behandeloptie/diagnose/procedure/general)
  // 3. Select appropriate template set
  // 4. Generate 4 context-aware suggestions
  // 5. Filter out current query if it matches a template
  return suggestions;
}
```

#### Updated Function: `generateSuggestedQuestions()`
```typescript
function generateSuggestedQuestions(
  citations: Citation[],
  query: string,
  intent: QueryIntent // ← NEW parameter
): string[] {
  // Try smart suggestions first (term extraction)
  const smartSuggestions = generateSmartSuggestions(query, intent);

  if (smartSuggestions.length > 0) {
    return smartSuggestions; // ← Use smart algorithm
  }

  // Fallback to citation-based suggestions (old behavior)
  return citationBasedSuggestions(citations);
}
```

### Frontend: `src/pages/tzone/CareButlerAsk.tsx`

#### New "Verfijn je vraag" Panel
```tsx
{answer.suggested_questions.length > 0 && (
  <div className="bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 rounded-2xl shadow-lg p-6 border-2 border-teal-200">
    <h3>Verfijn je vraag</h3>
    <p>Klik op een suggestie voor een gerichter antwoord:</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {answer.suggested_questions.map(question => (
        <button onClick={() => {
          setQuery(question);
          handleSearch(question);
        }}>
          {question}
        </button>
      ))}
    </div>
  </div>
)}
```

---

## 🔄 User Flow Example

### Before:
```
User types: "Wat is behandeloptie bij diep caries?"
     ↓
Butler searches for entire phrase
     ↓
Gets 10,720 ice_workflows results (dominated by "behandeloptie" keyword)
     ↓
User sees generic workflows
     ↓
❌ Not helpful
```

### After:
```
User types: "Wat is behandeloptie bij diep caries?"
     ↓
Butler extracts: "diep caries" + detects "behandeloptie" context
     ↓
Butler shows main answer + 4 suggestions:
  1. "Welke behandelopties zijn er voor diep caries?"
  2. "Wat zijn de protocollen bij diep caries?"
  3. "Wat zijn de kosten (UPT codes) voor diep caries?"
  4. "Wat is de prognose bij diep caries?"
     ↓
User clicks #3 (wants cost info)
     ↓
Butler searches specifically for "UPT codes diep caries"
     ↓
Gets precise UPT tariff results
     ↓
✅ Exactly what user needed!
```

---

## 🎨 Design Principles

1. **Progressive Disclosure**
   - Start broad → Butler suggests refinements → User narrows down
   - AI and user collaborate in steps, not one-shot search

2. **Context Awareness**
   - Different suggestions for different query types
   - Clinical context drives template selection

3. **Time Efficiency**
   - Quick refinement panel at top = immediate action
   - No need to manually rephrase query
   - One click to refined results

4. **Visual Hierarchy**
   - Top panel (teal gradient) = "Refine NOW"
   - Bottom panel (amber) = "Explore MORE"
   - Clear distinction in color and positioning

---

## 📊 Expected Impact

### Metrics to Track:
- **Refinement click rate:** % of users clicking suggested questions
- **Result relevance:** Do refined searches have higher confidence scores?
- **Time to answer:** Average search iterations before user stops
- **Source diversity:** Do refined searches show more varied source types?

### Success Criteria:
- ✅ 30%+ of searches trigger smart suggestions
- ✅ 40%+ of users click at least one suggestion
- ✅ Average confidence score improves by 0.1+ after refinement
- ✅ Top 5 results show >= 3 different source types

---

## 🔧 Configuration

### Add New Clinical Terms:
```typescript
// src/services/careButlerAskService.ts:65
const CLINICAL_KEYWORDS = [
  // Add new terms here
  'nieuwe_term',
  // ...
];
```

### Add New Question Templates:
```typescript
// src/services/careButlerAskService.ts:76
const QUESTION_TEMPLATES = {
  new_category: [
    'Template vraag 1 voor {term}?',
    'Template vraag 2 voor {term}?',
  ],
};
```

### Adjust Detection Logic:
```typescript
// src/services/careButlerAskService.ts:934
if (/nieuwe_keywords|pattern/i.test(queryLower)) {
  questionType = 'new_category';
}
```

---

## 🚀 Future Enhancements

1. **Real-time Suggestions While Typing**
   - Show suggestions in dropdown as user types
   - Like Google autocomplete

2. **Learning from Clicks**
   - Track which suggestions users click most
   - Rank popular refinements higher

3. **Multi-term Extraction**
   - Handle queries with multiple clinical terms
   - "diep caries en pulpitis" → suggest for both

4. **Location-Aware Suggestions**
   - "implantologie Almelo" → add location-specific suggestions
   - "Wat zijn de implantologie protocollen in Raalte?"

5. **Visualization Hints**
   - Icons next to suggestions (💰 for costs, 📋 for protocols)
   - Visual cues for suggestion categories

---

## 📝 Testing Scenarios

### Test Case 1: Clinical Diagnosis Query
```
Input: "Wat zijn de symptomen van pulpitis?"
Expected extraction: "pulpitis"
Expected type: "diagnose"
Expected suggestions:
  - "Wat zijn de symptomen van pulpitis?"
  - "Hoe diagnosticeer je pulpitis?"
  - "Welke behandelingen zijn er voor pulpitis?"
  - "Wat is de prognose van pulpitis?"
```

### Test Case 2: Treatment Procedure Query
```
Input: "Hoe doe ik een wortelkanaalbehandeling?"
Expected extraction: "wortelkanaal"
Expected type: "procedure"
Expected suggestions:
  - "Wat is de workflow voor wortelkanaal?"
  - "Welke materialen heb je nodig voor wortelkanaal?"
  - "Wat zijn de UPT codes voor wortelkanaal?"
  - "Wat is de duur van wortelkanaal?"
```

### Test Case 3: Treatment Options Query
```
Input: "Wat is behandeloptie bij diep caries?"
Expected extraction: "diep caries"
Expected type: "behandeloptie"
Expected suggestions:
  - "Welke behandelopties zijn er voor diep caries?"
  - "Wat zijn de protocollen bij diep caries?"
  - "Wat zijn de kosten (UPT codes) voor diep caries?"
  - "Wat is de prognose bij diep caries?"
```

### Test Case 4: General Query (no clinical term)
```
Input: "Hoe werkt de autoclaaf?"
Expected extraction: "autoclaaf" (fallback extraction)
Expected type: "general"
Expected suggestions:
  - "Wat is autoclaaf?"
  - "Waar vind ik informatie over autoclaaf?"
  - "Zijn er protocollen voor autoclaaf?"
  - "Wat zijn de kosten voor autoclaaf?"
```

---

## 🏆 Credits

**Concept:** User feedback - "Butler en gebruiker moeten samen stappen maken"
**Implementation:** Progressive disclosure pattern + template-based suggestion engine
**Date:** 2025-12-25

**Related Issues:**
- SOURCE_WEIGHTS rebalancing (protocols: 110, ice_workflows: 85)
- Multi-source ranking improvements
- Smart term extraction algorithm

---

**Status:** ✅ Implemented and production-ready

---

## 🏥 CLINICAL QUALITY IMPROVEMENTS (2025-12-25 - Update 2)

### Problem Identified (User Feedback):

**Query:** "gingivitis"

**Issues:**
1. ❌ Most relevant results (treatment options, prosthetic considerations) appeared **at bottom**
2. ❌ Suggestions were NOT clinically useful:
   - "Wat is gingivitis?" (everyone knows this already)
   - "Wat zijn de kosten voor gingivitis?" (diagnoses don't have costs, treatments do)
3. ❌ Generic questions not appropriate for dental professionals

**User insight:** "Niet echt bruikbaar want in een tandartspraktijk weet iedereen wat gingivitis is. En gingivitis is een diagnose - de vraag 'wat zijn de kosten voor gingivitis?' is niet goed. AI moet nog meer zijn best doen. Het is nog niet kliniek niveau."

---

### Solutions Implemented:

#### 1. Diagnosis-Aware Question Templates

**Before (generic):**
```typescript
diagnose: [
  'Wat zijn de symptomen van {term}?',      // ← Too basic
  'Hoe diagnosticeer je {term}?',           // ← Not actionable
  'Welke behandelingen zijn er voor {term}?',
  'Wat is de prognose van {term}?',
]
```

**After (clinically focused):**
```typescript
diagnose: [
  'Welke behandelopties zijn er bij {term}?',     // ← Actionable
  'Wat zijn de protocollen voor {term}?',         // ← Practical
  'Wat zijn de risicofactoren voor {term}?',      // ← Clinical insight
  'Welke complicaties kunnen optreden bij {term}?', // ← Prevention
]
```

**Rationale:**
- Dental professionals know WHAT a diagnosis is
- They need ACTIONABLE information: treatments, protocols, risk factors
- Skip basic definitions, focus on clinical decision support

#### 2. Known Diagnosis Detection

Added **DIAGNOSIS_TERMS** list to automatically detect diagnosis queries:

```typescript
const DIAGNOSIS_TERMS = [
  'gingivitis', 'parodontitis', 'periodontitis', 'pulpitis',
  'caries', 'cariës', 'alveolitis', 'periimplantitis',
  'mucositis', 'stomatitis', 'abces', 'fistel',
  'fractuur', 'luxatie', 'avulsie', 'erosie',
  'attrition', 'abrasie', 'slijtage', 'bruxisme',
  // ... (28 total terms)
];
```

**Detection Logic:**
```typescript
// Check if extracted term is a known diagnosis
const isDiagnosis = DIAGNOSIS_TERMS.some(d =>
  clinicalTerm.includes(d) || d.includes(clinicalTerm)
);

// Priority system:
if (/behandeloptie|behandeling/i.test(query)) {
  questionType = 'behandeloptie';  // Priority 1: Explicit context
}
else if (isDiagnosis) {
  questionType = 'diagnose';       // Priority 2: Known diagnosis
}
```

**Example:**
- Query: "gingivitis" → Detects as diagnosis → Shows treatment/protocol questions
- Query: "implantaat" → Not a diagnosis → Shows procedure/material questions

#### 3. Ranking Boost for Treatment Templates

**Problem:** Treatment options appeared at bottom of results

**Fix:** Increased weights for treatment-focused sources:

```typescript
// Before:
protocols: 110
ice_templates: 95
interventie_templates: 95          // ← Too low
behandeloptie_templates: 95        // ← Too low
ice_workflows: 85

// After:
behandeloptie_templates: 120       // ← HIGHEST (+25)
interventie_templates: 120         // ← HIGHEST (+25)
ice_templates: 115                 // ← High (+20)
protocols: 105                     // ← High (but lower than treatments)
ice_workflows: 80                  // ← Lowered (-5)
```

**Effect:**
- Treatment options now dominate top results
- Protocols still rank high but below treatment options
- Workflows demoted to supporting role
- Clinical relevance prioritized over generic workflows

#### 4. New Question Template Category: Material

Added dedicated templates for equipment/materials (not diagnoses or procedures):

```typescript
material: [
  'Waar vind ik {term}?',
  'Hoe gebruik je {term}?',
  'Wat zijn alternatieven voor {term}?',
  'Wat is de houdbaarheid van {term}?',
]
```

**Example:** "autoclaaf" → Material questions, not diagnosis questions

---

### Expected Improvements:

#### For "gingivitis" Query:

**Before:**
1. Generic workflow results
2. "Wat is gingivitis?" (not useful)
3. "Wat zijn de kosten voor gingivitis?" (nonsensical)
4. Relevant results buried at bottom

**After:**
1. **Gingivitis behandeloptie** (ice_templates, weight 120) ← TOP
2. **Marginale pasoormprobleem van kroon** (interventie_templates, weight 120)
3. **Ontsteking rond brugconstructie** (ice_templates, weight 115)
4. **Protocollen voor gingivitis** (protocols, weight 105)
5. Generic workflows (if relevant, weight 80) ← BOTTOM

**Suggestions:**
- "Welke behandelopties zijn er bij gingivitis?"
- "Wat zijn de protocollen voor gingivitis?"
- "Wat zijn de risicofactoren voor gingivitis?"
- "Welke complicaties kunnen optreden bij gingivitis?"

---

### Clinical Quality Checklist:

✅ **Professional-level questions** (no "Wat is X?" for known terms)
✅ **Actionable suggestions** (treatments, protocols, risks, complications)
✅ **Diagnosis awareness** (auto-detect 28+ diagnosis terms)
✅ **Treatment-first ranking** (interventions/behandelopties at top)
✅ **Context-appropriate** (different templates for diagnoses vs procedures vs materials)
✅ **No nonsensical questions** (no "costs of diagnosis", only "costs of treatment")

---

### Testing:

**Test Case 1: Known Diagnosis**
```
Input: "gingivitis"
Expected detection: isDiagnosis = true
Expected type: "diagnose"
Expected top results: behandeloptie_templates, interventie_templates
Expected suggestions:
  - "Welke behandelopties zijn er bij gingivitis?"
  - "Wat zijn de protocollen voor gingivitis?"
  - "Wat zijn de risicofactoren voor gingivitis?"
  - "Welke complicaties kunnen optreden bij gingivitis?"
```

**Test Case 2: Known Diagnosis with Context**
```
Input: "parodontitis behandeling"
Expected detection: isDiagnosis = true, explicit "behandeling" context
Expected type: "behandeloptie" (context override)
Expected top results: behandeloptie_templates
Expected suggestions:
  - "Welke behandelopties zijn er voor parodontitis?"
  - "Wat zijn de protocollen bij parodontitis?"
  - ...
```

**Test Case 3: Procedure (not diagnosis)**
```
Input: "wortelkanaalbehandeling"
Expected detection: isDiagnosis = false
Expected type: "procedure"
Expected suggestions:
  - "Wat is de workflow voor wortelkanaal?"
  - "Welke materialen heb je nodig voor wortelkanaal?"
  - "Wat zijn de UPT codes voor wortelkanaal?"
  - "Hoeveel tijd kost wortelkanaal?"
```

---

### Metrics to Track:

1. **Clinical Relevance Score:**
   - % of top 3 results that are treatment/intervention templates
   - Target: 70%+ for diagnosis queries

2. **Suggestion Click Rate:**
   - % of users clicking diagnosis-specific suggestions
   - Target: 50%+ for known diagnoses

3. **Result Position:**
   - Average position of behandeloptie/interventie templates in results
   - Target: Position 1-2 (top of list)

4. **User Satisfaction:**
   - Track if users refine their search after seeing initial results
   - Lower refinement rate = better initial results
   - Target: <30% refinement rate for diagnosis queries

---

**Status:** ✅ Clinical quality improvements implemented, pending user verification
