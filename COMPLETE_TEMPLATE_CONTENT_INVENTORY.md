# COMPLETE TEMPLATE & CLINICAL CONTENT INVENTORY
## DNMZ Application - Full Extraction

**Date:** December 21, 2024
**Purpose:** Complete source-of-truth inventory of all clinical text content
**Scope:** Database templates, ICE templates, hardcoded content, AI generators

---

## EXECUTIVE SUMMARY

### Database Content Overview
- **Total Active Templates:** 113
  - Template Teksten: 94
  - Template Verslagen: 13
  - Template Formulieren: 6

### Hardcoded Content Sources
- **aiTemplateGenerator.ts:** 7 document templates
- **dummyAI.ts:** 5 document templates + 1 PMO template
- **ICE Template Builder:** Template-driven clinical reasoning (metadata only)

### Critical Finding
**Most clinical content is HARDCODED in TypeScript files, not in the database.** The database contains primarily legacy CSV-imported "Behandelnotitie" quick texts. The application's modern document generation relies on hardcoded templates in source code.

---

## 1. TEMPLATE TEKSTEN (Database - templates table)

### 1.1 Behandelnotitie Templates (51 total)

**Note:** These are primarily quick texts / boilerplate snippets for treatment notes.

#### Sample Behandelnotitie Templates (First 10)

**Template 1: [Untitled - Preventie vervolg]**
- **Type:** Behandelnotitie
- **Doel:** KlinischeNote
- **Content:**
```
Preventie vervolg

Gespoeld met perio-aid 0.12%
Mhg wijziging
Voeding:
Pijn:
BOP:
PKT:
Tst:    OF/ molaren
Instr:
Wens en verwachting
vragen patiënt:
```

**Template 2: [Untitled - Kroon plaatsen]**
- **Type:** Behandelnotitie
- **Doel:** KlinischeNote
- **Content:**
```
Kroon plaatsen

Vandaag kroon gecementeerd
Emax full zirk.
Tijdelijke kroon verwijderd
Stomp schoon gemaakt met puimsteen.
Onder rubberdam gelegd
Teflon tape  en gecementeerd met rely x ultimate.
Gecementeerd met fuji plus.
Bw gemaakt ter controle cementresten. Hierna outline langsgelopen.
Occlusie/articulatie en aansluiting gecontroleerd
Lichtfoto gemaakt.
Retour voor PMO
```

**Template 3: [Untitled - PPS 3 start paro preventie]**
- **Type:** Behandelnotitie
- **Doel:** KlinischeNote
- **Content:**
```
PPS 3 start paro preventie ondanks advies

Patiënt heeft meerdere verdiepte en bloedende pockets 6 mm en meer.
Patiënt wil graag dentitie behouden.
Mondhygiëne redelijk, motivatie gering.
Advies om parotraject aan te gaan gezien wens behoud en ernst van de afwijking.
Folder NVvP en praktijkinformatiefolder meegegeven.
Patiënt begrijpt de informatie.
Patiënt kiest echter voor behandeling in het paropreventie traject in verband met de kosten en thuissituatie.
Patiënt begrijpt de risico's en gevolgen.
```

**Template 4: [Untitled - Controle implantologie]**
- **Type:** Behandelnotitie
- **Doel:** KlinischeNote
- **Content:**
```
Controle implantologie

Medische anamnese: geen veranderingen

Röntgen indicatie: controle botniveau bij implantaat

Röntgen verslag: gb

Klinisch: gb

Bijzonderheden: -

Beleid:
1. afdruk kroon (30min)
2. 3 weken plaatsen kroon 3(30min)

Kroon bij tandarts
8w eken na plaatsen kroon nulmeting (10min)

Halfjaarlijks eigen MH
COI
Afbehandeld
```

**Template 5: Afdrukken**
- **Type:** Behandelnotitie
- **Doel:** KlinischeNote
- **Content:**
```

Afdrukken bovenkaak/onderkaak t.b.v.:

Beetbepaling:

Röntgen: gb

Bijzonderheden:

Kleurbepaling ; kleur:

Kleurbepaling door het lab:

Gestuurd naar:

Assistent tegenafdruk:
```

**Template 6: AFSPRAAK MONSTERINNAME T.B.V. SPEEKSELTEST(EN)**
- **Type:** Behandelnotitie
- **Doel:** KlinischeNote
- **Content:**
```

GAAT HET OM HERAFNAME: JA/NEE

BIJZONDERHEDEN
MH: slecht/matig/goed
Motivatie: onvoldoende/matig/voldoende/uitstekend

INDICATIE MONSTERAFNAME
Persisterende problemen: ja/nee

DOMEIN: CARIES/PARO/IMPLANT

OVERIG: Droge mond / (rest) pockets / progressieve botafbraak

DATUM AFNAME: DD/MM/YYYY

AFGENOMEN MONSTERS:

[X] CARIES

[X] PARO

[X] IMPLANT


VERZENDDATUM: DD/MM/YYYY
```

