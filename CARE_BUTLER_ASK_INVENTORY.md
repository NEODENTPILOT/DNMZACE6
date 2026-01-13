# CARE BUTLER ASK — TECHNICAL & LOGICAL INVENTORY

**Report Generated:** 2024-12-25
**Assessment:** Brutal Honesty Mode — No Optimism, Only Facts

---

## SECTION 1 — ENTRY POINTS

### Pages/Components
- **Primary UI:** `src/pages/tzone/CareButlerAsk.tsx`
- **Route:** `/care-butler-ask` (registered in `App.tsx:390`)
- **Legacy components (unused):**
  - `src/legacy/care-butler-v1/CareButlerAsk.tsx`
  - `src/legacy/care-butler-v1/careButlerAskService.ts`

### Widgets/Links
- None found in dashboard
- No shortcut widgets
- Must navigate via menu to T-ZONE+ → Care Butler Ask

### Feature Flags
- **None.** Always enabled for all users.
- No role-based restrictions.
- No A/B testing flags.

---

## SECTION 2 — DATA SOURCES (CRITICAL)

### Search Adapters (Database-Configured)
Total: **9 adapters** loaded from `search_adapters` table

| Adapter Name | Table/View | Schema Fields | Purpose | Domain |
|-------------|-----------|---------------|---------|--------|
| `behandeloptie_templates` | `behandeloptie_templates` | `naam` (title) | Treatment options | Clinical |
| `checklists` | `checklist_instances` | `titel`, `notities`, `status` | Room prep checklists | Operational |
| `ice_templates` | `behandelplan_templates` | `naam`, `template_rationale`, `diagnosis_template_code`, `categorie` | ICE treatment plan templates | Clinical |
| `ice_workflows` | `interventie_workflows` | `naam`, `omschrijving`, `fase`, `rol` | Treatment workflows | Clinical |
| `interventie_templates` | `interventie_templates` | `naam`, `opmerking`, `fase` | Specific treatment steps | Clinical |
| `inventory` | `inventory_assets` | `naam`, `omschrijving`, `locatie_naam` | Equipment/materials | Operational |
| `protocols` | `protocols` | `titel`, `omschrijving` | Treatment protocols | Clinical |
| `tasks` | `hq.tasks` | `title`, `description`, `status` | Assigned tasks | Operational |
| `timeline_events` | `timeline_events` | `titel`, `body`, `event_type` | Posts/messages | Social |

### Queries Executed

**For each adapter:**
```sql
SELECT * FROM [table_name]
WHERE [config.filters]              -- e.g., is_actief = true
AND (
  [title_field] ILIKE '%keyword1%' OR
  [title_field] ILIKE '%keyword2%' OR
  [snippet_field] ILIKE '%keyword1%' OR
  [snippet_field] ILIKE '%keyword2%'
)
ORDER BY [order_field] [ASC/DESC]
LIMIT 50;
```

**Then:** In-memory ranking by relevance score, return top 10 per adapter.

**Final:** Top 5 citations across all adapters combined.

### Explicit Source Confirmation

| Source Type | Used? | Notes |
|------------|-------|-------|
| ICE Template Builder | ✅ YES | `ice_templates`, `behandeloptie_templates`, `interventie_templates` |
| ICE Workflow | ✅ YES | `interventie_workflows` table |
| Diagnoses tables | ⚠️ INDIRECT | Via `behandelplan_templates.diagnosis_template_code` only |
| Zorgdoel / behandelopties | ⚠️ INDIRECT | Via `behandeloptie_templates` (NO zorgdoel data) |
| Protocols | ✅ YES | `protocols` table |
| Checklists | ✅ YES | `checklist_instances` |
| Timeline / posts | ✅ YES | `timeline_events` |
| Inventory | ✅ YES | `inventory_assets` |

### Critical Data Gaps

**NOT USED:**
- `ice_reasoning_behandelplannen_v` (clinical reasoning view with diagnosis chains)
- `vw_diagnosis_synonym_lookup` (diagnosis synonyms)
- `patient_diagnoses` (patient-specific diagnoses)
- `diagnosis_alerts` (contraindications, warnings)
- `care_requirements` (treatment requirements/dependencies)
- `care_requirement_options` (treatment option constraints)
- `zorgdoelen`, `zorgwens` (care goals, patient wishes)

