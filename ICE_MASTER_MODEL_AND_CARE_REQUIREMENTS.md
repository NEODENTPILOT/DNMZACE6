# ICE Master Model + Care Requirements Engine

## 📋 Overview

This document describes the **Master Model** and **Care Requirements Engine** - two critical systems that ensure:

1. **Master Model**: All new code uses only master tables (source of truth)
2. **Care Requirements Engine**: Every intervention is validated for safety, completeness, and readiness

**Last Updated**: 2025-12-11
**Status**: ✅ Production Ready

---

## 🎯 Master Model: Source of Truth

### Purpose

The Master Model establishes a **single source of truth** for all data operations. It prevents accidental use of legacy/deprecated tables and ensures data consistency across the entire application.

### Master Tables (✅ USE THESE)

#### **Patients**
- **Table**: `patients`
- **Purpose**: Patient master data
- **Key Fields**: id, naam, email, geboortedatum, bsn, locatie_id

#### **Treatment Plans**
- **Table**: `behandelplannen`
- **Purpose**: Treatment plans for patients
- **Key Fields**: id, patient_id, titel, zorgtype, kaak_scope, status, template_id

#### **Interventions**
- **Table**: `interventies`
- **Purpose**: Individual treatment interventions
- **Key Fields**: id, behandelplan_id, behandeloptie_id, titel, element, kaak, surfaces

#### **Budgets V2** ⚠️ NOT begrotingen (v1)!
- **Tables**: `begrotingen_v2` + `begrotingen_v2_regels`
- **Purpose**: Treatment cost estimates and budget management
- **Key Fields**: id, behandelplan_id, patient_id, budget_naam, status, totaal_bedrag

#### **UPT Codes 2025** ⚠️ NOT upt_tarieven!
- **Tables**: `upt_tarief_2025` + `interventie_upt_codes`
- **Purpose**: Dutch dental procedure codes and tariffs
- **Key Fields**: upt_code, omschrijving, honorarium, mat_tec_bedrag

#### **Checklists**
- **Tables**: `checklist_master_templates` + `checklist_instances`
- **Purpose**: Procedural checklists and safety protocols
- **Key Fields**: id, naam, scope, status

#### **Inventory** ⚠️ NOT generic inventory!
- **Tables**:
  - `implants_inventory`
  - `biomaterials_inventory`
  - `prosthetic_components_inventory`
- **Purpose**: Material and implant tracking
- **Key Fields**: id, locatie_id, voorraad_aantal, prijs_per_stuk

#### **Medications** ⚠️ NOT medication_table!
- **Tables**: `medicatie_master` + `procedure_medications`
- **Purpose**: Medication database and prescriptions
- **Key Fields**: id, medicatie_naam, atc_code, dosering, timing

#### **Protocols**
- **Table**: `protocols`
- **Purpose**: Clinical protocols and procedures
- **Key Fields**: id, titel, categorie, versie, actief

#### **Rooms**
- **Table**: `rooms`
- **Purpose**: Treatment rooms and facilities
- **Key Fields**: id, naam, room_type, heeft_scanner, heeft_cbct

#### **Assets**
- **Table**: `assets`
- **Purpose**: Equipment and asset management
- **Key Fields**: id, naam, asset_type, status, qr_token

### Legacy Tables (❌ DO NOT USE)

| Legacy Table | Replacement | Reason |
|--------------|-------------|---------|
| `begrotingen` (v1) | `begrotingen_v2` | Outdated schema, missing NZa compliance fields |
| `begroting_items` | `begrotingen_v2_regels` | Old line item structure |
| `upt_tarieven` | `upt_tarief_2025` | Outdated tariff year |
| `inventory` (generic) | Specific inventory tables | Lacks proper categorization |
| `medication_table` | `medicatie_master` | Incomplete medication data |

### Implementation

#### Type Definitions

All master tables have TypeScript types defined in:
```typescript
// src/domain/masterSchema.ts
export interface Patient { /* ... */ }
export interface Behandelplan { /* ... */ }
export interface BudgetV2 { /* ... */ }
// etc.
```

#### Runtime Guards

```typescript
import { assertMasterTable, isValidUUID } from '../domain/masterSchema';

// Throws error if table is legacy
assertMasterTable('begrotingen_v2'); // ✅ OK
assertMasterTable('begrotingen');    // ❌ Throws error

// UUID validation
isValidUUID('123');                   // false
isValidUUID('550e8400-e29b-41d4-a716-446655440000'); // true
```

#### Master Data Service

Centralized service for accessing master tables:

```typescript
import {
  getPatients,
  getActiveTreatmentPlans,
  getBudgetsV2ForBehandelplan,
  getInterventionUPTCodes,
  searchUptCodes2025,
  // etc.
} from '../services/masterDataService';
```

---

## 🔧 Care Requirements Engine

### Purpose

The Care Requirements Engine ensures that every intervention has ALL necessary prerequisites before execution:

- ✅ Rooms and equipment available
- ✅ Checklists and protocols in place
- ✅ Materials and lab work arranged
- ✅ Medications and prophylaxis prescribed
- ✅ Informed consent obtained
- ✅ Insurance authorization secured
- ✅ Staff with proper competencies assigned
- ✅ Post-operative care planned

### Architecture

#### Database Tables

**`care_requirements`**
- One record per intervention
- Contains all requirement flags and IDs
- Auto-created for new interventions (if template exists)

**`care_requirement_templates`**
- Reusable templates linked to behandelopties
- Default values for common intervention types
- Speeds up care requirement setup

#### Domain Types

```typescript
// src/domain/careRequirements.ts

export interface CareRequirement {
  id: string;
  intervention_id: string;

  // Rooms & Equipment
  required_room_ids: string[];
  required_scanner: boolean;
  required_cbct: boolean;

  // Checklists & Protocols
  required_checklist_template_ids: string[];
  required_protocol_ids: string[];

  // Materials & Lab Work
  required_biomaterial_ids: string[];
  required_implant_ids: string[];
  requires_lab_work: boolean;
  lab_work_types: LabWorkType[];

  // Medications
  required_medication_ids: string[];
  antibiotic_prophylaxis_needed: boolean;

  // Consent & Authorization
  requires_informed_consent: boolean;
  requires_insurance_authorization: boolean;
  authorization_type?: AuthorizationType;

  // Staff & Competencies
  required_staff_roles: StaffRole[];
  required_competencies: StaffCompetency[];

  // Risk & Post-Op
  is_high_risk_procedure: boolean;
  requires_postop_control: boolean;
  // ... etc.
}
```

#### Validation System

The validation system checks intervention readiness and returns detailed issues:

```typescript
import {
  validateInterventionReadiness,
  getCareRequirementsSummary,
} from '../services/careRequirementsService';

const validation = await validateInterventionReadiness(interventionId);

// validation contains:
// - is_ready: boolean
// - readiness_percentage: number (0-100)
// - issues: ValidationIssue[]
// - missing_requirements: string[]
```

**Validation Categories:**
1. **Room**: Room selection and availability
2. **Equipment**: Scanner, CBCT, other equipment
3. **Protocols**: Checklists and protocols linked
4. **Materials**: Implants, biomaterials, prosthetic components
5. **Lab Work**: Technical work types specified
6. **Medications**: Prescriptions and prophylaxis
7. **Consent**: Informed consent templates
8. **Authorization**: Insurance authorization
9. **Staff**: Roles and competencies
10. **Post-Op**: Post-operative care planning

**Issue Severity Levels:**
- **Error** (🔴): Blocks intervention execution
- **Warning** (🟡): Should be addressed but not blocking
- **Info** (🔵): Suggestions for improvement

### Usage in Code

#### 1. Get Care Requirements

```typescript
import { getCareRequirementsForIntervention } from '../services/careRequirementsService';

const careReq = await getCareRequirementsForIntervention(interventionId);
```

#### 2. Ensure Care Requirements Exist

```typescript
import { ensureCareRequirementsExistForIntervention } from '../services/careRequirementsService';

// Creates default care requirements if none exist
const careReq = await ensureCareRequirementsExistForIntervention(interventionId);
```

#### 3. Update Care Requirements

```typescript
import { updateCareRequirements } from '../services/careRequirementsService';

await updateCareRequirements(careReq.id, {
  required_scanner: true,
  required_cbct: false,
  antibiotic_prophylaxis_needed: true,
  requires_informed_consent: true,
});
```

#### 4. Validate Readiness

```typescript
import { validateInterventionReadiness } from '../services/careRequirementsService';

const validation = await validateInterventionReadiness(interventionId);

if (validation.is_ready) {
  console.log('✅ Ready for execution');
} else {
  console.log(`⚠️ ${validation.issues.length} issues found`);
  validation.issues.forEach(issue => {
    console.log(`${issue.severity}: ${issue.message}`);
  });
}
```

#### 5. Get Summary (Lightweight)

```typescript
import { getCareRequirementsSummary } from '../services/careRequirementsService';

const summary = await getCareRequirementsSummary(interventionId);

// summary contains:
// - readiness_percentage
// - critical_issues_count
// - warnings_count
// - is_ready
```

### UI Integration

#### Care Requirements Panel Component

```tsx
import CareRequirementsPanel from '../components/CareRequirementsPanel';

<CareRequirementsPanel
  interventionId={intervention.id}
  interventionTitle={intervention.titel}
  onClose={() => setShowPanel(false)}
/>
```

**Features:**
- Real-time validation
- Expandable categories
- Issue highlighting
- Readiness percentage bar
- Quick toggles for common requirements
- Auto-save on changes

#### Integration Points

1. **Care Hub** (Patient Care Hub)
   - Show readiness badge per intervention
   - Click to open Care Requirements Panel
   - Warn before execution if not ready