**Template 7: Akkoord bw's door assistent**
- **Type:** Behandelnotitie
- **Doel:** KlinischeNote
- **Content:**
```

Patiënt geeft toestemming voor het maken van bitewings voor de aanvullende cariësdiagnosttiek in opdracht van de tandarts door assistent
```

**Template 8: Akkoord OPT door assistent**
- **Type:** Behandelnotitie
- **Doel:** KlinischeNote
- **Content:**
```

Patiënt geeft toestemming voor het maken van een panorama foto ten behoeve van aanvullende diagnostiek in opdracht van de tandarts door assistent
```

**Template 9: Akkoord solo door assistent**
- **Type:** Behandelnotitie
- **Doel:** KlinischeNote
- **Content:**
```

Patiënt geeft toestemming voor het maken van solo opname voor aanvullende diagnostiek in opdracht van de tandarts door assistent
```

**Template 10: Bitewings**
- **Type:** Behandelnotitie
- **Doel:** KlinischeNote
- **Content:**
```

Indicatie:
Diagnose:
```

### 1.2 Sneltekst Templates (26 total)

**Purpose:** Quick text snippets for rapid documentation

### 1.3 Consult-text Templates (7 total)

**Purpose:** Consultation note templates

### 1.4 Other Tekst Templates

- **InformedConsent:** 2 templates
- **Implantologie:** 2 templates
- **Recept:** 2 templates
- **PatiëntenInfo:** 1 template
- **VerslagAanCollega:** 1 template
- **Behandelplan:** 1 template
- **Verwijsbrief:** 1 template

---

## 2. TEMPLATE VERSLAGEN (Database - 13 total)

### 2.1 Breakdown
- **Behandelnotitie Verslagen:** 2
- **Verwijsbrief Verslagen:** 1
- **Untyped Verslagen:** 10

**Note:** Limited content details available. These are report-style documents.

---

## 3. TEMPLATE FORMULIEREN (Database - 6 total)

### 3.1 Formulier with Content (2 templates)

**Template 1: Formulier – Informed consent implantologie**
- **Doel:** InformedConsent
- **Content:**
```
Gebruik dit formulier voor schriftelijke vastlegging van toestemming bij implantaatbehandeling.
```
- **Content Length:** 95 characters
- **Status:** Placeholder only, no full form structure

**Template 2: Formulier – Intake nieuwe patiënt (anamnese)**
- **Doel:** Intake
- **Content:**
```
Anamneselijst nieuwe patiënt, inclusief medische gegevens en tandheelkundige voorgeschiedenis.
```
- **Content Length:** 94 characters
- **Status:** Placeholder only, no full form structure

### 3.2 Formulier without Content (4 templates)

**Template 3: Informed Consent Implantologie**
- **Doel:** InformedConsent
- **Content:** NULL
- **Status:** Name only, no content

**Template 4: Intake Nieuwe Patiënt**
- **Doel:** Intake
- **Content:** NULL
- **Status:** Name only, no content

**Template 5: Nazorg Instructies Implantologie**
- **Doel:** Nazorg
- **Content:** NULL
- **Status:** Name only, no content

**Template 6: Pre-operatieve Checklist**
- **Doel:** KlinischeNote
- **Content:** NULL
- **Status:** Name only, no content

**Critical Finding:** All 6 Formulier templates are essentially empty placeholders. The form structure is NOT stored in the database.

---

## 4. ICE TEMPLATE BUILDER CONTENT

### 4.1 System Architecture

The ICE (Intelligent Care Engine) Template Builder uses a different approach:
- **Storage:** `behandelplan_templates` table
- **Content Type:** Metadata + structured data (JSONB)
- **Text Generation:** Uses hardcoded templates + variable substitution

### 4.2 Behandelplan Template Structure

**Database Columns:**
- `naam` (name)
- `categorie` (category)
- `kaak_scope` (jaw scope: boven/onder/beide/nvt)
- `default_diagnoses` (JSONB array)
- `default_risicos` (JSONB risks)
- `template_rationale` (TEXT - clinical reasoning)
- `indicative_factors` (JSONB)
- `contraindications` (JSONB)
- `alternative_options` (JSONB)
- `prognose_text` (TEXT - prognosis)
- `auto_title_pattern` (TEXT - title generation pattern)
- `diagnosis_template_code` (e.g., "DX-EXTR-001")
- `anatomical_scope_type` (full_dentition, region, element, etc.)
- `anatomical_scope_data` (JSONB with specific teeth/surfaces)

**NO full document templates stored in database.** The system generates documents by:
1. Taking structured metadata from behandelplan_templates
2. Combining with interventie_templates data
3. Using hardcoded document templates from source code
4. Applying variable substitution

### 4.3 Linked Interventie Templates

**Database:** `interventie_templates` table
- Links to `behandelplan_templates`
- Contains: naam, beschrijving, UPT codes, care requirements
- NO full text content, only structured data

**Example workflow:**
1. User selects behandelplan template (e.g., "Extractierijpe dentitie boven")
2. System loads default_diagnoses: ["DX-EXTR-001"]
3. System loads linked interventie_templates
4. Document generation uses hardcoded template from `aiTemplateGenerator.ts`
5. Variables filled from database metadata

---

