# Care Butler Canon

## Overview
Care Butler is an AI-powered knowledge layer split into 5 distinct modules. It's NOT a single form with dropdowns, but a distributed intelligence system across the entire app.

---

## 1. Care Butler ASK (Knowledge Search)

**Purpose**: Answer questions BEFORE posting to avoid duplicate threads and enable self-service.

**Input**: Single text input (no intent chips, no dropdowns)

**Search Sources**:
- Timeline events (previous posts)
- Protocols
- Checklists
- Inventory (assets/items)
- Tasks
- Workflows
- ICE templates

**Output**:
- **Answer Found**: Direct answer + links to sources
- **Similar Exists**: Related threads/documents
- **No Match**: Suggest creating Quick Post

**Rules**:
- Default location filter: BOTH
- AI determines relevance
- No manual intent selection
- Clean, minimal UI

**Routes**:
- `/care-butler-ask`
- Dashboard hero widget (prominent placement)
- Menu: T-ZONE+ → Care Butler (Ask)

---

## 2. Care Best (Clinical AI)

**Purpose**: Clinical decision support for diagnosis, treatment, and workflows.

**Modules**:
- Rx Generator (no patient data)
- Diagnosis → Treatment options + interventions
- Care Goals → Recommended interventions
- Workflow calculations:
  - DNMZ time
  - Practitioner time
  - Field norm time
  - UPT tariffs 2025/2026

**Data Sources**:
- ICE Template Builder
- DNMZ protocols
- Clinical guidelines
- App data (procedures, treatments)

**Status**: P1 (skeleton hub created)

---

## 3. Care Max (Practice AI)

**Purpose**: Operations, facilities, and resource management.

**Scope**:
- Equipment & inventory optimization
- Facilities (GWL)
- Hygiene & infection prevention (RDS/HIP)
- Insurance & suppliers
- Maintenance planning
- Scheduling (future)

**Status**: P1 (skeleton hub created)

---

## 4. Learning Layer (Background)

**Purpose**: Continuous improvement through pattern analysis.

**Tracks**:
- Repeated questions
- Knowledge gaps per role
- Unclear protocols
- Onboarding improvement signals

**Feeds Into**:
- Tutor+ system
- Onboarding templates
- Process improvement initiatives

**Status**: P2 (logging infrastructure via `dnmz_ai_gate_sessions`)

---

## 5. Quick Posts (Content Creation)

**Purpose**: Fast posting with AI assistance for title, tagging, and follow-up.

**Types**:
- News (announcements)
- Update (follow-ups)
- Ticket (enquiry/maintenance/order)

**Features**:
- Zone/Circle targeting
- Intent tagging (VRAAG, AANKONDIGING, etc.)
- Media upload
- Read modes (optional/requires acknowledgement)

**Route**: `/tzone/quick-posts` (reuses TZoneNewPost UI)

---

## Hard Rules

### Location Filter
- NO fixed location per user
- Default: BOTH locations visible
- User can manually filter if needed
- AI suggests relevance, but doesn't enforce

### UI Philosophy
- Care Butler ASK: Clean, single input, no chips
- Quick Posts: Full form with intents/threads/tagging
- Separation of concerns: search vs. create

### Data Safety
- ASK queries logged via `dnmz_ai_gate_sessions`
- Learning signals stored separately
- No PII in search logs

---

## Implementation Status

### ✅ P0 Complete
- Care Butler ASK page
- Dashboard hero widget
- Menu integration
- careButlerAskService (multi-source search)
- Routes configured

### ✅ P1 Complete
- CareBest skeleton hub
- CareMax skeleton hub
- Quick Posts (renamed TZoneNewPost)

### 🚧 P2 Pending
- Learning Layer analytics
- CareBest module implementations
- CareMax module implementations
- Advanced AI synthesis

---

## Architecture

```
Care Butler (umbrella term)
├── ASK (knowledge search) ← P0 ✅
├── Care Best (clinical AI) ← P1 skeleton ✅
├── Care Max (practice AI) ← P1 skeleton ✅
├── Learning Layer (analytics) ← P2
└── Quick Posts (creation) ← P0 ✅
```

---

**Last Updated**: 2024-12-25
**Version**: 1.0
**Status**: P0 Complete, P1 Skeletons Ready
