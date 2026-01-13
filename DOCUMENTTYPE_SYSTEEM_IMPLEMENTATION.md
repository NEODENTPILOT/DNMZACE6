# Documenttype Systeem - Implementation Report

## Overzicht

Het documenttype systeem is uitgebreid van een statisch hardcoded systeem naar een volledig dynamisch database-driven systeem waar admins nieuwe documenttypes kunnen toevoegen en beheren via een UI.

## Wat is geïmplementeerd?

### 1. Database Schema (Migration)
**Bestand:** `supabase/migrations/[timestamp]_create_document_types_management_system.sql`

Nieuwe tabel: `document_types`
- **Primaire velden:**
  - `code` - Unieke systeemcode (bijv. 'recept', 'formulier')
  - `naam` - Display naam (bijv. 'Recept', 'Formulier')
  - `icon_name` - Lucide icon naam (bijv. 'Award', 'FileText')
  - `kleur` - Tailwind kleur theme (bijv. 'amber', 'blue')
  - `db_type` - Mapping naar document_store enum (bijv. 'Recept', 'Formulier')

- **Requirement velden:**
  - `patient_required` - Boolean
  - `care_path_required` - Boolean
  - `diagnosis_required` - Boolean
  - `referrer_required` - Boolean

- **Management velden:**
  - `is_active` - Boolean (toon/verberg in UI)
  - `sort_order` - Integer (volgorde in UI)
  - `beschrijving` - Text (optionele beschrijving)

- **Security:** Volledige RLS policies voor authenticated users en admin-only mutaties

### 2. Seeding van Alle Documenttypes

De database is gevuld met **alle 9 documenttypes**:

1. **Klinische Note** (blue, FileText)
2. **Informed Consent** (teal, FileSignature)
3. **Verslag** (green, ClipboardList)
4. **Verwijzing** (purple, Send)
5. **Verklaring** (indigo, Shield) ← *Terug toegevoegd*
6. **Recept** (amber, Award) ← *Nieuw*
7. **Formulier** (slate, ClipboardList) ← *Nieuw*
8. **AI Gegenereerde Tekst** (violet, Sparkles) ← *Nieuw*
9. **Overig** (gray, Folder) ← *Terug toegevoegd*

### 3. Config Update
**Bestand:** `src/config/cliniDocRequirements.ts`

Uitgebreid met:
- 'recept' type met requirements
- 'formulier' type met requirements
- 'ai_tekst' type met requirements
- Behouden: 'verklaring' en 'overig'

### 4. UI Component Refactor
**Bestand:** `src/components/care/CliniDocCreatePanel.tsx`

**Van:**
```typescript
const DOC_TYPES = [
  { id: 'klinische_note', label: 'Klinische Note', icon: FileText, ... }
  // hardcoded array
];
```

**Naar:**
```typescript
const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);

useEffect(() => {
  loadDocumentTypes(); // Laad dynamisch uit database
}, []);
```

**Key Changes:**
- Icon mapping systeem (`ICON_MAP` + `getIconComponent()`)
- Database property mapping (`.code`, `.naam`, `.kleur` ipv `.id`, `.label`, `.color`)
- Loading state voor betere UX
- Alle 3 plekken waar DOC_TYPES werd gebruikt zijn geüpdatet

### 5. Admin Interface - DocumentTypeBeheer
**Nieuw bestand:** `src/pages/DocumentTypeBeheer.tsx`

**Functionaliteit:**
- ✅ Overzicht van alle documenttypes in tabel format
- ✅ Create nieuw documenttype via modal
- ✅ Edit bestaand documenttype
- ✅ Delete documenttype (met confirmatie)
- ✅ Toggle active/inactive status per type
- ✅ Reorder met pijltjes (sort_order management)
- ✅ Icon selector (14 beschikbare icons)
- ✅ Kleur selector (9 kleuren)
- ✅ DB type selector (9 types)
- ✅ Requirements checkboxes (patient, care_path, diagnosis, referrer)
- ✅ Beschrijving veld (optioneel)
- ✅ Real-time refresh na wijzigingen

**Design:**
- Moderne tabelweergave met badges
- Modal editing interface
- Kleurgecodeerde cards per documenttype
- Requirement badges (blauw/groen/paars/amber)
- Active/Inactive status badges

### 6. Routing & Menu Integration

**App.tsx:**
- Import toegevoegd
- Route `'documenttype-beheer'` gekoppeld aan component

**Layout.tsx:**
- Menu item toegevoegd in Beheer sectie
- Label: "📄 Documenttype Beheer"
- Badge: "NEW"
- Icon: FileText

## Waarom deze Wijzigingen?

**Probleem:** Inconsistentie tussen hardcoded UI (recept, formulier) en config (verklaring, overig)

**Oplossing:** Volledig dynamisch systeem waar:
1. Alle types in database leven
2. UI laadt dynamisch uit database
3. Admins kunnen nieuwe types toevoegen zonder code te wijzigen
4. Geen mismatch meer tussen verschillende delen van de app

## Testing

✅ Build succesvol (`npm run build`)
- 1744 modules transformed
- 0 errors
- Bundle size warnings (normal voor grote app)

## Gebruik

### Voor Admins:
1. Navigeer naar **Beheer → Documenttype Beheer**
2. Klik **Nieuw Documenttype** om type toe te voegen
3. Vul formulier in:
   - Code (uniek, lowercase, geen spaties)
   - Naam (display naam)
   - Icon (kies uit 14 opties)
   - Kleur (kies uit 9 opties)
   - DB Type (mapping naar document_store)
   - Requirements (checkboxes)
4. Klik **Opslaan**
5. Type verschijnt meteen in CliniDoc creator

### Voor Gebruikers:
- Open CliniDoc creator
- Alle actieve documenttypes worden getoond
- Inclusief nieuwe types die admin heeft toegevoegd
- Volgorde volgens sort_order in database

## Security

- ✅ RLS enabled op document_types tabel
- ✅ Alleen authenticated users kunnen types lezen
- ✅ Alleen admin/eigenaar kan types aanmaken/wijzigen/verwijderen
- ✅ Location-based filtering (indien locatie_id ingevuld)

## Performance

- Documenttypes worden 1x geladen bij mount van CliniDocCreatePanel
- Cached in component state voor snelle re-renders
- Admin interface herlaadt alleen na mutaties

## Migration Path

Bestaande data:
- Alle oude documenttypes zijn gemigreerd naar nieuwe tabel
- Requirements zijn correct overgenomen
- Geen data loss
- Backwards compatible door config file behouden

## Toekomstige Uitbreidingen

Mogelijk in toekomst:
- Custom icons uploaden (nu beperkt tot 14 Lucide icons)
- Template koppeling per documenttype
- Workflow integratie
- Permission-based type visibility (niet alle types voor alle users)
- Document type templates/defaults

## Bestanden Gewijzigd

1. **Nieuw:**
   - `supabase/migrations/[timestamp]_create_document_types_management_system.sql`
   - `src/pages/DocumentTypeBeheer.tsx`

2. **Gewijzigd:**
   - `src/config/cliniDocRequirements.ts`
   - `src/components/care/CliniDocCreatePanel.tsx`
   - `src/App.tsx`
   - `src/components/Layout.tsx`

## Conclusie

Het systeem is nu volledig dynamisch en toekomstbestendig. Admins kunnen zonder developer involvement nieuwe documenttypes toevoegen, aanpassen en beheren. Alle bestaande functionaliteit blijft werken door backwards compatibility in de config.
