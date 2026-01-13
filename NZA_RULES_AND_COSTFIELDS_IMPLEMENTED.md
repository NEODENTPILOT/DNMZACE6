# NZa-Regels en Kostenberekening Implementatie

**Datum**: 9 december 2024
**Versie**: 3.0
**Status**: ✅ Compleet

## Overzicht

De UPT-engine en Begrotingen 3.0 (NewBudgetModal) zijn uitgebreid met volledige NZa-combinatieregels en ondersteuning voor:

- Elementnummer (FDI-nummering 11-48)
- Vlakken (M, O, D, B, L, P, I, V voor V-codes)
- Techniekkosten (TEB/Extern)
- Materiaalkosten
- Optionele handmatige totaalprijs voor honorarium

---

## 1. Database Wijzigingen

### 1.1 Tabel: `begrotingen_v2_regels`

De volgende kolommen zijn toegevoegd aan de begrotingsregels:

| Kolom | Type | Beschrijving |
|-------|------|--------------|
| `honorarium_handmatig` | numeric(10,2) NULL | Handmatige override voor honorarium (overschrijft NZa-tarief) |
| `nza_override_toegestaan` | boolean DEFAULT FALSE | Gebruiker heeft bewust NZa-waarschuwing genegeerd |
| `nza_override_reden` | text NULL | Motivatie waarom NZa-regel is genegeerd |
| `nza_validation_status` | text NULL | Status: 'valid', 'warning', 'error' |
| `nza_validation_messages` | text[] NULL | Array van validatiemeldingen |

**Bestaande velden** (al aanwezig, nu volledig geïntegreerd):
- `vlakken` (text): Tandoppervlakken notatie (bijv. "MOD", "V", "MODIB")
- `element` (text): FDI elementnummer (11-48) of "nvt"
- `kaak` (text): 'nvt', 'boven', 'onder', 'beide'
- `techniek_bedrag` (numeric(10,2)): Techniekkosten
- `materiaal_bedrag` (numeric(10,2)): Materiaalkosten

### 1.2 Migratie

Migratie: `extend_begrotingen_for_nza_rules.sql`

Alle nieuwe velden zijn nullable of hebben veilige defaults, bestaande data blijft intact.

---

## 2. NZa-Regels Engine

**Locatie**: `src/utils/nzaRulesEngine.ts`

### 2.1 Regeltypen

De engine ondersteunt 6 typen NZa-regels:

#### 1. Same Session Forbidden
Codes die niet in dezelfde zitting mogen worden gedeclareerd.

**Voorbeelden**:
- C001 (intakeconsult) ↔ E02, E03, G21, T012, J010, C002, C003, C012, C014, C015
- E02 (uitgebreid wortelkanaalbehandelingsconsult) ↔ C003, E77, E78
- E03 (trauma-beoordeling) ↔ C003, E05, E02
- E19 ↔ E61, E62, E63, E77, E78
- U06 ↔ U05
- R55 ↔ R50

#### 2. Same Element Forbidden
Codes die niet op hetzelfde element in dezelfde zitting mogen.

**Voorbeelden**:
- V95 (volledig vormherstel) ↔ V15, V71-V74, V81-V84, V91-V94
- V35 (uitgebreide restauratie) ↔ V71-V74, V81-V84, V91-V95
- V40 (vormcorrectie) ↔ V71-V74, V81-V84, V91-V95

#### 3. Must Be Combined With
Toeslagen en codes die alleen met specifieke basisprestaties mogen.

**Voorbeelden**:
- E04 (NiTi-instrumenten) → vereist E13, E14, E16, E17, E54, E61, E77, U05, U06, U25, U35
- E63 (apexificatie-afsluiting) → vereist E13-E17
- U06 (extra tijd moeilijke patiënt) → vereist andere prestaties (mag niet alleen)

#### 4. Chapter Forbidden
Hoofdstukken die niet met bepaalde codes combineerbaar zijn.

**Voorbeelden**:
- T-hoofdstuk A (parodontologie T001-T199) → niet met C001, C002, C003, C010, C011, C012, M40

#### 5. Time Window Forbidden
Codes met minimale tussenperiode (niet geïmplementeerd met historische data, wel info-melding).

**Voorbeelden**:
- P060-P067 (nazorg prothese) → niet binnen 4 maanden (behalve P045)
- J046, J047 (implantaatvervanging) → niet binnen 6 maanden na plaatsing
- J046, J047 → niet met J010-J014 diagnostiek (eigen implantaat)

#### 6. Information Exclusive
Informatieprestaties die niet met elkaar combineerbaar zijn.

**Voorbeelden**:
- Y01 (informatieverstrekking) → mag niet met Y02, Y03

### 2.2 Geïmplementeerde Regels

**Totaal**: 30+ individuele regels + 12 J-nazorg onderlinge uitsluitingen

Zie `src/utils/nzaRulesEngine.ts` regel 32-152 voor complete lijst.