**MISSING FIELDS IN ADAPTERS:**
- `behandeloptie_templates` has NO `snippet_field` configured (search broken)
- `interventie_templates.opmerking` often empty (poor snippets)
- No access to UPT codes (pricing context missing)
- No access to anatomical scope (tooth/jaw context missing)

---

## SECTION 3 — AI PROMPT ANALYSIS

### System Prompt (Exact Text)

```
Je bent een medische AI-assistent voor een tandartspraktijk. Je taak is om vragen te beantwoorden op basis van gevonden bronnen.

BELANGRIJKE RICHTLIJNEN:
- Gebruik ALLEEN informatie uit de gegeven bronnen
- Pas clinical reasoning toe bij medische vragen
- Wees helder en beknopt (max 200 woorden)
- Bij behandelopties: vermeld indicaties, contra-indicaties en prognose
- Verwijs altijd naar de bron(nen)
- Als bronnen niet relevant zijn, geef dat eerlijk toe
```

### User Prompt (Template)

```
Vraag: [user_question]

Gevonden bronnen:
**[citation_1_title]** ([citation_1_type])
[citation_1_snippet]

---

**[citation_2_title]** ([citation_2_type])
[citation_2_snippet]

[... up to 5 citations]

Geef een helder, professioneel antwoord op de vraag. Gebruik ALLEEN informatie uit de bronnen hierboven.
```

### AI Configuration

- **Model:** `gpt-4o-mini`
- **Temperature:** `0.3` (low randomness)
- **Max Tokens:** `500` (short responses)
- **Fallback:** Template-based response if AI fails

### Hardcoded Logic

**Keyword Extraction:**
- Dutch stopwords: `de, het, een, is, wat, hoe, waar, wie, wanneer, waarom, zijn, van, voor, bij, met, aan, op, in, uit, naar, over, dat, dit, deze, die, kan, moet`
- Filters words < 3 characters
- No stemming, no lemmatization, no synonym expansion

**Relevance Scoring Weights:**
- Title exact match: 30%
- Keyword overlap: 40%
- Recency boost: 20%
- Metadata match: 10% (placeholder, always 0)

**Confidence Thresholds:**
- Direct answer: ≥ 0.6
- Suggest existing: ≥ 0.4 (AND citation type = 'post')
- Needs clarification: avg score ≥ 0.2
- Handoff to Quick Posts: < 0.2

### Explicit Answers

| Capability | Present? | Evidence |
|-----------|----------|----------|
| **Clinical reasoning logic** | ❌ NO | System prompt INSTRUCTS AI to apply it, but provides NO reasoning data (no diagnosis chains, no contraindications, no prognosis data) |
| **Diagnostic hierarchy** | ❌ NO | No procesgebieden, no diagnose_templates, no hoofddiagnose vs. bijkomende logic |
| **Medical safety logic** | ❌ NO | No diagnosis_alerts table queried, no contraindications checked |
| **Domain separation** | ⚠️ PARTIAL | Scope tags exist (`care_best` vs `care_max`) but not enforced; all adapters searched together |

---

## SECTION 4 — CURRENT LOGIC FLOW

### Step-by-Step Execution

**1. Input Received**
- User types question in UI
- Input: `{ question: string, user_id: string, scope: 'auto', locationScope: 'both' }`

**2. Data Retrieved (Parallel Search)**
- Load 9 search adapters from `search_adapters` table (or fallback to hardcoded)
- For each adapter:
  - Extract keywords from question (stopword filtering)
  - Build ILIKE query: `title ILIKE '%kw1%' OR title ILIKE '%kw2%' OR snippet ILIKE '%kw1%' ...`
  - Fetch 50 results, rank by relevance, return top 10
- Combine all adapter results (max 90 citations)
- Rank by relevance score, keep top 5

**3. AI Prompt Composed**
- Concatenate top 5 citations into prompt
- Format: `**[title]** ([type])\n[snippet]\n\n---\n\n`
- Add system prompt + user question

**4. AI Response Processed**
- Call OpenAI edge function (gpt-4o-mini, temp=0.3, max_tokens=500)
- If success: return AI-generated answer
- If failure: fallback to template: `"Gevonden: [citation.title]\n\n[citation.snippet]\n\n*Bron: [type]*"`

**5. Output Rendered**
- Answer title + body (markdown-like, client-side parsing)
- Citations list (max 5) with routes
- Suggested actions (navigate / handoff)
- Suggested questions (hardcoded templates per citation type)

### Where Logic is Naive / Flat

