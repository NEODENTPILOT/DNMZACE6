-- ==============================================
-- UPDATE CRM HOOFDGROEPEN KLEUREN
-- ==============================================
-- Dit script update de kleuren van de Overheid & Toezicht tile
-- naar donkere slate kleuren voor betere tekstzichtbaarheid

-- Update Overheid & Toezicht met donkere kleuren
UPDATE crm_hoofdgroepen
SET
  color_from = 'from-slate-700',
  color_to = 'to-slate-800',
  bg_color = 'bg-slate-700',
  updated_at = now()
WHERE naam = 'Overheid & Toezicht';

-- Verifieer de update
SELECT naam, label, color_from, color_to, text_color
FROM crm_hoofdgroepen
WHERE naam = 'Overheid & Toezicht';
