# Begrotingen 3.0 - Workflow Uitleg

## 🎯 HOE WERKT DE NIEUWE BEGROTINGSFLOW?

### Stap 1: Start vanuit een Case
De **enige** manier om een begroting aan te maken is via een **Case** of **Behandelplan**.

**Waar:**
- Navigeer naar: **Cases** (in sidebar)
- Open een bestaande case
- Of: open een behandelplan detail

### Stap 2: Open de Begroting Modal
In de case/behandelplan detail pagina klik je op:
- **"Begroting opstellen"** button
- Of: **"Begroting genereren vanuit behandeloptie"**

Dit opent de **NewBudgetModal** (moderne begroting wizard).

### Stap 3: Vul de Begroting met UPT Codes

#### 🔧 HET PROBLEEM DAT JE ZAG (NU OPGELOST!)

**Probleem:**
- De begroting opende LEEG (geen UPT codes)
- Er stond: "Gebruik de AI Assistent om regels toe te voegen"
- De "Vul vanuit interventies" knop was **grijs/disabled**

**Oorzaak:**
1. De automatische `copyInterventieUptCodesToBudget()` functie werkte niet altijd correct
2. De "Vul vanuit interventies" button was ALLEEN enabled voor `scope.type === 'intervention'`
3. Als je een begroting opende vanuit een **behandelplan** (scope = 'plan') of **behandeloptie** (scope = 'option'), was de button disabled

**Fix:**
✅ De "Vul vanuit interventies" button werkt nu voor **ALLE** scope types:
- `intervention` - Direct vanuit interventie
- `option` - Vanuit behandeloptie
- `plan` - Vanuit behandelplan

✅ De functie zoekt nu automatisch de juiste interventies op basis van de scope:
```typescript
// Voor PLAN:
1. Zoek alle behandelopties van het plan
2. Zoek alle interventies van die opties
3. Haal UPT codes op

// Voor OPTION:
1. Zoek alle interventies van de optie
2. Haal UPT codes op

// Voor INTERVENTION:
1. Haal direct UPT codes op
```

### Stap 4: Gebruik de AI Assistent Panel

In de **rechterkant** van de begroting modal zie je het **"AI Assistent"** panel met knoppen:

#### 1. **"Vul vanuit interventies"** ← DE BELANGRIJKSTE!
**Wanneer klikken:**
- Als de begroting leeg is (geen regels)
- Als je alle UPT codes uit de interventies wilt laden

**Wat gebeurt er:**
1. Systeem zoekt alle interventies voor deze scope
2. Haalt alle UPT codes op uit `interventie_upt_codes` tabel
3. Zoekt tarief data op uit `upt_tarief_2025` tabel
4. Maakt budget regels aan in `begrotingen_v2_regels`
5. Toont: "X UPT codes toegevoegd vanuit interventies"

**Nu ALTIJD KLIKBAAR** ✅

#### 2. **"Optimaliseer en groepeer"**
**Wanneer:** Als je dubbele UPT codes wilt samenvoegen
**Wat:** Combineert identieke codes (zelfde UPT + element) en telt hoeveelheid op

#### 3. **"Alternatieve varianten"**
**Wanneer:** Als je verschillende scenario's wilt vergelijken
**Wat:** Maak varianten A, B, C met verschillende prijzen/opties

#### 4. **"Controleer dubbelen"**
**Wanneer:** Om te zien of er dubbele codes zijn
**Wat:** Rapporteert dubbele UPT codes zonder ze te verwijderen

#### 5. **"Genereer patiëntuitleg"**
**Wanneer:** Om patient-vriendelijke uitleg te genereren
**Wat:** (AI feature - work in progress)

---

## 📋 COMPLETE WORKFLOW - STAP VOOR STAP

### Scenario: Begroting maken voor een behandelplan

```
1. CASES PAGINA
   ↓
2. Klik op een case
   ↓
3. CASE DETAIL PAGINA
   ├─ Tab: Behandelplannen
   ├─ Klik op behandelplan
   ↓
4. BEHANDELPLAN DETAIL PAGINA
   ├─ Zie interventies lijst
   ├─ Klik "Begroting opstellen"
   ↓
5. BEGROTING MODAL OPENT
   ├─ Links: Scope info (Type: plan, Items: 1)
   ├─ Midden: (LEEG - "Nog geen regels")
   ├─ Rechts: AI Assistent panel
   ↓
6. KLIK "VUL VANUIT INTERVENTIES" ← DIT IS NU DE FIX!
   ↓
7. SYSTEEM VERWERKT
   ├─ Zoekt behandelopties van het plan
   ├─ Zoekt interventies van die opties
   ├─ Haalt UPT codes op
   ├─ Maakt budget regels aan
   ↓
8. SUCCESS MELDING
   "X UPT codes toegevoegd vanuit interventies"
   ↓
9. BEGROTING TABEL GEVULD
   ├─ Kolommen: UPT, OMSCHRIJVING, AANTAL, ELEMENT, TARIEF, SUBTOTAAL
   ├─ Per interventie tab beschikbaar
   ├─ Totalen onderaan: Honorarium + Techniek + Materiaal
   ↓
10. OPSLAAN
    ├─ "Opslaan als concept" (status blijft concept)
    ├─ "Activeren" (status → actief, beschikbaar voor patient)
```

---

## 🔍 WAAROM WAS HET LEEG?

### Automatische Load (Zou moeten werken maar deed het niet altijd)

De `initializeBudget()` functie in `budgetService.ts` zou automatisch moeten:
1. Interventies ophalen voor de scope
2. UPT codes kopiëren via `copyInterventieUptCodesToBudget()`
3. Budget regels aanmaken