### 2.3 Validatiefuncties

```typescript
// Hoofdvalidatie
validateBudgetLines(lines: BudgetLine[]): ValidationResult[]

// Extra validaties
validateVCodeSurfaces(line: BudgetLine): ValidationResult | null
validateElementNumber(line: BudgetLine): ValidationResult | null

// Helper functies
getHardErrors(validations: ValidationResult[]): ValidationResult[]
getWarnings(validations: ValidationResult[]): ValidationResult[]
canActivateBudget(validations: ValidationResult[]): boolean
```

### 2.4 ValidationResult

```typescript
{
  valid: boolean;
  severity: 'error' | 'warning' | 'info';
  message: string;
  ruleType: string;
  affectedCodes: string[];
}
```

---

## 3. Berekeningslogica

### 3.1 Regel-niveau berekening

Voor elke begrotingsregel:

```
honorarium_regel =
  ALS honorarium_handmatig niet NULL → honorarium_handmatig
  ANDERS → honorarium_nza (uit UPT tarief 2025)

techniek_regel = techniek_bedrag
materiaal_regel = materiaal_bedrag

regel_totaal = (honorarium_regel + techniek_regel + materiaal_regel) × hoeveelheid
```

### 3.2 Begroting-niveau berekening

```
honorarium_totaal = som(alle honorarium_regel)
techniek_totaal = som(alle techniek_regel)
materiaal_totaal = som(alle materiaal_regel)

subtotaal = honorarium_totaal + techniek_totaal + materiaal_totaal

NA KORTING:
honorarium_gekort = honorarium_totaal - (korting_absoluut OF korting_percentage%)
totaal = honorarium_gekort + techniek_totaal + materiaal_totaal
```

**Belangrijk**: Techniek en materiaal worden NIET gekort!

### 3.3 Code Locaties

**Backend/Service**:
- `src/services/budgetService.ts` → `recalculateBudgetTotals()` (regel 463-497)

**Frontend/UI**:
- `src/components/NewBudgetModal.tsx` → `calculateTotals()` (regel 1129-1144)

---

## 4. UI Implementatie (NewBudgetModal)

### 4.1 Nieuwe Velden per Regel

In de begrotingsregel-editor:

| Veld | Type | Validatie | Opmerking |
|------|------|-----------|-----------|
| Element | Dropdown | 11-48 (FDI) of "nvt" | Mag leeg |
| Vlakken | Tekst | M, O, D, B, L, P, I, V | Verplicht voor V-codes (warning) |
| Kaak | Dropdown | nvt/OK/BK/beide | Direct in tabel zichtbaar |
| Handmatig Hon. | Getal (€) | >= 0 | Placeholder toont NZa-tarief |
| Techniek | Getal (€) | >= 0 | Standaard 0.00 |
| Materiaal | Getal (€) | >= 0 | Standaard 0.00 |

### 4.2 Visuele Indicatoren

- **Handmatig honorarium**: Paars label met icoon
- **Vlakken ingevuld**: Blauw label (uppercase)
- **NZa-fouten**: Rood paneel met AlertCircle icoon
- **NZa-waarschuwingen**: Geel paneel met AlertTriangle icoon

### 4.3 Validatiepaneel

Rechterpaneel toont:
- **Hard errors** (rood): Blokkeren activatie
- **Warnings** (geel): Tonen waarschuwing, activatie toegestaan met bevestiging

### 4.4 Activatielogica

Bij klik op "Activeren":

1. **Hard errors** → Alert + blokkeer
2. **Warnings** → Confirm dialog met lijst
3. **Geen issues** → Direct activeren

---

## 5. Interactie en Workflow

### 5.1 Gebruikersflow

1. **Begroting aanmaken** via behandelplan/interventies
2. **Automatisch vullen** met "Vul vanuit interventies"
3. **Regels bewerken**:
   - Klik op aantal/element → inline edit
   - Vul element, vlakken, kosten
   - Optioneel: handmatig honorarium
4. **Real-time validatie** → NZa-panel updatet
5. **Concept opslaan** → altijd mogelijk
6. **Activeren** → alleen als geen hard errors

### 5.2 Validatie Triggers

Validatie wordt uitgevoerd:
- Bij laden van begroting
- Na elke regel-update
- Na verwijderen van regel
- Voor activatie

---

## 6. Testing

### 6.1 Test Suite

**Locatie**: `src/utils/__tests__/nzaRulesEngine.test.ts`

**Test Coverage**:

1. ✅ Same Session Forbidden (C001 + E02)
2. ✅ Same Element Forbidden (V95 + V72 op element 11)
3. ✅ Must Be Combined With (E04 vereist endo-code)
4. ✅ U06 vereist andere prestaties
5. ✅ V-code surface validation (MOD vlakken)
6. ✅ Element number validation (FDI 11-48)
7. ✅ Budget activation blocking met errors
8. ✅ Chapter forbidden (T-A + consulten)
9. ✅ Information exclusive (Y01 + Y02)
10. ✅ R-code rules (R55 + R50)

