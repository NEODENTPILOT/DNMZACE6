# Template Variabelen Systeem

## Overzicht

Het Template Variabelen Systeem maakt het mogelijk om dynamische variabelen te gebruiken in alle template teksten. Deze variabelen worden automatisch vervangen met daadwerkelijke waarden wanneer een template wordt gebruikt.

## Belangrijkste Bestanden

### 1. `/src/utils/templateVariables.ts`
Centraal bestand met alle beschikbare variabelen en de logica om ze te vervangen.

**Belangrijkste functies:**
- `replaceTemplateVariables()` - Vervang alle variabelen in een template
- `extractVariablesFromTemplate()` - Haal alle gebruikte variabelen uit een template
- `validateTemplateVariables()` - Valideer of alle variabelen bekend zijn

### 2. `/src/components/TemplateVariablesHelper.tsx`
UI component die alle beschikbare variabelen toont met zoekfunctionaliteit.

**Features:**
- Doorzoekbare lijst van alle variabelen
- Gegroepeerd per categorie
- Kopieer-naar-klembord functionaliteit
- Direct invoegen in textarea
- Voorbeeld gebruik

## Beschikbare Variabelen Categorieën

### Patiënt Gegevens
```
{{patient.voornaam}}
{{patient.tussenvoegsel}}
{{patient.achternaam}}
{{patient.volledige_naam}}
{{patient.geboortedatum}}
{{patient.leeftijd}}
{{patient.epd_nummer}}
{{patient.email}}
{{patient.telefoon}}
{{patient.adres}}
{{patient.postcode}}
{{patient.woonplaats}}
{{patient.volledig_adres}}
{{patient.bsn}}
{{patient.geslacht}}
{{patient.aanhef}}
```

### Case Informatie
```
{{case.case_code}}
{{case.omschrijving}}
{{case.start_datum}}
{{case.status}}
```

### Behandelaar
```
{{behandelaar.naam}}
{{behandelaar.big_nummer}}
{{behandelaar.specialisatie}}
{{behandelaar.email}}
{{behandelaar.telefoon}}
```

### Locatie/Praktijk
```
{{locatie.naam}}
{{locatie.adres}}
{{locatie.postcode}}
{{locatie.woonplaats}}
{{locatie.volledig_adres}}
{{locatie.telefoon}}
{{locatie.email}}
```

### Document Metadata
```
{{document.datum}}
{{document.datum_lang}}
{{document.tijd}}
{{document.referentie_nummer}}
{{document.titel}}
```

### Datum & Tijd Helpers
```
{{vandaag}}
{{vandaag_lang}}
{{nu}}
{{jaar}}
{{maand}}
{{dag}}
```

### Status Praesens
```
{{status_praesens.algemene_indruk}}
{{status_praesens.medische_historie}}
{{status_praesens.medicatie}}
{{status_praesens.allergieën}}
{{status_praesens.tandstatus}}
```

### Diagnoses
```
{{diagnoses.lijst}}
{{diagnoses.codes}}
```

### Interventies/Behandelingen
```
{{interventies.lijst}}
{{interventies.omschrijving}}
```

### Custom Velden
```
{{custom.veld}}
```

## Gebruik

### In Templates

**Voorbeeld template tekst:**
```
Beste {{patient.aanhef}} {{patient.achternaam}},

Hierbij ontvangt u de behandelnotitie van uw bezoek op {{document.datum_lang}}.

Patiëntgegevens:
- Naam: {{patient.volledige_naam}}
- Geboortedatum: {{patient.geboortedatum}} ({{patient.leeftijd}} jaar)
- EPD nummer: {{patient.epd_nummer}}

Met vriendelijke groet,
{{behandelaar.naam}}
{{locatie.naam}}
```

**Wordt na vervanging:**
```
Beste Mevrouw Jansen,

Hierbij ontvangt u de behandelnotitie van uw bezoek op 20 december 2025.

Patiëntgegevens:
- Naam: Maria Jansen
- Geboortedatum: 15-03-1980 (45 jaar)
- EPD nummer: EPD-2024-001

Met vriendelijke groet,
Dr. Jan de Vries
Tandartspraktijk Almelo
```

### In Code

**Variabelen vervangen:**
```typescript
import { replaceTemplateVariables, TemplateVariableContext } from '../utils/templateVariables';

const context: TemplateVariableContext = {
  patient: {
    voornaam: 'Maria',
    achternaam: 'Jansen',
    geboortedatum: '1980-03-15',
    epd_nummer: 'EPD-2024-001'
  },
  behandelaar: {
    naam: 'Dr. Jan de Vries'
  },
  locatie: {
    naam: 'Tandartspraktijk Almelo'
  },
  document: {
    datum: '2025-12-20'
  }
};

const processedText = replaceTemplateVariables(templateText, context);
```

