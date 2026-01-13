# Begrotingen 3.0 - NZa UX Implementatie

## Overzicht

Dit document beschrijft de gebruikersinterface en user experience voor de Begrotingen 3.0 module, met specifieke focus op NZa-validatie, kostenberekening en gebruiksvriendelijke velden.

## 1. Tabel-layout Begrotingsregels

### Kolomvolgorde

De begrotingstabel heeft de volgende kolommen (van links naar rechts):

1. **UPT Code** (w-20) - Fixed width, font-mono
2. **Omschrijving** (flex-grow) - Neemt meeste ruimte, bevat ook badges voor validatie
3. **Aantal** (w-16) - Gecentreerd, klikbaar voor edit
4. **Element** (w-20) - Gecentreerd, FDI-notatie (11-48)
5. **Vlakken** (w-24) - Gecentreerd, uppercase (M, O, D, B, L/P, I)
6. **Honorarium** (w-24) - Rechts uitgelijnd, NZa-tarief of handmatig
7. **Techniek** (w-24) - Rechts uitgelijnd, lab-kosten
8. **Materiaal** (w-24) - Rechts uitgelijnd, materiaalkosten
9. **Subtotaal** (w-28) - Rechts uitgelijnd, dikgedrukt
10. **Acties** (w-10) - Delete button

### Kolom Styling

- **Getalkolommen**: Rechts uitgelijnd voor nette uitlijning van bedragen
- **Element & Vlakken**: Gecentreerd voor overzichtelijkheid
- **UPT Code**: Monospace font voor technische leesbaarheid
- **Subtotaal**: Dikgedrukt om eindresultaat te benadrukken

## 2. Velden en Microcopy

### 2.1 Element Veld

**Placeholder:** "bijv. 11"

**Tooltip op label:**
> "Elementnummer volgens FDI-notatie (11–48). Voor restauraties en endo bij voorkeur invullen."

**Validatie:**
- Alleen elementnummers tussen 11-48 (FDI-notatie)
- Bij foutieve invoer: inline rode tekst onder veld
- Tekstuele feedback: "Gebruik een elementnummer tussen 11–18, 21–28, 31–38 of 41–48."

**Weergave:**
- View mode: Simpel getal of "-" als leeg
- Edit mode: Tekstveld met placeholder en tooltip

### 2.2 Vlakken Veld

**Placeholder:** "bijv. MOD"

**Tooltip op label:**
> "Geef de betrokken vlakken op: M, O, D, B, L/P, I. Voor V-codes is minimaal één vlak vereist volgens NZa-richtlijnen."

**Validatie voor V-codes:**
- V-codes (vullingen) zonder vlakken: tonen amber badge "Ontbreekt"
- Badge tooltip: "Voor deze V-code is vlak-aanduiding verplicht. Vul minstens één vlak in (bijvoorbeeld MO, MOD, of PAL)."

**Weergave:**
- View mode met vlakken: Blauwe badge, uppercase, dikgedrukt
- View mode zonder vlakken (V-code): Amber badge "Ontbreekt"
- View mode zonder vlakken (andere): "-"
- Edit mode: Tekstveld met automatische uppercase conversie

### 2.3 Techniek & Materiaal Velden

**Label in kolom:** "Tech." en "Mat."

**Placeholders:** "€ 0,00"

**Tooltip bij Techniek:**
> "Techniekkosten (bijv. lab-kosten). Worden apart bijgehouden en niet meegenomen in honorariumkorting."

**Tooltip bij Materiaal:**
> "Materiaalkosten (bijv. implantaat, botmateriaal). Worden apart bijgehouden en niet meegenomen in honorariumkorting."

**Weergave:**
- Als waarde = 0: Grijze "-" placeholder
- Als waarde > 0: Dikgedrukt zwart bedrag met € symbool

### 2.4 Handmatig Honorarium Override

**Edit mode label:** "Handmatig Hon. (€)"

**Tooltip:**
> "Laat leeg om het standaard NZa-tarief te gebruiken"

**Helptekst onder veld:**
> "Laat leeg voor NZa-tarief"

**Placeholder:** Toont het huidige NZa-tarief (bijv. "NZa: 45.20")

**View mode weergave:**
- Kleine paarse badge met tekst "Handmatig" onder omschrijving
- Icoon: AlertCircle
- Alleen zichtbaar als handmatig tarief is ingesteld

## 3. Totalen Sectie

### Layout

De totalen worden getoond in een blauw paneel met de titel "Kostenverdeling".