## 5. HARDCODED CLINICAL CONTENT

### 5.1 Source: aiTemplateGenerator.ts

**Location:** `/src/utils/aiTemplateGenerator.ts`
**Purpose:** Primary document templates used by AI generator and document creation
**Lines:** 68-255

#### Template 1: KlinischeNote (Clinical Note)

```
**Klinische Notitie - {verrichtingOnderdeel}**

Patiënt: {{patientNaam}}, geb. {{geboortedatum}}
Dossiernummer: {{dossierNummer}}
Datum: {{datum}}
Behandelaar: {{eigenNaam}}

**Anamnese:**
{{anamnese}}

**Bevindingen:**
{{bevindingen}}

**Uitgevoerde behandeling:**
{verrichtingOnderdeel}

**Conclusie:**
{{conclusie}}

**Vervolgafspraken:**
{{vervolg}}

Met vriendelijke groet,
{{eigenNaam}}
{{praktijkNaam}}
```

**Variables Used:**
- patientNaam
- geboortedatum
- dossierNummer
- datum
- eigenNaam
- praktijkNaam
- anamnese
- bevindingen
- conclusie
- vervolg

**Status:** ACTIVELY USED in document generation

---

#### Template 2: InformedConsent

```
**Toestemmingsverklaring - {verrichtingOnderdeel}**

Patiëntgegevens:
Naam: {{patientNaam}}
Geboortedatum: {{geboortedatum}}

**Voorgestelde behandeling:**
{verrichtingOnderdeel}

**Doel van de behandeling:**
{{doel}}

**Procedure:**
{{procedure}}

**Risico's en bijwerkingen:**
{{risicos}}

**Alternatieven:**
{{alternatieven}}

**Verklaring patiënt:**
Ik verklaar dat bovenstaande informatie met mij is besproken en dat ik de gelegenheid heb gehad om vragen te stellen. Ik geef toestemming voor de voorgestelde behandeling.

Datum: {{datum}}
Handtekening patiënt: ________________
Handtekening behandelaar: ________________

Behandelaar: {{eigenNaam}}
{praktijkNaam}
```

**Variables Used:**
- patientNaam
- geboortedatum
- doel
- procedure
- risicos
- alternatieven
- datum
- eigenNaam
- praktijkNaam

**Status:** ACTIVELY USED for informed consent generation

---

#### Template 3: PatiëntenInformatie (Patient Information)

```
**Patiënteninformatie - {verrichtingOnderdeel}**

Beste {{patientNaam}},

U heeft binnenkort een afspraak voor {verrichtingOnderdeel.toLowerCase()}.

**Wat kunt u verwachten:**
{{verwachtingen}}

**Voorbereiding:**
{{voorbereiding}}

**Nazorginstructies:**
{{nazorg}}

**Wanneer contact opnemen:**
- Bij aanhoudende pijn na 3 dagen
- Bij zwelling die toeneemt
- Bij bloeding die niet stopt
- Bij koorts boven 38°C

**Contact:**
{{praktijkNaam}}
Telefoon: {{praktijkTelefoon}}
Email: {{praktijkEmail}}

Met vriendelijke groet,
{{eigenNaam}}
```

**Variables Used:**
- patientNaam
- verwachtingen
- voorbereiding
- nazorg
- praktijkNaam
- praktijkTelefoon
- praktijkEmail
- eigenNaam

**Status:** ACTIVELY USED for patient information sheets

---

#### Template 4: Recept (Prescription)

```
Recept voor {{patientNaam}}, geb. {{geboortedatum}}

**Medicatie voor {verrichtingOnderdeel}:**

{{medicatie}}

**Dosering:**
{{dosering}}

**Bijzonderheden:**
{{bijzonderheden}}

Voorschrijver: {{eigenNaam}}
BIG: {{bigNummer}}
Datum: {{datum}}

{praktijkNaam}
{{praktijkTelefoon}}
```

**Variables Used:**
- patientNaam
- geboortedatum
- medicatie
- dosering
- bijzonderheden
- eigenNaam
- bigNummer
- datum
- praktijkNaam
- praktijkTelefoon

**Status:** ACTIVELY USED for prescription generation

---

#### Template 5: Behandelplan (Treatment Plan)

```
**Behandelplan - {verrichtingOnderdeel}**

Patiënt: {{patientNaam}}, geb. {{geboortedatum}}
Datum: {{datum}}
Behandelaar: {{eigenNaam}}

**Diagnose:**
{{diagnose}}

**Voorgesteld behandelplan:**
{verrichtingOnderdeel}

**Behandelfasen:**
{{fasen}}

**Verwachte duur:**
{{duur}}

**Kosten (indicatief):**
{{kosten}}

**Prognose:**
{{prognose}}

**Vervolgafspraken:**
{{vervolgafspraken}}

Behandelaar: {{eigenNaam}}
{praktijkNaam}
```

**Variables Used:**
- patientNaam
- geboortedatum
- datum
- eigenNaam
- diagnose
- fasen
- duur
- kosten
- prognose
- vervolgafspraken
- praktijkNaam

**Status:** ACTIVELY USED for treatment plan generation

---

