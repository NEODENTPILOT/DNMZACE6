# Template Auto-Select Implementatie

**Datum:** 2024-12-21
**Fase:** 3.5 — Zorgpad Mode A+B → Template Auto-Select

## Overzicht

Dit systeem selecteert automatisch het meest geschikte document template op basis van:
- **Patient-specifiek zorgpad**: Behandeloptie categorie uit het zorgplan
- **Generieke mode**: Handmatig geselecteerd behandelingstype

## Architectuur

### 1. Template Mapping Systeem
**Bestand:** `src/utils/templateAutoSelector.ts`

#### Mapping Tabel
```typescript
interface TemplateMapping {
  documentType: string;        // Consent, Verwijsbrief, Verslag
  treatmentCategory?: string;  // implantaat, extractie, chirurgie, etc.
  templateName: string;        // Naam van het template in de database
  priority: number;            // Hogere waarde = hogere prioriteit
}
```

#### Huidige Mappings

**Informed Consent:**
- Implantaat/Implantologie → "Informed consent – implantaatbehandeling" (prio 10)
- Extractie → "Informed consent – extractie" (prio 9)
- Chirurgie → "Informed consent – chirurgische ingreep" (prio 9)
- Endodontie → "Informed consent – wortelkanaalbehandeling" (prio 8)
- Prothetiek → "Informed consent – prothetische behandeling" (prio 8)
- Algemeen/Fallback → "Informed consent – algemene behandeling" (prio 5/1)

**Verwijsbrief:**
- Implantaat → "Verwijsbrief – implantologie" (prio 10)
- Chirurgie → "Verwijsbrief – orale chirurgie" (prio 9)
- Fallback → "Verwijsbrief – algemeen" (prio 1)

**Verslag:**
- Implantaat → "Operatieverslag – implantaatplaatsing" (prio 10)
- Chirurgie → "Operatieverslag – chirurgische ingreep" (prio 9)
- Fallback → "Behandelverslag – algemeen" (prio 1)

### 2. Behandelingstype Opties
```typescript
const TREATMENT_TYPES = [
  { id: 'implantaat', label: 'Implantaatbehandeling', category: 'implantaat' },
  { id: 'extractie', label: 'Tandextractie', category: 'extractie' },
  { id: 'chirurgie', label: 'Orale Chirurgie', category: 'chirurgie' },
  { id: 'endodontie', label: 'Wortelkanaalbehandeling', category: 'endodontie' },
  { id: 'prothetiek', label: 'Prothetische Behandeling', category: 'prothetiek' },
  { id: 'parodontologie', label: 'Parodontale Behandeling', category: 'parodontologie' },
  { id: 'algemeen', label: 'Algemene Tandheelkunde', category: 'algemeen' }
];
```

## Workflow

### Mode A: Patient-Specifiek Zorgpad

```
1. Gebruiker selecteert patiënt
2. Kiest behandeloptie uit zorgplan
3. Systeem haalt categorie op uit behandelopties.behandeloptie_categorie
   └─ Fallback: Interventie categorie of naam-analyse
4. autoSelectTemplate() zoekt best match in TEMPLATE_MAPPINGS
5. Template wordt opgehaald uit database
6. Template content wordt gerenderd met patient/zorgpad context
```

**Voorbeeld:**
```
Patiënt: Jan Jansen
Behandeloptie: "Implantaatplaatsing element 36"
├─ Categorie: "implantaat"
├─ Document type: "Consent"
└─ Auto-select: "Informed consent – implantaatbehandeling"
```

### Mode B: Generieke Mode

```
1. Gebruiker kiest "Generiek"
2. Dropdown toont TREATMENT_TYPES
3. Gebruiker selecteert behandelingstype (bijv. "Implantaatbehandeling")
4. autoSelectTemplate() gebruikt manualTreatmentCategory
5. Template wordt geselecteerd en gerenderd
```

**Voorbeeld:**
```
Mode: Generiek
Behandelingstype: Extractie
├─ Category: "extractie"
├─ Document type: "Consent"
└─ Auto-select: "Informed consent – extractie"
```

## Implementatie Details

### CliniDocCreatePanel.tsx

**State toevoegen:**
```typescript
const [selectedTreatmentType, setSelectedTreatmentType] = useState<string>('');
```

**UI Component (Generieke Mode):**
```tsx
{contextMode === 'generic' && (
  <div className="border-t border-gray-200 pt-6 mb-6">
    <h4 className="font-semibold text-gray-900 mb-3">Behandelingstype</h4>
    <select
      value={selectedTreatmentType}
      onChange={(e) => setSelectedTreatmentType(e.target.value)}
      className="w-full px-4 py-3 border..."
    >
      <option value="">Selecteer behandelingstype...</option>
      {TREATMENT_TYPES.map(tt => (
        <option key={tt.id} value={tt.category}>
          {tt.label} — {tt.description}
        </option>
      ))}
    </select>
  </div>
)}
```