2. **ICE Workflows**
   - Validate workflow prerequisites
   - Show required materials list
   - Warn about missing staff competencies

3. **Begrotingen 3.0** (Budget System)
   - Link care requirements to budget items
   - Show material costs
   - Include lab work costs

4. **Treatment Planning**
   - Auto-generate care requirements from templates
   - Copy care requirements when duplicating interventions
   - Validate before scheduling

---

## 📊 Diagrams

### Master Model Relationships

```
patients
  ↓
behandelplannen
  ↓
interventies
  ↓
├─ interventie_upt_codes → upt_tarief_2025
├─ care_requirements
│    ├─ rooms
│    ├─ checklist_master_templates
│    ├─ protocols
│    ├─ implants_inventory
│    ├─ biomaterials_inventory
│    ├─ prosthetic_components_inventory
│    └─ medicatie_master
└─ begrotingen_v2
     └─ begrotingen_v2_regels
```

### Care Requirements Validation Flow

```
1. User opens intervention
   ↓
2. Load care_requirements for intervention
   ↓
3. If none exist → create default
   ↓
4. Run validation checks:
   - Room requirements
   - Equipment requirements
   - Protocols & checklists
   - Materials & lab work
   - Medications
   - Consent & authorization
   - Staff & competencies
   - Post-op care
   ↓
5. Calculate readiness percentage
   ↓
6. Display issues grouped by category
   ↓
7. User addresses issues
   ↓
8. Re-validate on save
   ↓
9. When ready → allow execution
```

---

## 🚀 Getting Started

### For Developers

1. **Always use Master Data Service**
   ```typescript
   // ✅ GOOD
   import { getPatients } from '../services/masterDataService';
   const patients = await getPatients();

   // ❌ BAD
   const { data } = await supabase.from('patients').select('*');
   ```

2. **Use Type Guards**
   ```typescript
   import { assertMasterTable, isValidUUID } from '../domain/masterSchema';

   assertMasterTable('begrotingen_v2'); // Validate at runtime
   if (isValidUUID(patientId)) { /* ... */ }
   ```

3. **Leverage Care Requirements**
   ```typescript
   // Check if intervention is ready
   const validation = await validateInterventionReadiness(interventionId);

   if (!validation.is_ready) {
     // Show warnings before proceeding
     alert(`⚠️ ${validation.issues.length} issues found`);
   }
   ```

### For UI Components

1. **Show Readiness Badge**
   ```tsx
   const summary = await getCareRequirementsSummary(interventionId);

   return (
     <div className={summary.is_ready ? 'text-green-600' : 'text-red-600'}>
       {summary.is_ready ? '✅ Klaar' : '⚠️ Ontbrekend'}
       <span className="text-sm">({summary.readiness_percentage}%)</span>
     </div>
   );
   ```

2. **Open Care Panel**
   ```tsx
   <button onClick={() => setShowCarePanel(true)}>
     Care Requirements
   </button>

   {showCarePanel && (
     <CareRequirementsPanel
       interventionId={intervention.id}
       interventionTitle={intervention.titel}
       onClose={() => setShowCarePanel(false)}
     />
   )}
   ```

---

## 🔐 Security & Data Integrity

### Row Level Security (RLS)

All master tables and care_requirements tables have RLS enabled with location-based policies:

```sql
-- Users can only see data from their locations
CREATE POLICY "Users can view care requirements at their location"
  ON care_requirements FOR SELECT
  TO authenticated
  USING (
    locatie_id IN (
      SELECT locatie_id FROM user_praktijk_locaties WHERE user_id = auth.uid()
    )
    OR locatie_id IS NULL
  );
```

### Data Validation

- **UUID Validation**: All foreign keys validated before insert
- **Master Table Enforcement**: Runtime guards prevent legacy table access
- **Type Safety**: TypeScript types for all master tables
- **Required Fields**: Database constraints for critical fields

---

## 📈 Future Enhancements

1. **Auto-scheduling**
   - Automatically find available rooms based on care requirements
   - Schedule staff with required competencies

2. **Material Reservation**
   - Reserve implants/biomaterials when intervention scheduled
   - Alert when stock is low

3. **Workflow Templates**
   - Pre-built care requirement templates for common workflows
   - One-click setup for standard procedures

4. **Compliance Reporting**
   - Track percentage of interventions with complete care requirements
   - Report on missing informed consents
   - Audit trail for high-risk procedures

5. **Integration with External Systems**
   - Auto-request insurance authorization
   - Order lab work directly from care requirements
   - Sync with practice management system

---

## 📞 Support

For questions or issues:
- See code comments in `src/domain/masterSchema.ts`
- See code comments in `src/domain/careRequirements.ts`
- Review service implementations in `src/services/`
- Check UI component: `src/components/CareRequirementsPanel.tsx`

**Last Updated**: 2025-12-11
**Version**: 1.0.0
**Status**: ✅ Production Ready