1. **Keyword extraction:**
   - No NLP, no stemming ("implantaten" ≠ "implantaat")
   - No medical synonym expansion ("cariës" ≠ "tandbederf")
   - No diagnosis code matching (DX_ALVEOLITIS not recognized)

2. **Relevance ranking:**
   - Pure keyword overlap + recency
   - No semantic similarity (embeddings)
   - No clinical priority (protocols > posts, but not weighted)
   - Recent posts rank higher than older protocols (WRONG)

3. **Citation context:**
   - Citations are text snippets, no structured data
   - No diagnosis-to-treatment links
   - No UPT codes, no anatomical scope
   - No care requirements, no contraindications

4. **AI synthesis:**
   - AI receives flat text, no structured clinical data
   - No reasoning chain input (hoofddiagnose → behandelopties → interventies)
   - No safety data (diagnosis alerts, drug interactions)
   - AI must hallucinate clinical logic from text alone

### Where Domain Context is Lost

- **Clinical vs. operational mixing:** Checklists for sterilization ranked equally with treatment protocols
- **No role awareness:** Assistant sees same results as dentist
- **No patient context:** Can't access current patient's diagnoses/treatments
- **No location filtering:** Almelo equipment mixed with Raalte inventory
- **No temporal logic:** Doesn't know if protocol is current or outdated

### Where Irrelevant Answers Enter

**Example query:** "Wat zijn behandelopties voor Caries profunda?"

**What happens:**
1. Keywords extracted: `["behandelopties", "caries", "profunda"]`
2. Timeline posts about "nieuwe caries-boor besteld" rank high (keyword match)
3. ICE template "Diepe cariës" found but ranked LOW (no exact title match)
4. Checklist "Controle na cariës behandeling" ranks HIGHER than treatment protocol
5. AI receives: post about equipment, checklist, random workflows
6. AI synthesizes: generic answer about checking equipment before caries treatment

**Why wrong:**
- No clinical hierarchy (diagnosis templates should rank highest)
- No synonym matching (cariës ≠ caries in stopword list)
- No domain separation (operational posts contaminate clinical search)

---

## SECTION 5 — GAP ANALYSIS (MOST IMPORTANT)

| Required Capability | Present | Missing | Notes |
|---------------------|---------|---------|-------|
| **Clinical reasoning** | ❌ | ✅ | AI instructed to reason, but receives flat text, no diagnosis chains |
| **Zorgdoel mapping** | ❌ | ✅ | Zorgdoelen/zorgwens tables exist but not queried |
| **ICE workflow logic** | ⚠️ | ⚠️ | Workflows queried but not linked to diagnoses/behandelopties |
| **Protocol precedence** | ❌ | ✅ | Protocols rank equally with posts (recency bias) |
| **Role-based reasoning** | ❌ | ✅ | No role filtering (assistant sees dentist-only protocols) |
| **Location awareness** | ⚠️ | ⚠️ | Location field exists but not consistently used |
| **Safety boundaries** | ❌ | ✅ | No diagnosis_alerts, no contraindications checked |
| **Diagnosis code matching** | ❌ | ✅ | No DX_ code recognition, no synonym lookup |
| **Treatment hierarchy** | ❌ | ✅ | No hoofddiagnose → behandeloptie → interventie chain |
| **UPT context** | ❌ | ✅ | No pricing/tariff data for treatment reasoning |
| **Anatomical scope** | ❌ | ✅ | No tooth/jaw filtering (jaw-specific treatments invisible) |
| **Patient context** | ❌ | ✅ | No access to current patient's diagnoses/status praesens |
| **Care requirements** | ❌ | ✅ | No treatment requirement dependencies checked |
| **Semantic search** | ❌ | ✅ | No embeddings, no similarity matching |
| **Medical synonyms** | ❌ | ✅ | vw_diagnosis_synonym_lookup exists but unused |

---

## SECTION 6 — RISK ASSESSMENT

### Why Current Output Feels "Onzin"

**Root Causes:**

1. **Clinical reasoning is instructed, not implemented**
   - System prompt says: "Pas clinical reasoning toe bij medische vragen"
   - Reality: AI receives 5 text snippets with no clinical structure
   - Result: AI must guess or hallucinate clinical logic

2. **Domain contamination**
   - Clinical question: "behandelopties voor pulpitis"
   - Receives: timeline post "nieuwe boor besteld", checklist "OK 3 schoonmaak", protocol "Endodontie"
   - AI synthesizes: answer about equipment and cleaning (WRONG)

