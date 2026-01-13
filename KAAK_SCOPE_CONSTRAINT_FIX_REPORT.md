# Kaak Scope Check Constraint Fix Rapportage

**Datum:** 2025-12-08
**Bug:** `"violates check constraint 'behandelplan_templates_kaak_scope_check'"`
**Locatie:** ICE Template Builder / TemplateMetadataEditor

---

## Probleem Analyse

### Foutmelding
```
Fout bij opslaan: new row for relation "behandelplan_templates"
violates check constraint "behandelplan_templates_kaak_scope_check"
```

### Root Cause

De database check constraint staat alleen deze waarden toe:
- ✅ `'BK'` (Bovenkaak)
- ✅ `'OK'` (Onderkaak)
- ✅ `'BKOK'` (Beide kaken)
- ✅ `NULL` (Niet specifiek)

Maar de Template Builder UI stuurde **verkeerde waarden**:
- ❌ `'boven'`
- ❌ `'onder'`
- ❌ `'beide'`

---

## Database Schema

### Check Constraint Definitie

**Bestand:** `supabase/migrations/20251207072958_add_kaak_scope_to_behandelplan_system.sql`

```sql
-- Add kaak_scope to behandelplan_templates
ALTER TABLE behandelplan_templates
ADD COLUMN IF NOT EXISTS kaak_scope text
CHECK (kaak_scope IN ('BK', 'OK', 'BKOK'));

-- Comment explaining the values
COMMENT ON COLUMN behandelplan_templates.kaak_scope IS
  'Jaw scope: BK (upper jaw), OK (lower jaw), BKOK (both jaws), NULL (not applicable)';
```

**Betekenis van de waarden:**
- `'BK'` = **B**oven**k**aak (upper jaw / maxilla)
- `'OK'` = **O**nder**k**aak (lower jaw / mandibula)
- `'BKOK'` = **B**oven**k**aak + **O**nder**k**aak (both jaws)
- `NULL` = Niet specifiek / niet van toepassing

---

## Frontend Fix

### Aangepast Bestand
`src/features/ice-template-builder/components/TemplateMetadataEditor.tsx`

### Toegevoegde Type Definitie

```typescript
/**
 * Database kaak_scope values as defined in check constraint:
 * CHECK (kaak_scope IN ('BK', 'OK', 'BKOK'))
 * - 'BK' = Bovenkaak (upper jaw)
 * - 'OK' = Onderkaak (lower jaw)
 * - 'BKOK' = Beide kaken (both jaws)
 * - NULL = Niet specifiek (not applicable)
 */
type KaakScopeDbValue = 'BK' | 'OK' | 'BKOK' | '';

const KAAK_SCOPE_OPTIONS: { label: string; value: KaakScopeDbValue }[] = [
  { label: 'Niet specifiek', value: '' },
  { label: 'Bovenkaak', value: 'BK' },
  { label: 'Onderkaak', value: 'OK' },
  { label: 'Beide kaken', value: 'BKOK' },
];
```

### Voor de Fix

```tsx
<select value={kaakScope} onChange={(e) => setKaakScope(e.target.value)}>
  <option value="">Niet specifiek</option>
  <option value="boven">Bovenkaak</option>     {/* ❌ FOUT */}
  <option value="onder">Onderkaak</option>     {/* ❌ FOUT */}
  <option value="beide">Beide kaken</option>   {/* ❌ FOUT */}
</select>
```

### Na de Fix

```tsx
<select
  value={kaakScope}
  onChange={(e) => setKaakScope(e.target.value as KaakScopeDbValue)}
>
  {KAAK_SCOPE_OPTIONS.map(option => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ))}
</select>
```

**Nu worden de juiste database waarden verstuurd:**
- Label: "Bovenkaak" → Waarde: `'BK'` ✅
- Label: "Onderkaak" → Waarde: `'OK'` ✅
- Label: "Beide kaken" → Waarde: `'BKOK'` ✅

### Save Functie Update

```typescript
async function handleSave() {
  // Ensure kaak_scope is one of the valid values or null
  const cleanKaakScope = kaakScope && kaakScope !== '' ? kaakScope : null;

  const updates = {
    naam,
    categorie,
    kaak_scope: cleanKaakScope,  // ✅ Now always valid: 'BK', 'OK', 'BKOK', or null
    template_rationale: templateRationale || null,
    auto_title_pattern: autoTitlePattern || null,
    updated_at: new Date().toISOString()
  };

  console.log('[DEBUG] Saving template with kaak_scope:', cleanKaakScope);

  // ... rest of save logic
}
```

