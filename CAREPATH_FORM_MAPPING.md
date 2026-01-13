# CAREPATH FORM MAPPING
## Form Context Rules & Care Path Integration

**Date:** December 21, 2024
**Source:** FORM_DEFINITION_SCHEMA.md + document_store schema
**Purpose:** Define allowed contexts and required data for each clinical form

**Important:** This document establishes the rules for when and how forms can be used in different clinical contexts, including standalone, patient-bound, and care path-bound scenarios.

---

## TABLE OF CONTENTS

1. [Context Types Overview](#context-types-overview)
2. [Form Context Mappings](#form-context-mappings)
3. [Dummy Patient Context](#dummy-patient-context)
4. [Database Schema](#database-schema)
5. [Implementation Guide](#implementation-guide)
6. [Validation Rules](#validation-rules)

---

## CONTEXT TYPES OVERVIEW

### Context Type Definitions

Clinical forms in DNMZ can be used in three distinct contexts:

#### 1. Generic Context
**Description:** Form used without patient or care path binding

**Characteristics:**
- No patient identification required
- Used for template creation, testing, or generic documentation
- Cannot be submitted to patient record
- Limited clinical value (training/reference only)

**Use Cases:**
- Template testing
- Staff training
- Form preview/demonstration
- Protocol documentation

**Limitations:**
- ❌ Cannot be saved to patient record
- ❌ Cannot trigger clinical workflows
- ❌ Cannot generate billing/budgets
- ❌ No legal validity (not part of patient dossier)

---

#### 2. Patient-Specific Context
**Description:** Form bound to a patient but NOT part of structured care plan

**Characteristics:**
- Requires `patient_id`
- Patient identity confirmed before form creation
- Document stored in patient's dossier
- Standalone clinical documentation

**Use Cases:**
- Ad-hoc consultations
- Emergency visits
- Walk-in patients
- Standalone assessments

**Data Flow:**
```
Patient Selected → Form Opened → Form Completed → Saved to patient_id
```

**Database Storage:**
```json
{
  "patient_id": "uuid",
  "case_id": null,
  "behandelplan_id": null,
  "behandeloptie_id": null,
  "zorgplan_id": null
}
```

---

#### 3. CarePath-Bound Context (ICE+)
**Description:** Form bound to patient AND integrated into structured care plan

**Characteristics:**
- Requires `patient_id` + care path reference
- Part of Intelligent Care Engine (ICE) workflow
- Linked to treatment plan, case, or care trajectory
- Enables automatic template variable substitution
- Supports care requirement validation

**Use Cases:**
- Planned treatments (implants, orthodontics, rehab)
- Multi-visit procedures
- Informed consent for specific treatments
- Follow-up documentation

**Care Path Reference Types:**
| Reference | Table | Description |
|-----------|-------|-------------|
| `case_id` | cases | Links to patient case (e.g., "Case 2024-123") |
| `behandelplan_id` | behandelplannen | Links to treatment plan |
| `behandeloptie_id` | behandelopties | Links to specific treatment option |
| `zorgplan_id` | zorgplannen | Links to care plan |

**Data Flow:**
```
Patient Selected → Care Path Selected → Form Opened →
Template Variables Auto-Filled → Form Completed →
Saved with Full Context → Care Requirements Validated
```

**Database Storage:**
```json
{
  "patient_id": "uuid",
  "case_id": "uuid",
  "behandelplan_id": "uuid",
  "behandeloptie_id": "uuid",
  "zorgplan_id": "uuid"
}
```

---

## FORM CONTEXT MAPPINGS

### FORM 1: Pijnklacht Acute (Emergency Pain Consultation)

**Form ID:** `pijnklacht_acute`

**Allowed Contexts:**
- ✅ Patient-Specific
- ⚠️ CarePath-Bound (optional)
- ❌ Generic (not allowed - emergency requires patient)

**Required Context Data:**
```typescript
{
  required: {
    patient_id: true
  },
  optional: {
    case_id: true,          // If emergency is case-related
    behandelplan_id: true,  // If part of ongoing treatment
    behandeloptie_id: false,
    zorgplan_id: false
  }
}
```

**Context Rules:**

| Context | Allowed | Required Data | Use Case |
|---------|---------|---------------|----------|
| Generic | ❌ No | - | Emergency requires patient identity |
| Patient-Specific | ✅ Yes | patient_id | Walk-in emergency, no prior case |
| CarePath-Bound | ⚠️ Optional | patient_id + case_id | Emergency during ongoing treatment |

**Rationale:**
- **Medical:** Emergency documentation requires patient identification for legal record
- **Legal:** Treatment without patient record violates WGBO documentation requirements
- **Clinical:** Emergency pain typically ad-hoc, but MAY relate to ongoing case
- **Workflow:** Most emergencies are standalone, but linking to case is valuable for continuity

**Template Variable Support:**
- ✅ Patient variables: {{patient_naam}}, {{patient_geboortedatum}}, {{patient_bsn}}
- ⚠️ Care path variables: Available only if case_id provided
- ❌ Treatment option variables: Not applicable to emergencies

**Validation:**
```typescript
function validatePijnklachtAcuteContext(context: FormContext): ValidationResult {
  if (!context.patient_id) {
    return {
      valid: false,
      error: "Pijnklacht Acute requires patient identification"
    };
  }
  return { valid: true };
}
```

---

### FORM 2: PMO Uitgebreid (Comprehensive Oral Health Examination)

**Form ID:** `pmo_uitgebreid`

**Allowed Contexts:**
- ✅ Patient-Specific
- ✅ CarePath-Bound
- ❌ Generic (not allowed - requires patient for oral health assessment)

**Required Context Data:**
```typescript
{
  required: {
    patient_id: true
  },
  optional: {
    case_id: true,          // If part of care trajectory
    behandelplan_id: true,  // If assessment for treatment planning
    behandeloptie_id: false,
    zorgplan_id: true       // If part of periodic care plan
  }
}
```

**Context Rules:**

| Context | Allowed | Required Data | Use Case |
|---------|---------|---------------|----------|
| Generic | ❌ No | - | Requires actual patient examination |
| Patient-Specific | ✅ Yes | patient_id | Standalone periodic checkup |
| CarePath-Bound | ✅ Yes | patient_id + (case_id OR zorgplan_id) | Assessment as part of treatment plan |

**Rationale:**
- **Medical:** PMO is comprehensive examination requiring actual patient presence
- **Legal:** Oral cancer screening documentation requires patient identity (KNMT guidelines)
- **Clinical:** PMO can be standalone OR part of structured care plan
- **Workflow:** Common scenarios:
  - Standalone: Annual checkup, new patient intake
  - CarePath-Bound: Pre-treatment assessment, case evaluation, care plan review

**Template Variable Support:**
- ✅ Patient variables: Full support
- ✅ Care path variables: Available if case_id or zorgplan_id provided
- ⚠️ Treatment option variables: Available if behandelplan_id provided

**Special Use Cases:**

#### Use Case 1: Standalone Annual Checkup
```json
{
  "patient_id": "uuid",
  "case_id": null,
  "zorgplan_id": "uuid"  // Links to annual recall schedule
}
```

#### Use Case 2: Pre-Implant Assessment
```json
{
  "patient_id": "uuid",
  "case_id": "uuid",          // Implant case
  "behandelplan_id": "uuid",  // Implant treatment plan
  "zorgplan_id": "uuid"       // ICE care trajectory
}
```

**Validation:**
```typescript
function validatePMOUitgebreidContext(context: FormContext): ValidationResult {
  if (!context.patient_id) {
    return {
      valid: false,
      error: "PMO Uitgebreid requires patient identification"
    };
  }
  return { valid: true };
}
```

---

### FORM 3: Informed Consent Implantologie

**Form ID:** `informed_consent_implantologie`

**Allowed Contexts:**
- ❌ Generic (FORBIDDEN - legal document requires patient)
- ❌ Patient-Specific (NOT RECOMMENDED - should be treatment-bound)
- ✅ CarePath-Bound (MANDATORY - must link to treatment plan)

**Required Context Data:**
```typescript
{
  required: {
    patient_id: true,
    behandelplan_id: true,  // MANDATORY: Legal consent must link to specific treatment
    behandeloptie_id: true  // MANDATORY: Links to implant treatment option
  },
  optional: {
    case_id: true,          // Strongly recommended
    zorgplan_id: true       // Strongly recommended
  }
}
```

**Context Rules:**

| Context | Allowed | Required Data | Use Case |
|---------|---------|---------------|----------|
| Generic | ❌ FORBIDDEN | - | Legal document cannot be generic |
| Patient-Specific | ⚠️ Discouraged | patient_id | Creates orphan consent without treatment link |
| CarePath-Bound | ✅ MANDATORY | patient_id + behandelplan_id + behandeloptie_id | Proper informed consent workflow |

**Rationale:**
- **Legal:** WGBO Article 7:448 requires consent to be linked to specific treatment
- **Medical:** Informed consent meaningless without defined treatment plan
- **Liability:** Orphan consent documents create legal ambiguity
- **Workflow:** Informed consent MUST be obtained BEFORE treatment starts
- **Audit:** Treatment plan link enables verification that consent preceded treatment

**Template Variable Support:**
- ✅ Patient variables: Full support (naam, geboortedatum required by law)
- ✅ Treatment plan variables: {{behandelplan_titel}}, {{aantal_implantaten}}, {{locatie}}
- ✅ Cost variables: {{kosten_totaal}}, {{kosten_per_fase}} (from budget)
- ✅ Risk variables: Auto-populated from behandeloptie requirements

**Enforcement Policy:**
- ⚠️ **BLOCK submission** if patient_id missing
- ⚠️ **BLOCK submission** if behandelplan_id missing
- ⚠️ **BLOCK submission** if behandeloptie_id missing
- ⚠️ **WARN clinician** if case_id missing (best practice violation)
- ⚠️ **WARN clinician** if zorgplan_id missing (ICE integration incomplete)

**Template Variable Auto-Fill Example:**
```typescript
// When form opens in CarePath context, auto-fill:
{
  "patientNaam": "{{patient.naam}}",          // From patient_id
  "geboortedatum": "{{patient.geboortedatum}}", // From patient_id
  "behandelplan": "{{behandelplan.beschrijving}}", // From behandelplan_id
  "aantalImplantaten": "{{behandeloptie.aantal_implantaten}}", // From behandeloptie_id
  "locatie": "{{behandeloptie.locatie}}", // From behandeloptie_id
  "kosten": "{{budget.totaal_bedrag}}" // From linked budget
}
```

**Validation:**
```typescript
function validateInformedConsentContext(context: FormContext): ValidationResult {
  // Patient ID is absolutely mandatory
  if (!context.patient_id) {
    return {
      valid: false,
      error: "Informed Consent requires patient identification (legal requirement)"
    };
  }

  // Treatment plan is absolutely mandatory
  if (!context.behandelplan_id) {
    return {
      valid: false,
      error: "Informed Consent must be linked to treatment plan (WGBO requirement)"
    };
  }

  // Treatment option is absolutely mandatory
  if (!context.behandeloptie_id) {
    return {
      valid: false,
      error: "Informed Consent must be linked to specific treatment option"
    };
  }

  // Case ID is strongly recommended but not blocking
  if (!context.case_id) {
    return {
      valid: true,
      warning: "Best practice: Link informed consent to case for better audit trail"
    };
  }

  return { valid: true };
}
```

---

## DUMMY PATIENT CONTEXT

### Purpose

The Dummy Patient context enables safe testing, training, and development without risking real patient data or violating GDPR regulations.

### Rules

#### 1. Dummy Patient Identification

**EPD ID Format:** `DUMMY-EPD-XXX`

Where `XXX` is:
- `TST` - Test/development
- `TRN` - Training/education
- `DMO` - Demonstration/preview
- `DEV` - Developer sandbox

**Examples:**
- `DUMMY-EPD-TST-001`
- `DUMMY-EPD-TRN-IMPLANT`
- `DUMMY-EPD-DMO-SHOWCASE`
- `DUMMY-EPD-DEV-ALICE`

#### 2. Dummy Patient Data

**Required Fields:**
```typescript
{
  id: "uuid",
  naam: "Test Patiënt [XXX]",
  email: "dummy-xxx@example.local",
  geboortedatum: "1990-01-01",  // Fixed date for consistency
  bsn: "000000000",             // Invalid BSN (checksum fails)
  epd_nummer: "DUMMY-EPD-XXX",  // Clearly marked as dummy
  is_test: true,                // Database flag
  locatie_id: "uuid"
}
```

**Auto-Generated Fields:**
```typescript
{
  telefoon: "0600000000",
  straat: "Teststraat",
  huisnummer: "1",
  postcode: "0000AA",
  plaats: "Teststad"
}
```

#### 3. Database Flagging

All dummy patient records MUST have:
```sql
is_test = true
```

This enables:
- Filtering dummy data from reports
- Bulk cleanup of test data
- Production safety (prevent accidental real patient treatment)

#### 4. Allowed Operations

**Allowed:**
- ✅ Create dummy patients
- ✅ Create dummy cases/treatment plans
- ✅ Complete forms with dummy patient
- ✅ Test workflows end-to-end
- ✅ Generate dummy budgets/documents
- ✅ Training scenarios

**Forbidden:**
- ❌ Export dummy data to external systems
- ❌ Generate real invoices for dummy patients
- ❌ Submit dummy data to insurance
- ❌ Use dummy patient for actual treatment

#### 5. UI Indicators

When working with dummy patient, UI MUST display:
- 🧪 Test badge in patient header
- Orange/yellow color scheme
- Clear "DUMMY PATIENT - NOT REAL" warning
- Watermark on generated documents

#### 6. Data Lifecycle

**Retention:**
- Dummy patients are NOT automatically deleted
- Training dummy patients persist indefinitely
- Test/dev dummy patients can be bulk-deleted via admin tool

**Cleanup Query:**
```sql
-- Delete all dummy test data (dev/test only, not training)
DELETE FROM patients
WHERE is_test = true
  AND epd_nummer LIKE 'DUMMY-EPD-TST%'
  AND created_at < NOW() - INTERVAL '30 days';
```

### Example: Dummy Patient Workflow

#### Step 1: Create Dummy Patient
```typescript
const dummyPatient = await createDummyPatient({
  type: 'TST',  // Test patient
  scenario: 'implant_full_arch'
});

// Returns:
{
  id: "uuid",
  naam: "Test Patiënt Implant Full Arch",
  epd_nummer: "DUMMY-EPD-TST-001",
  is_test: true
}
```

#### Step 2: Create Dummy Care Path
```typescript
const dummyCase = await createCase({
  patient_id: dummyPatient.id,
  case_code: "DUMMY-2024-001"
});

const dummyBehandelplan = await createBehandelplan({
  patient_id: dummyPatient.id,
  case_id: dummyCase.id,
  template_id: "volledige_rehabilitatie_boven"
});
```

#### Step 3: Complete Form with Dummy Context
```typescript
const formContext = {
  patient_id: dummyPatient.id,
  case_id: dummyCase.id,
  behandelplan_id: dummyBehandelplan.id,
  is_dummy: true  // Flag for UI indicators
};

// Form opens with auto-filled dummy data
const form = await openForm('informed_consent_implantologie', formContext);
```

#### Step 4: Verify Test Data Flag
```typescript
// Before saving, verify is_test flag is set
if (!formContext.patient_id.is_test) {
  throw new Error("Cannot use dummy form context with real patient");
}
```

---

## DATABASE SCHEMA

### document_store Table

**Purpose:** Central storage for all clinical forms and documents

**Schema:**
```sql
CREATE TABLE document_store (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Document metadata
  document_type text NOT NULL,
  document_title text,
  content_tekst text,
  tag jsonb,

  -- Context bindings (all nullable)
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  case_id uuid REFERENCES cases(id) ON DELETE SET NULL,
  behandelplan_id uuid REFERENCES behandelplannen(id) ON DELETE SET NULL,
  behandeloptie_id uuid REFERENCES behandelopties(id) ON DELETE SET NULL,
  zorgplan_id uuid REFERENCES zorgplannen(id) ON DELETE SET NULL,

  -- Audit fields
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id),

  -- Form-specific data
  form_data jsonb,  -- Structured form responses
  form_version text -- Form schema version (e.g., "1.0.0")
);
```

**Indexes:**
```sql
CREATE INDEX idx_document_store_patient_id ON document_store(patient_id);
CREATE INDEX idx_document_store_case_id ON document_store(case_id);
CREATE INDEX idx_document_store_behandelplan_id ON document_store(behandelplan_id);
CREATE INDEX idx_document_store_behandeloptie_id ON document_store(behandeloptie_id);
CREATE INDEX idx_document_store_zorgplan_id ON document_store(zorgplan_id);
CREATE INDEX idx_document_store_patient_case_type ON document_store(patient_id, case_id, document_type);
```

**Context Patterns:**

| Context Type | patient_id | case_id | behandelplan_id | behandeloptie_id | zorgplan_id |
|--------------|-----------|---------|-----------------|------------------|-------------|
| Generic | NULL | NULL | NULL | NULL | NULL |
| Patient-Specific | uuid | NULL | NULL | NULL | NULL |
| Case-Bound | uuid | uuid | NULL | NULL | NULL |
| Treatment Plan-Bound | uuid | uuid | uuid | NULL | NULL |
| Full CarePath | uuid | uuid | uuid | uuid | uuid |

---

## IMPLEMENTATION GUIDE

### Frontend Form Component

```typescript
interface FormContext {
  // Required for all patient-bound forms
  patient_id?: string;

  // Optional care path bindings
  case_id?: string;
  behandelplan_id?: string;
  behandeloptie_id?: string;
  zorgplan_id?: string;

  // Metadata
  is_dummy?: boolean;
  allow_generic?: boolean;
}

interface FormConfig {
  formId: string;
  allowedContexts: ('generic' | 'patient' | 'carePath')[];
  requiredContext: {
    patient_id: boolean;
    case_id?: boolean;
    behandelplan_id?: boolean;
    behandeloptie_id?: boolean;
    zorgplan_id?: boolean;
  };
}

// Form configuration registry
const FORM_CONFIGS: Record<string, FormConfig> = {
  pijnklacht_acute: {
    formId: 'pijnklacht_acute',
    allowedContexts: ['patient', 'carePath'],
    requiredContext: {
      patient_id: true
    }
  },

  pmo_uitgebreid: {
    formId: 'pmo_uitgebreid',
    allowedContexts: ['patient', 'carePath'],
    requiredContext: {
      patient_id: true
    }
  },

  informed_consent_implantologie: {
    formId: 'informed_consent_implantologie',
    allowedContexts: ['carePath'],
    requiredContext: {
      patient_id: true,
      behandelplan_id: true,
      behandeloptie_id: true
    }
  }
};

// Context validator
function validateFormContext(
  formId: string,
  context: FormContext
): { valid: boolean; error?: string; warning?: string } {
  const config = FORM_CONFIGS[formId];
  if (!config) {
    return { valid: false, error: `Unknown form: ${formId}` };
  }

  // Check required fields
  for (const [field, required] of Object.entries(config.requiredContext)) {
    if (required && !context[field as keyof FormContext]) {
      return {
        valid: false,
        error: `${formId} requires ${field}`
      };
    }
  }

  // Determine actual context type
  const hasPatient = !!context.patient_id;
  const hasCarePath = !!(context.case_id || context.behandelplan_id || context.zorgplan_id);

  let contextType: 'generic' | 'patient' | 'carePath';
  if (!hasPatient) {
    contextType = 'generic';
  } else if (hasCarePath) {
    contextType = 'carePath';
  } else {
    contextType = 'patient';
  }

  // Check if context type is allowed
  if (!config.allowedContexts.includes(contextType)) {
    return {
      valid: false,
      error: `${formId} does not allow ${contextType} context`
    };
  }

  return { valid: true };
}

// Usage example
async function openForm(formId: string, context: FormContext) {
  // Validate context
  const validation = validateFormContext(formId, context);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (validation.warning) {
    console.warn(validation.warning);
  }

  // Load patient data if patient_id provided
  let patientData = null;
  if (context.patient_id) {
    patientData = await supabase
      .from('patients')
      .select('*')
      .eq('id', context.patient_id)
      .single();

    // Check if dummy patient
    if (patientData.is_test) {
      context.is_dummy = true;
    }
  }

  // Load care path data if provided
  let carePathData = null;
  if (context.behandelplan_id) {
    carePathData = await loadCarePathData(context);
  }

  // Render form with context
  return renderForm({
    formId,
    context,
    patientData,
    carePathData
  });
}
```

### Backend Save Handler

```typescript
async function saveFormSubmission(
  formId: string,
  context: FormContext,
  formData: any
) {
  // Validate context again (never trust frontend)
  const validation = validateFormContext(formId, context);
  if (!validation.valid) {
    throw new Error(`Invalid context: ${validation.error}`);
  }

  // Prevent saving dummy data to production if not test environment
  if (context.is_dummy && process.env.NODE_ENV === 'production') {
    const patient = await supabase
      .from('patients')
      .select('is_test')
      .eq('id', context.patient_id)
      .single();

    if (!patient.is_test) {
      throw new Error('Context marked as dummy but patient is not test patient');
    }
  }

  // Save to document_store
  const { data, error } = await supabase
    .from('document_store')
    .insert({
      document_type: formId,
      document_title: getFormTitle(formId, formData),
      patient_id: context.patient_id || null,
      case_id: context.case_id || null,
      behandelplan_id: context.behandelplan_id || null,
      behandeloptie_id: context.behandeloptie_id || null,
      zorgplan_id: context.zorgplan_id || null,
      form_data: formData,
      form_version: '1.0.0'
    })
    .select()
    .single();

  if (error) throw error;

  // Trigger post-save workflows if care path bound
  if (context.behandelplan_id) {
    await triggerCarePathWorkflows(context, data.id);
  }

  return data;
}
```

---

## VALIDATION RULES

### Context Validation Matrix

| Form | Generic | Patient-Specific | CarePath-Bound |
|------|---------|------------------|----------------|
| Pijnklacht Acute | ❌ Block | ✅ Allow | ✅ Allow |
| PMO Uitgebreid | ❌ Block | ✅ Allow | ✅ Allow |
| Informed Consent Implantologie | ❌ Block | ⚠️ Block with warning | ✅ Allow |

### Validation Error Messages (Dutch)

```typescript
const VALIDATION_MESSAGES = {
  // Generic context errors
  'generic_not_allowed': 'Dit formulier kan niet zonder patiënt worden gebruikt',
  'generic_patient_required': 'Patiënt selectie is verplicht voor dit formulier',

  // Patient-specific errors
  'patient_id_required': 'Patiënt ID is verplicht',
  'patient_not_found': 'Patiënt niet gevonden',
  'patient_is_dummy_production': 'Test patiënt kan niet worden gebruikt in productieomgeving',

  // CarePath errors
  'carepath_required': 'Dit formulier moet gekoppeld worden aan een behandelplan',
  'behandelplan_id_required': 'Behandelplan ID is verplicht voor dit formulier',
  'behandeloptie_id_required': 'Behandeloptie ID is verplicht voor dit formulier',
  'case_recommended': 'Beste praktijk: koppel dit formulier aan een case voor betere traceerbaarheid',

  // Legal consent errors
  'informed_consent_carepath_mandatory': 'Informed consent moet gekoppeld zijn aan specifiek behandelplan (WGBO vereiste)',
  'informed_consent_orphan': 'Informed consent zonder behandelplan creëert juridische onduidelijkheid',

  // Dummy patient warnings
  'dummy_patient_active': '🧪 LET OP: U werkt met een test patiënt',
  'dummy_data_not_real': 'Deze gegevens zijn NIET echt en mogen niet worden gebruikt voor echte behandeling'
};
```

### Pre-Save Validation Checklist

**For ALL forms:**
- [ ] Form ID valid and recognized
- [ ] Form version compatible with schema
- [ ] User has permission to create this document type

**For Patient-Specific forms:**
- [ ] patient_id is valid UUID
- [ ] Patient exists in database
- [ ] Patient is not marked as deleted
- [ ] If dummy patient: is_test flag is true
- [ ] If production: patient is not dummy (unless test environment)

**For CarePath-Bound forms:**
- [ ] All patient-specific validations pass
- [ ] behandelplan_id is valid UUID (if required)
- [ ] behandeloptie_id is valid UUID (if required)
- [ ] Behandelplan belongs to specified patient
- [ ] Behandeloptie belongs to specified behandelplan
- [ ] Case exists and is active (if case_id provided)

**For Informed Consent specifically:**
- [ ] All CarePath-Bound validations pass
- [ ] behandelplan_id is MANDATORY
- [ ] behandeloptie_id is MANDATORY
- [ ] Behandeloptie has type = 'implant' or similar
- [ ] Budget exists for behandelplan (for cost disclosure)
- [ ] No previous signed consent for same behandeloptie (prevent duplicates)

---

## APPENDIX A: Context Resolution Algorithm

```typescript
function resolveFormContext(
  formId: string,
  providedContext: Partial<FormContext>
): FormContext {
  const config = FORM_CONFIGS[formId];

  // Start with provided context
  const context: FormContext = { ...providedContext };

  // If patient_id provided, auto-resolve related IDs
  if (context.patient_id) {
    // Find active case for patient (if any)
    if (!context.case_id) {
      const activeCase = await findActiveCase(context.patient_id);
      if (activeCase) {
        context.case_id = activeCase.id;
      }
    }

    // Find active behandelplan for patient (if any)
    if (!context.behandelplan_id && context.case_id) {
      const activeBehandelplan = await findActiveBehandelplan(
        context.patient_id,
        context.case_id
      );
      if (activeBehandelplan) {
        context.behandelplan_id = activeBehandelplan.id;
      }
    }

    // Find active zorgplan for patient (if any)
    if (!context.zorgplan_id) {
      const activeZorgplan = await findActiveZorgplan(context.patient_id);
      if (activeZorgplan) {
        context.zorgplan_id = activeZorgplan.id;
      }
    }
  }

  return context;
}
```

---

## APPENDIX B: Template Variable Mapping

### Available Variables by Context

#### Generic Context
**Available:** None (no patient or care path data)

#### Patient-Specific Context
**Available:** Patient variables only

| Variable | Source | Example Value |
|----------|--------|---------------|
| {{patient_naam}} | patients.naam | "Jan de Vries" |
| {{patient_geboortedatum}} | patients.geboortedatum | "1985-03-15" |
| {{patient_leeftijd}} | Calculated | "39 jaar" |
| {{patient_bsn}} | patients.bsn | "123456789" |
| {{patient_email}} | patients.email | "jan@example.nl" |
| {{patient_telefoon}} | patients.telefoon | "0612345678" |

#### CarePath-Bound Context
**Available:** Patient + Care Path variables

| Variable | Source | Example Value |
|----------|--------|---------------|
| All patient variables | See above | - |
| {{case_code}} | cases.case_code | "CASE-2024-123" |
| {{behandelplan_titel}} | behandelplannen.titel | "Volledige Rehabilitatie Boven" |
| {{behandelplan_zorgtype}} | behandelplannen.zorgtype | "verwezen_patient_integraal" |
| {{behandeloptie_naam}} | behandelopties.naam | "All-on-4 Bovenkaak" |
| {{aantal_implantaten}} | From behandeloptie metadata | "4" |
| {{budget_totaal}} | begrotingen_v2.totaal_bedrag | "€ 15.250,00" |
| {{budget_honorarium}} | Calculated from budget | "€ 8.500,00" |

---

**END OF DOCUMENT**

**Form Context Mappings:** 3 forms defined
**Context Types:** 3 types documented
**Validation Rules:** Comprehensive coverage
**Implementation Examples:** Complete

**Quality Assurance:**
- ✅ All forms from FORM_DEFINITION_SCHEMA.md covered
- ✅ Context types clearly defined
- ✅ Dummy patient rules comprehensive
- ✅ Database schema documented
- ✅ Validation rules complete
- ✅ Implementation examples provided
- ✅ Legal requirements (WGBO) addressed
