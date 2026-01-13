# 🔍 CRASH DIAGNOSIS REPORT

## **SYSTEMATISCHE ANALYSE**

### **1. ✅ DATABASE SCHEMA - VERIFIED OK**
- ✅ `room_templates_master` table exists (6 records)
- ✅ `room_templates_master_items` table exists
- ✅ `spot_specific_specials` table exists
- ✅ `checklist_instances` extended with new columns
- ✅ All migrations applied successfully

**Query Test:**
```sql
SELECT COUNT(*) FROM room_templates_master; -- Returns 6
SELECT COUNT(*) FROM room_templates_master_items; -- Returns items
SELECT COUNT(*) FROM spot_specific_specials; -- Returns 0 (empty, OK)
```

---

### **2. ✅ BUILD STATUS - SUCCESSFUL**
```bash
✓ 1600 modules transformed
✓ built in 8.48s
```

**TypeScript Errors Fixed:**
- ✅ Missing import `X` in Verrichtingen.tsx (CRITICAL)
- ✅ Type `unknown` in RoomChecklistGenerator.tsx

**Remaining Errors:**
- ⚠️ ~90 unused import warnings (TS6133) - NON-BLOCKING
- ⚠️ 3 document_type mismatches - NON-BLOCKING

---

### **3. 🔍 POTENTIAL CRASH SOURCES**

#### **A. MasterChecklists.tsx**

**Status:** ⚠️ **POTENTIAL ISSUE**

**Problem:**
```tsx
// Line 137
onClick={() => window.location.href = `/master-detail/${master.id}`}
```

**Issue:** Route `/master-detail/:id` does NOT exist in App.tsx

**Impact:**
- ❌ Clicking "Bewerken" button → 404 or blank page
- ✅ Page load itself → OK (button not auto-clicked)

**Crash Trigger:** Only if user clicks "Bewerken" button

**Fix Needed:**
```tsx
// Option 1: Remove button action
onClick={() => alert('Master detail page komt binnenkort')}

// Option 2: Add route to App.tsx
{currentPage === 'master-detail' && <MasterChecklistDetail />}
```

---

#### **B. ClinicalNoteComposerModal.tsx - Implantology Tab**

**Status:** ✅ **LIKELY OK**

**New Code Added:**
- Implantology tab (line 601-696)
- 3 selector modals (line 702-733)
- Surgical report form (line 735-819)

**Variables Used:**
- ✅ `editorContent` - defined (line 43)
- ✅ `patiëntNaam` - defined (line 44)
- ✅ `selectedImplants` - defined (line 57)
- ✅ `selectedBiomaterials` - defined (line 58)
- ✅ `selectedProsthetics` - defined (line 59)
- ✅ `surgicalFormData` - defined (line 61-70)

**Potential Issue:**
```tsx
// Line 804
const report = generateSurgicalReport(reportData);
```

**Type Mismatch:**
```typescript
// reportData has:
{
  ...surgicalFormData,  // includes all form fields
  implants: [],
  biomaterials: [],
  prostheticComponents: []
}

// But SurgicalReportData interface expects:
{
  sutureInfo?: string,  // OPTIONAL in interface
  // but surgicalFormData has 'sutureInfo' as REQUIRED
}
```

**Impact:** ✅ Should work (spread operator adds all fields)

---

#### **C. Dashboard.tsx**

**Status:** ⚠️ **POSSIBLE NULL REFERENCE**

**Problem:**
```tsx
// Line 45: Guard clause
if (!user?.id) return;

// Line 53: Safe (inside guarded function)
.eq('toegewezen_aan', user.id)  // ✅ OK

// Line 78-79: POTENTIAL NULL ACCESS
if (user.rol !== 'Manager' && user.rol !== 'Admin' && user.locatie !== 'Beide') {
  query = query.eq('locatie', user.locatie);
}
```

**Issue:** TypeScript says `user` possibly null