#### Template 6: Verwijsbrief (Referral Letter)

```
Geachte collega,

Graag verwijs ik u patiënt {{patientNaam}}, geboren op {{geboortedatum}}, voor {verrichtingOnderdeel.toLowerCase()}.

**Reden van verwijzing:**
{{redenVerwijzing}}

**Anamnese:**
{{medischeAnamnese}}

**Klinische bevindingen:**
{{klinischeBevindingen}}

**Radiologische bevindingen:**
{{radiologischeBevindingen}}

**Vraag aan u:**
{{vraagAanCollega}}

Met collegiale groet,
{{eigenNaam}}
{{functie}}
{praktijkNaam}
{{praktijkEmail}} – {{praktijkTelefoon}}
```

**Variables Used:**
- patientNaam
- geboortedatum
- redenVerwijzing
- medischeAnamnese
- klinischeBevindingen
- radiologischeBevindingen
- vraagAanCollega
- eigenNaam
- functie
- praktijkNaam
- praktijkEmail
- praktijkTelefoon

**Status:** ACTIVELY USED for referral letter generation

---

#### Template 7: Verslag (Report)

```
Geachte collega,

Verslag betreffende patiënt {{patientNaam}}, geboren op {{geboortedatum}}.

**Datum behandeling:**
{{datumBehandeling}}

**Uitgevoerde behandeling:**
{verrichtingOnderdeel}

**Bevindingen:**
{{bevindingen}}

**Resultaat:**
{{resultaat}}

**Nazorg:**
{{nazorg}}

**Vervolgafspraken:**
{{vervolg}}

Met collegiale groet,
{{eigenNaam}}
{praktijkNaam}
{{praktijkEmail}} – {{praktijkTelefoon}}
```

**Variables Used:**
- patientNaam
- geboortedatum
- datumBehandeling
- bevindingen
- resultaat
- nazorg
- vervolg
- eigenNaam
- praktijkNaam
- praktijkEmail
- praktijkTelefoon

**Status:** ACTIVELY USED for clinical report generation

---

### 5.2 Source: dummyAI.ts

**Location:** `/src/utils/dummyAI.ts`
**Purpose:** Fallback templates when AI is unavailable / Legacy document generation
**Lines:** 31-236

#### Template 1: Clinical note (dummyAI version)

```
KLINISCHE NOTITIE

Patiënt: {patientCode}
Locatie: {locatie || 'Almelo'}
Datum: {new Date().toLocaleDateString('nl-NL')}
{behandelaar ? `Behandelaar: ${behandelaar}` : ''}

VERRICHTING:
{verrichtingDetail}{verrichtingCategorie ? `\nCategorie: ${verrichtingCategorie}` : ''}{uptInfo}

{verrichtingBeschrijving ? `OMSCHRIJVING:\n${verrichtingBeschrijving}\n\n` : ''}{standaardtekst ? `BEHANDELING:\n${standaardtekst}\n\n` : ''}{bijzonderheden ? `BIJZONDERHEDEN:\n${bijzonderheden}\n\n` : ''}CONCLUSIE:
Behandeling is volgens DNMZ protocol uitgevoerd zonder complicaties.
```

**Variables Used:**
- patientCode
- locatie
- behandelaar
- verrichtingDetail
- verrichtingCategorie
- uptCodes
- verrichtingBeschrijving
- standaardtekst
- bijzonderheden

**Status:** ACTIVELY USED as fallback

---

#### Template 2: Informed Consent (dummyAI version)

```
INFORMED CONSENT - TOESTEMMINGSVERKLARING

Patiënt: {patientCode}
Locatie: {locatie || 'De Nieuwe Mondzorg'}
Behandeling: {verrichtingDetail}
Datum: {new Date().toLocaleDateString('nl-NL')}

INFORMATIE VERSTREKT OVER:
{verrichtingBeschrijving || verrichting}{verrichtingCategorie ? `\n\nCategorie: ${verrichtingCategorie}` : ''}{uptInfo}

{standaardtekst ? `\nBEHANDELINGSPROCEDURE:\n${standaardtekst}\n` : ''}{bijzonderheden ? `\nBIJZONDERE AANDACHTSPUNTEN:\n${bijzonderheden}\n` : ''}
De patiënt is geïnformeerd over:
✓ De aard en doel van de behandeling
✓ Verwachte resultaten en behandelduur
✓ Mogelijke risico's en complicaties
✓ Alternatieven en gevolgen bij niet-behandelen
✓ Kosten en verzekering

Patiënt heeft vragen kunnen stellen en geeft informed consent voor de behandeling.

Handtekening patiënt: _________________  Datum: __________

Handtekening behandelaar: _________________  Datum: __________
```

**Variables Used:**
- patientCode
- locatie
- verrichtingDetail
- verrichtingBeschrijving
- verrichting
- verrichtingCategorie
- uptCodes
- standaardtekst
- bijzonderheden

**Status:** ACTIVELY USED as fallback

---

#### Template 3: Verwijsbrief (Referral Letter - dummyAI version)

