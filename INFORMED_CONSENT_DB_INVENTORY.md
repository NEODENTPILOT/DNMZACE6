# INFORMED CONSENT DATABASE INVENTARISATIE

**Datum:** 21 december 2024
**Doel:** Complete database-inventarisatie van alle tabellen en records gerelateerd aan Informed Consent templates en documenten

---

## EXECUTIVE SUMMARY

### Bevindingen Overzicht

| Aspect | Status | Details |
|--------|--------|---------|
| **Templates Beschikbaar** | ✅ 7 templates | Volledig met content en variabelen |
| **Form System** | ✅ 1 formulier | 10 velden, inactief |
| **Documenten Aangemaakt** | ⚠️ 2 documenten | **GEEN template_id gekoppeld** |
| **Template Lookup** | ❌ Niet geïmplementeerd | UI gebruikt templates NIET |
| **Standaardteksten** | ❌ 0 records | Geen IC entries in legacy systeem |

### Kernprobleem

**Documenten worden aangemaakt ZONDER template koppeling:**
- `document_store.template_id` = `NULL` voor alle Consent documenten
- Hardcoded placeholder tekst gebruikt in plaats van template content
- Database heeft volledige templates, maar deze worden niet opgehaald

---

## 1. HOOFD TABELLEN OVERZICHT

### 1.1 Template-gerelateerde Tabellen

```
templates                          ← HOOFDBRON voor document templates
├── template_categories            ← Categorieën ("Informed Consent")
├── template_subcategories         ← Subcategorieën (18 types)
├── form_templates                 ← Form-based templates
└── form_field_templates           ← Velden voor formulieren

document_store                     ← Opgeslagen documenten
├── template_id → templates.id    ← KOPPELING (maar NIET GEBRUIKT!)

standaardteksten                   ← Legacy tekst systeem
ai_template_generator_requests     ← AI generatie logging
```

**Totaal relevante tabellen:** 6 hoofdtabellen + 28 gerelateerde template tabellen

---

## 2. TEMPLATES TABEL - HOOFDBRON

### 2.1 Schema

| Kolom | Type | Nullable | Beschrijving |
|-------|------|----------|--------------|
| **id** | uuid | NO | Primary key |
| **naam** | text | NO | Template naam |
| **beschrijving** | text | YES | Omschrijving |
| **category_id** | uuid | YES | FK → template_categories |
| **subcategory_id** | uuid | YES | FK → template_subcategories |
| **template_type** | text | NO | Type: Tekst, Formulier, Verslag |
| **doel** | text | YES | Doel van template |
| **inhoud** | text | YES | **TEMPLATE CONTENT** |
| **teksttype** | text | YES | Teksttype: InformedConsent, etc. |
| **document_format** | text | YES | Document format: InformedConsent, etc. |
| **verrichting_type** | text | YES | Gekoppeld aan verrichting type |
| **verrichting_subtype** | text | YES | Gekoppeld aan verrichting subtype |
| **is_standaard_template** | boolean | YES | Standaard template (true) |
| **is_persoonlijke_template** | boolean | YES | Persoonlijke template |
| **owner_id** | uuid | YES | Eigenaar van persoonlijke template |
| **actief** | boolean | YES | Template actief status |
| **has_form_fields** | boolean | YES | Heeft form velden |
| **form_fields** | jsonb | YES | Form velden definitie |
| **standaard_tekst_id** | uuid | YES | FK → standaardteksten (legacy) |
| **form_template_id** | uuid | YES | FK → form_templates |
| created_at | timestamptz | YES | Aanmaak datum |
| updated_at | timestamptz | YES | Update datum |

### 2.2 Statistieken

```sql
Total templates:              113
IC teksttype/format:          2 templates
IC door naam match:           7 templates
Templates met content >100:   100 templates
Actieve templates:            109 templates
```

### 2.3 Informed Consent Templates in Database

#### Template 1: Informed consent – algemene behandeling

**ID:** `d46e3420-72d3-439a-8be2-b495c85056b8`

