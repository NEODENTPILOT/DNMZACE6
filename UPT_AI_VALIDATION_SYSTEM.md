# UPT AI Learning - Validatie & Correctie Systeem

**Datum:** 4 december 2025
**Status:** Geïmplementeerd

## Probleem

De AI learning engine bevatte **voorbeeldpatronen met fictieve UPT codes** (zoals M46, J70, E33) die niet bestaan in de UPT Tarief 2025 database. Deze codes werden gebruikt voor demo doeleinden, maar zijn niet geschikt voor productie.

## Oplossing

Een volledig **validatie & correctie systeem** dat:

1. **Valideert** dat alle UPT codes in patronen echt bestaan
2. **Detecteert en markeert** patronen met fictieve codes
3. **Voorkomt** dat nieuwe patronen met fictieve codes worden aangemaakt
4. **Biedt tools** om patronen handmatig te corrigeren

---

## Nieuwe Functionaliteit

### 1. UPT Code Validatie Engine

**Locatie:** `src/services/uptLearningEngine.ts`

#### Functies:

```typescript
// Valideer of een UPT code bestaat in de database
async function validateUptCode(uptCode: string): Promise<boolean>

// Valideer alle codes in een patroon
export async function validatePattern(patternId: string): Promise<{
  isValid: boolean;
  invalidCodes: string[];
  validCodes: string[];
}>

// Scan alle patronen en markeer invalide patronen
export async function scanAndMarkInvalidPatterns(): Promise<{
  total_scanned: number;
  invalid_patterns: number;
  patterns_marked: Array<{...}>;
}>

// Verwijder alle patronen met fictieve codes
export async function cleanupInvalidPatterns(): Promise<{
  deleted_count: number;
  deleted_patterns: string[];
}>
```

#### Werking:

- **Bij aanmaken nieuwe patronen**: Alle UPT codes worden eerst gevalideerd
- **Bij voorspellingen**: Patronen met `confidence_score = 0` worden genegeerd
- **Handmatige scan**: Je kunt alle patronen scannen via de UI

---

### 2. UPT Pattern Correctie Tool

**Locatie:** `src/pages/UptPatternCorrection.tsx`
**Menu:** Beheer → 🔧 UPT Pattern Correctie (badge: FIX)

#### Features:

**A. Automatische Validatie**
- Wanneer je een patroon selecteert, wordt het automatisch gevalideerd
- Je ziet direct welke codes fictief zijn (rood) of geldig (groen)

**B. Scan Functie**
```
🔍 Scan Patronen
```
- Scant ALLE patronen in de database
- Markeert patronen met fictieve codes (confidence_score = 0)
- Toont hoeveel invalide patronen zijn gevonden

**C. Cleanup Functie**
```
🗑️ Verwijder Alle Invalide
```
- Verwijdert ALLE patronen met fictieve UPT codes
- Onherstelbare actie (met confirmatie)
- Toont welke patronen zijn verwijderd

**D. Handmatige Correctie**
- Selecteer een patroon
- Klik op "✏️ Edit"
- Verwijder fictieve codes
- Zoek en voeg echte UPT 2025 codes toe
- Sla op

---

## Hoe Te Gebruiken

### Stap 1: Scan de Database

1. Ga naar: **Beheer → 🔧 UPT Pattern Correctie**
2. Klik op **🔍 Scan Patronen**
3. Bekijk het resultaat (bijv. "5 patronen gescand, 5 invalide gevonden")

### Stap 2: Review Invalide Patronen

In de lijst zie je nu welke patronen als **INVALIDE** zijn gemarkeerd (rode badge).

Bijvoorbeeld:
- ❌ Implantologie - Implantaat plaatsing enkel (M46, J70, E33)
- ❌ Prothetiek - Kroon enkele (R30, P21)
- ❌ Endodontie - Wortelkanaal (K10, K20)

### Stap 3A: Automatisch Opschonen

**Als je ALLE fictieve patronen wilt verwijderen:**

1. Klik op **🗑️ Verwijder Alle Invalide**
2. Bevestig de actie
3. Klaar! Alle patronen met fictieve codes zijn verwijderd

### Stap 3B: Handmatig Corrigeren

**Als je patronen wilt corrigeren met echte codes:**

1. Selecteer een invalide patroon
2. Klik op **✏️ Edit**
3. Verwijder de fictieve codes (bijv. M46)
4. Klik op **+ Voeg toe**
5. Zoek de juiste UPT code (bijv. J040)
6. Voeg toe en herhaal voor alle codes
7. Klik op **💾 Opslaan**

---

## Voorbeelden: Correcte UPT Codes

### Implantologie - Single Implant

**Oud (fictief):**
- M46, J70, E33 ❌

