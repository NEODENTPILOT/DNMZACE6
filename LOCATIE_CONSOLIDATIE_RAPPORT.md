# Locatie Systeem Consolidatie

## Probleem
Er waren twee verschillende tabellen voor locaties:
- `praktijk_locaties` (oude, legacy tabel) - gebruikt door 14+ bestanden
- `hq.venues` (nieuwe HQ+ module tabel) - gebruikt door 7 bestanden

Dit zorgde voor:
- Verwarring over welke tabel te gebruiken
- Dubbel werk bij wijzigingen
- Inconsistente data
- Onduidelijke scheiding tussen praktijklocaties en opslaglocaties

## Oplossing

### 1. Nieuwe Tabelstructuur

**`praktijk_locaties`** (MASTER voor praktijklocaties)
- Voor praktijken waar patiënten behandeld worden
- Waar medewerkers werken
- Waar rooms/behandelkamers zijn
- Volledige Nederlandse velden incl. AGB codes, KVK, etc.

**`opslag_locaties`** (NIEUW - voor opslaglocaties)
- Voor opslag van gestalde apparatuur
- Voor inventaris die niet actief gebruikt wordt
- Voor apparatuur in onderhoud/reserve
- Velden:
  - naam, code (unique)
  - adres, beschrijving
  - capaciteit_m2
  - is_klimaat_gecontroleerd
  - toegang_instructies
  - contact_persoon, contact_telefoon
  - is_actief

### 2. Database Verbeteringen

**rooms tabel**
- ✅ Nieuw veld: `praktijk_locatie_id` (UUID FK naar praktijk_locaties)
- ⚠️ Oude veld: `vestiging` (text) - behouden voor backwards compatibility
- Data automatisch gemigreerd waar mogelijk

**assets tabel**
- ✅ Nieuw veld: `opslag_locatie_id` (UUID FK naar opslag_locaties)
- ⚠️ Oude veld: `location` (text) - behouden voor backwards compatibility
- Nieuwe logica:
  - `assigned_room` → asset staat op praktijk in specifieke kamer
  - `opslag_locatie_id` → asset is gestald in opslag
  - Beide NULL → locatie onbekend

**Nieuwe view: `vw_asset_locations`**
```sql
-- Toont waar elk asset zich bevindt met:
- Room naam + praktijk naam (als assigned_room)
- Opslag naam (als opslag_locatie_id)
- Legacy text (als alleen location veld)
- Helper veld: huidige_locatie (leesbare tekst)
```

### 3. Initiële Opslaglocaties

3 opslaglocaties aangemaakt:
1. **OPSLAG-01**: Hoofdopslag Centrum (Amsterdam)
2. **OPSLAG-02**: Externe Opslag Zuid (Rotterdam)
3. **OPSLAG-TEMP**: Tijdelijke Opslag (variabel)

### 4. HQ Venues Pagina Compleet Herschreven

`src/pages/hq/HQVenues.tsx`:
- ✅ Gebruikt nu `praktijk_locaties` en `opslag_locaties`
- ✅ Unified interface toont beide types in één lijst
- ✅ Dynamische formulieren op basis van type:
  - **Praktijk**: Alle NL praktijkvelden (naam, korte naam, adres, postcode, plaats, telefoon, email, AGB, KVK)
  - **Opslag**: Opslagspecifieke velden (code, capaciteit, klimaatcontrole, toegangsinstructies)
- ✅ Visueel onderscheid:
  - Praktijk = blauw icoon (Building2)
  - Opslag = amber icoon (Warehouse)
- ✅ Type selectie bij aanmaken

### 5. hq.venues Deprecated

- Tabel `hq.venues` gemarkeerd als DEPRECATED in database
- Comment toegevoegd met migratie instructies
- Kan verwijderd worden in toekomstige migratie

## Voordelen

✅ **Eén bron van waarheid**
- `praktijk_locaties` voor praktijken
- `opslag_locaties` voor opslag
- Geen verwarring meer

✅ **Betere data integriteit**
- Foreign keys ipv text velden
- Cascade deletes/nulls

✅ **Duidelijke semantiek**
- Asset op praktijk: `assigned_room` → `rooms` → `praktijk_locaties`
- Asset gestald: `opslag_locatie_id` → `opslag_locaties`

✅ **Schaalbaar**
- Makkelijk meerdere opslaglocaties toevoegen
- Opslagspecifieke metadata (capaciteit, klimaat, etc.)

## Migratie Details

**Database migratie**: `create_opslag_locaties_and_consolidate_venue_system.sql`
- Creëert `opslag_locaties` tabel
- Voegt `praktijk_locatie_id` toe aan `rooms`
- Voegt `opslag_locatie_id` toe aan `assets`
- Migreert bestaande data waar mogelijk
- Creëert helper view `vw_asset_locations`
- Deprecates `hq.venues`

**Code wijzigingen**:
- `src/pages/hq/HQVenues.tsx` - volledig herschreven

## Vervolgstappen (Optioneel)

### Fase 1: Cleanup Legacy Velden (na migratie periode)
1. Controleer dat alle `rooms.vestiging` correct gemigreerd zijn naar `praktijk_locatie_id`
2. Verwijder `rooms.vestiging` kolom
3. Controleer dat alle `assets.location` correct gemigreerd zijn naar `opslag_locatie_id` of `assigned_room`
4. Verwijder `assets.location` kolom

### Fase 2: Drop hq.venues
1. Verifieer dat geen enkele code meer `hq.venues` gebruikt
2. Drop alle views die `hq.venues` gebruiken
3. Drop `hq.venues` tabel

### Fase 3: Update Inventaris UI
1. Update `src/pages/Inventaris.tsx` om opslag locaties te tonen
2. Dropdown voor asset locatie:
   - Optie 1: Praktijk → selecteer room (toont automatisch praktijk)
   - Optie 2: Opslag → selecteer opslag locatie
3. Visual indicators voor waar asset zich bevindt

## Testing Checklist

- [x] Database migratie succesvol
- [x] Build slaagt zonder errors
- [ ] HQ Venues pagina: lijst laden
- [ ] HQ Venues pagina: nieuwe praktijk aanmaken
- [ ] HQ Venues pagina: nieuwe opslaglocatie aanmaken
- [ ] HQ Venues pagina: praktijk bewerken
- [ ] HQ Venues pagina: opslaglocatie bewerken
- [ ] Inventaris pagina: assets tonen met nieuwe locatie view
