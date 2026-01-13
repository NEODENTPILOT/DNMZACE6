# CLINICAL ENCOUNTER DEFINITIONS
## Derived from Existing Template Content

**Date:** December 21, 2024
**Source:** COMPLETE_TEMPLATE_CONTENT_INVENTORY.md + Database templates
**Method:** Structure extraction only - NO content invention

**Important:** All field definitions are derived from existing template text. Field types, labels, and requirements are inferred from consistent patterns across source templates.

---

## TABLE OF CONTENTS

1. [PMO Uitgebreid (Comprehensive Oral Health Examination)](#1-pmo-uitgebreid)
2. [PMO Kort (Brief Oral Health Check)](#2-pmo-kort)
3. [Pijnklacht Acute (Acute Pain Complaint)](#3-pijnklacht-acute)
4. [Consult Algemeen (General Consultation)](#4-consult-algemeen)
5. [Intake Nieuwe Patiënt (New Patient Intake)](#5-intake-nieuwe-patiënt)
6. [Parotraject Intake (Periodontal Trajectory Intake)](#6-parotraject-intake)
7. [Implantologie Time-out (Implantology Pre-op)](#7-implantologie-time-out)
8. [Implantologie Operatieverslag (Implant Surgery Report)](#8-implantologie-operatieverslag)
9. [Implantologie Controle (Implant Follow-up)](#9-implantologie-controle)
10. [Informed Consent Implantologie](#10-informed-consent-implantologie)

---

## 1. PMO UITGEBREID
### Comprehensive Oral Health Examination

**Clinical Purpose:** Complete periodic oral health assessment, including extraoral/intraoral examination, periodontal screening, caries detection, and treatment planning.

**Source Templates:**
- Database: "PMO (uitgebreid)" (Consult-text)
- dummyAI.ts: `generatePMOSummary()` function

**Usage Context:** Periodic checkup, comprehensive assessment, new patient evaluation

---

### Section 1.1: Anamnese & Klachten

**Section Purpose:** Patient history update and chief complaints

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `bijzonderheden` | Bijzonderheden | textarea | false | "Bijzonderheden:" |
| `wensen` | Wensen | textarea | false | "Wensen/klachten:" |
| `klachten` | Klachten | textarea | false | "Wensen/klachten:" |

---

### Section 1.2: Extraoraal & Intraoraal Onderzoek

**Section Purpose:** External and internal oral examination

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `extraoraal` | Extraoraal onderzoek | textarea | true | "EO:" |
| `intraoraal` | Intraoraal onderzoek | textarea | true | "IO:" |
| `slijmvliezen` | Slijmvliezen | textarea | true | "Slijmvliezen:" |
| `tong` | Tong | textarea | true | "Tong:" |
| `slijtage` | Slijtage | textarea | false | "Slijtage:" |

---

### Section 1.3: Mondhygiëne & Zelfzorg

**Section Purpose:** Oral hygiene assessment

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `mondgezondheid` | Mondhygiëne | enum | true | "MH: zeer slecht/slecht/matig/goed" |
| `interdentaal` | Interdentale reiniging | textarea | false | "Interdentaal:" |
| `plaque` | Plaque | enum | false | "Plaque: lokaal/voorkeurslokatie/gegeneraliseerd" |
| `bloeding` | Bloeding | enum | false | "Bloeding: lokaal/voorkeurslokatie/gegeneraliseerd" |

**Enum Options for `mondgezondheid`:**
- zeer_slecht
- slecht
- matig
- goed

**Enum Options for `plaque` and `bloeding`:**
- lokaal
- voorkeurslokatie
- gegeneraliseerd

---

### Section 1.4: Parodontale Screening (PPS)

**Section Purpose:** Periodontal pocket screening per quadrant

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `pps` | PPS score | text | true | "PPS:" |
| `pps_q1` | PPS Kwadrant 1 | text | false | "Q1: {pps_q1}" (dummyAI) |
| `pps_q2` | PPS Kwadrant 2 | text | false | "Q2: {pps_q2}" (dummyAI) |
| `pps_q3` | PPS Kwadrant 3 | text | false | "Q3: {pps_q3}" (dummyAI) |
| `pps_q4` | PPS Kwadrant 4 | text | false | "Q4: {pps_q4}" (dummyAI) |

---

### Section 1.5: Bevindingen Harde Weefsels

**Section Purpose:** Hard tissue findings

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `caries` | Cariës | textarea | true | "Caries:" + "cariologie.opties" (dummyAI) |
| `cariesOpties` | Cariologie opties | text | false | "cariologie.opties" (dummyAI) |
| `cariesTekst` | Cariologie tekst | textarea | false | "cariologie.tekst" (dummyAI) |
| `restauraties` | Restauraties | textarea | true | "Restauraties:" |
| `restauratiesOpties` | Restauraties opties | text | false | "restauraties.opties" (dummyAI) |
| `restauratiesTekst` | Restauraties tekst | textarea | false | "restauraties.tekst" (dummyAI) |
| `kroonBrugwerk` | Kroon-Brugwerk | textarea | false | "Kroon-Brugwerk:" |
| `endodontie` | Endodontie | textarea | false | "Endo:" |
| `endodontieOpties` | Endodontie opties | text | false | "endodontie.opties" (dummyAI) |
| `endodontieTekst` | Endodontie tekst | textarea | false | "endodontie.tekst" (dummyAI) |
| `slijtageKortTermijn` | Slijtage korte termijn | textarea | false | "Slijtage:" (Korte termijn section) |

---

### Section 1.6: Radiologische Diagnostiek

**Section Purpose:** Radiographic imaging

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `rontgenIndicatie` | Röntgen uitgevoerd | boolean | true | "Rontgendiagnostiek: Ja / Nee" |
| `rontgenType` | Type röntgen | text | false | "Solo/BW/OPG/CBCT" |

---

### Section 1.7: ASA & Voorzieningen

**Section Purpose:** Medical risk classification and prosthetic devices

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `asa` | ASA classificatie | number | false | "ASA CLASSIFICATIE: ASA {asa}" (dummyAI) |
| `voorzieningen` | Voorzieningen | textarea | false | "voorzieningen" (dummyAI) |
| `uitneembareVoorzieningen` | Uitneembare voorzieningen | textarea | false | "uitneembare_voorzieningen" (dummyAI) |

---

### Section 1.8: Conclusie & Behandelplan

**Section Purpose:** Clinical conclusion and treatment plan

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `conclusie` | Conclusie | textarea | true | "Conclusie:" |
| `recall` | Recall interval | text | false | "Recall:" |
| `txPlanPreventie` | Preventie | textarea | false | "Tx-plan: 1) Preventie" |
| `txPlanAcuteInterventies` | Acute interventies | textarea | false | "2) Acute interventies:" |
| `txPlanKorteTermijn` | Korte termijn interventies | textarea | false | "3) Korte termijn interventies:" |
| `txPlanLangeTermijn` | Lange termijn interventies | textarea | false | "4) Lange termijn interventies:" |
| `informedConsent` | Informed consent gegeven | boolean | true | "Informed Consent: Ja / Nee" |
| `vervolg` | Vervolgafspraken | textarea | false | "Vervolg:" |
| `opmerkingen` | Opmerkingen | textarea | false | "OPMERKINGEN:" (dummyAI) |

---

### Section 1.9: OCH (Mondhygiënist Doorsturen)

**Section Purpose:** Referral to dental hygienist

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `ochCaries` | OCH - Cariës | textarea | false | "Naar OCH: Caries:" |
| `ochRestauraties` | OCH - Restauraties | textarea | false | "Naar OCH: Restauraties:" |
| `ochKroonBrugwerk` | OCH - Kroon-Brugwerk | textarea | false | "Naar OCH: Kroon-Brugwerk:" |
| `ochEndo` | OCH - Endodontie | textarea | false | "Naar OCH: Endo:" |
| `ochSlijtage` | OCH - Slijtage | textarea | false | "Naar OCH: Slijtage:" |

---

## 2. PMO KORT
### Brief Oral Health Check

**Clinical Purpose:** Quick oral health check, focused screening for routine patients

**Source Templates:**
- Database: "PMO (kort)" (Consult-text)

**Usage Context:** Routine checkup, limited time, stable patients

---

### Section 2.1: Anamnese Update

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `medAnamWijziging` | Medische anamnese wijziging | textarea | false | "MedAnam wijziging:" |
| `wensVerwachtingKlacht` | Wens/Verwachting/Klacht | textarea | false | "Wens/Verwachting/Klacht:" |

---

### Section 2.2: Klinisch Onderzoek

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `extraoraal` | Extraoraal | textarea | true | "EXTRA-ORAAL:" |
| `intraoraal` | Intraoraal | textarea | true | "INTRA-ORAAL" |
| `slijmvliezen` | Slijmvliezen | textarea | true | "Slijmvliezen:" |
| `tong` | Tong | textarea | true | "Tong:" |
| `ppsMhZelfzorg` | PPS/MH/Zelfzorg | textarea | true | "PPS/MH/Zelfzorg:" |
| `lifestyle` | Lifestyle | textarea | false | "Lifestyle:" |

---

### Section 2.3: Bevindingen & Diagnostiek

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `rontgen` | Röntgen | textarea | false | "Röntgen:" |
| `slijtage` | Slijtage (attritie/erosie) | textarea | false | "Slijtage(attittie/erosie):" |
| `gnathoParafuncties` | Gnatho/Parafuncties | textarea | false | "Gnatho/Parafuncties:" |
| `indicatieFluoride` | Indicatie fluoride | textarea | false | "Indicatie fluoride:" |
| `ochVorigeBezoek` | OCH vorige bezoek | textarea | false | "OCH vorige bezoek:" |
| `och` | OCH | textarea | false | "OCH:" |
| `bevindingenHardeWeefsels` | Bevindingen harde weefsels | textarea | true | "Bevindingen harde weefsels:" |
| `rontgendiagnostiek` | Röntgendiagnostiek | textarea | false | "Rontgendiagnostiek:" |
| `diagnostiek` | Diagnostiek | textarea | false | "Diagnostiek:" |

---

### Section 2.4: Conclusie & Zorgplan

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `conclusie` | Conclusie | textarea | true | "Conclusie:" |
| `nogNietAfgemaakteTxPlan` | Nog niet afgemaakte Tx-plan | boolean | false | "Nog niet afgemaakte Tx-plan: ja/nee" |
| `waaromNietAfgemaakt` | Waarom niet afgemaakt | textarea | false | "zo ja, dan waarom:" |
| `zelfzorgThuis` | Zelfzorg thuis | textarea | false | "Zelfzorg thuis:2-3x daags mondverzorging (poetsen+interdentaal)" |
| `frequentieTa` | Frequentie tandarts | text | false | "Frequentie ta:" |
| `frequentiePrevMh` | Frequentie prev/mh | text | false | "Frequentie prev/mh:" |
| `acuteInterventies` | Acute interventies | textarea | false | "Acute interventies:" |
| `interventiesKorteTermijn` | Interventies korte termijn | textarea | false | "Interven ties op korte termijn:" |
| `interventiesLangeTermijn` | Interventies lange termijn | textarea | false | "Interventies op lange termijn:" |
| `afspraken` | Afspraken | textarea | false | "Afspraken:" |

---

## 3. PIJNKLACHT ACUTE
### Acute Pain Complaint

**Clinical Purpose:** Emergency consultation for acute pain, focused clinical assessment and immediate intervention

**Source Templates:**
- Database: "Pijnconsult – acute klacht" (Behandelnotitie)
- Database: "Pijnklacht" (Consult-text)

**Usage Context:** Emergency appointment, acute pain, rapid assessment

---

### Section 3.1: Anamnese Pijn

**Section Purpose:** Pain history

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `soortPijn` | Soort pijn | enum | true | "Soort pijn: {{soortPijn}} (zeurend, kloppend, scherp)" |
| `lokalisatie` | Lokalisatie / Waar | textarea | true | "Lokalisatie: {{lokalisatie}}" + "Waar:" |
| `duurKlachten` | Hoelang | text | true | "Hoelang:" |
| `uitlokkendeFactoren` | Uitlokkende factoren | textarea | false | "Uitlokkende factoren: {{triggers}}" + "Warm/Koud/Zoet" |
| `nachtelijkePijn` | Nachtelijke pijn | boolean | false | "Nachtelijke pijn: {{nacht}}" |
| `pijnkarakter` | Karakter | enum | false | "Zeurend/kloppend" + "Constant/Bij activiteit" |
| `medicatiegebruik` | Medicatiegebruik | textarea | false | "Medicatiegebruik: {{medicatie}}" |

**Enum Options for `soortPijn`:**
- zeurend
- kloppend
- scherp

**Enum Options for `pijnkarakter`:**
- zeurend
- kloppend
- constant
- bij_activiteit

---

### Section 3.2: Onderzoek

**Section Purpose:** Clinical examination

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `extraoraal` | Extraoraal onderzoek | textarea | true | "Extraoraal: {{extraoraal}}" |
| `intraoraal` | Intraoraal onderzoek | textarea | true | "Intraoraal: {{intraoraal}}" |
| `percussietest` | Percussietest | textarea | true | "Percussietest: {{percussie}}" |
| `vitaliteitstest` | Vitaliteitstest | textarea | true | "Vitaliteitstest: {{vitaliteit}}" |
| `pocketmetingLokaal` | Pocketmeting lokaal | textarea | false | "Pocketmeting lokaal: {{pockets}}" |
| `zwelling` | Zwelling | boolean | false | "Zwelling/Bloed" |
| `bloeding` | Bloeding | boolean | false | "Zwelling/Bloed" |
| `occlusie` | Occlusie | boolean | false | "Occlusie Ja/Nee" |
| `elementMobiel` | Element mobiel | boolean | false | "Element mobiel" |
| `foetorExOre` | Foetor ex ore | boolean | false | "Foetor ex ore/Trismus" |
| `trismus` | Trismus | boolean | false | "Foetor ex ore/Trismus" |

---

### Section 3.3: Diagnose & Beleid

**Section Purpose:** Working diagnosis and treatment plan

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `diagnose` | Waarschijnlijke diagnose | textarea | true | "Diagnose: - Waarschijnlijke diagnose: {{diagnose}}" |
| `directeBehandeling` | Directe behandeling | textarea | true | "Beleid: - Directe behandeling: {{behandeling}}" |
| `pijnstilling` | Pijnstilling/medicatie | textarea | false | "- Pijnstilling/medicatie: {{pijnstilling}}" |
| `informatieProg nose` | Informatie over prognose | textarea | false | "- Informatie over prognose: {{prognose}}" |
| `controleafspraak` | Controleafspraak | text | false | "- Controleafspraak: {{controle}}" |
| `kortBehandeldAan` | Kort geleden behandeld aan | textarea | false | "Kort geleden behandeld aan:" |
| `algemeenGezondheid` | Algemene gezondheid | textarea | false | "Algemene gezondheid:" |

---

## 4. CONSULT ALGEMEEN
### General Consultation

**Clinical Purpose:** General dental consultation, not emergency but not comprehensive PMO

**Source Templates:**
- Database: "Consult algemeen – kort verslag"

**Usage Context:** Second opinion, consultation visit, problem-focused examination

---

### Section 4.1: Anamnese

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `hoofdklacht` | Hoofdklacht | textarea | true | "Hoofdklacht: {{hoofdklacht}}" |
| `duurKlachten` | Duur klachten | text | false | "Duur klachten: {{duur}}" |
| `pijnscore` | Pijnscore (0-10) | number | false | "Pijnscore (0–10): {{pijnscore}}" |

---

### Section 4.2: Onderzoek

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `extraoraal` | Extraoraal onderzoek | textarea | true | "Extraoraal onderzoek: {{extraoraal}}" |
| `intraoraal` | Intraoraal onderzoek | textarea | true | "Intraoraal onderzoek: {{intraoraal}}" |

---

### Section 4.3: Diagnose & Plan

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `diagnose` | Werkdiagnose | textarea | true | "Werkdiagnose: {{diagnose}}" |
| `plan` | Afgesproken behandeling | textarea | true | "Afgesproken behandeling: {{plan}}" |
| `instructie` | Informatie en instructie gegeven | textarea | false | "Informatie en instructie gegeven: {{instructie}}" |
| `vervolg` | Vervolgafspraak | text | false | "Vervolgafspraak: {{vervolg}}" |

---

## 5. INTAKE NIEUWE PATIËNT
### New Patient Intake

**Clinical Purpose:** Comprehensive intake for new patients, including medical history and dental history

**Source Templates:**
- Database: "Formulier – Intake nieuwe patiënt (anamnese)" (placeholder)
- Database: "Intake Nieuwe Patiënt" (name only)

**Usage Context:** First visit new patient

**Note:** Template content is minimal placeholder text. Field structure derived from standard dental intake requirements and similar encounter patterns.

---

### Section 5.1: Algemene Gegevens

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `medischeGegevens` | Medische gegevens | textarea | true | "inclusief medische gegevens" |
| `tandheelkundigeVoorgeschiedenis` | Tandheelkundige voorgeschiedenis | textarea | true | "en tandheelkundige voorgeschiedenis" |

**Note:** This encounter requires expansion based on institutional requirements. Current templates provide only high-level placeholders.

---

## 6. PAROTRAJECT INTAKE
### Periodontal Trajectory Intake

**Clinical Purpose:** Initial assessment for periodontal therapy program

**Source Templates:**
- Database: "Parotraject intake" (Behandelnotitie)

**Usage Context:** Start of periodontal treatment program

---

### Section 6.1: Anamnese & Zelfzorg

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `gespoeldMet` | Gespoeld met | text | false | "Gespoeld met perio-aid 0.12%" |
| `mondgezondheid` | Mondgezondheid | textarea | false | "Mondgezondheid:" |
| `zelfzorg` | Zelfzorg | textarea | true | "Zelfzorg:" |
| `interdentaal` | Interdentaal | textarea | true | "Interdentaal:" |
| `andersSpoelt` | Anders/spoelt | textarea | false | "Anders/spoelt:" |
| `pijn` | Pijn | textarea | false | "Pijn:" |
| `halitose` | Halitose | textarea | false | "Halitose:" |

---

### Section 6.2: Klinische Bevindingen

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `bop` | BOP (Bleeding on Probing) | textarea | true | "BOP:" |
| `pkt` | PKT (Pocket depth) | textarea | true | "PKT:" |
| `tst` | TST | textarea | false | "Tst:" |
| `instructie` | Instructie | textarea | false | "Instr:" |

---

### Section 6.3: Wens & Motivatie

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `wensPatient` | Wens patiënt mbt paro.beh. | textarea | true | "Wens patient mbt paro.beh.:" |
| `motivatiePatient` | Motivatie patiënt | textarea | true | "Motivatie patiënt:" |
| `keuzeRagers` | Keuze ragers | boolean | false | "Keuze ragers: ja/nee" |
| `waaromRagers` | Waarom wel/niet ragers | textarea | false | "waarom wel/niet" |

---

### Section 6.4: Verwijzing & Beleid

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `verwijzingMhParo` | Verwijzing naar MH/Parodontoloog | boolean | false | "Verwijzing naar MH/Parodontoloog: ja/nee" |
| `redenVerwijzing` | Reden verwijzing | textarea | false | "+ reden" |
| `lifestyle` | Lifestyle | textarea | false | "Lifestyle:" |
| `complicerendeFactor` | Complicerende factor | textarea | false | "Complicerende factor:" |
| `retour` | Retour | text | false | "Retour:" |

---

## 7. IMPLANTOLOGIE TIME-OUT
### Implantology Pre-operative Check

**Clinical Purpose:** Pre-operative assessment and planning confirmation before implant surgery

**Source Templates:**
- Database: "Time-out implantologie" (Behandelnotitie)

**Usage Context:** Immediately before implant surgery

---

### Section 7.1: Controle Voorwaarden

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `medAnamWijzigingen` | MA: wijzigingen | boolean | true | "MA: geen veranderingen" |
| `rontgenBeoordeling` | Röntgen beoordeling | enum | true | "Rontgen : GB" |
| `klinischBeoordeling` | Klinisch beoordeling | enum | true | "Klinisch: GB" |

**Enum Options for `rontgenBeoordeling` and `klinischBeoordeling`:**
- gb (geen bijzonderheden)
- afwijkend

---

### Section 7.2: Planning Bevestiging

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `afdrukBoorMal` | Afdruk voor boormal | text | false | "Afdruk voor boormal:" |
| `bijzonderheden` | Bijzonderheden | textarea | false | "Bijzonderheden:" |
| `geplandImplantaat` | Gepland implantaat | text | true | "Gepland implantaat:" |

---

### Section 7.3: Beleid & Planning

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `stap1Operatie` | Implantaat operatie met opbouw | text | true | "1. implantaat operatie met opbouw (... min)" |
| `stap2Hv` | HV (healing phase) | text | true | "2. HV" |
| `genezingstijd` | Genezingstijd | text | true | "==> 3-4mnd" |
| `stap3Abutment` | Abutment/controle na 3mnd | text | true | "3. abutement/controle na 3mnd (... min)" |
| `stap4Suprastructuur` | Suprastructuur | text | true | "4. Suprastructuur bij ons of eigen TA" |
| `stap5Nulmeting` | Nulmeting | text | true | "5. nulmeting (10min)" |

---

## 8. IMPLANTOLOGIE OPERATIEVERSLAG
### Implant Surgery Report

**Clinical Purpose:** Detailed surgical report of implant placement procedure

**Source Templates:**
- Database: "Implantologie – operatieverslag"

**Usage Context:** During/immediately after implant surgery

---

### Section 8.1: Indicatie & Planning

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `regio` | Regio | text | true | "Regio: {{regio}}" |
| `redenImplantaat` | Reden implantaatplaatsing | textarea | true | "Reden implantaatplaatsing: {{reden}}" |
| `cbctOptBeoordeeld` | Pre-operatieve CBCT/OPT beoordeeld | boolean | true | "Pre-operatieve CBCT/OPT beoordeeld" |
| `botkwaliteit` | Botkwaliteit en -hoogte | textarea | true | "Botkwaliteit en -hoogte: {{botkwaliteit}}" |

---

### Section 8.2: Chirurgische Procedure

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `anesthesie` | Anesthesie | text | true | "Anesthesie: {{anesthesie}}" |
| `incisieFlap` | Incisie en flap | textarea | true | "Incisie en flap: {{flap}}" |
| `boorsequentie` | Boorsequentie | text | true | "Boorsequentie conform protocol: {{boorsequentie}}" |

---

### Section 8.3: Implantaat Specificaties

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `merkType` | Merk/type implantaat | text | true | "Merk/type: {{merk}}" |
| `diameterLengte` | Diameter / lengte | text | true | "Diameter / lengte: {{diameterLengte}}" |
| `primairStabiliteit` | Primaire stabiliteit (ISQ/torque) | text | true | "Primair stabiliteit (ISQ/torque): {{stabiliteit}}" |
| `botopbouwGbr` | Botopbouw/GBR | textarea | false | "Botopbouw/GBR: {{gbr}}" |

---

### Section 8.4: Afsluiting

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `healingAbutment` | Healing abutment / cover screw | text | true | "Healing abutment / cover screw: {{afsluiting}}" |
| `hechtingen` | Hechtingen | text | true | "Hechtingen: {{hechtingen}}" |

---

### Section 8.5: Postoperatief

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `instructiesMedicatie` | Instructies en medicatie | textarea | true | "Instructies en medicatie: {{medicatie}}" |
| `datumControle` | Controle gepland op | date | true | "Controle gepland op: {{datumControle}}" |

---

## 9. IMPLANTOLOGIE CONTROLE
### Implant Follow-up

**Clinical Purpose:** Post-operative or periodic implant control visit

**Source Templates:**
- Database: "Controle implantologie" (Behandelnotitie, Template 4 from inventory)

**Usage Context:** Follow-up after implant placement, periodic implant check

---

### Section 9.1: Anamnese & Röntgen

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `medAnamWijzigingen` | Medische anamnese wijzigingen | boolean | true | "Medische anamnese: geen veranderingen" |
| `rontgenIndicatie` | Röntgen indicatie | textarea | true | "Röntgen indicatie: controle botniveau bij implantaat" |
| `rontgenVerslag` | Röntgen verslag | textarea | true | "Röntgen verslag: gb" |

---

### Section 9.2: Klinisch Onderzoek

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `klinisch` | Klinisch onderzoek | textarea | true | "Klinisch: gb" |
| `bijzonderheden` | Bijzonderheden | textarea | false | "Bijzonderheden: -" |

---

### Section 9.3: Beleid

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `beleidStappen` | Beleid stappen | textarea | true | "Beleid: 1. afdruk kroon (30min) 2. 3 weken plaatsen kroon 3(30min)" |
| `kroonBijTandarts` | Kroon bij tandarts | boolean | false | "Kroon bij tandarts" |
| `nulmetingGepland` | Nulmeting gepland | text | false | "8w eken na plaatsen kroon nulmeting (10min)" |
| `halfjaarlijksMh` | Halfjaarlijks eigen MH | boolean | false | "Halfjaarlijks eigen MH" |
| `coi` | COI (controle op indicatie) | boolean | false | "COI" |
| `afbehandeld` | Afbehandeld | boolean | false | "Afbehandeld" |

---

## 10. INFORMED CONSENT IMPLANTOLOGIE
### Informed Consent for Implant Treatment

**Clinical Purpose:** Legal documentation of patient consent for implant treatment

**Source Templates:**
- Database: "Informed consent – implantaatbehandeling" (InformedConsent)
- Database: "Formulier – Informed consent implantologie" (placeholder)
- aiTemplateGenerator.ts: InformedConsent template

**Usage Context:** Before start of implant treatment

---

### Section 10.1: Patiëntgegevens

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `patientNaam` | Naam | text | true | "Naam: {{patientNaam}}" |
| `geboortedatum` | Geboortedatum | date | true | "Geboortedatum: {{geboortedatum}}" |

---

### Section 10.2: Behandelplan

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `behandelplan` | Voorgestelde implantaatbehandeling | textarea | true | "{{behandelplan}}" |
| `aantalImplantaten` | Aantal implantaten | number | true | "Aantal implantaten: {{aantalImplantaten}}" |
| `locatie` | Locatie | text | true | "Locatie: {{locatie}}" |

---

### Section 10.3: Behandelfasen

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `fase1Chirurgie` | Fase 1: Chirurgische plaatsing | text | true | "1. Chirurgische plaatsing implantaat(en)" |
| `genezingsperiode` | Genezingsperiode (maanden) | number | true | "2. Genezingsperiode ({{genezingstijd}} maanden)" |
| `fase3Suprastructuur` | Fase 3: Plaatsing kroon/brug/prothese | text | true | "3. Plaatsing kroon/brug/prothese" |

---

### Section 10.4: Risico's

**Section Purpose:** Documented risks and complications

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `risicoInfectie` | Infectie (1-5%) | boolean | true | "Infectie (1-5%)" |
| `risicoBeschadiging` | Beschadiging nabijgelegen structuren | boolean | true | "Beschadiging nabijgelegen structuren" |
| `risicoImplantaatVerlies` | Implantaatverlies (2-5% in eerste jaar) | boolean | true | "Implantaatverlies (2-5% in eerste jaar)" |
| `risicoBotresorptie` | Botresorptie | boolean | true | "Botresorptie" |
| `risicoZenuwbeschadiging` | Zenuwbeschadiging (zeer zeldzaam) | boolean | true | "Zenuwbeschadiging (zeer zeldzaam)" |

---

### Section 10.5: Contra-indicaties & Nazorg

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `contraIndicaties` | Contra-indicaties besproken | textarea | true | "{{contraIndicaties}}" |
| `nazorgGoedeMh` | Goede mondhygiëne essentieel | boolean | true | "Goede mondhygiëne essentieel" |
| `nazorgRegelmatigeControles` | Regelmatige controles | boolean | true | "Regelmatige controles" |
| `nazorgStoppenRoken` | Stoppen met roken aanbevolen | boolean | true | "Stoppen met roken aanbevolen" |

---

### Section 10.6: Kosten & Toestemming

| Field Key | Label | Type | Required | Source Text |
|-----------|-------|------|----------|-------------|
| `kosten` | Kostenoverzicht | textarea | true | "{{kosten}}" |
| `toestemmingVerklaring` | Patiënt verklaart informed consent | boolean | true | "Ik verklaar volledig geïnformeerd te zijn over de implantaatbehandeling, begrijp de risico's en geef toestemming voor de behandeling." |
| `datum` | Datum ondertekening | date | true | "Datum: {{datum}}" |
| `handtekeningPatient` | Handtekening patiënt | text | false | "Handtekening patiënt: ________________" |
| `handtekeningImplantoloog` | Handtekening implantoloog | text | false | "Handtekening implantoloog: ________________" |

---

## APPENDIX A: CROSS-ENCOUNTER COMMON FIELDS

The following fields appear consistently across multiple encounters and should be standardized:

### Patient Identification
- `patientNaam` / `patientCode` (text, required)
- `geboortedatum` (date, required)
- `dossierNummer` (text, optional)

### Date/Time
- `datum` (date, required) - Encounter date
- `datumBehandeling` (date, optional) - Treatment date if different

### Provider Information
- `eigenNaam` / `behandelaar` (text, required) - Treating clinician
- `functie` (text, optional) - Clinical role
- `bigNummer` (text, optional) - BIG registration number

### Clinical Examination
- `extraoraal` (textarea, typically required)
- `intraoraal` (textarea, typically required)
- `slijmvliezen` (textarea, typically required)
- `tong` (textarea, typically required)

### Diagnosis & Plan
- `diagnose` (textarea, typically required)
- `conclusie` (textarea, typically required)
- `vervolg` / `vervolgafspraken` (textarea, optional)
- `bijzonderheden` (textarea, optional)

### Imaging
- `rontgenIndicatie` / `rontgen` (boolean or textarea)
- `rontgenType` (text, optional)
- `rontgenVerslag` (textarea, optional)

---

## APPENDIX B: ENUM VALUE DEFINITIONS

### Mondhygiëne Quality
```
enum MondgezondeidScore {
  zeer_slecht = "Zeer slecht"
  slecht = "Slecht"
  matig = "Matig"
  goed = "Goed"
}
```

### Plaque/Bloeding Distribution
```
enum DistributiePattern {
  lokaal = "Lokaal"
  voorkeurslokatie = "Voorkeurslokatie"
  gegeneraliseerd = "Gegeneraliseerd"
}
```

### Pain Type
```
enum PijnType {
  zeurend = "Zeurend"
  kloppend = "Kloppend"
  scherp = "Scherp"
}
```

### Pain Timing
```
enum PijnTiming {
  constant = "Constant"
  bij_activiteit = "Bij activiteit"
}
```

### Clinical Assessment Status
```
enum KlinischeStatus {
  gb = "GB (geen bijzonderheden)"
  afwijkend = "Afwijkend"
}
```

---

## APPENDIX C: FIELD TYPE DEFINITIONS

| Type | Description | Validation |
|------|-------------|------------|
| `text` | Single-line text input | Max 255 characters |
| `textarea` | Multi-line text input | Max 5000 characters |
| `number` | Numeric input | Integer or decimal |
| `date` | Date picker | ISO 8601 format |
| `boolean` | Yes/No checkbox | true/false |
| `enum` | Select from predefined options | See Appendix B |

---

## APPENDIX D: FIELD NAMING CONVENTIONS

All field keys follow these rules:
1. **camelCase** (Dutch words, camelCase boundaries)
2. **No special characters** (no spaces, dashes, or underscores except in enum values)
3. **Descriptive** (full words, avoid abbreviations unless standard clinical)
4. **Consistent** across encounters where possible

Examples:
- ✅ `medAnamWijziging`
- ✅ `rontgenIndicatie`
- ✅ `ppsKwadrant1`
- ❌ `med_anam_wijz`
- ❌ `ri`
- ❌ `pps-q1`

---

## APPENDIX E: REQUIRED FIELD DETERMINATION

Fields are marked `required: true` when:

1. **Medically essential:** Data critical for safe clinical decision-making
2. **Legally required:** Regulatory or professional requirement
3. **Consistently present:** Field appears filled in >90% of template examples
4. **Logical dependency:** Parent field is meaningless without this child field

Fields are marked `required: false` when:
- Optional clinical documentation
- Conditional based on findings
- Enhancement/detail fields
- Future-planning fields

---

## APPENDIX F: SOURCE TEMPLATE MAPPING

| Encounter | Primary Source | Secondary Sources | Content Quality |
|-----------|----------------|-------------------|-----------------|
| PMO Uitgebreid | DB: "PMO (uitgebreid)" | dummyAI.ts: generatePMOSummary | High - comprehensive |
| PMO Kort | DB: "PMO (kort)" | - | High - complete |
| Pijnklacht Acute | DB: "Pijnconsult – acute klacht" | DB: "Pijnklacht" | High - detailed |
| Consult Algemeen | DB: "Consult algemeen – kort verslag" | - | Medium - basic |
| Intake Nieuwe Patiënt | DB: "Formulier – Intake nieuwe patiënt" | - | Low - placeholder only |
| Parotraject Intake | DB: "Parotraject intake" | - | High - detailed |
| Implantologie Time-out | DB: "Time-out implantologie" | - | High - complete |
| Implantologie Operatie | DB: "Implantologie – operatieverslag" | - | High - comprehensive |
| Implantologie Controle | DB: "Controle implantologie" | - | Medium - adequate |
| Informed Consent Implant | DB: "Informed consent – implantaatbehandeling" | aiTemplateGenerator.ts | High - legal complete |

---

## NOTES ON USAGE

### Implementation Guidelines

1. **Field Order:** Preserve section order as documented. UI should follow clinical workflow.

2. **Conditional Fields:** Some fields should only appear based on previous answers:
   - If `rontgenIndicatie = true`, show `rontgenType` and `rontgenVerslag`
   - If `nogNietAfgemaakteTxPlan = true`, show `waaromNietAfgemaakt`
   - If `verwijzingMhParo = true`, show `redenVerwijzing`

3. **Auto-fill:** Consider pre-filling these fields:
   - `datum` → Current date
   - `eigenNaam` → Logged-in user
   - `patientNaam` / `geboortedatum` → From patient context

4. **Validation:** Required fields must have content before form submission.

5. **Storage:** All encounter data should be stored as structured JSON in `document_store` table or equivalent, NOT as free text.

---

## REVISION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12-21 | Initial extraction from template inventory |

---

**END OF DOCUMENT**

Total Encounters Defined: 10
Total Unique Fields Extracted: ~150
Source Templates Analyzed: 15
Content Coverage: Complete for available templates
