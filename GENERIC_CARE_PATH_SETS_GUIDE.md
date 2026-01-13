# Generieke Zorgpad Sets - Gebruikershandleiding

## Overzicht

Het **Generieke Zorgpad Sets** systeem stelt klinieken in staat om herbruikbare zorgpad combinaties te definiëren op basis van hoofddiagnoses. Hiermee kunnen clinici snel en efficiënt documenten creëren door voorgedefinieerde sets van zorgplannen, behandelplannen en interventies te selecteren.

## Hoofdfunctionaliteit

### 1. Zorgpad Sets Beheren (Admin)

**Locatie:** Admin menu → 🎯 Zorgpad Sets

Als administrator kun je:

#### Sets Maken
1. Klik op "Nieuwe Set"
2. Vul de basisgegevens in:
   - **Naam**: Beschrijvende naam voor de set (bijv: "Volledige Rehabilitatie OK")
   - **Beschrijving**: Uitleg wanneer deze set gebruikt moet worden
   - **Actief**: Of de set beschikbaar is voor gebruikers

3. Voeg hoofddiagnoses toe:
   - Type diagnose codes zoals: EDENT-OK, PART-EDENT-OK, etc.
   - Druk Enter of klik "Toevoegen"
   - Meerdere diagnoses mogelijk per set

4. Voeg tags toe (optioneel):
   - Zoals: implantologie, chirurgie, endodontie
   - Voor eenvoudig filteren en zoeken

5. Selecteer zorgpad componenten:
   - **Zorgplannen**: Selecteer relevante zorgplannen uit de lijst
   - **Behandelplannen**: Selecteer bijbehorende behandelplannen
   - **Interventies**: Selecteer specifieke interventies
   - Je kunt componenten uit alle drie de categorieën selecteren

6. Klik "Opslaan" om de set te bewaren

#### Sets Bewerken
1. Klik op het potlood icoon bij een bestaande set
2. Wijzig de gewenste velden
3. Update de component selecties indien nodig
4. Klik "Opslaan"

#### Sets Verwijderen
1. Klik op het prullenbak icoon
2. Bevestig de verwijdering
3. Alle koppelingen worden automatisch verwijderd (cascade delete)

#### Zoeken en Filteren
- **Zoekbalk**: Zoek op naam, beschrijving of diagnoses
- **Filters**:
  - Alle sets
  - Alleen actieve sets
  - Alleen inactieve sets

### 2. Zorgpad Sets Gebruiken (Document Creatie)

**Locatie:** Generieke modus in document aanmaak panel

Wanneer je in de generieke modus bent (niet patiënt-specifiek):

1. Klik op "Gebruik Zorgpad Set" om de selector uit te vouwen

2. Selecteer een voorgedefinieerde set uit de dropdown:
   - Zie direct de bijbehorende diagnoses
   - Bekijk hoeveel zorgplannen, behandelplannen en interventies in de set zitten
   - Lees de beschrijving om te verifiëren dat het de juiste set is

3. Klik "Deze set toepassen":
   - Alle zorgplannen uit de set worden automatisch geselecteerd
   - Alle behandelplannen worden geselecteerd
   - Alle interventies worden geselecteerd
   - Diagnoses worden toegevoegd aan de context

4. De dropdowns hieronder zijn nu automatisch gevuld en je kunt direct verdergaan met document creatie

## Database Schema

### Tabellen

#### `generic_care_path_sets`
Hoofdtabel voor set definities:
- `id`: Unieke identifier
- `naam`: Naam van de set
- `beschrijving`: Beschrijving van het gebruik
- `hoofddiagnoses`: Array van diagnose codes
- `is_actief`: Boolean voor zichtbaarheid
- `locatie_id`: Optionele locatie filter
- `created_by`: Gebruiker die de set heeft gemaakt
- `tags`: Array van tags
- `display_order`: Sorteervolgorde
- `metadata`: Extra JSON data