**Rijen:**

1. **Honorarium** - Totaal honorariumbedrag (voor korting)
2. **(Korting)** - Alleen zichtbaar als korting > 0%
   - Klein, ingesprongen, rood
   - Format: "Korting (X%) -€ Y,YY"
3. **Techniek** - Totaal techniekkosten
4. **Materiaal** - Totaal materiaalkosten
5. **Totaal** - Eindtotaal na korting (dikgedrukt, groot, blauw)

### Korting Display

**Alleen op honorarium:**
```
Honorarium            € 1.250,00
  Korting (10%)         -€ 125,00
Techniek              €   450,00
Materiaal             €   200,00
------------------------
Totaal                € 1.775,00
```

**Toelichting onder totalen:**
> "Korting wordt alleen toegepast op honorarium, niet op techniek en materiaal."

## 4. NZa-Validatie UX

### 4.1 Inline Badges in Tabel

Validatiemeldingen worden getoond als badges onder de omschrijving in de regelrij.

**Rode badges (Fouten):**
- Achtergrond: `bg-red-100`
- Tekst: `text-red-700`
- Border: `border-red-300`
- Icoon: AlertCircle
- Voorbeelden:
  - "NZa: combinatie verboden"
  - "NZa: code alleen als toeslag"

**Amber badges (Waarschuwingen):**
- Achtergrond: `bg-amber-100`
- Tekst: `text-amber-700`
- Border: `border-amber-300`
- Icoon: AlertTriangle
- Voorbeelden:
  - "NZa: controleer indicatie"
  - "Voor V-code is vlak-aanduiding verplicht"

**Badge behavior:**
- Volledige melding zichtbaar in badge
- Hover: tooltip met volledige uitleg
- Max-width om overlap te voorkomen

### 4.2 NZa-Controle Paneel

Rechter sidebar bevat een gedetailleerd NZa-controle paneel.

**Titel:** "NZa-controle"

**Sectie 1: Fouten** (alleen zichtbaar bij fouten)
- Subtitel: "Fouten (X)" met AlertCircle icoon
- Elke fout in rode box met icoon en bericht
- Uitgebreide melding, meerdere regels mogelijk

**Sectie 2: Waarschuwingen** (alleen zichtbaar bij waarschuwingen)
- Subtitel: "Waarschuwingen (X)" met AlertTriangle icoon
- Elke waarschuwing in amber box
- **Override checkbox:**
  ```
  ☐ Ik begrijp deze NZa-waarschuwingen en wil de
    begroting toch opslaan als concept.
  ```

**Sectie 3: Blokkeermelding** (alleen bij fouten)
> **Let op:** Begroting kan pas geactiveerd worden na het oplossen van alle fouten.

### 4.3 Validatie bij Opslaan/Activeren

**Concept opslaan:**
- Altijd mogelijk
- Waarschuwingen mogen aanwezig zijn
- Override-checkbox optioneel (informatief)

**Activeren:**
- 🔴 Fouten moeten opgelost zijn → geblokkeerd
- 🟠 Waarschuwingen mogen blijven → warning dialog
- Dialog toont alle waarschuwingen en vraagt bevestiging

## 5. Y01 - Tijd Afronding (Toekomstig)

Voor UPT-code Y01 (informatieverstrekking) moet tijd-invoer geïmplementeerd worden.

**Specificatie:**
- Veld: "Tijd (minuten)"
- Automatische afronding op 5-minuten stappen
- Voorbeeld: gebruiker voert "7" in → systeem rekent met "10"
- Display: "Gerekend als 10 min"
- Tarief: "Tarief gebaseerd op 10 min (afronding NZa)"

**Validatie:**
- Y01 mag niet gecombineerd met andere informatie-prestaties
- Rode badge + NZa-fout bij conflicten

## 6. Typische Scenario's

### Scenario 1: V-code zonder Vlakken

**Situatie:**
- Regel: V95 (Amalgaamvulling 1-vlaks)
- Vlakken: (leeg)

**Display:**
- Amber badge in Vlakken kolom: "Ontbreekt"
- Tooltip: "Voor deze V-code is vlak-aanduiding verplicht. Vul minstens één vlak in (bijvoorbeeld MO, MOD, of PAL)."
- NZa paneel: Waarschuwing over ontbrekende vlakken
- Gebruiker kan opslaan als concept
- Bij activeren: bevestiging vereist

### Scenario 2: Combinatieverbod V95 + V72