---

## Data Normalisatie

### Database Migratie Toegepast

**Migratie:** `normalize_kaak_scope_values`

Alle bestaande templates en behandelplannen met verkeerde waarden zijn automatisch genormaliseerd:

```sql
-- Normalize behandelplan_templates.kaak_scope
UPDATE behandelplan_templates
SET kaak_scope = 'BK'
WHERE kaak_scope = 'boven';

UPDATE behandelplan_templates
SET kaak_scope = 'OK'
WHERE kaak_scope = 'onder';

UPDATE behandelplan_templates
SET kaak_scope = 'BKOK'
WHERE kaak_scope = 'beide';

-- Also normalize behandelplannen.kaak_scope (instances)
UPDATE behandelplannen
SET kaak_scope = 'BK'
WHERE kaak_scope = 'boven';

UPDATE behandelplannen
SET kaak_scope = 'OK'
WHERE kaak_scope = 'onder';

UPDATE behandelplannen
SET kaak_scope = 'BKOK'
WHERE kaak_scope = 'beide';
```

---

## Andere Componenten Gecontroleerd

De volgende componenten gebruikten **al** de juiste waarden en hoefden niet aangepast:

### ✅ BehandelplanIntegraalModal.tsx
```typescript
kaak_scope: null as 'BK' | 'OK' | 'BKOK' | null,

// Buttons gebruiken de juiste waarden
onClick={() => setFormData({ ...formData, kaak_scope: 'BK' })}
onClick={() => setFormData({ ...formData, kaak_scope: 'OK' })}
onClick={() => setFormData({ ...formData, kaak_scope: 'BKOK' })}
```

### ✅ BehandelplanPassantVerwezenModal.tsx
```typescript
kaak_scope: null as 'BK' | 'OK' | 'BKOK' | null,

// Buttons gebruiken de juiste waarden
onClick={() => setFormData({ ...formData, kaak_scope: 'BK' })}
onClick={() => setFormData({ ...formData, kaak_scope: 'OK' })}
onClick={() => setFormData({ ...formData, kaak_scope: 'BKOK' })}
```

### ✅ ICEFlowTest.tsx
```typescript
kaak_scope: templates.kaak_scope,  // Gebruikt template waarden direct
```

---

## Validatie & Testing

### Build Status
- ✅ Project bouwt succesvol zonder errors
- ✅ Geen TypeScript fouten
- ✅ Alle imports en dependencies correct

### Verwacht Gedrag

**Voor de Fix:**
```
Gebruiker selecteert "Beide kaken" in Template Builder
→ UI stuurt value: "beide"
→ Database: ❌ CHECK CONSTRAINT VIOLATION
→ Foutmelding: "violates check constraint"
```

**Na de Fix:**
```
Gebruiker selecteert "Beide kaken" in Template Builder
→ UI stuurt value: "BKOK"
→ Database: ✅ ACCEPTED (voldoet aan constraint)
→ Template succesvol opgeslagen
```

### Debug Logging

In de browser console zie je nu:
```
[DEBUG] Saving template with kaak_scope: "BKOK"
```

of

```
[DEBUG] Saving template with kaak_scope: null
```

---

## Type Safety Voordelen

Met de nieuwe TypeScript types is het **onmogelijk** om per ongeluk een verkeerde waarde te sturen:

```typescript
type KaakScopeDbValue = 'BK' | 'OK' | 'BKOK' | '';

// ✅ Compiler accepteert alleen deze waarden
const scope1: KaakScopeDbValue = 'BK';
const scope2: KaakScopeDbValue = 'BKOK';
const scope3: KaakScopeDbValue = '';

// ❌ Compiler error bij verkeerde waarde
const scope4: KaakScopeDbValue = 'boven';  // Type Error!
```

---

## Best Practices Toegepast

### 1. Type Safety
- ✅ Expliciete TypeScript type voor database waarden
- ✅ Enum-achtige structuur met constante mapping
- ✅ Compile-time validatie

### 2. Code Documentatie
```typescript
/**
 * Database kaak_scope values as defined in check constraint:
 * CHECK (kaak_scope IN ('BK', 'OK', 'BKOK'))
 * ...
 */
```

### 3. UI/UX Consistency
- ✅ Labels in UI zijn gebruiksvriendelijk ("Bovenkaak", "Onderkaak")
- ✅ Database waarden zijn technisch en consistent ('BK', 'OK', 'BKOK')
- ✅ Clean separation of concerns

