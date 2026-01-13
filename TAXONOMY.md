# Unified Template Taxonomy

This document defines the official taxonomy structure used across all text systems in the application.

## Template Model Structure

All templates (Tekst, Verslag, Formulier) follow this unified structure:

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | uuid | Yes | Unique identifier |
| `template_type` | enum | Yes | Type: Tekst, Verslag, Formulier |
| `naam` | string | Yes | Template name (from CSV: Onderwerp) |
| `inhoud` | text | No | Template content (from CSV: Tekst) |
| `beschrijving` | string | No | Auto-generated description |

### Taxonomy Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | No | Unique code identifier |
| `teksttype` | string | No | Text type classification |
| `verrichting_categorie` | string | No | Treatment/procedure category |
| `verrichting_onderdeel` | string | No | Treatment/procedure component |
| `doel` | enum | No | Purpose: KlinischeNote, InformedConsent, Verwijsbrief, PatiëntenInformatie, Overig |

### Relational Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `category_id` | uuid | No | Link to TemplateCategory |
| `subcategory_id` | uuid | No | Link to TemplateSubcategory |

### Metadata Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `actief` | boolean | No | Is active (default: true) |
| `is_favoriet` | boolean | No | Is favorite (default: false) |
| `created_at` | timestamp | No | Creation timestamp |
| `updated_at` | timestamp | No | Last update timestamp |

## CSV Import Mapping

When importing from CSV with columns: `Code, Teksttype, Verrichting categorie, Verrichting onderdeel, Onderwerp, Tekst`

### Field Mapping

```
Template.template_type           = "Tekst"
Template.code                    = CSV["Code"]
Template.teksttype               = CSV["Teksttype"]
Template.verrichting_categorie   = CSV["Verrichting categorie"]
Template.verrichting_onderdeel   = CSV["Verrichting onderdeel"]
Template.naam                    = CSV["Onderwerp"]
Template.inhoud                  = CSV["Tekst"]
Template.beschrijving            = CSV["Verrichting categorie"] + " / " + CSV["Verrichting onderdeel"]
```

## Doel (Purpose) Determination

The `doel` field is automatically determined based on `teksttype`:

### KlinischeNote
Used for clinical notes and treatment documentation.

**Teksttype values:**
- Sneltekst
- Behandelnotitie
- Verslag
- Endodontologie
- Preventie
- Implantologie
- Parodontologie
- Chirurgie
- Consult
- Intake
- Prothetiek

### PatiëntenInformatie
Used for patient information materials.

**Teksttype values:**
- PatiëntenInfo
- Voorlichting
- Nazorgtekst

### InformedConsent
Used for informed consent documents.

**Teksttype values:**
- InformedConsent
- Informed Consent

### Verwijsbrief
Used for referral letters.

**Teksttype values:**
- Verwijsbrief

### Overig
Default for all other text types.

## Automatic Category Linking

When importing, the system automatically links templates to TemplateCategory and TemplateSubcategory:

1. **Category Linking**
   - Search for TemplateCategory with `naam = verrichting_categorie` (case-insensitive)
   - If not found, create new TemplateCategory
   - Set `Template.category_id = TemplateCategory.id`

2. **Subcategory Linking**
   - Search for TemplateSubcategory with:
     - `naam = verrichting_onderdeel` (case-insensitive)
     - `category_id = Template.category_id`
   - If not found, create new TemplateSubcategory
   - Set `Template.subcategory_id = TemplateSubcategory.id`

## UI Consistency Requirements

All template interfaces (Tekst, Verslag, Formulier) must display:

### Columns
- Code
- Naam (Name)
- Teksttype
- Verrichting categorie
- Verrichting onderdeel
- Categorie (linked TemplateCategory)
- Subcategorie (linked TemplateSubcategory)
- Doel
- Actief

### Filters
- Teksttype (dropdown with unique values)
- Verrichting categorie (dropdown with unique values)
- Verrichting onderdeel (optional)
- Doel (dropdown)
- TemplateCategory (dropdown)
- TemplateSubcategory (dropdown, filtered by category)
- Search field (searches naam and inhoud)

## Clinical Notes Integration

Templates are displayed in the Clinical Notes editor grouped by:

1. **Primary grouping:** Verrichting categorie
2. **Secondary grouping:** Verrichting onderdeel
3. **Tertiary level:** Naam (template name)

Users can:
- Insert Template Tekst content at cursor position
- Use Template Verslag as report structure
- Link/attach Formulier to clinical note

## Migration from Legacy Systems

### Standaardteksten Module
- UI hidden from admin menu
- Database table preserved for compatibility
- All new entries use Template system with unified taxonomy
- Existing data can be migrated via CSV import

### Import Process
1. Export legacy data to CSV format
2. Use "Import Templates CSV" page
3. System automatically:
   - Maps fields to unified taxonomy
   - Determines correct doel
   - Creates/links categories and subcategories
   - Handles duplicates (update existing by code + naam)

## Validation Rules

1. **Required Fields**
   - `template_type` must be one of: Tekst, Verslag, Formulier
   - `naam` must not be empty

2. **Optional but Recommended**
   - `code` for unique identification
   - `teksttype` for proper doel determination
   - `verrichting_categorie` and `verrichting_onderdeel` for organization

3. **Automatic Behavior**
   - If `verrichting_categorie` is provided, category linking is automatic
   - If `teksttype` is provided, doel is automatically determined
   - `beschrijving` is auto-generated from verrichting fields

## Future Considerations

This taxonomy is designed to be:
- **Extensible:** New teksttype values can be added
- **Flexible:** Categories and subcategories created dynamically
- **Consistent:** Same structure across all text types
- **Scalable:** Supports growing content library

All new features should align with this unified taxonomy structure.