**Variabelen valideren:**
```typescript
import { validateTemplateVariables } from '../utils/templateVariables';

const validation = validateTemplateVariables(templateText);

if (!validation.valid) {
  console.log('Onbekende variabelen:', validation.unknownVariables);
}
```

## Implementatie Locaties

Het variabelen systeem is geïmplementeerd in:

1. **Clinical Note Composer** (`/src/components/ClinicalNoteComposerInline.tsx`)
   - Variabelen worden automatisch vervangen wanneer een template wordt geselecteerd
   - TemplateVariablesHelper wordt getoond onder de editor

2. **Templates Pagina** (`/src/pages/Templates.tsx`)
   - Quick Edit modal toont TemplateVariablesHelper
   - Klik op een variabele om deze in te voegen

3. **Standaardteksten Beheer** (`/src/pages/StandaardtekstenBeheer.tsx`)
   - Form modal toont TemplateVariablesHelper
   - Ondersteunt variabelen in standaardteksten

## Nieuwe Variabelen Toevoegen

Om nieuwe variabelen toe te voegen:

1. **Voeg toe aan `TEMPLATE_VARIABLES` in `templateVariables.ts`:**
```typescript
export const TEMPLATE_VARIABLES = {
  // ... bestaande variabelen
  '{{nieuwe.variabele}}': 'Beschrijving van de nieuwe variabele',
} as const;
```

2. **Voeg logica toe in `replaceTemplateVariables()` functie:**
```typescript
if (context.nieuwe) {
  result = result.replace(/\{\{nieuwe\.variabele\}\}/g, context.nieuwe.variabele || '');
}
```

3. **Update `TemplateVariableContext` interface:**
```typescript
export interface TemplateVariableContext {
  // ... bestaande velden
  nieuwe?: {
    variabele?: string;
  };
}
```

4. **Voeg categorie toe aan `VARIABLE_CATEGORIES` (indien nieuwe categorie):**
```typescript
export const VARIABLE_CATEGORIES = {
  // ... bestaande categorieën
  nieuwe: 'Nieuwe Categorie',
} as const;
```

## Best Practices

1. **Gebruik duidelijke variabele namen** die zelfverklarend zijn
2. **Groepeer gerelateerde variabelen** onder dezelfde categorie (bijv. `patient.*`)
3. **Gebruik fallback waarden** (lege string) als data niet beschikbaar is
4. **Test variabelen** met verschillende data om edge cases te vinden
5. **Documenteer nieuwe variabelen** in dit bestand

## Speciale Functies

### Berekende Waarden

Sommige variabelen worden automatisch berekend:

- `{{patient.leeftijd}}` - Berekend uit geboortedatum
- `{{patient.volledige_naam}}` - Gecombineerd uit voornaam, tussenvoegsel, achternaam
- `{{patient.aanhef}}` - Bepaald op basis van geslacht
- `{{patient.volledig_adres}}` - Gecombineerd uit adres, postcode, woonplaats

### Datum Formatting

Datums worden automatisch geformatteerd:

- `{{vandaag}}` - "20-12-2025" (kort formaat)
- `{{vandaag_lang}}` - "20 december 2025" (lang formaat)
- `{{document.datum_lang}}` - Lang formaat van document datum

## Troubleshooting

### Variabelen worden niet vervangen

1. **Controleer spelling** - Variabelen zijn case-sensitive
2. **Controleer haakjes** - Moet exact `{{variabele}}` zijn
3. **Controleer context** - Data moet beschikbaar zijn in de context

### Nieuwe variabele toevoegen werkt niet

1. **Voeg toe aan alle 3 de plekken** - TEMPLATE_VARIABLES, replaceTemplateVariables(), TemplateVariableContext
2. **Herstart dev server** - TypeScript types worden dan opnieuw geladen
3. **Check de context** - Zorg dat de data wordt meegegeven waar de template wordt gebruikt

## Toekomstige Uitbreidingen

Mogelijke toekomstige features:

- [ ] Conditionele variabelen (bijv. `{{if patient.email}}...{{endif}}`)
- [ ] Loop variabelen (bijv. `{{foreach diagnoses}}...{{endforeach}}`)
- [ ] Formattering opties (bijv. `{{patient.naam|uppercase}}`)
- [ ] Berekeningen (bijv. `{{leeftijd + 10}}`)
- [ ] Custom functies (bijv. `{{format_date(vandaag, 'DD-MM-YYYY')}}`)
- [ ] Template preview met sample data
- [ ] Syntax highlighting voor variabelen in editor
- [ ] Auto-complete voor variabelen tijdens typen

## Changelog

### Versie 1.0.0 (20 december 2025)
- Initiele implementatie van het variabelen systeem
- 60+ standaard variabelen beschikbaar
- TemplateVariablesHelper component
- Integratie in Clinical Note Composer, Templates, en Standaardteksten
- Automatische vervanging bij template selectie
- Validatie functie voor onbekende variabelen
