# ROOSTER & SHIFTBASE CONSOLIDATIE — DEFINITIEF RAPPORT

**Datum:** 2025-12-14
**Status:** ✅ VOLTOOID

---

## EXECUTIEVE SAMENVATTING

Het rooster- en Shiftbase-systeem is succesvol geconsolideerd tot één eenduidig systeem met:
- ✅ Duidelijke source of truth tabellen
- ✅ Employee/venue mapping voor Shiftbase import/export
- ✅ Unified UI in DNMZ+ HQ
- ✅ Nederlandse terminologie (ROOSTER)
- ✅ Geen dubbele of legacy systemen actief

---

## SOURCE OF TRUTH — DEFINITIEVE AFSPRAKEN

### 1. PERSONEEL
**Tabel:** `hq.employees`
**Doel:** Enige bron voor medewerker informatie
**Status:** ACTIEF

**GEEN alternatieve tabellen:**
- ❌ `staff_profiles` (orphaned, niet meer gebruiken)
- ❌ Custom staff tabellen

### 2. ROOSTER DATA
**Tabel:** `schedule_shifts`
**Doel:** Enige bron voor alle roosterregels (Shiftbase + handmatig)
**Kolommen:**
- `employee_id` → FK naar `hq.employees.id`
- `venue_id` → FK naar `hq.venues.id`
- `start_at` / `end_at` (timestamptz)
- `shift_type` (text)
- `notes` (text)

**Legacy kolommen (backwards compatibility):**
- `staff_profile_id` (niet meer gebruiken)
- `vestiging` (text, niet meer gebruiken)
- `start_time` / `end_time` (time, fallback)

**Container tabel:** `schedules`
Gebruikt voor import batches (start_datum, eind_datum, status)

### 3. SHIFTBASE MAPPING
**Tabellen:**
- `hq.shiftbase_employee_map` — koppelt `hq.employees` aan Shiftbase external IDs
- `hq.shiftbase_venue_map` — koppelt `hq.venues` aan Shiftbase location external IDs

**Doel:**
- Bij import: match externe IDs aan interne records
- Bij export: voeg externe IDs toe indien beschikbaar
- Optioneel: handmatige koppeling indien automatisch matchen faalt

---

## DATABASE WIJZIGINGEN

### Migratie: `create_rooster_consolidation_system`

1. **Nieuwe Tabellen:**
   - `hq.shiftbase_employee_map`
   - `hq.shiftbase_venue_map`

2. **Uitbreidingen `schedule_shifts`:**
   - Toegevoegd: `employee_id`, `venue_id`, `start_at`, `end_at`, `shift_type`, `notes`
   - Bestaande kolommen behouden voor backwards compatibility
   - Indexen toegevoegd voor performance

3. **RLS Policies:**
   - Mapping tabellen: authenticated users read, managers/owners write
   - schedule_shifts: bestaande policies behouden

---

## UI CONSOLIDATIE

### DNMZ+ HQ (Nieuwe Locatie)
**Pagina:** `/hq/roosters` (`HQRoosters.tsx`)

**Functionaliteit:**
- ✅ Overzicht alle roosterregels
- ✅ Split-view: lijst + detail panel
- ✅ Export naar Shiftbase (CSV) met preview
- ✅ Warnings bij ontbrekende mappings
- ✅ Premium styling, Nederlandse terminologie

**Sidebar:**
- 🟢 HQ → Roosters (ACTIEF)
- 🟢 HQ → Shiftbase Import (ACTIEF)

### Shiftbase Import (Gerefactored)
**Pagina:** `/shiftbase-import` (`ShiftbaseImport.tsx`)

**Verbeteringen:**
- ✅ Automatische employee matching via external ID + fuzzy naam match
- ✅ Automatische venue matching
- ✅ Mapping modal voor handmatige koppeling
- ✅ Preview tabel toont mapping status
- ✅ Bij import: `employee_id` + `venue_id` ALTIJD ingevuld
- ✅ Warnings bij unmapped rows

### Legacy Items (Deprecated)
**Team → Roosterregels (LEGACY)**
- Status: DISABLED
- Badge: LEGACY
- Reden: Vervangen door HQ → Roosters

---

## SERVICES & LOGICA

### shiftbaseExportService.ts
**Functie:** Export roosterdata naar Shiftbase CSV