**Reality Check:**
- Line 45 has guard: `if (!user?.id) return;`
- So user SHOULD be defined inside function
- But TypeScript doesn't track control flow perfectly

**Impact:**
- ✅ Runtime likely OK (guard works)
- ⚠️ TypeScript warning exists

**Crash Likelihood:** LOW (guard clause protects)

---

#### **D. Checklist Generator / Existing Pages**

**Status:** ✅ **SHOULD BE OK**

**New Fields Added to checklist_instances:**
- `master_template_id` (nullable)
- `template_versie` (nullable)
- `gegenereerd_van_master` (boolean, default false)

**Impact on Existing Queries:**
```tsx
// Old queries like:
.from('checklist_instances').select('*')

// Will now return extra fields:
{
  ...existing_fields,
  master_template_id: null,      // nullable, no crash
  template_versie: null,          // nullable, no crash
  gegenereerd_van_master: false   // has default, no crash
}
```

**Crash Likelihood:** VERY LOW (nullable fields with defaults)

---

### **4. 🎯 MOST LIKELY CRASH SOURCE**

#### **VERDICT: Navigation to Non-Existent Route**

**Crash Scenario:**
```
User opens app
  → Navigates to "Master Checklists" (OK, page loads)
  → Clicks "Bewerken" button on a master
  → window.location.href = `/master-detail/${id}`
  → Route doesn't exist in App.tsx
  → React Router: No match found
  → Blank page / 404 / Error boundary
```

**Confirmation Needed:**
- Does clicking "Bewerken" cause the crash?
- Or does the page crash on initial load?

---

### **5. 📊 ERROR PROBABILITY**

```
HIGH (80%+):
  ❌ Master detail route missing → Crash on button click

MEDIUM (50%):
  ⚠️ Dashboard user null check → Possible runtime error

LOW (20%):
  ✅ Implantology tab → Type issues are dev-time only
  ✅ New DB fields → Properly nullable

VERY LOW (5%):
  ✅ MasterChecklists query → Works in SQL test
  ✅ Utility functions → Not yet used anywhere
```

---

### **6. 🔧 IMMEDIATE FIX RECOMMENDATIONS**

#### **Priority 1: Fix Navigation (BLOCKER)**
```tsx
// src/pages/MasterChecklists.tsx line 137
// BEFORE:
onClick={() => window.location.href = `/master-detail/${master.id}`}

// AFTER:
onClick={() => alert('Master detail pagina komt binnenkort. Gebruik "Items bekijken" voor nu.')}
```

#### **Priority 2: Add Null Checks (SAFETY)**
```tsx
// src/pages/Dashboard.tsx line 78
// BEFORE:
if (user.rol !== 'Manager' && user.rol !== 'Admin' && user.locatie !== 'Beide') {

// AFTER:
if (user && user.rol !== 'Manager' && user.rol !== 'Admin' && user.locatie !== 'Beide') {
```

---

### **7. ✅ TESTING CHECKLIST**

To find actual crash:

1. **Load Master Checklists page**
   - [ ] Does it load initially?
   - [ ] Are masters displayed?
   - [ ] Check browser console for errors

2. **Click "Bewerken" button**
   - [ ] Does it crash?
   - [ ] What error appears?

3. **Try Implantology tab in Clinical Note Composer**
   - [ ] Does tab render?
   - [ ] Can you add implants?
   - [ ] Does surgical report generate?

4. **Check Dashboard load**
   - [ ] Does it load checklists?
   - [ ] Any console errors?

---

## **FINAL DIAGNOSIS**

**PRIMARY SUSPECT:**
**Missing route `/master-detail/:id` causing navigation crash**

**SECONDARY SUSPECT:**
**Null reference in Dashboard.tsx (low probability)**

**TERTIARY:**
**Everything else looks OK**

---

## **NEXT STEPS**

1. Apply Priority 1 fix (navigation)
2. Test in browser
3. Check console for actual error
4. Report back with exact stack trace