| Veld | Waarde |
|------|--------|
| **Naam** | Informed consent – algemene behandeling |
| **teksttype** | InformedConsent |
| **document_format** | InformedConsent |
| **template_type** | Tekst |
| **category_id** | e1013616-0fdd-436f-b99f-bf651b8eb273 (Informed Consent) |
| **subcategory_id** | 65526c86-00fc-47f4-a3da-3f10ab1bb33d (Algemene behandeling) |
| **inhoud_length** | 653 characters |
| **is_standaard_template** | true |
| **actief** | true |

**Content:**
```markdown
**Toestemmingsverklaring Tandheelkundige Behandeling**

**Patiëntgegevens:**
Naam: {{patientNaam}}
Geboortedatum: {{geboortedatum}}

**Voorgestelde behandeling:**
{{behandeling}}

**Doel van de behandeling:**
{{doel}}

**Mogelijke alternatieven:**
{{alternatieven}}

**Risico's en bijwerkingen:**
{{risicos}}

**Prognose:**
{{prognose}}

**Verklaring patiënt:**
Ik verklaar dat bovenstaande informatie met mij is besproken en dat ik de gelegenheid heb gehad om vragen te stellen. Ik geef toestemming voor de voorgestelde behandeling.

Datum: {{datum}}
Handtekening patiënt: ________________
Handtekening behandelaar: ________________
```

#### Template 2: Informed consent – implantaatbehandeling

**ID:** `0a23772a-1455-4705-9915-e2998046acfe`

| Veld | Waarde |
|------|--------|
| **Naam** | Informed consent – implantaatbehandeling |
| **teksttype** | InformedConsent |
| **document_format** | InformedConsent |
| **template_type** | Tekst |
| **category_id** | e1013616-0fdd-436f-b99f-bf651b8eb273 (Informed Consent) |
| **subcategory_id** | 9cd2cb9d-15a7-49d1-8dcb-ad62065310ec (Implantologie) |
| **inhoud_length** | 1072 characters |
| **is_standaard_template** | true |
| **actief** | true |

**Content:**
```markdown
**Toestemmingsverklaring Implantaatbehandeling**

**Patiëntgegevens:**
Naam: {{patientNaam}}
Geboortedatum: {{geboortedatum}}

**Voorgestelde implantaatbehandeling:**
{{behandelplan}}

**Aantal implantaten:** {{aantalImplantaten}}
**Locatie:** {{locatie}}

**Behandelfasen:**
1. Chirurgische plaatsing implantaat(en)
2. Genezingsperiode ({{genezingstijd}} maanden)
3. Plaatsing kroon/brug/prothese

**Specifieke risico's implantaatchirurgie:**
- Infectie (1-5%)
- Beschadiging nabijgelegen structuren
- Implantaatverlies (2-5% in eerste jaar)
- Botresorptie
- Zenuwbeschadiging (zeer zeldzaam)

**Contra-indicaties besproken:**
{{contraIndicaties}}

**Nazorg vereist:**
- Goede mondhygiëne essentieel
- Regelmatige controles
- Stoppen met roken aanbevolen

**Kostenoverzicht:**
{{kosten}}

**Verklaring patiënt:**
Ik verklaar volledig geïnformeerd te zijn over de implantaatbehandeling, begrijp de risico's en geef toestemming voor de behandeling.

Datum: {{datum}}
Handtekening patiënt: ________________
Handtekening implantoloog: ________________
```

#### Template 3-7: Overige IC Templates

| ID | Naam | Type | Doel | Actief |
|----|------|------|------|--------|
| 772b11e1... | Formulier – Informed consent implantologie | Formulier | InformedConsent | ✅ |
| c61242a4... | Informed consent bw's | Tekst | KlinischeNote | ✅ |
| cc8dd723... | Informed Consent Implantologie | Formulier | InformedConsent | ✅ |
| 541b22ef... | Informed consent OPT | Tekst | KlinischeNote | ✅ |
| a949074c... | Informed consent solo | Tekst | KlinischeNote | ✅ |

---

## 3. TEMPLATE_CATEGORIES TABEL

### 3.1 Schema

| Kolom | Type | Nullable |
|-------|------|----------|
| id | uuid | NO |
| naam | text | NO |
| omschrijving | text | YES |
| volgorde | integer | YES |
| actief | boolean | YES |
| created_at | timestamptz | YES |
| updated_at | timestamptz | YES |

### 3.2 Informed Consent Category