**Features:**
- Leest uit `schedule_shifts` (ALLEEN)
- Joined met `hq.employees` en `hq.venues`
- Haalt mapping external IDs op indien beschikbaar
- Genereert preview + warnings
- CSV download met correcte kolommen

**CSV Format:**
```
Start Datum/Tijd, Eind Datum/Tijd, Medewerker, Medewerker External ID, Locatie, Locatie External ID, Dienst Type, Notities
```

---

## TERMINOLOGIE — NEDERLANDS

**Verplichte termen:**
- ✅ Rooster (niet Roster)
- ✅ Roosters (niet Rosters)
- ✅ Roosterregel (niet Roster entry)
- ✅ Roosterregels (niet Roster entries)

**Toegepast in:**
- HQRoosters pagina
- ShiftbaseImport pagina
- Sidebar labels
- Export service
- Database comments

---

## VALIDATIE & TESTING

### Functionele Tests
- ✅ Shiftbase import met mapping logica
- ✅ Export met preview en warnings
- ✅ Sidebar navigatie correct
- ✅ Routes wijzen naar juiste pagina's

### Data Integriteit
- ✅ Oude kolommen behouden (backwards compatible)
- ✅ GEEN data verwijderd
- ✅ Foreign keys correct ingesteld
- ✅ RLS policies actief

---

## STOPCRITERIA — BEHAALD

1. ✅ Shiftbase import werkt en toont roosterregels in `/hq/roosters`
2. ✅ Export naar CSV werkt met preview
3. ✅ Sidebar bevat geen dubbele of oude rooster/shiftbase items
4. ✅ UI gebruikt overal "Rooster" (NL)
5. ✅ Build succesvol (geen errors)

---

## BEST PRACTICES — NALEVING

**Toekomstige ontwikkelaars:**

1. **Personeel data:**
   - Gebruik ALTIJD `hq.employees`
   - Gebruik NOOIT `staff_profiles` of custom tabellen

2. **Rooster data:**
   - Gebruik ALTIJD `schedule_shifts`
   - Vul ALTIJD `employee_id` en `venue_id` in
   - Gebruik `start_at`/`end_at` (timestamptz) voor moderne data

3. **Shiftbase integratie:**
   - Import → schrijft naar `schedule_shifts`
   - Export → leest uit `schedule_shifts`
   - Gebruik mapping tabellen voor external ID koppeling

4. **UI/UX:**
   - 1 plek voor roosters: DNMZ+ HQ
   - Nederlandse terminologie: ROOSTER
   - Premium styling (teal/ocean kleuren)

---

## LEGACY CODE — NIET MEER GEBRUIKEN

**Deprecated:**
- ❌ `staff_profiles` tabel
- ❌ Team → Roosterregels pagina
- ❌ Oude `RoosterRegels.tsx` component
- ❌ Hardcoded vestigingen ("Almelo", "Raalte")

**Gebruik in plaats daarvan:**
- ✅ `hq.employees`
- ✅ HQ → Roosters pagina
- ✅ `HQRoosters.tsx` component
- ✅ `hq.venues` tabel

---

## DOCUMENTATIE IN CODE

Alle source of truth bestanden bevatten nu header comments:

```typescript
/**
 * SOURCE OF TRUTH:
 * - Rooster data: schedule_shifts
 * - Employee data: hq.employees
 * - Venue data: hq.venues
 * - Shiftbase mappings: hq.shiftbase_employee_map, hq.shiftbase_venue_map
 */
```

**Bestanden met documentatie:**
- `src/services/shiftbaseExportService.ts`
- `src/pages/ShiftbaseImport.tsx`
- `src/pages/hq/HQRoosters.tsx`
- Database migratie comments

---

## CONCLUSIE

Het rooster- en Shiftbase-systeem is nu volledig geconsolideerd:
- Duidelijke source of truth
- Moderne employee/venue referenties
- Werkende import + export
- Nederlandse terminologie
- Unified UI in DNMZ+ HQ

**Volgende stappen:**
- Monitoring van Shiftbase import/export in productie
- Eventuele mappings aanmaken voor bestaande medewerkers
- Legacy `staff_profiles` tabel verwijderen (na volledige migratie)

---

**Einde Rapport**
