/*
  # PHASE C: UPT Codes Consistency Fix

  This script converts all UPT codes from corrupt JSON string format to clean JSONB array format.

  ## What it fixes:
  - Strings like "({\"code\":\"C003\",\"aantal\":1}, {\"code\":\"E60\",\"aantal\":1})"
  - Converts to clean JSONB: [{"code":"C003","aantal":1}, {"code":"E60","aantal":1}]

  ## Tables affected:
  1. interventie_template_upt_defaults (upt_codes column)

  ## Safety:
  - Only updates rows where upt_codes is of type TEXT
  - Preserves original data structure
  - Uses safe JSON parsing
*/

DO $$
DECLARE
  rec RECORD;
  cleaned_json JSONB;
  row_count INT := 0;
BEGIN
  -- Fix interventie_template_upt_defaults table
  RAISE NOTICE 'Starting UPT codes consistency fix...';

  FOR rec IN
    SELECT id, upt_codes::text as upt_text
    FROM interventie_template_upt_defaults
    WHERE jsonb_typeof(upt_codes) IS NULL
       OR upt_codes::text LIKE '(%'
  LOOP
    BEGIN
      -- Remove wrapping parentheses if present: "(...)" -> "..."
      cleaned_json := (
        SELECT
          CASE
            WHEN rec.upt_text LIKE '(%' THEN
              -- Remove leading "(" and trailing ")"
              ('['|| TRIM(BOTH '()' FROM rec.upt_text) ||']')::jsonb
            ELSE
              rec.upt_text::jsonb
          END
      );

      -- Update the row with cleaned JSON
      UPDATE interventie_template_upt_defaults
      SET upt_codes = cleaned_json,
          updated_at = now()
      WHERE id = rec.id;

      row_count := row_count + 1;

      IF row_count % 10 = 0 THEN
        RAISE NOTICE 'Processed % rows...', row_count;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not fix row %: %', rec.id, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'Fixed % rows in interventie_template_upt_defaults', row_count;

  -- Summary statistics
  RAISE NOTICE 'Consistency fix complete!';
  RAISE NOTICE 'Total rows fixed: %', row_count;

END $$;

-- Verify the fix
SELECT
  'interventie_template_upt_defaults' as table_name,
  COUNT(*) as total_rows,
  COUNT(*) FILTER (WHERE jsonb_typeof(upt_codes) = 'array') as valid_arrays,
  COUNT(*) FILTER (WHERE jsonb_typeof(upt_codes) IS NULL OR upt_codes::text LIKE '(%') as remaining_issues
FROM interventie_template_upt_defaults
WHERE upt_codes IS NOT NULL;
