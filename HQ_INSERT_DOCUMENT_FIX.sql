/*
  # FIX: hq_insert_document RPC - Correcte Nederlandse Kolomnamen
  
  Problem: RPC gebruikt Engelse kolomnamen die niet bestaan in database
  Solution: Rewrite met correcte Nederlandse kolomnamen uit hq.documents
  
  Changes:
  - title → titel
  - description → omschrijving
  - is_confidential → vertrouwelijk
  - visible_to_employee → zichtbaar_voor_medewerker
  - created_by → geupload_door
  - mime_type → file_type
  - Remove storage_path (doesn't exist in table)
*/

-- Drop broken function
DROP FUNCTION IF EXISTS public.hq_insert_document(uuid,text,text,text,text,text,text,date,boolean,boolean,text,bigint,uuid);

-- Create corrected function
CREATE OR REPLACE FUNCTION public.hq_insert_document(
  p_employee_id uuid,
  p_category text,
  p_titel text,
  p_file_url text,
  p_file_type text,
  p_omschrijving text DEFAULT NULL,
  p_valid_until date DEFAULT NULL,
  p_vertrouwelijk boolean DEFAULT false,
  p_zichtbaar_voor_medewerker boolean DEFAULT true,
  p_file_naam text DEFAULT NULL,
  p_file_size_bytes integer DEFAULT NULL,
  p_document_category_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_geupload_door uuid;
BEGIN
  -- Get current user ID
  v_geupload_door := auth.uid();
  
  -- Validate required fields
  IF p_employee_id IS NULL THEN
    RAISE EXCEPTION 'employee_id is required';
  END IF;
  
  IF p_category IS NULL OR p_category = '' THEN
    RAISE EXCEPTION 'category is required';
  END IF;
  
  IF p_titel IS NULL OR p_titel = '' THEN
    RAISE EXCEPTION 'titel is required';
  END IF;
  
  IF p_file_url IS NULL OR p_file_url = '' THEN
    RAISE EXCEPTION 'file_url is required';
  END IF;

  -- Insert into hq.documents with CORRECT Dutch column names
  INSERT INTO hq.documents (
    employee_id,
    category,
    titel,
    omschrijving,
    file_url,
    file_naam,
    file_type,
    file_size_bytes,
    valid_until,
    vertrouwelijk,
    zichtbaar_voor_medewerker,
    document_category_id,
    status,
    geupload_door,
    created_at,
    updated_at
  )
  VALUES (
    p_employee_id,
    p_category,
    p_titel,
    p_omschrijving,
    p_file_url,
    p_file_naam,
    p_file_type,
    p_file_size_bytes,
    p_valid_until,
    p_vertrouwelijk,
    p_zichtbaar_voor_medewerker,
    p_document_category_id,
    'actief',
    v_geupload_door,
    now(),
    now()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.hq_insert_document(uuid,text,text,text,text,text,date,boolean,boolean,text,integer,uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.hq_insert_document IS 'Insert document metadata into hq.documents using CORRECT Dutch column names. Security definer for cross-schema inserts.';