#### `generic_care_path_set_zorgplannen`
Koppeltabel voor zorgplannen:
- `set_id`: Verwijzing naar de set
- `zorgplan_id`: Verwijzing naar het zorgplan
- `is_required`: Of het component verplicht is
- `display_order`: Volgorde

#### `generic_care_path_set_behandelplannen`
Koppeltabel voor behandelplannen:
- `set_id`: Verwijzing naar de set
- `behandelplan_id`: Verwijzing naar het behandelplan
- `zorgplan_link_id`: Optionele link naar zorgplan in set
- `is_required`: Of het component verplicht is
- `display_order`: Volgorde

#### `generic_care_path_set_interventies`
Koppeltabel voor interventies:
- `set_id`: Verwijzing naar de set
- `interventie_id`: Verwijzing naar de interventie
- `behandelplan_link_id`: Optionele link naar behandelplan in set
- `is_required`: Of het component verplicht is
- `display_order`: Volgorde

## Security (RLS Policies)

### Lezen
- Alle authenticated users kunnen **actieve** sets zien
- Creators kunnen hun eigen inactieve sets zien

### Schrijven
- Alleen **admins** en **eigenaren** kunnen sets maken
- Alleen **creators** en **admins** kunnen sets bewerken
- Alleen **admins** en **eigenaren** kunnen sets verwijderen

### Junction Tables
- Inherit dezelfde rechten als de parent set
- Admins hebben volledige toegang tot alle koppelingen

## Use Cases

### Voorbeeld 1: Volledige Rehabilitatie Bovenkaak
```
Naam: Volledige Rehabilitatie OK
Diagnoses: EDENT-OK, EXTRACTIERIJP-OK
Tags: implantologie, chirurgie

Zorgplannen:
  - Implantologisch Zorgplan OK

Behandelplannen:
  - Extractie alle elementen OK
  - Implantaatplaatsing OK (6x)
  - Provisorische voorziening
  - Definitieve prothese op implantaten

Interventies:
  - Pre-operatieve CBCT scan
  - Behandelplan bespreking
  - Totale extractie OK
  - Bottransplantaat indien nodig
  - 6 Implantaten OK
  - Healing abutments
  - Provisorische klikprothese
  - Definitieve prothese
```

### Voorbeeld 2: Parodontale Revalidatie
```
Naam: Parodontale Revalidatie Compleet
Diagnoses: PARO-GEN, PARO-LOK
Tags: parodontologie, preventie

Zorgplannen:
  - Parodontaal Behandelplan

Behandelplannen:
  - Initiële fase: OHI + Scaling
  - Correctieve fase: Deep cleaning
  - Onderhouds fase

Interventies:
  - Volledige parodontale status
  - Foto-serie (intra-oraal)
  - Supra-gingivale reiniging (4 kwadranten)
  - Sub-gingivale reiniging (4 kwadranten)
  - Herbeoordeling na 6 weken
  - Periodieke controle + reiniging
```

### Voorbeeld 3: Endodontische Behandeling
```
Naam: Endo Molaar + Crown
Diagnoses: PULPITIS-IRREV, APICALE-PARODONTITIS
Tags: endodontie, restauratief

Zorgplannen:
  - Endodontisch Behandelplan

Behandelplannen:
  - Wortelkanaalbehandeling molaar
  - Kroonvervanging

Interventies:
  - Diagnostische röntgenfoto's
  - Pulpotomie / pulpectomie
  - Wortelkanaalbehandeling 3-4 kanalen
  - Vulling composite
  - Crown preparatie
  - Impressie + tijdelijke kroon
  - Definitieve kroon cementatie
```

## API / Service Layer

### `genericCarePathSetService.ts`

Belangrijkste functies:

