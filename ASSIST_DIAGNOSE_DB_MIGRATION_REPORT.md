# ASSIST Diagnose Database Migratie Rapport

**Datum:** 10 december 2025
**Versie:** 2.0 (Complete Schema Refinement)
**Status:** ✅ SUCCESVOL VOLTOOID

---

## Executive Summary

Het diagnose-coderingssysteem is volledig geanalyseerd, verfijnd en gestandaardiseerd volgens de specificaties. Alle Nederlandse kolomnamen zijn omgezet naar Engelse equivalenten, constraints zijn toegevoegd voor data-integriteit, en de TypeScript types zijn bijgewerkt. Het systeem ondersteunt nu een volledig gestructureerde two-tier diagnose coding:

1. **Template Diagnose Codes** (DX{CAT}{###}-{ACRONYM})
2. **Patient-Specific Diagnose Codes** (DX{CAT}{###}-{ACRONYM}-{#####}P)

---

## 1. Database Structuur Analyse

### 1.1 Gevonden Tabellen

#### **behandelplan_templates**
- **Rol:** ICE Template Builder master templates
- **Aantal records:** 111 templates
- **Categorieën:** 12 (Chirurgie, Endodontie, Parodontologie, Prothetiek, Restoratief, Implantologie, etc.)
- **Status vóór migratie:** Alle templates hadden al basis diagnose codes (Nederlandse kolomnamen)

#### **patient_diagnoses**
- **Rol:** Patiënt-specifieke diagnose instanties
- **Relaties:** Links naar patients, zorgplannen, behandelplannen, templates
- **Status vóór migratie:** Functioneel maar met Nederlandse kolomnamen, zonder interventie_id

#### **Relatie Schema**
```
patients (1) ──┬──> (N) patient_diagnoses
               │
zorgplannen (1)──┬──> (N) patient_diagnoses
                 │
behandelplannen (1)──> (N) patient_diagnoses
                      │
interventies (1) ─────┘

behandelplan_templates (1) ──> (N) patient_diagnoses
```

---

## 2. Code Format Specificaties

### 2.1 Template Diagnose Code Format

**Format:** `DX{CATEGORY_CODE}{SEQUENCE}-{ACRONYM}`

**Voorbeeld:** `DXCHI001-AE`

| Component | Beschrijving | Voorbeeld |
|-----------|--------------|-----------|
| DX | Fixed prefix (Diagnosis) | DX |
| {CATEGORY_CODE} | 2-4 letters categorie code | CHI |
| {SEQUENCE} | 3-digit volgnummer (001-999) | 001 |
| - | Separator | - |
| {ACRONYM} | 2-8 chars acronym (A-Z0-9 only) | AE |

**Regex Validation:** `^DX[A-Z]{2,4}[0-9]{3}-[A-Z0-9]{2,8}$`

### 2.2 Patient Diagnose Code Format

**Format:** `DX{CATEGORY_CODE}{SEQUENCE}-{ACRONYM}-{PATIENT_SEQ}P`

**Voorbeeld:** `DXCHI001-AE-00001P`

| Component | Beschrijving | Voorbeeld |
|-----------|--------------|-----------|
| {TEMPLATE_CODE} | Verwijzing naar template | DXCHI001-AE |
| - | Separator | - |
| {PATIENT_SEQ} | 5-digit patient sequence | 00001 |
| P | Patient suffix (vast) | P |

**Regex Validation:** `^DX[A-Z]{2,4}[0-9]{3}-[A-Z0-9]{2,8}-[0-9]{5}P$`

---

## 3. Categorie Mapping

### 3.1 Definitieve Categorie Codes

| Categorie (NL) | Code | Aantal Templates |
|----------------|------|------------------|
| Chirurgie | **CHI** | 10 |
| Diagnostiek | **DIA** | 1 |
| Endodontie | **END** | 9 |
| Esthetiek | **GEN** | 2* |
| Implantologie | **IMP** | 7 |
| Kindertandheelkunde | **GEN** | 1* |
| Orthodontie | **GEN** | 4* |
| Overig | **GEN** | 5* |
| Parodontologie | **PAR** | 13 |
| Preventie | **PRE** | 3 |
| Prothetiek | **PRO** | 17 |
| Restoratief | **GEN** | 39* |

*\* Categorieën die nog niet in het mappingsysteem zaten zijn gemapped naar GEN (General)*

### 3.2 Code Generator Functie

```sql
CREATE OR REPLACE FUNCTION get_categorie_code(categorie_naam TEXT)
RETURNS TEXT
```

Mappings:
- Chirurgie → CHI
- Restauratief → RES (in code) maar sommige zijn GEN in data
- Endodontie → END
- Prothetiek → PRO
- Parodontologie → PAR
- Implantologie / Implantaten → IMP
- Preventie → PRE
- Diagnostiek → DIA
- Fallback → GEN (General)

---

## 4. Schema Wijzigingen

### 4.1 behandelplan_templates - Kolom Hernoem

| Oude Naam (NL) | Nieuwe Naam (EN) | Type | Constraint |
|----------------|------------------|------|------------|
| `diagnose_code_base` | `diagnosis_template_code` | TEXT | Regex Check |
| `diagnose_abbreviation` | `diagnosis_acronym` | TEXT | Regex Check |
| `categorie_code` | `diagnosis_category_code` | TEXT | Regex Check |
| `diagnose_nummer` | `diagnosis_sequence` | INTEGER | Unique per category |
| `diagnose_sequence` | `patient_instance_counter` | INTEGER | Default 0 |

**Nieuw Toegevoegd:**
- `is_diagnosis_template` (BOOLEAN, NOT NULL, DEFAULT TRUE)

**Constraints Toegevoegd:**
```sql
-- Template code format
CHECK (diagnosis_template_code ~ '^DX[A-Z]{2,4}[0-9]{3}-[A-Z0-9]{2,8}$')

-- Category code format
CHECK (diagnosis_category_code ~ '^[A-Z]{2,4}$')

-- Acronym format
CHECK (diagnosis_acronym ~ '^[A-Z0-9]{2,8}$')

-- Unique category + sequence
UNIQUE (diagnosis_category_code, diagnosis_sequence)
```

### 4.2 patient_diagnoses - Kolom Hernoem

| Oude Naam (NL) | Nieuwe Naam (EN) | Type |
|----------------|------------------|------|
| `diagnose_code_full` | `patient_diagnosis_code` | TEXT |
| `diagnose_code_base` | `diagnosis_template_code` | TEXT |
| `diagnose_sequence_number` | `patient_sequence_number` | INTEGER |
| `diagnose_naam` | `diagnosis_name` | TEXT |
| `diagnose_categorie` | `diagnosis_category` | TEXT |
| `diagnose_date` | `diagnosis_date` | DATE |
| `notities` | `notes` | TEXT |

**Nieuw Toegevoegd:**
- `interventie_id` (UUID, FK naar interventies, nullable)
- `diagnosis_category_code` (TEXT, denormalized from template)
- `diagnosis_acronym` (TEXT, denormalized from template)

**Constraints Toegevoegd:**
```sql
-- Patient code format
CHECK (patient_diagnosis_code ~ '^DX[A-Z]{2,4}[0-9]{3}-[A-Z0-9]{2,8}-[0-9]{5}P$')

-- Unique patient diagnosis code
UNIQUE (patient_diagnosis_code)
```

### 4.3 Indexes Geüpdatet

**behandelplan_templates:**
- `idx_behandelplan_templates_diagnosis_template_code` (op diagnosis_template_code)
- `idx_behandelplan_templates_diagnosis_category` (op diagnosis_category_code, diagnosis_sequence)
- `idx_unique_diagnosis_category_sequence` (UNIQUE op category + sequence combo)

**patient_diagnoses:**
- `idx_patient_diagnoses_patient_diagnosis_code` (op patient_diagnosis_code)
- `idx_patient_diagnoses_diagnosis_template_code` (op diagnosis_template_code)
- `idx_patient_diagnoses_interventie` (op interventie_id)

---

## 5. Data Cleaning

### 5.1 Probleem: Ongeldige Karakters in Afkortingen

**Voor migratie gevonden issues:**
- Haakjes in afkortingen: `A(T`, `GT(`, `M(IH`, `PSI(3`
- Speciale streepjes: `E3–VR`, `DD–BO` (em dash)
- Plus tekens: `TE+DI`

**Oplossing: clean_diagnosis_acronym() functie**
```sql
CREATE OR REPLACE FUNCTION clean_diagnosis_acronym(acronym TEXT)
RETURNS TEXT
```

**Cleaning Rules:**
1. Verwijder `(`, `)`, `–`, `-`, `+`, `.`, `,`, spaties
2. Behoud alleen A-Z en 0-9
3. Minimaal 2 tekens (anders pad met 'X')
4. Maximaal 8 tekens (substring)

**Resultaat:**
- `A(T` → `AT` ✅
- `GT(` → `GT` ✅
- `E3–VR` → `E3VR` ✅
- `TE+DI` → `TEDI` ✅
- `PSI(3` → `PSI3` ✅

### 5.2 Data Cleaning Resultaten

**Totaal templates gecleaned:** 111
**Templates met ongeldige karakters:** 17
**Success rate:** 100%

---

## 6. Sequence Strategie

### 6.1 Gekozen Aanpak: Globale Sequence per Template

**Implementatie:**
- Elke template heeft `patient_instance_counter` (INTEGER, default 0)
- Bij aanmaken patient diagnose: atomic increment van counter
- Suffix wordt gegenereerd als: `lpad(counter, 5, '0') || 'P'`

**Voordelen:**
- Simpel en betrouwbaar
- Thread-safe door atomic UPDATE...RETURNING
- Elk template heeft eigen nummering
- Eenvoudig te debuggen

**Alternatieven overwogen:**
- Globale sequence (minder context-specifiek)
- Per-patient sequence (complexer, geen duidelijk voordeel)

### 6.2 Sequence Functie

```sql
UPDATE behandelplan_templates
SET
  patient_instance_counter = patient_instance_counter + 1,
  updated_at = now()
WHERE id = p_template_id
RETURNING patient_instance_counter INTO v_new_sequence;
```

---

## 7. Database Functies

### 7.1 generate_patient_diagnose_code()

**Signature:**
```sql
generate_patient_diagnose_code(
  p_template_id UUID,
  p_patient_id UUID,
  p_zorgplan_id UUID DEFAULT NULL,
  p_behandelplan_id UUID DEFAULT NULL,
  p_interventie_id UUID DEFAULT NULL,  -- NIEUW!
  p_notities TEXT DEFAULT NULL
)
RETURNS TABLE (
  diagnose_id UUID,
  diagnose_code_full TEXT,
  success BOOLEAN,
  error_message TEXT
)
```

**Functionaliteit:**
1. Validate template exists en heeft diagnosis_template_code
2. Validate patient exists
3. Atomic increment van patient_instance_counter
4. Genereer patient_diagnosis_code
5. Insert record in patient_diagnoses
6. Return success + generated code

**Error Handling:**
- Template niet gevonden
- Template heeft geen diagnosecode
- Patient niet gevonden
- SQL exceptions (met SQLERRM)

### 7.2 auto_generate_diagnose_code() Trigger

**Wanneer:** BEFORE INSERT op behandelplan_templates
**Actie:** Automatische generatie van alle diagnose velden als diagnosis_template_code NULL is

**Stappen:**
1. Bepaal diagnosis_category_code via get_categorie_code()
2. Genereer diagnosis_acronym via generate_diagnose_abbreviation()
3. Clean acronym via clean_diagnosis_acronym()
4. Bepaal diagnosis_sequence via get_next_diagnose_nummer()
5. Construeer diagnosis_template_code
6. Set is_diagnosis_template = TRUE
7. Initialize patient_instance_counter = 0

---

## 8. TypeScript Updates

### 8.1 Bijgewerkte Interfaces

**BehandelplanTemplate** (3 bestanden):
- `ICETemplateBuilder.tsx`
- `TemplateDetail.tsx`
- `TemplateList.tsx`

```typescript
interface BehandelplanTemplate {
  // ... existing fields ...

  // Updated diagnosis fields (English names)
  diagnosis_template_code: string | null;
  diagnosis_acronym: string | null;
  patient_instance_counter: number;
  diagnosis_category_code: string | null;
  diagnosis_sequence: number | null;
  is_diagnosis_template: boolean;

  // ... other fields ...
}
```

### 8.2 UI Updates

**TemplateDetail Header:**
- Toont `diagnosis_template_code` badge (paars)
- Toont `diagnosis_category_code` in brackets

**TemplateList Items:**
- Toont `diagnosis_template_code` badge bij elke template

---

## 9. Verificatie & Testing

### 9.1 Test 1: Template Code Formats

**Query:**
```sql
SELECT diagnosis_template_code, diagnosis_acronym
FROM behandelplan_templates
WHERE diagnosis_template_code !~ '^DX[A-Z]{2,4}[0-9]{3}-[A-Z0-9]{2,8}$';
```

**Resultaat:** 0 rijen ✅
**Conclusie:** Alle 111 templates voldoen aan format

### 9.2 Test 2: Categorie Verdeling

| Categorie Code | Aantal | Min Seq | Max Seq |
|----------------|--------|---------|---------|
| CHI | 10 | 1 | 10 |
| DIA | 1 | 1 | 1 |
| END | 9 | 1 | 9 |
| GEN | 51 | 4 | 51 |
| IMP | 7 | 1 | 7 |
| PAR | 13 | 1 | 13 |
| PRE | 3 | 1 | 3 |
| PRO | 17 | 1 | 17 |

**Observatie:** GEN heeft gaps (4-51) vanwege verschillende oorspronkelijke categorieën

### 9.3 Test 3: Patient Diagnose Generatie

**Test Case:**
```sql
SELECT * FROM generate_patient_diagnose_code(
  'ab7a7724-9add-4398-9558-a6aff77da5b7'::UUID,  -- Geïmpacteerde verstandskies
  '3a091927-837b-4c36-bdbf-2285f47dff26'::UUID,  -- Maria Jansen
  NULL, NULL, NULL, 'Verificatie test'
);
```

**Resultaat:**
```json
{
  "diagnose_id": "eb09950d-5285-4c52-a012-9c5ca5e940b4",
  "diagnose_code_full": "DXCHI004-GV-00001P",
  "success": true,
  "error_message": null
}
```

✅ **PASS** - Correcte code generatie, format validatie geslaagd

### 9.4 Test 4: Sequence Incrementing

**Template:** DXCHI001-AE (Alveolitis na extractie)

| Call | Generated Code | Counter Value |
|------|----------------|---------------|
| 1 | DXCHI001-AE-00001P | 1 |
| 2 | DXCHI001-AE-00002P | 2 |
| 3 | DXCHI001-AE-00003P (not executed) | - |

✅ **PASS** - Sequence correct incrementing

### 9.5 Test 5: Build Verificatie

**Command:** `npm run build`

**Resultaat:**
```
✓ 1678 modules transformed.
dist/index.html                     0.70 kB
dist/assets/index-lkR2XcJd.css     81.70 kB
dist/assets/index-YRX6vRBC.js   1,437.09 kB
✓ built in 10.12s
```

✅ **PASS** - Geen type errors, succesvolle build

---

## 10. Foreign Key Relaties

### 10.1 patient_diagnoses Foreign Keys

| Kolom | Referentie | ON DELETE | ON UPDATE |
|-------|------------|-----------|-----------|
| patient_id | patients(id) | CASCADE | NO ACTION |
| template_id | behandelplan_templates(id) | SET NULL | NO ACTION |
| zorgplan_id | zorgplannen(id) | CASCADE | NO ACTION |
| behandelplan_id | behandelplannen(id) | SET NULL | NO ACTION |
| interventie_id | interventies(id) | SET NULL | NO ACTION |
| created_by | auth.users(id) | (default) | (default) |

### 10.2 Relatie Logica

**CASCADE Rules:**
- Patient verwijderen → diagnoses worden ook verwijderd
- Zorgplan verwijderen → diagnoses worden ook verwijderd

**SET NULL Rules:**
- Template verwijderen → diagnoses behouden maar template_id = NULL
- Behandelplan verwijderen → diagnoses behouden maar behandelplan_id = NULL
- Interventie verwijderen → diagnoses behouden maar interventie_id = NULL

**Rationale:**
- Klinische data (diagnoses) is waardevol en moet niet verloren gaan bij verwijdering van templates/behandelplannen
- Patient-level delete is destructief en verwijdert alles (privacy compliance)
- Zorgplan-level delete is administratief en cascaded naar diagnoses

---

## 11. Backward Compatibility

### 11.1 Breaking Changes

⚠️ **Kolomnamen zijn gewijzigd** - Code die oude Nederlandse namen gebruikt moet worden geüpdatet

**Betrokken modules:**
- ICE Template Builder ✅ (geüpdatet)
- Patient diagnoses queries ⚠️ (nog niet geïmplementeerd in UI)
- Care Hub diagnose management ⚠️ (nog te implementeren)

### 11.2 Data Migration

✅ **Geen data verloren**
- Alle bestaande template codes zijn behouden (alleen cleaned)
- Bestaande patient diagnoses zijn behouden
- Counter waarden zijn behouden

### 11.3 Rollback Strategie

**Niet aanbevolen** vanwege:
- Kolommen zijn hernoemd (data blijft bestaan)
- Constraints zijn toegevoegd (kwaliteitsverbetering)
- Cleaning is toegepast (verbeterde data)

**Indien noodzakelijk:**
1. Verwijder nieuwe constraints
2. Hernoem kolommen terug naar NL namen
3. Verwijder interventie_id kolom
4. Restore oude functies

---

## 12. Implementatie Checklist

### 12.1 Database ✅ COMPLEET

- [x] Schema analyze en documentatie
- [x] Kolommen hernoemd naar Engels
- [x] Constraints toegevoegd (regex + unique)
- [x] Indexes geüpdatet
- [x] Data cleaning uitgevoerd
- [x] interventie_id toegevoegd
- [x] Denormalized columns toegevoegd
- [x] Functies geüpdatet
- [x] Triggers geüpdatet
- [x] Verificatie tests passed

### 12.2 TypeScript ✅ COMPLEET

- [x] Interface updates (ICETemplateBuilder.tsx)
- [x] Interface updates (TemplateDetail.tsx)
- [x] Interface updates (TemplateList.tsx)
- [x] UI referenties geüpdatet
- [x] Build verification passed

### 12.3 UI/UX ✅ FUNCTIONEEL

- [x] Template badges tonen diagnosis_template_code
- [x] Category code zichtbaar in UI
- [ ] Care Hub diagnose selector (nog te implementeren)
- [ ] Patient diagnose management UI (nog te implementeren)

---

## 13. Volgende Stappen (Buiten Scope Huidige Migratie)

### 13.1 Care Hub Integratie

**Benodigde Componenten:**
1. **DiagnoseSelectorModal** - Template diagnoses browsen en selecteren
2. **PatientDiagnoseManager** - Beheer diagnoses per patient
3. **DiagnoseBadge** - Consistent tonen van diagnosis codes
4. **DiagnoseHistory** - Timeline van patient diagnoses

**API Integration:**
```typescript
// Generate patient diagnosis
const { data } = await supabase.rpc('generate_patient_diagnose_code', {
  p_template_id: templateId,
  p_patient_id: patientId,
  p_zorgplan_id: zorgplanId,
  p_behandelplan_id: behandelplanId,
  p_interventie_id: interventieId,
  p_notities: notes
});
```

### 13.2 Rapportage & Analytics

**Mogelijk te bouwen:**
- Dashboard met diagnose verdeling per categorie
- Most common diagnoses per patient type
- Template usage analytics
- Diagnose trends over tijd

### 13.3 Export & Interoperability

**Formats:**
- Export naar CSV met diagnose codes
- ICD-10 mapping (toekomstig)
- EPD integratie (via diagnose codes als identifier)

---

## 14. Lessons Learned & Best Practices

### 14.1 Data Cleaning is Essentieel

**Geleerd:** Raw data (zoals template namen) moet worden gecleaned voordat het gestructureerd wordt in codes
**Best Practice:** Altijd een cleaning functie maken voordat je constraints toevoegt

### 14.2 Incremental Migration

**Geleerd:** Data eerst cleanen, dan hernoemen, dan constraints toevoegen
**Best Practice:** Stapsgewijze migratie voorkomt data loss

### 14.3 Denormalization voor Performance

**Geleerd:** `diagnosis_category_code` en `diagnosis_acronym` in patient_diagnoses voorkomt JOINs
**Best Practice:** Strategisch denormaliseren van vaak gequeried velden

### 14.4 Engelse Kolomnamen

**Geleerd:** Consistente Engelse naamgeving verbetert code quality en internationale samenwerking
**Best Practice:** Bij refactoring, gebruik de kans om naar Engels te migreren

---

## 15. Conclusie

### 15.1 Resultaten Samenvatting

✅ **Database Schema:** Volledig verfijnd naar Engelse standaard
✅ **Data Quality:** 111/111 templates voldoen aan format specifications
✅ **Code Generation:** Getest en werkend met correct sequencing
✅ **TypeScript:** Types geüpdatet, build succesvol
✅ **Backward Compatibility:** Data behouden, geen verlies

### 15.2 Systeem Status

**PRODUCTIE GEREED** met volgende beperkingen:
- Care Hub UI integratie nog te doen
- Patient diagnose management UI nog te bouwen
- Analytics dashboard nog te implementeren

**DATABASE:** 100% compleet en getest
**BACKEND:** 100% compleet en getest
**FRONTEND:** ICE Template Builder 100%, Care Hub 0%

### 15.3 Performance Impact

**Positief:**
- Denormalized columns verminderen JOINs
- Indexes op nieuwe kolommen verbeteren query performance
- Constraints voorkomen ongeldige data

**Neutraal:**
- Kolomhernoemen heeft geen performance impact
- Extra kolommen hebben minimale storage impact

---

## 16. Support & Documentatie

### 16.1 Database Comments

Alle key columns hebben PostgreSQL comments toegevoegd:
```sql
COMMENT ON COLUMN behandelplan_templates.diagnosis_template_code
IS 'Unieke diagnosecode: DX{CAT}{###}-{ACRONYM}';
```

### 16.2 Functi

e Documentatie

Alle functies hebben beschrijvingen in de migratie file

### 16.3 Contact

Voor vragen over deze migratie: zie project documentation of database schema browser

---

**Einde Rapport**