**Record:**
```json
{
  "id": "e1013616-0fdd-436f-b99f-bf651b8eb273",
  "naam": "Informed Consent",
  "omschrijving": "Toestemmingsformulieren",
  "volgorde": 17,
  "actief": true
}
```

---

## 4. TEMPLATE_SUBCATEGORIES TABEL

### 4.1 Informed Consent Subcategorieën (18 types)

| ID | Naam | Omschrijving |
|----|------|--------------|
| 65526c86... | **Algemene behandeling** | Toestemming algemene tandheelkundige behandelingen |
| 85194e81... | Aligners | - |
| 60f9e4a7... | **Chirurgie** | Toestemming chirurgische ingrepen |
| 0f4fa432... | Endo | - |
| 610d332c... | Extracties | - |
| 4df12c35... | GBR | - |
| 9f3e3d60... | Implantaten (alle varianten) | - |
| 9cd2cb9d... | **Implantologie** | Toestemming implantaatbehandelingen |
| 667cc07a... | Kinderbehandelingen | - |
| 5779344f... | Klikgebit | - |
| 19e04e34... | Kronen/brugwerk | - |
| 4b6e383d... | Medicatie | - |
| 6d48216e... | Paro chirurgie | - |
| 5838ea04... | Prothese | - |
| 1e938613... | Restauratie | - |
| 7b62df97... | Revisie endo | - |
| ca82e546... | Sedatie | - |
| c6022a09... | Sinuslift | - |

**Status:** ✅ Volledige taxonomie beschikbaar voor alle IC types

---

## 5. FORM_TEMPLATES TABEL

### 5.1 Schema

| Kolom | Type | Nullable |
|-------|------|----------|
| id | uuid | NO |
| naam | text | NO |
| beschrijving | text | YES |
| **categorie** | text | NO |
| doel_verrichting_type | text | YES |
| doel_verrichting_subtype | text | YES |
| **allow_ai_generation** | boolean | YES |
| actief | boolean | YES |
| created_at | timestamptz | YES |
| updated_at | timestamptz | YES |

### 5.2 Informed Consent Form Template

**Record:**
```json
{
  "id": "c73e17de-de80-48c7-aa31-f7ca4c9a177d",
  "naam": "Informed Consent Implantologie",
  "beschrijving": "Toestemmingsformulier voor implantaat plaatsing",
  "categorie": "InformedConsent",
  "allow_ai_generation": true,
  "actief": false  // ⚠️ INACTIEF!
}
```

**Status:** ⚠️ Template bestaat maar is NIET actief

---

## 6. FORM_FIELD_TEMPLATES TABEL

### 6.1 Schema

| Kolom | Type | Nullable |
|-------|------|----------|
| id | uuid | NO |
| **form_template_id** | uuid | NO |
| **label** | text | NO |
| **veld_naam** | text | NO |
| **type** | text | NO |
| **opties** | jsonb | YES |
| **verplicht** | boolean | YES |
| **volgorde** | integer | YES |
| helptekst | text | YES |
| created_at | timestamptz | YES |

### 6.2 Form Velden voor "Informed Consent Implantologie"

| # | Label | Veld Naam | Type | Opties | Verplicht |
|---|-------|-----------|------|--------|-----------|
| 1 | Naam patiënt | naam_patient | text | - | ✅ |
| 2 | Geboortedatum | geboortedatum | date | - | ✅ |
| 3 | Datum ingreep | datum_ingreep | date | - | ✅ |
| 4 | Type implantaat | type_implantaat | select | Nobel Biocare, Straumann, Zimmer Biomet, Dentsply Sirona, Anders | ✅ |
| 5 | Locatie implantaat | locatie_implantaat | text | - | ✅ |
| 6 | Risico's besproken | risicos_besproken | checkbox | - | ✅ |
| 7 | Alternatieve behandelingen besproken | alternatieven_besproken | checkbox | - | ✅ |
| 8 | Toestemming voor behandeling | toestemming | checkbox | - | ✅ |
| 9 | Handtekening patiënt | handtekening_patient | signature | - | ✅ |
| 10 | Opmerkingen | opmerkingen | textarea | - | ❌ |

**Status:** ✅ Volledig gedefinieerd form systeem, 10 velden

---