```
VERWIJSBRIEF

DE NIEUWE MONDZORG
{locatie || 'Almelo'}

Geachte collega,

Patiënt: {patientCode}
Datum: {new Date().toLocaleDateString('nl-NL')}
{behandelaar ? `Verwijzend arts: ${behandelaar}` : ''}

Ik verwijs u onderstaande patiënt voor: {verrichtingDetail}{verrichtingCategorie ? `\nCategorie: ${verrichtingCategorie}` : ''}{uptInfo}

ANAMNESE EN BEVINDINGEN:
{verrichtingBeschrijving || ''}
{standaardtekst || ''}

{bijzonderheden ? `AANVULLENDE INFORMATIE:\n${bijzonderheden}\n` : ''}VRAAGSTELLING:
Graag verneem ik uw bevindingen en advies voor verdere behandeling.

Bij voorkeur retourinformatie binnen 2 weken.

Met vriendelijke groet,

{behandelaar || '[Naam behandelaar]'}
De Nieuwe Mondzorg - {locatie || 'Almelo'}
```

**Variables Used:**
- patientCode
- locatie
- behandelaar
- verrichtingDetail
- verrichtingCategorie
- uptCodes
- verrichtingBeschrijving
- standaardtekst
- bijzonderheden

**Status:** ACTIVELY USED as fallback

---

#### Template 4: Patiënteninformatie (Patient Information - dummyAI version)

```
INFORMATIE VOOR PATIËNT

DE NIEUWE MONDZORG

Beste patiënt,

Behandeling: {verrichtingDetail}{verrichtingCategorie ? `\nType behandeling: ${verrichtingCategorie}` : ''}

{verrichtingBeschrijving ? `WAT HOUDT DE BEHANDELING IN?\n${verrichtingBeschrijving}\n\n` : ''}{standaardtekst ? `BEHANDELINGSPROCES:\n${standaardtekst}\n\n` : ''}{bijzonderheden ? `BELANGRIJK OM TE WETEN:\n${bijzonderheden}\n\n` : ''}NAZORG:
• Volg de gegeven instructies nauwkeurig op
• Bij pijn of zwelling: contact opnemen met de praktijk
• Controleafspraak indien nodig plannen
• Goede mondhygiëne handhaven

CONTACT:
Bij vragen of klachten kunt u ons bereiken via:
Tel: 0546-123456 ({locatie || 'Almelo'})
Email: info@denieuwe mondzorg.nl

Met vriendelijke groet,
Team De Nieuwe Mondzorg
```

**Variables Used:**
- verrichtingDetail
- verrichtingCategorie
- verrichtingBeschrijving
- standaardtekst
- bijzonderheden
- locatie

**Status:** ACTIVELY USED as fallback

---

#### Template 5: Behandelplan (Treatment Plan - dummyAI version)

```
BEHANDELPLAN

Patiënt: {patientCode}
Locatie: {locatie || 'De Nieuwe Mondzorg'}
Datum: {new Date().toLocaleDateString('nl-NL')}
{behandelaar ? `Behandelaar: ${behandelaar}` : ''}

VOORGESTELDE BEHANDELING:
{verrichtingDetail}{verrichtingCategorie ? `\nCategorie: ${verrichtingCategorie}` : ''}{uptInfo}

INDICATIE:
{verrichtingBeschrijving || verrichting}

{standaardtekst ? `BEHANDELINGSAANPAK:\n${standaardtekst}\n\n` : ''}{bijzonderheden ? `BIJZONDERHEDEN:\n${bijzonderheden}\n\n` : ''}PLANNING:
Dit behandelplan wordt besproken met de patiënt en na akkoord uitgevoerd volgens DNMZ protocollen.

BEGROTING:
Zie separate kostenbegroting voor financiële details.
```

**Variables Used:**
- patientCode
- locatie
- behandelaar
- verrichtingDetail
- verrichtingCategorie
- uptCodes
- verrichtingBeschrijving
- verrichting
- standaardtekst
- bijzonderheden

**Status:** ACTIVELY USED as fallback

---

#### Template 6: PMO Samenvatting (PMO Summary)

**Function:** `generatePMOSummary()`
**Purpose:** Generate Periodiek Mondgezondheidsonderzoek (Periodic Oral Health Examination) summary

```
PMO SAMENVATTING
Patiënt: {patientCode}
Datum: {new Date().toLocaleDateString('nl-NL')}

ASA CLASSIFICATIE: ASA {asa}

PARODONTALE SCREENING (PPS):
Q1: {pps_q1}
Q2: {pps_q2}
Q3: {pps_q3}
Q4: {pps_q4}

CARIOLOGIE:
- {cariologie.opties.join(', ')}
{cariologie.tekst}

RESTAURATIES:
- {restauraties.opties.join(', ')}
{restauraties.tekst}

ENDODONTIE:
- {endodontie.opties.join(', ')}
{endodontie.tekst}

VOORZIENINGEN:
- {voorzieningen entries}

UITNEEMBARE VOORZIENINGEN:
- {uitneembare_voorzieningen entries}

OPMERKINGEN:
{opmerking}

CONCLUSIE:
Mondhygiënisch onderzoek uitgevoerd. Patiënt is geïnformeerd over de bevindingen en het voorgestelde behandelplan.
```

