-- ============================================================
-- HQ DOCUMENTS DIAGNOSTIC - RUN THESE NOW
-- ============================================================

-- ============================================================
-- A) Verify row exists in hq.documents
-- REPLACE with actual document_id from upload console log
-- ============================================================
SELECT
  id,
  employee_id,
  category_id,
  document_type,
  titel,
  file_url,
  created_at,
  updated_at,
  is_archived,
  deleted_at,
  status,
  zichtbaar_voor_medewerker,
  vertrouwelijk
FROM hq.documents
WHERE id = 'b94be3cd-a200-45a8-a76a-b49b51079866'  -- REPLACE with your document_id
ORDER BY created_at DESC;

-- ============================================================
-- B) Verify view returns it (server-side, bypasses client RLS)
-- REPLACE with actual employee_id from upload
-- ============================================================
SELECT
  id,
  employee_id,
  category_code,
  category_label,
  titel,
  file_url,
  created_at,
  visible_to_employee,
  vertrouwelijk,
  status
FROM public.hq_employee_documents_view
WHERE employee_id = '6107d3e6-1769-4fb6-ae6a-57edd2be2226'  -- REPLACE with your employee_id
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================
-- C) Check if view definition has unexpected filters
-- ============================================================
SELECT pg_get_viewdef('public.hq_employee_documents_view'::regclass, true);

-- ============================================================
-- D) Check RLS policies on hq.documents
-- ============================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'hq'
  AND tablename = 'documents'
ORDER BY policyname;

-- ============================================================
-- E) Check if RLS is enabled on hq.documents
-- ============================================================
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'hq'
  AND tablename = 'documents';

-- ============================================================
-- F) List all documents (ignore filters) - check data exists
-- ============================================================
SELECT
  id,
  employee_id,
  category_id,
  titel,
  created_at,
  is_archived,
  deleted_at
FROM hq.documents
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================
-- G) Check if category_id FK is valid
-- ============================================================
SELECT
  d.id,
  d.category_id,
  dc.code as category_code,
  dc.label as category_label,
  CASE
    WHEN d.category_id IS NOT NULL AND dc.id IS NULL THEN '❌ ORPHANED FK'
    WHEN d.category_id IS NULL THEN '⚠️ NULL category_id'
    ELSE '✅ Valid FK'
  END as fk_status
FROM hq.documents d
LEFT JOIN hq.document_categories dc ON d.category_id = dc.id
ORDER BY d.created_at DESC
LIMIT 10;

-- ============================================================
-- H) Check if employee_id FK is valid
-- ============================================================
SELECT
  d.id,
  d.employee_id,
  e.voornaam,
  e.achternaam,
  CASE
    WHEN d.employee_id IS NOT NULL AND e.id IS NULL THEN '❌ ORPHANED FK'
    WHEN d.employee_id IS NULL THEN '⚠️ NULL employee_id'
    ELSE '✅ Valid FK'
  END as fk_status
FROM hq.documents d
LEFT JOIN hq.employees e ON d.employee_id = e.id
ORDER BY d.created_at DESC
LIMIT 10;

-- ============================================================
-- INTERPRETATION GUIDE
-- ============================================================
-- Query A returns row, Query B returns 0:
--   → View definition problem OR RLS blocking view access
--   → FIX: Create SECURITY DEFINER RPC (see migration below)
--
-- Query A returns 0:
--   → RPC not inserting OR inserting to wrong schema
--   → Check hq_insert_document RPC code
--
-- Query D shows restrictive policies:
--   → RLS may be blocking authenticated users
--   → FIX: SECURITY DEFINER RPC bypasses RLS safely
--
-- Query G/H show orphaned FKs:
--   → category_id or employee_id invalid
--   → Check RPC parameter mapping