```typescript
// Laad alle actieve sets
loadActiveCareSets(): Promise<GenericCarePathSet[]>

// Laad complete details van een set (inclusief alle componenten)
loadCarePathSetDetail(setId: string): Promise<CarePathSetDetail | null>

// Pas een set toe en krijg alle IDs terug
applyCarePathSet(setId: string): Promise<{
  zorgplanIds: string[];
  behandelplanIds: string[];
  interventieIds: string[];
  diagnosisLabels: string[];
}>

// Zoek sets op diagnose
searchSetsByDiagnosis(diagnosisQuery: string): Promise<GenericCarePathSet[]>

// Haal component counts op
getCarePathSetCounts(setId: string): Promise<{
  zorgplannen: number;
  behandelplannen: number;
  interventies: number;
}>
```

### Database Helper Function

```sql
get_care_path_set_complete(p_set_id uuid)
```

Haalt een complete set op met alle gekoppelde componenten in één call. Returns JSONB met:
- Set metadata
- Alle zorgplannen (inclusief details)
- Alle behandelplannen (inclusief details)
- Alle interventies (inclusief details)

## UI Componenten

### `GenericCarePathSets.tsx`
Admin interface voor het beheren van sets. Features:
- Lijst van alle sets
- Formulier voor aanmaken/bewerken
- Multi-select voor componenten
- Zoeken en filteren
- Real-time validatie

### `CarePathSetSelector.tsx`
Reusable component voor het selecteren en toepassen van een set. Features:
- Dropdown met actieve sets
- Preview van set details
- Component counts
- One-click apply functionaliteit
- Integratie met document workflow

## Best Practices

1. **Naming Convention**
   - Gebruik duidelijke, beschrijvende namen
   - Vermeld de anatomische scope (OK, UK, totaal)
   - Vermeld het type behandeling

2. **Diagnose Codes**
   - Gebruik consistente, gestandaardiseerde codes
   - Vermijd te specifieke codes (gebruik generieke waar mogelijk)
   - Documenteer betekenis van codes

3. **Component Selectie**
   - Selecteer alleen essentiële componenten
   - Maak geen te grote sets (max 10-15 interventies)
   - Groepeer gerelateerde behandelingen

4. **Tags**
   - Gebruik consistente tag namen
   - Gebruik specialisme tags: implantologie, parodontologie, etc.
   - Gebruik type tags: chirurgie, preventie, restauratief

5. **Onderhoud**
   - Review sets regelmatig (elk kwartaal)
   - Update bij wijzigingen in protocollen
   - Deactiveer verouderde sets (niet verwijderen)

## Technische Details

### Performance Optimalisatie
- Indexes op `is_actief`, `locatie_id`, `hoofddiagnoses` (GIN), `tags` (GIN)
- Foreign key indexes op alle junction tables
- Efficient gebruik van `get_care_path_set_complete` RPC

### Cascade Deletes
- Bij verwijderen van een set worden alle koppelingen automatisch verwijderd
- Bij verwijderen van een zorgplan/behandelplan/interventie worden de koppelingen verwijderd

### Extensibility
- `metadata` JSONB field voor toekomstige uitbreidingen
- Display order voor custom sortering
- Location-specific sets mogelijk via `locatie_id`

## Toekomstige Uitbreidingen

Mogelijke features voor toekomstige versies:

1. **Set Varianten**
   - Optionele componenten binnen een set
   - Basis + uitgebreide versies

2. **Set Templates**
   - Copy functionaliteit
   - Template library

3. **Analytics**
   - Meest gebruikte sets
   - Success rates per set

4. **AI Suggesties**
   - Automatisch voorstellen van sets op basis van diagnose
   - Leren van gebruikersgedrag

5. **Set Versioning**
   - Historische versies bijhouden
   - Audit trail

6. **Approval Workflow**
   - Sets moeten goedgekeurd worden voordat ze actief zijn
   - Multi-level review proces

## Support

Voor vragen of problemen:
- Check de documentatie in dit bestand
- Bekijk de inline code comments
- Contact: development team

## Change Log

### v1.0.0 (2026-01-07)
- Initiele implementatie
- Admin UI voor set management
- Integration met document creation panel
- Database schema + RLS policies
- Service layer + API functions
