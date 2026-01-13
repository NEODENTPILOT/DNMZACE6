# CRASH FIX REPORT - December 22, 2024

## 🔴 CRITICAL ISSUES FIXED

### 1. ✅ Procedures Table Column Name Mismatch
**Error:** `column procedures.procedure_categorie_id does not exist`

**Root Cause:**
- Code referenced `procedure_categorie_id` but actual column is `categorie_id`
- Migration `20251201001815_cleanup_upt_code_sets_categorie_column.sql` renamed the column

**Fix Applied:**
- **File:** `src/components/AICompleteDocumentSetModal.tsx:92`
- Changed: `procedure_categorie_id` → `categorie_id`

---

### 2. ✅ Document Store Type Constraint Missing Values
**Error:** `new row for relation "document_store" violates check constraint "document_store_document_type_check"`

**Root Cause:**
- Constraint only allowed: KlinischeNote, Consent, Verwijsbrief, Verslag, Recept, Formulier, AITekst
- Missing: **Verklaring**, **Overig**

**Fix Applied:**
- **Migration:** `20251222000001_fix_document_store_type_constraint.sql`
- Updated constraint to include all 9 document types from `document_types` table

**Valid document_type values NOW:**
```
'KlinischeNote', 'Consent', 'Verwijsbrief', 'Verslag',
'Verklaring', 'Recept', 'Formulier', 'AITekst', 'Overig'
```

---

### 3. ✅ Templates Doel Constraint Missing Values
**Error:** AI Template Maker crash - `Fout bij genereren template`

**Root Cause:**
- `templates.doel` constraint missing: **Verslag**, **PatiëntenInformatie**, **Recept**
- AI Template Maker dropdown included these options but constraint rejected them

**Fix Applied:**
- **Migration:** `20251222000002_fix_templates_doel_constraint.sql`
- Updated constraint to align with `document_format` constraint

**Valid doel values NOW:**
```
'KlinischeNote', 'Verwijsbrief', 'Verslag', 'Behandelplan',
'InformedConsent', 'PatiëntenInformatie', 'Recept',
'Intake', 'Nazorg', 'Overig'
```

---

### 4. ✅ Duplicate Reference Number Generation
**Error:** `duplicate key value violates unique constraint "document_store_referentie_nummer_key"`

**Root Cause:**
- `documentHelpers.ts` set `referentie_nummer: ''` (empty string)
- Multiple documents created simultaneously would all get empty string → constraint violation

**Fix Applied:**
- **File:** `src/utils/documentHelpers.ts:20-22`
- Now generates unique reference numbers: `DOC-{timestamp}-{random}`
- Pattern: `DOC-LX8K3M2-AB4F` (timestamp in base36 + 4 random chars)

---

## 🎯 VERIFICATION

### Build Status
```bash
✅ npm run build - SUCCESS
✅ No TypeScript errors
✅ No compilation errors
```

### Database Constraints
```sql
✅ document_store.document_type - 9 valid types
✅ templates.doel - 10 valid types
✅ templates.document_format - 8 valid types
```

### Code References
```
✅ AICompleteDocumentSetModal - uses correct column name
✅ documentHelpers - generates unique references
✅ All document type mappings aligned
```

---

## 📊 IMPACT SUMMARY

| Issue | Affected Feature | Severity | Status |
|-------|-----------------|----------|--------|
| procedure_categorie_id | AI Document Sets | 🔴 Critical | ✅ FIXED |
| document_type constraint | Document Creation (Verklaring, Overig) | 🔴 Critical | ✅ FIXED |
| templates doel constraint | AI Template Maker | 🔴 Critical | ✅ FIXED |
| referentie_nummer duplicates | Document Creation (bulk) | 🟡 High | ✅ FIXED |

---

## 🔍 ROOT CAUSE ANALYSIS

**Pattern Identified:**
Database schema evolved but frontend code/constraints not synchronized:
1. Column renamed but code not updated
2. New document types added to UI but not to constraints
3. Empty string defaults caused unique constraint violations

**Prevention:**
- Add migration checklist to verify constraint updates when adding new enum values
- Synchronize frontend dropdowns with database constraints
- Use generated unique IDs instead of empty string defaults

---

## ✅ NEXT STEPS

1. **Test AI Template Maker** - verify all document types work
2. **Test Document Creation** - create Verklaring and Overig documents
3. **Test Bulk Document Creation** - verify no duplicate reference numbers
4. **Monitor Errors** - check diagnostics panel for any remaining issues

---

## 📝 FILES MODIFIED

### Source Code
- `src/components/AICompleteDocumentSetModal.tsx` (line 92)
- `src/utils/documentHelpers.ts` (lines 13-41)

### Database Migrations
- `20251222000001_fix_document_store_type_constraint.sql` ✅ Applied
- `20251222000002_fix_templates_doel_constraint.sql` ✅ Applied

---

**Status:** ALL CRITICAL CRASHES RESOLVED ✅
**Build:** Passing ✅
**Ready for Testing:** YES ✅