## 7. DOCUMENT_STORE TABEL - OPGESLAGEN DOCUMENTEN

### 7.1 Schema

| Kolom | Type | Nullable | Default |
|-------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| **titel** | text | NO | - |
| **document_type** | text | NO | - |
| **inhoud** | text | NO | - |
| **template_id** | uuid | **YES** | **NULL** ⚠️ |
| user_id | uuid | YES | - |
| **referentie_nummer** | text | NO | - |
| tag | text | YES | - |
| patient_id | uuid | YES | - |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |

### 7.2 Foreign Key Relaties

```sql
template_id → templates.id   -- BESCHIKBAAR maar NIET GEBRUIKT!
user_id → users.id
patient_id → patients.id
```

### 7.3 Document Type Constraint

**Constraint:** `document_store_document_type_check`

**Toegestane waarden:**
```sql
CHECK (document_type = ANY (ARRAY[
  'KlinischeNote'::text,
  'Consent'::text,        -- ← Informed Consent type
  'Verwijsbrief'::text,
  'Verslag'::text,
  'Recept'::text,
  'Formulier'::text,
  'AITekst'::text
]))
```

### 7.4 Informed Consent Documenten in Database

**Query Resultaten:**
```
Total Consent documents:        2
Documents with template_id:     0  ← PROBLEEM!
Documents without template_id:  2
```

#### Document 1

```json
{
  "id": "1f46fad4-f2f7-49ef-81d0-6005268c074d",
  "titel": "Informed Consent - 21-12-2025, 02:08:06",
  "document_type": "Consent",
  "template_id": null,  // ← GEEN TEMPLATE GEKOPPELD!
  "template_naam": null,
  "inhoud_preview": "# Informed Consent\n\nDatum: 21-12-2025\n\n---\n\n[Vul hier de inhoud van het document in]",
  "created_at": "2025-12-21 01:08:06.664473+00"
}
```

**Analyse:** Hardcoded placeholder tekst, geen template content

#### Document 2

```json
{
  "id": "60f90a50-b559-47cf-89de-dc026bea37a7",
  "titel": "Informed Consent",
  "document_type": "Consent",
  "template_id": null,  // ← GEEN TEMPLATE GEKOPPELD!
  "template_naam": null,
  "inhoud_preview": "**Toestemmingsverklaring - **\n\nPatiënt: hotie\nGeboortedatum: [Geboortedatum]\n\n**Voorgestelde behande",
  "created_at": "2025-11-23 00:58:55.647898+00"
}
```

**Analyse:** Gedeeltelijke template tekst, maar geen template_id

### 7.5 Document Type Distributie

| document_type | Count |
|---------------|-------|
| AITekst | 1 |
| **Consent** | **2** |
| KlinischeNote | 5 |
| Recept | 1 |

---

## 8. STANDAARDTEKSTEN TABEL - LEGACY SYSTEEM

### 8.1 Schema

| Kolom | Type | Nullable |
|-------|------|----------|
| id | uuid | NO |
| verrichting_id | uuid | YES |
| titel | text | NO |
| **tekst** | text | NO |
| type | text | NO |
| taal | text | NO |
| wijzigbaar_per_patient | boolean | YES |
| categorie_csv | text | YES |
| subcategorie_csv | text | YES |
| verrichting_type | text | YES |
| verrichting_subtype | text | YES |
| **standaardtekst_type** | text | YES |
| actief | boolean | YES |
| created_at | timestamptz | YES |
| updated_at | timestamptz | YES |

### 8.2 Informed Consent Records

**Query Result:**
```sql
SELECT COUNT(*)
FROM standaardteksten
WHERE standaardtekst_type = 'InformedConsent'
   OR titel ILIKE '%consent%'
   OR titel ILIKE '%toestemming%';

-- Result: 0 records
```

**Conclusie:** ❌ Geen Informed Consent records in legacy systeem

---

## 9. KOPPELING TUSSEN TABELLEN

### 9.1 Template → Document Flow (GEBROKEN)

