# Zorgdoelen & Zorgwens System

## Conceptual Model (MANDATORY)

**Strict separation of concerns:**

1. **Zorgwens** = Subjective patient desire ("wat wil de patiënt?")
2. **Zorgdoel** = Objective, medically justified goal ("wat is professioneel nodig?")
3. **Zorgplan** = Strategy derived from zorgdoelen ("hoe gaan we dit aanpakken?")

## Component Architecture

**File:** `src/components/clinidoc/ZorgdoelenZorgwensPanel.tsx`
**Parent:** `src/components/clinidoc/IntegraleQuickscanForm.tsx`
**Activation:** Only when `zorgrichting === 'temporiseerde_afbouw'`

---

## Section A — Zorgwens (Patiënt)

### Purpose
Capture the patient's personal wishes WITHOUT medical filtering.

### Fields

#### 1. zorgwensPatient (textarea, required)
- Patient's own words
- No validation against feasibility
- Never auto-modified by AI
- Placeholder: "Bijv. mooiere lach, geen pijn, zo min mogelijk behandelingen"

#### 2. zorgwensCategorie (multi-select, optional)
Available categories:
- `esthetiek` - Esthetiek
- `comfort` - Comfort
- `pijnvrij` - Pijnvrij
- `snelheid` - Snelheid
- `kostenbeheersing` - Kostenbeheersing
- `angstvermindering` - Angstvermindering
- `duurzaamheid` - Duurzaamheid

### Data Storage
```json
{
  "zorgwens": {
    "zorgwensPatient": "Ik wil zo min mogelijk behandelingen",
    "zorgwensCategorie": ["comfort", "kostenbeheersing"]
  }
}
```

---

## Section B — Zorgdoelen (Professioneel & gezamenlijk)

### Purpose
Define MEDICAL objectives based on onderzoek + overleg.

### Fields

#### 1. voorgesteldeZorgdoelen (multi-select, required)
Available goals:
- `behoud_van_tanden` - Behoud van tanden
- `behoud_functionele_dentitie` - Behoud functionele dentitie
- `infectiecontrole` - Infectiecontrole
- `stabilisatie_parodontium` - Stabilisatie parodontium
- `vervanging_niet_redbare_elementen` - Vervanging niet-redbare elementen
- `functioneel_herstel` - Functioneel herstel
- `esthetisch_herstel` - Esthetisch herstel
- `voorbereiden_prothetiek` - Voorbereiden prothetiek

#### 2. zorgdoelToelichting (textarea, required)
- Professional rationale
- Based on diagnosis and prognosis
- Placeholder: "Onderbouwing op basis van diagnose en prognose"

#### 3. behandelstrategieType (select, required)
Available strategies:
- `conservatief` - Conservatief
- `temporiseerde_afbouw` - Temporiseerde afbouw
- `versneld_afbouw` - Versneld afbouw
- `gefaseerde_reconstructie` - Gefaseerde reconstructie
- `palliatief` - Palliatief

### Rules
- Editable ONLY by clinician role
- AI may suggest but NEVER auto-fill final values

### Data Storage
```json
{
  "zorgdoelen": {
    "voorgesteldeZorgdoelen": [
      "behoud_functionele_dentitie",
      "infectiecontrole"
    ],
    "zorgdoelToelichting": "Patiënt heeft...",
    "behandelstrategieType": "temporiseerde_afbouw"
  }
}
```

---

## Section C — Afstemming & Besluitvorming

### Purpose
Document shared decision making explicitly for medico-legal traceability.

### Fields

#### 1. discrepantieWensDoel (boolean)
- Checkbox to indicate discrepancy between wish and goal
- If true, triggers conditional field

#### 2. toelichtingDiscrepantie (textarea, conditional)
- Required if `discrepantieWensDoel === true`
- Explain where wish and professional goal differ

#### 3. gekozenRichting (select, required)
Available options:
- `volgt_zorgdoel` - Volgt zorgdoel
- `volgt_zorgwens_binnen_grenzen` - Volgt zorgwens binnen grenzen
- `compromis` - Compromis
- `meerdere_opties_open` - Meerdere opties open

#### 4. behandelaarBesluit (textarea, required)
- Professional weighing and final responsibility
- Placeholder: "Professionele afweging en eindverantwoordelijkheid"

### Data Storage
```json
{
  "sharedDecision": {
    "discrepantieWensDoel": true,
    "toelichtingDiscrepantie": "Patiënt wil geen extracties...",
    "gekozenRichting": "compromis",
    "behandelaarBesluit": "Na uitgebreid overleg..."
  }
}
```

---

## Complete Data Structure

Saved in `draft.payload.zorgdoelenZorgwens`:

```json
{
  "zorgdoelenZorgwens": {
    "zorgwens": {
      "zorgwensPatient": "string",
      "zorgwensCategorie": ["string"]
    },
    "zorgdoelen": {
      "voorgesteldeZorgdoelen": ["string"],
      "zorgdoelToelichting": "string",
      "behandelstrategieType": "string"
    },
    "sharedDecision": {
      "discrepantieWensDoel": boolean,
      "toelichtingDiscrepantie": "string",
      "gekozen Richting": "string",
      "behandelaarBesluit": "string"
    }
  }
}
```

---

## UI Behavior

### Completion Tracking
- Each section has completion status (green = complete, orange = incomplete)
- Header badge shows: `X/3 secties compleet`
- Incomplete sections have orange border and background

### Auto-save
- 600ms debounce
- Console log on every save
- Visual feedback: "Opslaan..." → "Opgeslagen"

### Validation
- **Soft validation only** - warnings, no blocking
- User can always proceed
- Orange highlights on incomplete required fields

### Console Logging
```
🔴 DEV DEBUG: Zorgdoelen/Zorgwens autosave
{
  timestamp: "2024-12-21T...",
  data: { ... }
}
```

And in main autosave:
```
🔴 DEV DEBUG: Auto-save triggered
{
  hasZorgdoelenZorgwens: true/false,
  ...
}
```

---

## Medico-Legal Importance

This system explicitly documents:
1. What the patient wants (zorgwens)
2. What is professionally advised (zorgdoel)
3. How discrepancies are resolved (shared decision)
4. Final professional responsibility (behandelaar besluit)

This provides **complete traceability** for informed consent and shared decision making.

---

## Integration Points

### Parent Component
`IntegraleQuickscanForm.tsx`:
- State: `zorgdoelenZorgwens`
- Saved in draft payload
- Included in document generation
- Tracked in debug ribbon

### Conditional Display
Only shown when:
```typescript
advies?.zorgrichting === 'temporiseerde_afbouw'
```

---

**Created:** 2024-12-21
**Last Updated:** 2024-12-21