**Run tests**:
```bash
npm test -- nzaRulesEngine
```

### 6.2 Handmatige Testcases

| Scenario | Verwacht Resultaat | Status |
|----------|-------------------|--------|
| C001 + E02 in zelfde sessie | ❌ Hard error | ✅ |
| E04 zonder endo-code | ❌ Hard error | ✅ |
| V95 + V72 op element 11 | ❌ Hard error | ✅ |
| V71 zonder vlakken | ⚠️ Warning | ✅ |
| Element 99 invoeren | ❌ Hard error | ✅ |
| Handmatig honorarium invullen | Gebruikt in berekening | ✅ |
| Techniek + materiaal | Niet gekort | ✅ |
| Activeren met errors | Geblokkeerd | ✅ |
| Activeren met warnings | Confirm dialog | ✅ |

---

## 7. Database Schema Details

### 7.1 Volledige Kolommen `begrotingen_v2_regels`

```sql
CREATE TABLE begrotingen_v2_regels (
  id uuid PRIMARY KEY,
  begroting_id uuid NOT NULL,

  -- Source tracking
  source_type text NOT NULL,
  source_id uuid,
  source_interventie_id uuid,
  interventie_naam text,

  -- UPT code
  upt_code text NOT NULL,
  omschrijving text NOT NULL,

  -- Clinical details
  fase text,
  kaak text DEFAULT 'nvt',
  element text,
  vlakken text,

  -- Pricing - Honorarium
  honorarium_nza numeric(10,2) DEFAULT 0.00,
  honorarium_bedrag numeric(10,2) DEFAULT 0.00,
  honorarium_handmatig numeric(10,2),  -- NIEUW

  -- Techniek
  is_techniek boolean DEFAULT false,
  techniek_type text,
  techniek_bedrag numeric(10,2) DEFAULT 0.00,

  -- Materiaal
  is_materiaal boolean DEFAULT false,
  materiaal_bedrag numeric(10,2) DEFAULT 0.00,

  -- Quantity
  hoeveelheid integer DEFAULT 1,
  actief boolean DEFAULT true,

  -- NZa validation -- NIEUW
  nza_override_toegestaan boolean DEFAULT false,
  nza_override_reden text,
  nza_validation_status text,
  nza_validation_messages text[],

  -- Session & ordering
  session_id uuid,
  sort_order integer DEFAULT 0,
  notes text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 7.2 Indexen

```sql
CREATE INDEX idx_begrotingen_v2_regels_nza_validation
ON begrotingen_v2_regels(nza_validation_status)
WHERE nza_validation_status IS NOT NULL;
```

---

## 8. Toekomstige Uitbreidingen

### 8.1 Time Window Validation

Momenteel toont de engine een **info-melding** voor time window regels (P060, J046/J047), maar valideert niet tegen historische data.

**Toekomstige implementatie**:
- Query historische UPT-declaraties
- Check datum + windowMonths
- Blokkeer of waarschuw met exacte datum

### 8.2 Extra Regels

Nog niet geïmplementeerde NZa-regels:
- J-nazorg complexe combinaties (J080-J184 time windows)
- V94 specifieke hoekopbouw-check
- T164 orthodontische retentie-waarschuwing
- Y01 tijd-afronding op 5 minuten

### 8.3 UI Verbeteringen

- Inline tooltips bij codes met regels
- Kleur-codering in tabel (rood/geel bij conflicten)
- Visuele lijn tussen conflicterende regels
- Export validatierapport naar PDF

---

## 9. Samenvatting

### ✅ Volledig Geïmplementeerd

1. **Database**: Alle velden voor element, vlakken, techniek, materiaal, handmatig honorarium, NZa-override
2. **NZa-Regels Engine**: 30+ regels over 6 categorieën
3. **Berekeningslogica**: Correcte totaalberekening met handmatig honorarium en gescheiden techniek/materiaal
4. **UI**: Volledige editor met validatiepaneel en real-time feedback
5. **Validatie**: Hard errors blokkeren activatie, warnings tonen confirm
6. **Tests**: Uitgebreide test suite voor alle regeltypen

### 📊 Impact

- **Data Safety**: Alle wijzigingen backward-compatible, bestaande data intact
- **User Experience**: Duidelijke foutmeldingen, handmatige override mogelijk
- **Compliance**: NZa-regels worden actief gehandhaafd
- **Flexibility**: Handmatige prijzen voor edge cases

### 🎯 Volgende Stappen

1. **Gebruikerstraining**: Documentatie en training voor NZa-regels
2. **Monitoring**: Log validatie-overrides voor audit
3. **Historische data**: Implementeer time window validation met echte data
4. **Feedback loop**: Verzamel feedback over missing rules

---

**Einde Rapport**

Voor vragen of issues: zie code in `src/utils/nzaRulesEngine.ts` en `src/components/NewBudgetModal.tsx`
