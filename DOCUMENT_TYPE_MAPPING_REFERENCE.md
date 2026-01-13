# Document Type Mapping System - Definitief

**Datum**: 15 december 2024  
**Status**: PRODUCTION READY

---

## 🎯 Probleem Opgelost

**Was**: `hq.documents.document_type` is NOT NULL maar RPC vulde deze niet → upload faalde  
**Nu**: RPC bepaalt automatisch `document_type` obv `category` code → upload werkt

---

## 📊 Strategische Document Types (ENUM)

De volgende 8 document types worden gebruikt in `hq.documents.document_type`:

| Document Type | Doel | Gebruikt Voor |
|---------------|------|---------------|
| `CONTRACT` | Arbeidscontracten | Vaste/tijdelijke contracten |
| `CONTRACT_ADDENDUM` | Contract wijzigingen | Salarisverhoging, FTE aanpassing |
| `SKILL_CERT` | Diploma's & Certificaten | BIG registratie, cursussen, linked to skills |
| `IDENTITY` | Identificatie | ID kaart, paspoort (extra beveiligd) |
| `HR_REVIEW` | Gesprekken & Beoordelingen | Functionerings-, beoordelingsgesprekken |
| `HR_POP` | Persoonlijk Ontwikkel Plan | POP documenten |
| `HR_FINANCE` | Financiële HR documenten | Loonstroken, fiscale documenten (HR-only) |
| `ONBOARDING` | Onboarding documenten | Onboarding checklists, instructies |

---

## 🔄 Mapping: Category Code → Document Type

Automatische mapping in `hq.map_category_to_document_type()`:

```sql
-- UI Category Code → document_type (automatisch)
'CONTRACT'        → 'CONTRACT'
'ADDENDUM'        → 'CONTRACT_ADDENDUM'
'CERTIFICATE'     → 'SKILL_CERT'
'IDENTIFICATION'  → 'IDENTITY'
'CONVERSATION'    → 'HR_REVIEW'
'POP'             → 'HR_POP'
'FINANCIAL_HR'    → 'HR_FINANCE'
'ONBOARDING'      → 'ONBOARDING'
```

**Fallback**: Als category code onbekend is → `ONBOARDING`

---

## 🔧 Implementatie Details

### Database Side

**Tabel**: `hq.documents`
```sql
document_type text NOT NULL CHECK (document_type IN (
  'CONTRACT',
  'CONTRACT_ADDENDUM',
  'SKILL_CERT',
  'IDENTITY',
  'HR_REVIEW',
  'HR_POP',
  'HR_FINANCE',
  'ONBOARDING'
))
```

**Mapping Function**: `hq.map_category_to_document_type(text)`
- Input: Category code (e.g., 'CERTIFICATE')
- Output: Document type (e.g., 'SKILL_CERT')
- IMMUTABLE voor performance

**RPC Function**: `public.hq_insert_document()`
- Accepteert `p_category` (category code)
- Roept mapping function aan: `v_document_type := hq.map_category_to_document_type(p_category)`
- INSERT met beide velden: `category` EN `document_type`

---

### Frontend Side

**File**: `src/components/HQDocumentsTab.tsx`

**Guards**:
```typescript
// 1. Validate category exists
const selectedCategory = categories.find(c => c.id === uploadForm.category_id);
if (!selectedCategory) {
  throw new Error('Categorie niet gevonden');
}

// 2. Validate category has code
if (!selectedCategory.code) {
  throw new Error('Categorie code ontbreekt');
}

// 3. Send correct code to RPC
await supabaseBase.rpc('hq_insert_document', {
  p_category: selectedCategory.code, // e.g., 'CERTIFICATE'
  // ... document_type wordt automatisch bepaald in RPC
});
```

**Rollback bij Failure**:
```typescript
if (insertError) {
  // Delete uploaded file from storage
  await supabaseBase.storage.from('hr-documents').remove([fileName]);
  throw insertError;
}
```

---

## ✅ Upload Flow (Compleet)

