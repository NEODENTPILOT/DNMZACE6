-- ============================================================
-- HQ DOCUMENTS FIX VERIFICATION
-- Execute these queries in Supabase SQL Editor to verify
-- ============================================================

-- ============================================================
-- A) DATABASE DIAGNOSTIC QUERIES
-- ============================================================

-- 1) Show last 20 documents in hq.documents
-- This proves documents are being inserted
SELECT
  id,
  employee_id,
  titel,
  category_id,
  created_at,
  status
FROM hq.documents
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================
-- 2) Check category FK integrity (join with categories)
-- This verifies category_id FK is working correctly
SELECT
  d.id,
  d.employee_id,
  d.titel,
  d.category_id,
  dc.code as category_code,
  dc.label as category_label,
  d.created_at
FROM hq.documents d
LEFT JOIN hq.document_categories dc ON dc.id = d.category_id
ORDER BY d.created_at DESC
LIMIT 20;

-- ============================================================
-- 3) List all public views containing 'doc' or 'employee'
-- This shows which views are available to the frontend
SELECT
  schemaname,
  viewname,
  CASE
    WHEN schemaname = 'public' THEN '✅ PUBLIC (accessible)'
    ELSE '⚠️ ' || schemaname || ' (not directly accessible)'
  END as access_status
FROM pg_views
WHERE schemaname IN ('public', 'hq')
  AND (viewname ILIKE '%doc%' OR viewname ILIKE '%employee%')
ORDER BY schemaname, viewname;

-- ============================================================
-- 4) Test the public.hq_employee_documents_view
-- Replace 'YOUR_EMPLOYEE_ID_HERE' with an actual employee_id from query 1
-- ============================================================

-- First, get a sample employee_id:
SELECT DISTINCT employee_id
FROM hq.documents
ORDER BY employee_id
LIMIT 5;

-- Then test the view with that employee_id:
-- REPLACE THE UUID BELOW WITH AN ACTUAL EMPLOYEE_ID FROM THE QUERY ABOVE
/*
SELECT
  id,
  employee_id,
  category_code,
  category_label,
  titel,
  created_at,
  status,
  visible_to_employee,
  vertrouwelijk
FROM public.hq_employee_documents_view
WHERE employee_id = 'YOUR_EMPLOYEE_ID_HERE'
ORDER BY created_at DESC
LIMIT 50;
*/

-- ============================================================
-- 5) Verify the view structure
-- This shows all columns available in the view
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'hq_employee_documents_view'
ORDER BY ordinal_position;

-- ============================================================
-- 6) Check RLS policies on the view
-- This verifies users have SELECT permission
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'hq_employee_documents_view';

-- ============================================================
-- 7) Count documents by category
-- This helps identify if documents are properly categorized
SELECT
  dc.label as category,
  dc.code,
  COUNT(d.id) as document_count
FROM hq.document_categories dc
LEFT JOIN hq.documents d ON d.category_id = dc.id
GROUP BY dc.id, dc.label, dc.code
ORDER BY document_count DESC;

-- ============================================================
-- EXPECTED RESULTS
-- ============================================================
-- Query 1: Should show recently uploaded documents with UUIDs
-- Query 2: Should show documents with category_code and category_label populated
-- Query 3: Should show "hq_employee_documents_view" in PUBLIC schema
-- Query 4: Should return rows matching the employee_id filter
-- Query 5: Should show columns like: id, category_code, category_label, visible_to_employee, etc.
-- Query 6: Should show RLS policies (or empty if security_invoker is used)
-- Query 7: Should show distribution of documents across categories