```
┌─────────────────────────────────────────────┐
│ templates                                   │
│ - id: d46e3420-72d3-439a-8be2-b495c85056b8 │
│ - naam: "IC – algemene behandeling"        │
│ - inhoud: [653 chars full template]        │
│ - teksttype: "InformedConsent"             │
│ - actief: true                              │
└─────────────────────────────────────────────┘
               ↓
        ❌ MISSING LINK
               ↓
┌─────────────────────────────────────────────┐
│ document_store                              │
│ - id: 1f46fad4-f2f7-49ef-81d0-6005268c074d │
│ - titel: "Informed Consent - 21-12-2025"   │
│ - document_type: "Consent"                  │
│ - template_id: NULL  ← SHOULD BE UUID!     │
│ - inhoud: "[Vul hier de inhoud in]"        │
└─────────────────────────────────────────────┘
```

### 9.2 Beoogde Flow (NIET GEÏMPLEMENTEERD)

```
User creates document
  ↓
CliniDocCreatePanel
  ↓
[MISSING] Query templates WHERE teksttype = 'InformedConsent'
  ↓
[MISSING] User selects template
  ↓
[MISSING] Load template.inhoud
  ↓
[MISSING] Substitute {{variables}}
  ↓
Insert into document_store WITH template_id
```

### 9.3 Huidige Flow (FOUT)

```
User creates document
  ↓
CliniDocCreatePanel
  ↓
HARDCODED: inhoud = "# Informed Consent\n\n[Vul hier de inhoud in]"
  ↓
Insert into document_store WITHOUT template_id
```

---

## 10. WAAROM DOCUMENTEN LEEG BLIJVEN

### 10.1 Root Cause Analysis

**Probleem:** Editor start met lege/placeholder tekst in plaats van template content

**Oorzaak 1: Geen Template Lookup**
- `CliniDocCreatePanel.tsx:725` gebruikt hardcoded placeholder
- Geen query naar `templates` tabel
- Template systeem wordt volledig genegeerd

**Bewijs:**
```typescript
// CliniDocCreatePanel.tsx:725
inhoud: `# ${docLabel}\n\nDatum: ${new Date().toLocaleDateString('nl-NL')}\n\n---\n\n[Vul hier de inhoud van het document in]`
```

**Oorzaak 2: Geen template_id Koppeling**
- `document_store.template_id` blijft `NULL`
- Geen relatie tussen document en template
- Later laden van template content onmogelijk

**Bewijs:**
```sql
SELECT template_id FROM document_store WHERE document_type = 'Consent';
-- Result: NULL, NULL (beide documenten)
```

**Oorzaak 3: Geen Variable Substitution**
- Templates bevatten `{{patientNaam}}`, `{{behandeling}}`, etc.
- Geen runtime substitution geïmplementeerd
- Gebruiker ziet rauwe variabelen in plaats van ingevulde waarden

### 10.2 Disconnect Diagram

```
DATABASE (HEEFT ALLES)          UI (GEBRUIKT NIETS)
━━━━━━━━━━━━━━━━━━━━━━━━━      ━━━━━━━━━━━━━━━━━━━━━━

✅ 7 IC templates                ❌ Geen template query
✅ Volledige content             ❌ Hardcoded placeholder
✅ Template variabelen           ❌ Geen substitution
✅ Category systeem              ❌ Geen template selectie
✅ Form definitions              ❌ Geen form integratie
✅ template_id kolom             ❌ Wordt niet ingevuld

        ↕ GEEN COMMUNICATIE ↕
```

---

## 11. DOCUMENT TYPE MAPPING

### 11.1 UI → Database Type Mapping

**Bron:** `src/components/care/CliniDocCreatePanel.tsx:67-75`

```typescript
const DOC_TYPES = [
  {
    id: 'informed_consent',      // UI internal ID
    label: 'Informed Consent',    // UI display label
    icon: FileSignature,
    color: 'teal',
    dbType: 'Consent'             // ← Maps to document_store.document_type
  }
];
```

### 11.2 Database Type Mapping

```
UI Type             →  document_store.document_type  →  templates Filter
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
'informed_consent'  →  'Consent'                     →  teksttype='InformedConsent'
                                                         OR document_format='InformedConsent'
```

### 11.3 Template Query (ONTBREEKT)

**Wat er ZOU moeten gebeuren:**
```typescript
const { data: templates } = await supabase
  .from('templates')
  .select('id, naam, inhoud, category_id, subcategory_id')
  .or('teksttype.eq.InformedConsent,document_format.eq.InformedConsent')
  .eq('actief', true)
  .order('naam');