3. **No diagnostic hierarchy**
   - DX_PULPITIS_IRREVERSIBEL exists in database
   - Care Butler Ask doesn't know it exists
   - Treats "pulpitis" as keyword, not diagnosis code
   - Misses behandelopties linked to DX_PULPITIS_IRREVERSIBEL

4. **Keyword matching is primitive**
   - "implantaten" ≠ "implantaat" (no stemming)
   - "cariës" ranked lower than "caries" (different spelling)
   - "alveolitis" vs "droge socket" (no synonyms)

5. **Recency bias destroys clinical priority**
   - Recent post "nieuwe autoclaaf besteld" ranks HIGHER than
   - Older protocol "Endodontie bij pulpitis" (created 6 months ago)
   - Recency boost: 20% weight (too high for clinical knowledge)

6. **Flat search across incompatible domains**
   - Query: "temporisatie afbouw"
   - Returns: checklist voor temporisatie (operational)
   - Misses: ICE template "Temporisatie met afbouw" (clinical)
   - Why: Both match keywords, but operational has better recency

### Architectural Choices That Cause This

**Choice 1: "Multi-source search orchestration"**
- **Intent:** Search everything at once, AI will figure it out
- **Reality:** AI can't distinguish clinical from operational from social
- **Impact:** Garbage in, garbage out

**Choice 2: "Relevance scoring = keyword overlap + recency"**
- **Intent:** Recent content is more relevant
- **Reality:** Clinical protocols don't age like news articles
- **Impact:** Old protocols buried by new equipment posts

**Choice 3: "AI synthesis from flat text snippets"**
- **Intent:** Let LLM handle complexity
- **Reality:** LLM has no diagnosis-treatment mappings, no contraindications data
- **Impact:** AI invents clinical logic not supported by database

**Choice 4: "Dynamic adapter system for flexibility"**
- **Intent:** Easy to add new sources
- **Reality:** No domain boundaries, no clinical precedence
- **Impact:** All sources treated equally (checklists = protocols = diagnoses)

**Choice 5: "Graceful failure for missing sources"**
- **Intent:** Don't crash if table doesn't exist
- **Reality:** Silently skips critical clinical data (ice_reasoning view)
- **Impact:** System works but produces wrong answers (worse than crashing)

### What Care Butler Ask Actually Is

**NOT:**
- ❌ A clinical reasoning engine
- ❌ A diagnostic decision support system
- ❌ A knowledge management system with domain logic

**IS:**
- ✅ A keyword-based search aggregator
- ✅ A flat text summarizer with AI gloss
- ✅ An unstructured chatbot over heterogeneous data

**Analogy:**
```
Care Butler Ask = Google Search (2005) + ChatGPT prompt
```

- Searches everything with keywords (like Google)
- Ranks by keyword match + recency (like PageRank, but worse)
- Passes top 5 results to LLM for summarization (like ChatGPT over web results)
- No domain knowledge, no reasoning, no structure

**Critical Flaw:**
The system has access to structured clinical data (diagnoses, behandelopties, care requirements, contraindications) but throws it away and reduces everything to flat text before sending to AI.

It's like having a medical database and asking ChatGPT to read 5 random sentences from it instead of querying the actual relationships.

---

## SECTION 7 — HARD CONCLUSION

**What exactly is Care Butler Ask right now?**

Care Butler Ask is a **naive keyword search aggregator** that queries 9 disconnected tables in parallel, ranks results by basic text similarity and recency, dumps the top 5 into an OpenAI prompt with a medical-sounding system message, and hopes the LLM can reconstruct clinical logic from text fragments that were deliberately stripped of their relational structure.

It is architecturally incapable of clinical reasoning because it discards the diagnostic hierarchy, treatment dependencies, and contraindication data before synthesis begins. The system prompt instructs the AI to "apply clinical reasoning" while providing no reasoning data — equivalent to asking a medical student to diagnose a patient by reading 5 random sentences from different textbooks.

The result is a chatbot that produces plausible-sounding but medically unreliable answers by mixing clinical protocols with operational checklists and social posts, weighted by recency rather than clinical priority. It feels like "onzin" because it fundamentally is: the architecture treats medical knowledge as unstructured text rather than as a graph of causal relationships.

This is not a bug. It is the logical outcome of the architectural choice to flatten all domain knowledge into keyword-searchable snippets before AI synthesis, thereby destroying the very structure required for sound clinical reasoning.

---

**END OF REPORT**