**Probleem:** Dit werkte niet altijd betrouwbaar (mogelijk door query issues of scope type problemen).

### Handmatige Backup (NU ALTIJD BESCHIKBAAR)

De "Vul vanuit interventies" button is de **backup methode** die nu de **primaire methode** is geworden.

**Waarom:**
- Meer controle voor gebruiker
- Duidelijker wat er gebeurt
- Altijd beschikbaar, ook als automatische load faalt
- **NU WERKT HET OOK VOOR BEHANDELPLANNEN EN OPTIES!**

---

## 🐛 DEBUG & LOGGING

Ik heb debug logging toegevoegd om te zien wat er gebeurt:

### In Browser Console (F12)
Zoek naar:
```
[BUDGET_MODAL] handleFillFromInterventies called with scope: {...}
[BUDGET_MODAL] Found interventie IDs: [...]
[BUDGET_MODAL] Loaded interventies: [...]
[BUDGET_MODAL] Processing interventie: ... UPT codes: X
[BUDGET] copyInterventieUptCodesToBudget called: ...
[BUDGET] Processing interventie: ... UPT codes: X
[BUDGET] Fetched UPT data: J43 {...}
[BUDGET] Total items to insert: X
[BUDGET] Successfully inserted budget items: X
```

### Als het Nog Steeds Leeg is

**Mogelijke Oorzaken:**
1. **Interventies hebben geen UPT codes**
   - Ga naar Interventie Editor
   - Check of de interventie UPT codes heeft toegewezen
   - Voeg UPT codes toe via "UPT Code Browser (AI)"

2. **Behandelplan heeft geen interventies**
   - Ga naar Behandelplan detail
   - Check tab "Interventies"
   - Voeg interventies toe via "Nieuwe Interventie"

3. **Database query faalt**
   - Check console logs
   - Kijk of er errors zijn
   - Verifieer dat de behandeloptie_id's kloppen

---

## 🎨 UI LAYOUT - WAT ZIE JE

```
┌─────────────────────────────────────────────────────────────┐
│  Begroting Behandelplan                              [X]     │
│  Patient Naam • Case C-001                                   │
├─────────┬───────────────────────────────────┬────────────────┤
│         │                                   │                │
│ LINKS   │         MIDDEN (TABEL)            │    RECHTS      │
│         │                                   │                │
│ Scope   │  [Alle regels][Per int][Sessie]  │  AI Assistent  │
│ Type:   │                                   │                │
│ Plan    │  UPT  OMSCHRIJVING  AANTAL  €    │  [Vul vanuit   │
│ Items:1 │  ─────────────────────────────    │   interventies]│
│         │  (leeg)                           │                │
│ Variant │  "Nog geen regels"                │  [Optimaliseer]│
│ [A][B]  │  "Gebruik AI Assistent"           │                │
│ [C]     │                                   │  [Varianten]   │
│         │                                   │                │
│ Sessies │                                   │  [Dubbelen]    │
│ [+]     │                                   │                │
│         │  ─────────────────────────────    │  [Patient      │
│ Totalen │  Honorarium:         € 0.00       │   uitleg]      │
│ Hon: €0 │  Techniek:           € 0.00       │                │
│ Tec: €0 │  Materiaal:          € 0.00       │                │
│ Mat: €0 │  ─────────────────────────────    │                │
│ Tot: €0 │  Totaal:             € 0.00       │                │
│         │                                   │                │
└─────────┴───────────────────────────────────┴────────────────┘
           [Opslaan als concept]  [Activeren]
```

---

## ✅ WAT IS ER GEFIXED?

### Fix #1: Button Altijd Enabled
```typescript
// VOOR (slecht):
disabled={loading || scope.type !== 'intervention'}

// NA (goed):
disabled={loading}
```

Nu werkt de button voor:
- ✅ `scope.type = 'plan'` (behandelplan)
- ✅ `scope.type = 'option'` (behandeloptie)
- ✅ `scope.type = 'intervention'` (directe interventie)

### Fix #2: Intelligente Interventie Lookup
```typescript
if (scope.type === 'plan') {
  // 1. Zoek behandelopties van plan
  // 2. Zoek interventies van die opties
  interventieIds = [...]
} else if (scope.type === 'option') {
  // 1. Zoek interventies van optie
  interventieIds = [...]
} else {
  // Direct gebruik scope.ids
  interventieIds = scope.ids
}
```

### Fix #3: Debug Logging
Console logs om te traceren wat er gebeurt bij elke stap.

---

## 🚀 VOLGENDE STAPPEN VOOR GEBRUIKER

1. **Refresh de app** (Ctrl+R / Cmd+R)
2. **Open een case** met een behandelplan
3. **Klik "Begroting opstellen"**
4. **In de modal: Klik "Vul vanuit interventies"**
5. **Wacht 2-5 seconden** (verwerking)
6. **Zie de UPT codes verschijnen!** ✨

**Als het nog steeds leeg is:**
- Open Console (F12)
- Kijk naar de `[BUDGET_MODAL]` logs
- Deel de logs met mij

---

## 💡 TIP: Interventies Zonder UPT Codes?

Als je interventies hebt zonder UPT codes:

1. Ga naar **Interventie Editor**
2. Open de interventie
3. Scroll naar **"UPT Code Browser (AI)"** sectie
4. Zoek en selecteer UPT codes
5. Sla op
6. Probeer begroting opnieuw

---

**Questions? Check de console logs of vraag om hulp!**