### 4. Data Integrity
- ✅ Bestaande data genormaliseerd via migratie
- ✅ Geen data loss
- ✅ Backwards compatible

---

## Extra: Informatief Paneel voor Element & Sextant

**Toegevoegd aan:** `TemplateMetadataEditor.tsx`

Een nieuw informatief paneel is toegevoegd om gebruikers te helpen begrijpen wat Element en Sextant betekenen in de tandheelkundige context:

### Paneel Inhoud

```tsx
<div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
  <h4 className="font-semibold text-sm text-blue-900 mb-3">
    Tandnummering & Anatomische Indeling
  </h4>
  <div className="space-y-3 text-xs text-blue-800">
    <div>
      <strong className="block mb-1">Element (Tandnummer):</strong>
      <p className="text-blue-700">
        FDI-notatie: 11-18 (rechts boven), 21-28 (links boven),
        31-38 (links onder), 41-48 (rechts onder).
        Gebruik voor behandelingen die specifiek zijn voor één tand of tandgroep.
      </p>
    </div>
    <div>
      <strong className="block mb-1">Sextant (1 t/m 6):</strong>
      <p className="text-blue-700">
        Voor parodontale behandelingen: Sextant 1 (rechts boven),
        2 (midden boven), 3 (links boven), 4 (links onder),
        5 (midden onder), 6 (rechts onder).
        Bijvoorbeeld: "Subgingivale scaling per sextant" of
        "Wortelplaning per sextant".
      </p>
    </div>
    <div className="pt-2 border-t border-blue-200">
      <p className="text-blue-700 italic">
        💡 Deze begrippen worden gebruikt in interventies en
        UPT-codes binnen dit template.
      </p>
    </div>
  </div>
</div>
```

### Wat Dit Paneel Doet

1. **Educatief**: Legt uit wat Element (tandnummer) betekent in FDI-notatie
2. **Praktisch**: Geeft duidelijke voorbeelden van sextant-indeling voor parodontale behandelingen
3. **Contextueel**: Helpt gebruikers begrijpen hoe deze begrippen worden gebruikt in templates

### FDI Tandnummering Uitgelegd

**Element** verwijst naar individuele tanden volgens de FDI-notatie:

| Kwadrant | Beschrijving | Nummering |
|----------|-------------|-----------|
| Kwadrant 1 | Rechts boven | 11-18 |
| Kwadrant 2 | Links boven | 21-28 |
| Kwadrant 3 | Links onder | 31-38 |
| Kwadrant 4 | Rechts onder | 41-48 |

**Voorbeelden:**
- Element 11 = Rechter boven centrale incisief
- Element 16 = Rechter boven eerste molaar
- Element 36 = Linker onder eerste molaar

### Sextant Indeling (1-6)

Voor **parodontale** behandelingen wordt het gebit verdeeld in 6 sextanten:

```
        BOVENKAAK
   3    |    2    |    1
  _____ | _______ | _____
Sextant 3   Sextant 2   Sextant 1
(Links)     (Midden)    (Rechts)
  28-24       23-13       12-18
─────────────────────────────────
  38-34       33-43       42-48
Sextant 4   Sextant 5   Sextant 6
(Links)     (Midden)    (Rechts)
   4    |    5    |    6
        ONDERKAAK
```

**Gebruik in UPT-codes:**
- `G11`: Subgingivale scaling per sextant
- `G21`: Wortelplaning per sextant

Dit betekent dat de behandeling wordt uitgevoerd op alle tanden binnen één sextant (meestal 4-5 tanden).

---

## Conclusie

De kaak_scope check constraint bug is volledig opgelost:

1. ✅ **Database Constraint Geïdentificeerd**
   - Toegestane waarden: `'BK'`, `'OK'`, `'BKOK'`, `NULL`

2. ✅ **Frontend Aangepast**
   - Template Builder stuurt nu correcte waarden
   - Type-safe implementatie met TypeScript
   - Debug logging toegevoegd

3. ✅ **Bestaande Data Genormaliseerd**
   - Database migratie toegepast
   - Alle templates en behandelplannen bijgewerkt
   - Verkeerde waarden ('boven', 'onder', 'beide') omgezet naar correcte ('BK', 'OK', 'BKOK')

4. ✅ **Andere Componenten Geverifieerd**
   - BehandelplanIntegraalModal ✅
   - BehandelplanPassantVerwezenModal ✅
   - Alle andere modals gebruiken al de juiste waarden

De fout "violates check constraint" zou nu niet meer moeten optreden bij het opslaan van templates in de Template Builder!
