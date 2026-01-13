# HQ DOCUMENTS - QUICK TEST GUIDE 🚀

## ✅ WHAT WAS FIXED

**Problem**: Upload worked, but UI showed 0 documents (RLS blocking view queries)

**Solution**: Created SECURITY DEFINER RPC that bypasses RLS safely

---

## 🔥 QUICK TEST (5 minutes)

### 1. Test the RPC in SQL Editor (30 seconds)

Go to Supabase SQL Editor and run:

```sql
-- Get any employee_id from your system
SELECT id, voornaam, achternaam
FROM hq.employees
LIMIT 5;

-- Test RPC with one of those employee_id values
SELECT *
FROM public.hq_list_employee_documents('PASTE_EMPLOYEE_ID_HERE');
```

**Expected**: Array of documents with `category_code`, `category_label`, etc.

---

### 2. Test Upload in UI (2 minutes)

1. Open app → Navigate to HQ → Employees
2. Click any employee → "Documenten" tab
3. Click "Document Toevoegen"
4. Fill form:
   - Category: e.g., "Contract"
   - Title: "Test Document"
   - Upload any PDF
5. Click "Upload"

**Expected Console Logs**:
```
✅ [loadDocuments] 🔍 Using RPC: hq_list_employee_documents
✅ [loadDocuments] ✅ Result count: 1
✅ [loadDocuments] 📊 Documents set in state: 1
```

**Expected Network Tab**:
```
POST .../rest/v1/rpc/hq_list_employee_documents
Status: 200 OK
```

**Expected UI**:
- "Alle" tab shows count > 0
- Document card appears immediately
- Category badge displays correct label

---

### 3. Verify No Errors (10 seconds)

**Console should NOT show**:
- ❌ `404 Not Found`
- ❌ `documents_with_employee`
- ❌ `result count: 0` (when documents exist)

**Console SHOULD show**:
- ✅ `Using RPC: hq_list_employee_documents`
- ✅ `Result count: X` (X > 0)
- ✅ Sample document object

---

## 🐛 IF IT STILL DOESN'T WORK

### A) Check if RPC exists
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'hq_list_employee_documents';
```
**Expected**: 1 row with `routine_type = FUNCTION`

### B) Check if document was inserted
```sql
SELECT id, employee_id, titel, created_at
FROM hq.documents
ORDER BY created_at DESC
LIMIT 5;
```
**Expected**: Your uploaded document appears

### C) Test RPC manually with real IDs
```sql
-- Get document_id from B above
-- Get employee_id from B above
SELECT *
FROM public.hq_list_employee_documents('EMPLOYEE_ID_FROM_QUERY_B');
```
**Expected**: Your document appears in results

### D) Check RPC permissions
```sql
SELECT has_function_privilege('authenticated', 'public.hq_list_employee_documents(uuid)', 'EXECUTE');
```
**Expected**: `true`

---

## 📊 WHAT TO TELL ME

If it still doesn't work, send me:

1. **Console logs** (especially lines with `[loadDocuments]`)
2. **Network tab** (screenshot of RPC call + response)
3. **Results from diagnostic queries** (A, B, C above)
4. **Error messages** (if any)

---

## 🎯 SUCCESS CHECKLIST

After upload, you should see:

- ✅ Console: "Result count: 1" (or higher)
- ✅ Network: POST to `hq_list_employee_documents` with 200 OK
- ✅ UI: Document appears in "Alle" tab
- ✅ UI: Category badge shows correct label
- ✅ UI: Can filter by category
- ✅ UI: Can download/view document

---

**Migration**: `20251215183000_create_hq_list_employee_documents_rpc.sql`
**Frontend**: `src/components/HQDocumentsTab.tsx` (line 91-92)
**Status**: ✅ Ready to test
