# CRM Tile Tekstzichtbaarheid Fix

## Probleem
De tekst in de "Overheid & Toezicht" tile (tussen Marketing & Commercieel en Overig/Calamiteiten) was niet zichtbaar door een te lichte achtergrondkleur.

## Oplossing

### 1. Frontend Fallback Toegevoegd
De CRMHub component heeft nu fallback data met de juiste kleuren voor alle hoofdgroepen:

- **Overheid & Toezicht**: Donkere slate kleuren (`from-slate-700` tot `to-slate-800`)
- Alle andere tiles behouden hun originele kleuren

De fallback wordt gebruikt wanneer:
- De database tabel `crm_hoofdgroepen` leeg is
- Er een fout optreedt bij het laden van de data

### 2. Database Update (Optioneel)
Als de `crm_hoofdgroepen` tabel al data bevat, kun je deze updaten met:

```bash
# Via Supabase SQL Editor
# Voer de inhoud van UPDATE_CRM_HOOFDGROEPEN_COLORS.sql uit
```

Of via command line (als je psql hebt):
```bash
psql $SUPABASE_DB_URL -f UPDATE_CRM_HOOFDGROEPEN_COLORS.sql
```

### 3. Tekstzichtbaarheid Algemeen
Ook verbeterd:
- Tekstgrootte: `text-xs` → `text-sm` (voor labels onder cijfers)
- Tekstkleur: `text-gray-500/600` → `text-gray-700` (voor betere contrast)
- Font-weight: `font-medium` en `font-semibold` toegevoegd

## Kleurenschema Per Hoofdgroep

| Hoofdgroep | Gradient | Tekst |
|------------|----------|-------|
| Zorginhoudelijk | Blue (500-600) | White |
| Leveranciers & Faciliteiten | Teal-Green (500-600) | White |
| Juridisch & Financieel | Purple (500-600) | White |
| HR & Opleiding | Emerald (500-600) | White |
| Marketing & Commercieel | Orange (500-600) | White |
| **Overheid & Toezicht** | **Slate (700-800)** | **White** |
| Overig / Calamiteiten | Red (600-700) | White |

## Bestanden Gewijzigd
- `src/pages/CRMHub.tsx` - Fallback data en verbeterde tekstcontrasten
- `src/pages/CRMRelatieDetail.tsx` - Support voor nieuwe relaties
- `UPDATE_CRM_HOOFDGROEPEN_COLORS.sql` - Database update script
- `scripts/seedCrmHoofdgroepen.ts` - Seed script (voor referentie)

## Resultaat
✅ Alle tekst in CRM tiles is nu goed leesbaar
✅ "Overheid & Toezicht" tile heeft donkere achtergrond met witte tekst
✅ Fallback zorgt dat de app altijd werkt, ook zonder database data