**Template Selectie Logic:**
```typescript
// In createDocuments()
const autoSelectContext: AutoSelectContext = {
  documentType: dbDocType,
  patientId: selectedPatient?.id,
  behandeloptieId: selectedBehandeloptieIds[0],
  behandelplanId: selectedBehandelplanId,
  zorgplanId: selectedZorgplanId,
  manualTreatmentCategory: selectedTreatmentType
};

const autoSelectedTemplateId = await autoSelectTemplate(autoSelectContext);

let template: any = null;
if (autoSelectedTemplateId) {
  const { data } = await supabase
    .from('templates')
    .select('*')
    .eq('id', autoSelectedTemplateId)
    .maybeSingle();
  template = data;
}

// Fallback naar oude logica indien geen match
if (!template) {
  template = await resolveDefaultTemplate(docType, templateContext);
}
```

### Categorie Normalisatie

**Functie:** `normalizeCategoryName()`
- Converteert variaties naar standaard categorieën
- Case-insensitive matching
- Substring matching (bijv. "implantologie" → "implantaat")

**Voorbeelden:**
```
"Implantaat" → "implantaat"
"Implantologie" → "implantaat"
"Extractie van element 46" → "extractie"
"Chirurgische ingreep" → "chirurgie"
"Wortelkanaalbehandeling" → "endodontie"
```

### Database Integratie

**behandelopties tabel:**
```sql
SELECT
  id,
  naam,
  behandeloptie_categorie  -- Direct categorie veld
FROM behandelopties
WHERE id = $1;
```

**interventies fallback:**
```sql
SELECT
  behandelopties.id,
  interventies.interventie_categorie
FROM behandelopties
INNER JOIN interventies ON interventies.id = ANY(behandelopties.interventie_ids)
WHERE behandelopties.id = $1;
```

**templates lookup:**
```sql
SELECT id, naam, inhoud, doel
FROM templates
WHERE naam ILIKE '%Informed consent – implantaatbehandeling%'
LIMIT 1;
```

## Handmatige Override

Gebruikers kunnen ALTIJD het template handmatig wijzigen in DocumentEditor:

1. Document wordt geopend in editor
2. Template Selector dropdown (STAP 3.2) toont alle beschikbare templates
3. Gebruiker selecteert ander template
4. Bestaande content wordt vervangen met nieuw template
5. Template variabelen worden opnieuw gerenderd

**Belangrijk:** Auto-select is een hulpmiddel, geen beperking.

## Uitbreidbaarheid

### Nieuwe Document Types Toevoegen

1. **Voeg mappings toe in `templateAutoSelector.ts`:**
```typescript
{
  documentType: 'Recept',
  treatmentCategory: 'pijn',
  templateName: 'Pijnstillers voorschrift',
  priority: 10
}
```

2. **Voeg behandelingstype toe indien nodig:**
```typescript
{
  id: 'pijn',
  label: 'Pijnbestrijding',
  category: 'pijn',
  description: 'Pijnstilling en medicatie'
}
```

### Admin-Configureerbaar Maken

**Toekomstige Versie:**
- Mappings opslaan in database tabel `template_mappings`
- Admin interface voor toevoegen/wijzigen mappings
- Runtime reload van mappings cache
- Prioriteit wijzigen per praktijk/locatie

```sql
CREATE TABLE template_mappings (
  id uuid PRIMARY KEY,
  document_type text NOT NULL,
  treatment_category text,
  template_id uuid REFERENCES templates(id),
  priority int DEFAULT 1,
  locatie_id uuid REFERENCES praktijk_locaties(id),
  created_at timestamptz DEFAULT now()
);
```

## Debugging & Logging

**Console logs:**
```javascript
console.log('[TemplateAutoSelect] Selected template "X" for category "Y"');
console.log('[TemplateAutoSelect] Using fallback template "X"');
console.warn('[TemplateAutoSelect] Template not found: "X"');
```

**Controle punten:**
1. Is behandeloptie_categorie correct ingevuld?
2. Bestaat het template in de database met exacte naam?
3. Is de priority correct ingesteld?
4. Wordt de categorie correct genormaliseerd?

## Best Practices

1. **Altijd een fallback mapping** zonder treatmentCategory per documentType
2. **Priority waardes:**
   - 10: Zeer specifiek (bijv. implantaat)
   - 5-9: Specifieke categorieën
   - 1: Algemene fallback
3. **Template namen exact matchen** met database (case-insensitive via ILIKE)
4. **Categorie normalisatie** gebruiken voor flexibiliteit
5. **Treatment type** opslaan in document.tag voor auditing

## Performance

- **Caching:** TEMPLATE_MAPPINGS is in-memory array (< 1ms lookup)
- **Database queries:**
  - Behandeloptie categorie: 1 query (met JOIN fallback)
  - Template lookup: 1 query (indexed op naam)
- **Totale overhead:** ~50-100ms per document creatie

## Testen

**Test Scenarios:**
1. Patient mode + implantaat behandeloptie → Implantaat template
2. Patient mode + extractie behandeloptie → Extractie template
3. Patient mode + onbekende categorie → Algemeen template
4. Generiek mode + implantaat type → Implantaat template
5. Generiek mode + geen type → Algemeen template
6. Handmatige override in DocumentEditor

**Edge Cases:**
- Behandeloptie zonder categorie → naam analyse
- Template niet gevonden in database → oude fallback logica
- Multiple behandelopties → eerste wordt gebruikt
- Generiek zonder behandelingstype → algemeen template