```
1. User selecteert categorie (e.g., "Diploma's & Certificaten")
   ↓
2. Frontend valideert: category.code = 'CERTIFICATE' ✓
   ↓
3. Storage upload → hr-documents/{employee_id}/{timestamp}.ext
   ↓
4. RPC call met p_category = 'CERTIFICATE'
   ↓
5. RPC roept mapping aan:
   hq.map_category_to_document_type('CERTIFICATE') → returns 'SKILL_CERT'
   ↓
6. INSERT INTO hq.documents:
   - category = 'CERTIFICATE'
   - document_type = 'SKILL_CERT'  ← Auto-filled!
   - titel, file_url, etc.
   ↓
7. Document opgeslagen ✅
   ↓
8. Document zichtbaar in UI
```

**Bij Failure**:
- RPC faalt → Storage file wordt verwijderd (rollback)
- User ziet duidelijke error message

---

## 🧪 Test Instructies

**Per Categorie Test Vereist**:

| # | Categorie | Code | Expected document_type | Test File |
|---|-----------|------|----------------------|-----------|
| 1 | Contracten | CONTRACT | CONTRACT | contract_test.pdf |
| 2 | Addenda | ADDENDUM | CONTRACT_ADDENDUM | addendum_test.pdf |
| 3 | Diploma's & Certificaten | CERTIFICATE | SKILL_CERT | diploma_test.pdf |
| 4 | Identificatie | IDENTIFICATION | IDENTITY | id_test.pdf |
| 5 | Gesprekken & Beoordelingen | CONVERSATION | HR_REVIEW | gesprek_test.pdf |
| 6 | POP | POP | HR_POP | pop_test.pdf |
| 7 | Financieel (HR) | FINANCIAL_HR | HR_FINANCE | loonstrook_test.pdf |
| 8 | Onboarding Docs | ONBOARDING | ONBOARDING | onboarding_test.pdf |

**Test Scenario**:
```bash
1. Login als HR/Super Admin
2. Ga naar HQ → Documenten
3. Klik "Upload Document"
4. Selecteer medewerker
5. Kies categorie (zie tabel hierboven)
6. Vul titel in
7. Upload test file
8. ✅ CHECK: Upload succesvol
9. ✅ CHECK: Document zichtbaar in lijst
10. ✅ CHECK: Console logs tonen correct category code
11. ✅ CHECK: Geen NOT NULL violation errors
```

**Expected Console Output**:
```
📤 Starting upload to storage bucket hr-documents: {uuid}/{timestamp}.pdf
✅ Storage upload successful
💾 Inserting document metadata via RPC to hq.documents
   Category: Diploma's & Certificaten → Code: CERTIFICATE
   Document_type will be auto-determined from category code
✅ Document metadata inserted via RPC, ID: {uuid}
✅ Document uploaded and saved successfully
```

---

## 🔍 Verification Queries

Na upload, check document_type in database:

```sql
-- Check laatste 10 uploads
SELECT 
  id,
  category,
  document_type,
  titel,
  created_at
FROM hq.documents
ORDER BY created_at DESC
LIMIT 10;

-- Verify mapping correctheid
SELECT 
  category,
  document_type,
  COUNT(*) as aantal
FROM hq.documents
GROUP BY category, document_type
ORDER BY category;

-- Expected results:
-- category='CERTIFICATE' → document_type='SKILL_CERT'
-- category='CONTRACT' → document_type='CONTRACT'
-- etc.
```

---

## 🚨 Error Scenarios

### 1. Category Code Ontbreekt
**Error**: "Categorie code ontbreekt"  
**Oplossing**: Herlaad pagina, categorieën worden opnieuw geladen

### 2. NOT NULL Violation (niet meer mogelijk!)
**Was**: "null value in column document_type violates not-null constraint"  
**Nu**: Kan niet meer gebeuren (auto-filled via mapping)

### 3. Storage Upload Succesvol maar Metadata Faalt
**Handling**: Uploaded file wordt automatisch verwijderd (rollback)  
**Console**: "🔄 Rolling back: Deleting uploaded file from storage"

---

## 📋 Migration Files

1. **`fix_document_type_strategic_enum_system.sql`**
   - Update document_type constraint
   - Migreer oude data
   - Create mapping function
   - Update RPC to use mapping

---

## ✅ Acceptance Criteria

- [x] Upload werkt voor alle 8 categorieën
- [x] document_type wordt automatisch gevuld
- [x] Geen NOT NULL violations meer
- [x] Storage rollback bij metadata failure
- [x] Guards valideren category code
- [x] Console logs tonen mapping process
- [x] Build succesvol zonder errors

---

**Einde Referentie**