**Variables Used:**
- patientCode
- asa (ASA classification)
- pps_q1/q2/q3/q4 (Periodontal screening per quadrant)
- cariologie.opties, cariologie.tekst
- restauraties.opties, restauraties.tekst
- endodontie.opties, endodontie.tekst
- voorzieningen (Object with key-value pairs)
- uitneembare_voorzieningen (Object with key-value pairs)
- opmerking

**Status:** ACTIVELY USED for PMO documentation

---

### 5.3 Source: cliniDocTemplateService.ts

**Location:** `/src/services/cliniDocTemplateService.ts`
**Purpose:** CliniDoc template matching and fallback generation

**Fallback Template Function:**
When no template is found in database, generates basic structure:

```typescript
return {
  inhoud: `# ${documentType}\n\nPatiënt: {{patient_naam}}\nDatum: {{datum}}\n\n## Inhoud\n\n${klinischeInhoud || ''}`,
  variabelen: ['patient_naam', 'datum']
};
```

**Status:** Fallback only, rarely used

---

### 5.4 Source: Case AI Generators

**Location:** `/src/services/caseAI.ts`

#### Template 1: Case Samenvatting (Case Summary)

```typescript
const sections = [
  `CASE SAMENVATTING - ${caseData.patientName}`,
  `Datum: ${new Date().toLocaleDateString('nl-NL')}`,
  `\n**Casus:**`,
  caseData.caseTitle,
  `\n**Complexiteit:** ${caseData.complexiteit}`,
  // ... additional sections
];
```

**Purpose:** Generate case summary document for complex treatment cases

#### Template 2: Case Overdracht (Case Handover)

```typescript
const handoverSections = [
  `CASE OVERDRACHT`,
  `Van: ${fromUser}`,
  `Naar: ${toUser}`,
  `Datum: ${new Date().toLocaleDateString('nl-NL')}`,
  // ... case details
];
```

**Purpose:** Generate case handover document when transferring case ownership

#### Template 3: Case Afsluitrapport (Case Closure Report)

```typescript
const closureSections = [
  `AFSLUITRAPPORT CASUS`,
  `Patiënt: ${caseData.patientName}`,
  `Afgesloten op: ${new Date().toLocaleDateString('nl-NL')}`,
  `\n**Eindresultaat:**`,
  caseData.eindresultaat,
  // ... outcomes and learnings
];
```

**Purpose:** Generate case closure documentation

**Status:** All 3 case templates ACTIVELY USED in case management workflow

---

## 6. CLINICAL NOTE COMPOSER

### 6.1 Source: ClinicalNoteComposerModal.tsx

**Location:** `/src/components/ClinicalNoteComposerModal.tsx`

**Default Content Strategy:**
- NO hardcoded template text in this component
- Relies on:
  1. Selected template from database (templates table)
  2. Fallback to aiTemplateGenerator.ts templates
  3. User-entered content

**Placeholder Text:**
```typescript
placeholder="Typ hier uw klinische notitie of selecteer een template..."
```

**Status:** Template-driven, no hardcoded clinical content

---

### 6.2 Source: ClinicalNoteComposerInline.tsx

**Location:** `/src/components/ClinicalNoteComposerInline.tsx`

**Default Content Strategy:**
- Same as Modal version
- No hardcoded templates
- Template selection or free text

**Status:** Template-driven, no hardcoded clinical content

---

### 6.3 Source: ClinicalNoteComposer.tsx (Page)

**Location:** `/src/pages/ClinicalNoteComposer.tsx`

**Default Content Strategy:**
- Page wrapper for inline composer
- No hardcoded templates
- Manages document creation flow

**Status:** No hardcoded content, orchestration only

---

## 7. AI GENERATOR (LEGACY)

### 7.1 Source: AIGenerator.tsx

**Location:** `/src/pages/AIGenerator.tsx`

**Content:**
- UI component only
- Calls `aiTemplateGenerator.ts` functions
- No hardcoded templates in UI
- All templates in service layer (see Section 5.1)

**Status:** UI wrapper, no content

---

### 7.2 Source: AI Service Files

**Files Checked:**
- `src/services/aiOrchestrator.ts` - Orchestration only, no templates
- `src/services/aiReasoningSummaryGenerator.ts` - Logic only, no templates
- `src/services/aiTreatmentGenerator.ts` - Logic only, no templates
- `src/services/behandelplanAI.ts` - Logic only, no templates
- `src/services/behandelplanAI_v2.ts` - Logic only, no templates
- `src/services/begrotingenAI.ts` - Budget calculations, no clinical templates
- `src/services/caseAI.ts` - **Contains case templates (see Section 5.4)**
- `src/services/clinicalReasoningEngine.ts` - Logic only, no templates
- `src/services/dnmzAiSuggestionEngine.ts` - Suggestions only, no templates
- `src/services/protocolAI.ts` - Protocol generation logic
- `src/services/statusPraesensAI.ts` - Status generation logic

**Finding:** Only `caseAI.ts` contains template strings. All other AI services use:
- Database queries for data
- Hardcoded templates from `aiTemplateGenerator.ts` and `dummyAI.ts`
- Structured data transformation

---

## 8. ORPHANED / UNUSED CONTENT

### 8.1 Database Templates - Orphaned

**Kandidaten (requires verification):**
- **Sneltekst templates (26):** May be orphaned if not actively selected in UI
- **Verslag templates without teksttype (10):** Unclear usage, no type classification
- **Formulier templates without content (4):** Name-only records, no usable content

**Recommendation:** Audit UI to determine if these are selectable and used.

---

### 8.2 Hardcoded Content - All Active

**Finding:** All hardcoded templates in source code are ACTIVELY USED.
- `aiTemplateGenerator.ts`: Used by AI template generator and document creation
- `dummyAI.ts`: Used as fallback when AI unavailable
- `caseAI.ts`: Used in case management workflow

**No orphaned hardcoded content identified.**

---

## 9. VARIABLE INVENTORY

### 9.1 Complete Variable List (45 unique variables)

**Patient Data:**
- `{{patientNaam}}` / `{patientCode}`
- `{{geboortedatum}}`
- `{{dossierNummer}}`

**Provider Data:**
- `{{eigenNaam}}` / `{behandelaar}`
- `{{functie}}`
- `{{bigNummer}}`

**Practice Data:**
- `{{praktijkNaam}}`
- `{{praktijkEmail}}`
- `{{praktijkTelefoon}}`
- `{locatie}`

**Date/Time:**
- `{{datum}}`
- `{{datumBehandeling}}`

**Clinical Content:**
- `{{anamnese}}`
- `{{medischeAnamnese}}`
- `{{bevindingen}}`
- `{{klinischeBevindingen}}`
- `{{radiologischeBevindingen}}`
- `{{diagnose}}`
- `{{behandeling}}`
- `{verrichting}`
- `{verrichtingCode}`
- `{verrichtingCategorie}`
- `{verrichtingOnderdeel}`
- `{verrichtingBeschrijving}`
- `{uptCodes}` / `{uptInfo}`

**Informed Consent Specific:**
- `{{doel}}`
- `{{procedure}}`
- `{{risicos}}`
- `{{alternatieven}}`

**Patient Info Specific:**
- `{{verwachtingen}}`
- `{{voorbereiding}}`
- `{{nazorg}}`

**Treatment Plan Specific:**
- `{{fasen}}`
- `{{duur}}`
- `{{kosten}}`
- `{{prognose}}`
- `{{vervolgafspraken}}` / `{{vervolg}}`

**Prescription Specific:**
- `{{medicatie}}`
- `{{dosering}}`

**Referral Specific:**
- `{{redenVerwijzing}}`
- `{{vraagAanCollega}}`

**General:**
- `{{conclusie}}`
- `{{resultaat}}`
- `{{bijzonderheden}}`
- `{standaardtekst}`

### 9.2 Variable Syntax

**Two syntaxes used:**
1. **Mustache style:** `{{variableName}}` - Used in aiTemplateGenerator.ts
2. **Template literal style:** `{variableName}` - Used in dummyAI.ts

**Recommendation:** Standardize on one syntax for consistency.

---

## 10. USAGE MAPPING

### 10.1 Active Document Flows

**Flow 1: AI-Generated Documents**
1. User selects document type in AIGenerator
2. System calls `aiTemplateGenerator.ts` → `generateDummyTemplate()`
3. Returns hardcoded template with variables
4. User fills variables
5. Document saved to `document_store` table

**Flow 2: CliniDoc Document Creation**
1. User opens CliniDoc creator
2. System queries `templates` table for matching template
3. If found: uses database template content
4. If not found: falls back to `cliniDocTemplateService.ts` basic structure
5. User edits content
6. Document saved to `document_store` table

**Flow 3: ICE-Generated Clinical Reasoning**
1. User creates behandelplan from ICE template
2. System loads `behandelplan_templates` metadata
3. System generates document using:
   - default_diagnoses (JSONB)
   - template_rationale (TEXT)
   - Structured interventie data
4. NO full document template used, documents assembled from fragments

**Flow 4: PMO Documentation**
1. User completes PMO (Status Praesens) form
2. System calls `dummyAI.ts` → `generatePMOSummary()`
3. Returns structured PMO summary text
4. Saved to `document_store` or embedded in behandelplan

**Flow 5: Case Documentation**
1. User creates/closes case
2. System calls `caseAI.ts` case template functions
3. Returns formatted case document
4. Saved to case records

---

### 10.2 Inactive / Unclear Flows

**Unclear:**
- **Formulier templates:** Forms UI not fully implemented, templates are placeholders
- **Verslag templates (untyped):** No clear generation flow identified
- **Sneltekst templates:** Selection mechanism unclear, may be manual copy-paste

**Recommendation:** UI audit needed to map complete usage.

---

## 11. ARCHITECTURAL OBSERVATIONS

### 11.1 Hybrid Architecture

**The system uses TWO different approaches simultaneously:**

**Approach A: Traditional Template Storage (Database)**
- Templates stored in `templates` table
- Full document text in `inhoud` column
- Used for: Legacy behandelnotitie quick texts
- Pros: Easy to edit via UI, no code deployment needed
- Cons: Limited to text, no structured data, harder to version

**Approach B: Code-Based Templates (TypeScript)**
- Templates hardcoded in `aiTemplateGenerator.ts` and `dummyAI.ts`
- Used for: All modern document generation (AI generator, document composer fallback)
- Pros: Version controlled, can include logic, consistent formatting
- Cons: Requires code change to modify, not editable by users

**Approach C: Metadata + Assembly (ICE Templates)**
- Structured data in `behandelplan_templates` (JSONB)
- No full templates, documents assembled from fragments
- Used for: Clinical reasoning, treatment plans from ICE
- Pros: Highly structured, reusable components, data-driven
- Cons: Complex assembly logic, harder to preview full output

### 11.2 Document Generation Strategy

**Primary Strategy:** Hardcoded templates in source code
- 7 templates in aiTemplateGenerator.ts
- 5 templates + PMO in dummyAI.ts
- 3 templates in caseAI.ts

**Secondary Strategy:** Database templates
- 113 templates in database
- Primarily legacy quick texts
- Limited modern usage

**Tertiary Strategy:** Metadata-driven assembly
- ICE behandelplan system
- No full templates, structured fragments

---

## 12. RECOMMENDATIONS

### 12.1 Immediate Actions

1. **Standardize Variable Syntax**
   - Choose between `{{var}}` or `{var}`
   - Apply consistently across all templates

2. **Complete Formulier Implementation**
   - 4 of 6 formulier templates have no content
   - Either implement full forms or remove placeholder records

3. **Audit Sneltekst Usage**
   - Determine if 26 sneltekst templates are actively used
   - If not, mark as inactive or remove

4. **Document Template Source of Truth**
   - Create clear documentation of which templates come from where
   - Establish governance: when to use database vs. code vs. ICE metadata

### 12.2 Strategic Considerations

1. **Migrate to Unified System**
   - Consider migrating all templates to database
   - OR: Move all modern templates to code, deprecate database storage
   - Current hybrid creates confusion and maintenance burden

2. **Template Versioning**
   - Implement version tracking for templates
   - Track changes, allow rollback
   - Audit trail for clinical documentation

3. **Form Builder**
   - Implement full form builder for Formulier templates
   - Move from text-based to structured form definitions
   - Enable dynamic form rendering

4. **Variable Management**
   - Create centralized variable registry
   - Document all available variables
   - Type safety for variable substitution

---

## 13. SUMMARY STATISTICS

### 13.1 Content Counts

**Database Content:**
- Templates (active): 113
  - Tekst: 94 (83% have content)
  - Verslag: 13 (status unclear)
  - Formulier: 6 (33% have content, only placeholders)

**Hardcoded Content:**
- aiTemplateGenerator.ts: 7 full document templates
- dummyAI.ts: 6 full document templates (5 + PMO)
- caseAI.ts: 3 case document templates
- **Total hardcoded: 16 templates**

**ICE Metadata:**
- behandelplan_templates: Variable count (need query)
- interventie_templates: Variable count (need query)
- Uses fragment-based assembly, no full templates

### 13.2 Variable Usage

**Unique variables identified:** 45
**Syntax variants:** 2 (mustache vs. template literal)

### 13.3 Active vs. Inactive

**Confirmed Active:**
- All 16 hardcoded templates
- Unknown % of database templates (requires UI audit)

**Confirmed Inactive:**
- None identified (but likely candidates exist)

**Unknown Status:**
- 26 Sneltekst templates
- 10 untyped Verslag templates
- 4 empty Formulier templates

---

## 14. CONCLUSION

### 14.1 Key Findings

1. **The database contains mostly legacy content.** Modern document generation relies on hardcoded TypeScript templates.

2. **No single source of truth.** Three different systems (database, code, ICE metadata) coexist without clear governance.

3. **Formulier templates are non-functional.** 6 templates exist but 4 have no content and form rendering is not implemented.

4. **All modern, actively-used templates are in source code.** This makes user customization impossible without code deployment.

5. **Variable substitution is inconsistent.** Two syntax styles are used interchangeably.

### 14.2 Impact on Form-Based Redesign

For redesigning clinical encounters with form-based input:

**Assets to Leverage:**
- 16 hardcoded templates provide good structure and variable inventory
- PMO template shows strong structured data approach
- ICE metadata approach demonstrates fragment-based assembly

**Challenges:**
- Database templates are mostly unusable for modern forms
- No existing form definition system
- Variable substitution needs standardization
- Three competing architectures create complexity

**Recommended Approach:**
1. Use hardcoded templates as baseline for new form structure
2. Implement new form builder (separate from legacy templates)
3. Create structured form definitions (JSON schema)
4. Generate documents from form data (not template substitution)
5. Deprecate legacy database templates gradually

---

**End of Report**

*Total document templates inventoried: 129 (113 database + 16 hardcoded)*
*Total variables documented: 45 unique placeholders*
*Primary finding: Hardcoded templates are the de facto standard for modern document generation*