**Correct:**
- **J001** - Overhead implantaten (€220.32)
- **J011** - Onderzoek uitvoering (€128.04)
- **J040** - Plaatsen eerste implantaat (€293.22)
- **J057** - Kosten implantaat (€404.40)
- **J042** - Plaatsen tandvleesvormer (€96.03)

### Prothetiek - Kroon

**Oud (fictief):**
- R30, P21 ❌

**Correct:** (zoek in UPT database naar codes die beginnen met R voor kronen)

### Endodontie - Wortelkanaal

**Oud (fictief):**
- K10, K20 ❌

**Correct:** (zoek in UPT database naar codes die beginnen met E voor endodontie)

---

## Technische Details

### Validatie Flow

```
┌─────────────────────────────────┐
│ Nieuwe Begroting Opslaan        │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ Extract UPT Codes               │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│ Valideer Codes ✓                │
│ - Check vs upt_tarief_2025      │
│ - Actief = true                 │
└──────────────┬──────────────────┘
               │
          ┌────┴─────┐
          │          │
          ▼          ▼
      GELDIG    ONGELDIG
          │          │
          ▼          ▼
     Patroon    Patroon wordt
     aanmaken   NIET aangemaakt
```

### Database Changes

**Patronen met confidence_score = 0:**
- Worden niet gebruikt voor voorspellingen
- Zijn gemarkeerd als "INVALIDE" in de UI
- Kunnen automatisch verwijderd worden via cleanup

**Nieuwe patronen:**
- Worden alleen aangemaakt als ALLE codes geldig zijn
- Bij ongeldige codes: error in console log

---

## AI Learning Rules (Updated)

### Regel 1: Alleen Echte Codes
De AI mag **NOOIT** fictieve UPT codes voorstellen of leren.

### Regel 2: Validatie is Verplicht
Elk nieuw patroon moet EERST gevalideerd worden tegen `upt_tarief_2025`.

### Regel 3: Markering van Invalide Patronen
Patronen met fictieve codes krijgen `confidence_score = 0` en worden niet gebruikt.

### Regel 4: NZa Regels Gaan Voor
Zelfs als een code technisch bestaat, moet deze voldoen aan NZa combinatieregels.

---

## Next Steps

### Voor de Gebruiker:

1. **Scan nu de database** om te zien hoeveel invalide patronen er zijn
2. **Beslis:** automatisch cleanup OF handmatig corrigeren
3. **Vanaf nu:** Elk nieuw patroon wordt automatisch gevalideerd

### Voor Nieuwe Begrotingen:

Wanneer je vanaf nu begrotingen opslaat:
- ✅ Worden alleen patronen met echte codes geleerd
- ✅ Krijgt de AI steeds betere data
- ✅ Worden voorspellingen steeds accurater

### Over 1-2 Maanden:

Je hebt een **volledig geleerde database** met:
- 100+ echte behandelpatronen
- Accurate UPT code voorspellingen
- Realistische prijsschattingen
- Betrouwbare suggesties per categorie

---

## FAQ

**Q: Wat gebeurt er met bestaande invalide patronen?**
A: Ze blijven in de database MAAR worden niet meer gebruikt (confidence_score = 0).

**Q: Kan ik ze veilig verwijderen?**
A: Ja! Gebruik de "Verwijder Alle Invalide" functie.

**Q: Moet ik ze eerst corrigeren?**
A: Nee, je kunt ze verwijderen. Nieuwe patronen worden automatisch gebouwd van echte begrotingen.

**Q: Hoe weet ik of een code echt is?**
A: De tool valideert automatisch tegen `upt_tarief_2025`. Als de code rood is in de UI = fictief.

**Q: Kan de AI nog steeds leren?**
A: Ja! Maar alleen van codes die echt bestaan in UPT 2025.

**Q: Wat als ik een verkeerde code toevoeg?**
A: De tool accepteert alleen codes die bestaan in de database.

---

## Code References

**Validatie Engine:**
- `/src/services/uptLearningEngine.ts:474-725`

**Correctie Tool:**
- `/src/pages/UptPatternCorrection.tsx`

**Menu Item:**
- `/src/components/Layout.tsx:157`

**Route:**
- `/src/App.tsx:12,146`

---

## Conclusie

Het UPT AI Learning systeem is nu **production-ready** met:

- ✅ Volledige validatie van alle UPT codes
- ✅ Automatische detectie van fictieve codes
- ✅ UI tools voor correctie en cleanup
- ✅ Preventie van nieuwe fictieve patronen
- ✅ Alleen leren van echte, gevalideerde data

**Volgende actie:** Scan de database en kies tussen cleanup of handmatige correctie!