```

**Wat er NU gebeurt:**
```typescript
// NIETS - geen template query
```

---

## 12. VERGELIJKING: DATABASE vs. UI

### 12.1 Database Capabilities (AANWEZIG)

| Feature | Status | Details |
|---------|--------|---------|
| Template storage | ✅ | 7 IC templates |
| Full content | ✅ | 653-1072 chars per template |
| Variable system | ✅ | {{patientNaam}}, {{behandeling}}, etc. |
| Categorization | ✅ | 1 category, 18 subcategories |
| Form definitions | ✅ | 1 form template, 10 fields |
| Template versioning | ✅ | created_at, updated_at |
| AI generation flag | ✅ | allow_ai_generation |
| Active/inactive flag | ✅ | actief boolean |
| FK relationships | ✅ | template_id → templates.id |

### 12.2 UI Implementation (ONTBREEKT)

| Feature | Status | Details |
|---------|--------|---------|
| Template query | ❌ | Geen database call |
| Template selection | ❌ | Geen UI component |
| Template loading | ❌ | Gebruikt placeholder |
| Variable substitution | ❌ | Geen runtime replacement |
| template_id assignment | ❌ | Blijft NULL |
| Form integration | ❌ | form_templates niet gebruikt |
| Category filtering | ❌ | Categories niet getoond |
| Template preview | ❌ | Geen preview functie |

---

## 13. ANDERE TEMPLATE TABELLEN (NIET VOOR CLINI_DOC)

Voor volledigheid, andere template tabellen in de database:

### 13.1 Behandeling-gerelateerde Templates

| Tabel | Doel | Records |
|-------|------|---------|
| behandelplan_templates | Behandelplan templates | Template instantiation |
| behandeloptie_templates | Behandelopties | Treatment options |
| interventie_templates | Interventie templates | Procedures |
| diagnose_templates | Diagnose templates | Diagnoses |
| care_requirement_templates | Zorgvereisten | Care requirements |

### 13.2 Operationele Templates

| Tabel | Doel |
|-------|------|
| checklist_templates | Checklist templates |
| onboarding_templates | Onboarding flows |
| procedure_templates | Procedure definitie |
| recept_templates | Recept templates |
| room_checklist_templates | Ruimte checklists |
| shift_templates | Shift templates |
| task_description_templates | Taak beschrijvingen |

**Status:** Deze tabellen zijn voor andere doeleinden, NIET voor CliniDoc

---

## 14. AI INTEGRATION

### 14.1 AI Template Generator Requests

**Tabel:** `ai_template_generator_requests`

**Schema:**
- request_id
- user_id
- context
- generated_template
- created_at

**Status:** ⚠️ AI generatie mogelijk maar niet actief voor IC

### 14.2 Form Template AI Support

**form_templates.allow_ai_generation:**
```json
{
  "naam": "Informed Consent Implantologie",
  "allow_ai_generation": true  // ← AI generatie toegestaan
}
```

**Status:** ✅ Flag aanwezig, implementatie onduidelijk

---

## 15. MIGRATIE BESTANDEN

### 15.1 Key Migrations voor Informed Consent

| Migration | Datum | Inhoud |
|-----------|-------|--------|
| **20251118222332_populate_standard_templates.sql** | 2025-11-18 | **HOOFDBRON** - IC templates met volledige content |
| 20251118024312_populate_starter_templates.sql | 2025-11-18 | Starter IC templates |
| 20251117225218_add_forms_system.sql | 2025-11-17 | Form-based IC systeem + velden |
| 20251118023253_add_template_system.sql | 2025-11-18 | Template tabel structuur |
| 20251118023411_populate_template_categories.sql | 2025-11-18 | IC category + 18 subcategories |
| 20251118222219_create_full_template_category_structure_v2.sql | 2025-11-18 | Category structure v2 |
| 20251129221612_merge_templates_and_forms_system.sql | 2025-11-29 | Merge templates + forms |

### 15.2 document_store Creation

**Migration:** `20251129224103_extend_document_store_for_case_centric_clinical_notes.sql`

**Key Changes:**
- Added `patient_id` column
- Added `template_id` column (FK → templates)
- document_type constraint includes 'Consent'

---

## 16. CONCLUSIE & DIAGNOSE

### 16.1 Database Status: ✅ VOLLEDIG

De database bevat een **complete, functionele template infrastructuur:**

✅ 7 Informed Consent templates met volledige content
✅ 1 Category ("Informed Consent") met 18 subcategorieën
✅ Template variable systeem ({{variableName}})
✅ Form-based template met 10 velden
✅ FK relationship document_store.template_id → templates.id
✅ Document type constraint accepteert 'Consent'
✅ AI generation support

**Database Score:** 10/10 - Alles aanwezig

### 16.2 UI Implementation Status: ❌ ONTBREEKT

De frontend **gebruikt de template database NIET:**

❌ CliniDocCreatePanel doet GEEN template query
❌ Hardcoded placeholder tekst in plaats van template content
❌ template_id wordt NIET ingevuld bij document creatie
❌ Geen template selectie UI voor gebruiker
❌ Geen variable substitution bij instantiatie
❌ Form templates worden genegeerd
❌ Categories/subcategories niet zichtbaar

**UI Score:** 0/10 - Niets geïmplementeerd

### 16.3 Waarom Editor Leeg Blijft

**Simpel Antwoord:**

De editor blijft leeg omdat `CliniDocCreatePanel.tsx:725` een **hardcoded placeholder string** gebruikt:

```typescript
inhoud: `# ${docLabel}\n\nDatum: ${date}\n\n---\n\n[Vul hier de inhoud van het document in]`
```

In plaats van template content uit de database te laden.

**Technisch Antwoord:**

1. **Geen Template Lookup**
   - UI voert geen query uit naar `templates` tabel
   - Templates met volledige content worden genegeerd
   - Database connectie ontbreekt volledig

2. **Geen Template Selection**
   - Gebruiker krijgt geen keuze uit beschikbare templates
   - Standaard template wordt niet automatisch geladen
   - Subcategorie filtering niet beschikbaar

3. **Geen Variable Substitution**
   - Template variabelen (`{{patientNaam}}`) worden niet vervangen
   - Patient/behandeling data niet automatisch ingevuld
   - Handmatige invul vereist

4. **Geen template_id Assignment**
   - Foreign key blijft `NULL`
   - Relatie tussen document en template bestaat niet
   - Later ophalen van template onmogelijk

### 16.4 Impact

**Voor Gebruiker:**
- Moet alle IC content handmatig typen
- Geen standaard templates beschikbaar
- Risico op inconsistente documenten
- Geen gebruik van professionele templates

**Voor Systeem:**
- Template database niet benut
- Geen template hergebruik
- Geen tracking welke template gebruikt
- Dubbel onderhoud (DB + handmatig)

---

## 17. QUICK FIX VOORSTEL

### 17.1 Minimale Wijziging

**File:** `src/components/care/CliniDocCreatePanel.tsx`

**Toevoegen:**

```typescript
// 1. Query templates on mount
const [icTemplates, setIcTemplates] = useState<any[]>([]);