**Situatie:**
- Regel 1: V95 op element 16
- Regel 2: V72 op element 16

**Display:**
- Beide regels: Rode badge "NZa: combinatie verboden"
- NZa paneel Fouten sectie:
  > "V95 en V72 mogen niet in dezelfde sessie op hetzelfde element worden gedeclareerd"
- Blokkeermelding zichtbaar
- Activeren: geblokkeerd
- Concept opslaan: mogelijk

### Scenario 3: Handmatig Honorarium Override

**Situatie:**
- Regel: T164 (Beugel reinigen)
- NZa-tarief: € 15,00
- Handmatig ingesteld: € 20,00

**Display:**
- Honorarium kolom: € 20,00
- Paarse badge onder omschrijving: "Handmatig"
- Edit mode: veld toont 20.00, placeholder "NZa: 15.00"
- Totalen: gebruikt € 20,00 in berekening

### Scenario 4: Korting op Begroting

**Situatie:**
- Honorarium totaal: € 1.000,00
- Techniek: € 300,00
- Materiaal: € 150,00
- Korting: 15%

**Display in totalen:**
```
Honorarium            € 1.000,00
  Korting (15%)         -€ 150,00
Techniek              €   300,00
Materiaal             €   150,00
------------------------
Totaal                € 1.300,00
```

**Toelichting:**
> Korting wordt alleen toegepast op honorarium, niet op techniek en materiaal.

## 7. Implementatie Details

### Nieuwe Table Headers
```tsx
<th title="Elementnummer volgens FDI-notatie (11–48)">Element</th>
<th title="Betrokken vlakken: M, O, D, B, L/P, I">Vlakken</th>
<th title="Honorarium (NZa-tarief of handmatig)">Hon.</th>
<th title="Techniekkosten (bijv. lab)">Tech.</th>
<th title="Materiaalkosten">Mat.</th>
```

### Validation Badge Component
```tsx
{validationResults.map((validation, idx) => (
  <div className={`
    ${validation.severity === 'error'
      ? 'bg-red-100 text-red-700 border-red-300'
      : 'bg-amber-100 text-amber-700 border-amber-300'}
  `}>
    {validation.severity === 'error' ? <AlertCircle /> : <AlertTriangle />}
    <span>{validation.message}</span>
  </div>
))}
```

### Vlakken Display Logic
```tsx
{item.vlakken ? (
  <div className="bg-blue-50 text-blue-700 uppercase font-semibold">
    {item.vlakken}
  </div>
) : isVulling ? (
  <div className="bg-amber-50 text-amber-600" title="...">
    Ontbreekt
  </div>
) : (
  <span className="text-gray-400">-</span>
)}
```

## 8. Design System Alignment

Deze implementatie volgt het DNMZ design system:

- **Kleuren:**
  - Fouten: Red-100/700 scheme
  - Waarschuwingen: Amber-100/700 scheme
  - Handmatig: Purple-600
  - Primair: Blue-600
  - Vlakken: Blue-50/700

- **Typografie:**
  - Headers: font-semibold
  - Bedragen: font-medium tot font-bold
  - UPT codes: font-mono
  - Labels: text-xs uppercase

- **Spacing:**
  - Consistent px-3 py-2 voor table cells
  - Gap-2 tot gap-4 voor sections
  - Borders: 1-2px solid

- **Interactie:**
  - Hover states op alle klikbare elementen
  - Tooltips op labels en badges
  - Stoppropagate voor nested clickables
  - Cursor-pointer indicaties

## 9. Toegankelijkheid

- Alle tooltips via native `title` attributes
- Kleurcontrast voldoet aan WCAG AA standaard
- Focus states op alle interactieve elementen
- Screen reader vriendelijke labels
- Keyboard navigatie support

## 10. Toekomstige Verbeteringen

1. **Y01 Tijdveld Implementatie**
   - Dedicated tijd input met 5-min afronding
   - Real-time display van afgeronde tijd
   - Tariefberekening op basis van afgeronde tijd

2. **Validatie Export**
   - PDF export met validatiemeldingen
   - Print-friendly validatierapport
   - Email template met NZa-status

3. **Batch Editing**
   - Multi-select regels
   - Bulk update van Element/Vlakken
   - Bulk delete met undo

4. **Enhanced Tooltips**
   - Rich tooltips met voorbeelden
   - Inline help met video's
   - Contextual guidance

---

**Versie:** 1.0
**Datum:** 2025-12-09
**Module:** Begrotingen 3.0
**Component:** NewBudgetModal.tsx