useEffect(() => {
  async function loadTemplates() {
    const { data } = await supabase
      .from('templates')
      .select('id, naam, inhoud')
      .or('teksttype.eq.InformedConsent,document_format.eq.InformedConsent')
      .eq('actief', true)
      .order('naam');

    setIcTemplates(data || []);
  }
  loadTemplates();
}, []);

// 2. Let user select template
<select onChange={(e) => setSelectedTemplateId(e.target.value)}>
  <option value="">-- Kies een template --</option>
  {icTemplates.map(t => (
    <option key={t.id} value={t.id}>{t.naam}</option>
  ))}
</select>

// 3. Use template content
const selectedTemplate = icTemplates.find(t => t.id === selectedTemplateId);
const docData = {
  // ...
  inhoud: selectedTemplate?.inhoud || placeholderText,
  template_id: selectedTemplateId,
};
```

**Resultaat:** Templates beschikbaar in UI ✅

### 17.2 Uitgebreide Implementatie

**Fase 1:** Template Selection
- Query templates from database
- Show dropdown met beschikbare templates
- Preview template content

**Fase 2:** Variable Substitution
- Parse `{{variableName}}` syntax
- Replace with actual patient/behandeling data
- Mark unfilled variables for user

**Fase 3:** Form Integration
- Load form_field_templates
- Generate dynamic form UI
- Convert form data to document content

---

## APPENDIX A: ALLE TEMPLATE-GERELATEERDE TABELLEN

### Volledige Lijst (34 tabellen)

```
1.  ai_template_generator_requests       - AI template generatie logging
2.  behandeloptie_templates              - Behandelopties templates
3.  behandelplan_templates               - Behandelplan templates
4.  care_requirement_templates           - Zorgvereisten templates
5.  checklist_templates                  - Checklist templates
6.  clinical_alert_instances             - Alert instances
7.  clinical_alert_rules                 - Alert rules
8.  clinical_choice_answers              - Clinical choice answers
9.  clinical_choices_templates           - Clinical choices
10. clinical_titles                      - Clinical titles
11. diagnose_templates                   - Diagnose templates
12. document_store                       - HOOFDTABEL DOCUMENTEN ⭐
13. form_field_templates                 - Form field definitie
14. form_templates                       - Form templates
15. interventie_template_upt_defaults    - UPT defaults
16. interventie_templates                - Interventie templates
17. onboarding_template_steps            - Onboarding stappen
18. onboarding_templates                 - Onboarding templates
19. procedure_prescription_templates     - Procedure prescriptions
20. procedure_templates                  - Procedure templates
21. recept_templates                     - Recept templates
22. room_checklist_template_items        - Ruimte checklist items
23. room_checklist_templates             - Ruimte checklist templates
24. room_templates_master                - Master ruimte templates
25. room_templates_master_items          - Master ruimte items
26. shift_template_requirements          - Shift requirements
27. shift_templates                      - Shift templates
28. standaardteksten                     - Legacy standaard teksten
29. task_description_templates           - Taak beschrijvingen
30. template_categories                  - Template categorieën ⭐
31. template_sections                    - Template secties
32. template_subcategories               - Template subcategorieën ⭐
33. templates                            - HOOFDTABEL TEMPLATES ⭐
34. verrichting_upt_template_items       - Verrichting UPT items
35. verrichting_upt_templates            - Verrichting UPT templates
```

**⭐ = Relevant voor CliniDoc Informed Consent**

---

## APPENDIX B: QUERY VOORBEELDEN

### B.1 Alle IC Templates Ophalen

```sql
SELECT
  t.id,
  t.naam,
  t.inhoud,
  tc.naam as category,
  ts.naam as subcategory
FROM templates t
LEFT JOIN template_categories tc ON t.category_id = tc.id
LEFT JOIN template_subcategories ts ON t.subcategory_id = ts.id
WHERE (t.teksttype = 'InformedConsent'
   OR t.document_format = 'InformedConsent')
  AND t.actief = true
ORDER BY t.naam;
```

### B.2 Document met Template Info

```sql
SELECT
  ds.id,
  ds.titel,
  ds.document_type,
  ds.inhoud,
  ds.template_id,
  t.naam as template_naam,
  t.inhoud as template_inhoud
FROM document_store ds
LEFT JOIN templates t ON ds.template_id = t.id
WHERE ds.document_type = 'Consent'
ORDER BY ds.created_at DESC;
```

### B.3 Template met Alle Relaties

```sql
SELECT
  t.id,
  t.naam,
  t.teksttype,
  t.document_format,
  tc.naam as category,
  ts.naam as subcategory,
  ft.naam as form_naam,
  LENGTH(t.inhoud) as content_length,
  t.actief
FROM templates t
LEFT JOIN template_categories tc ON t.category_id = tc.id
LEFT JOIN template_subcategories ts ON t.subcategory_id = ts.id
LEFT JOIN form_templates ft ON t.form_template_id = ft.id
WHERE t.naam ILIKE '%consent%'
ORDER BY t.naam;
```

---

**EINDE RAPPORT**

**Samenvatting:** Database is compleet en functioneel. UI implementatie ontbreekt volledig. Documenten blijven leeg omdat geen template lookup plaatsvindt en hardcoded placeholder tekst wordt gebruikt.

**Next Action:** Implementeer template lookup en selectie in CliniDocCreatePanel.tsx
