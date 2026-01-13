# Legacy Begrotingen Module Cleanup Rapportage

**Datum:** 2025-12-08
**Doel:** De oude "Begrotingen (direct)" module uit het UI menu verwijderen en beveiligen

---

## Uitgevoerde Stappen

### 1. Menu-Entry Verwijderd

**Bestand:** `src/components/Layout.tsx`

**Actie:** De volgende menu-entry is verwijderd uit de BEHEER sectie (regel 162):
```typescript
{ id: 'begrotingen', label: 'Begrotingen (direct)', icon: FileText }
```

**Resultaat:**
- De menu-entry "Begrotingen (direct)" is niet meer zichtbaar in de sidebar onder BEHEER
- Alleen "Begrotingen 2.0" (onder KWALITEIT) blijft zichtbaar voor gebruikers

---

### 2. Legacy Pagina Beveiligd

**Bestand:** `src/pages/Begrotingen.tsx`

**Actie:** De volledige legacy implementatie is vervangen door een `DeprecatedPageNotice` component.

**Nieuwe Implementatie:**
```typescript
import { DeprecatedPageNotice } from '../components/DeprecatedPageNotice';

interface BegrotingenProps {
  onNavigate?: (page: string) => void;
}

export function Begrotingen({ onNavigate }: BegrotingenProps) {
  return (
    <DeprecatedPageNotice
      pageName="Begrotingen (direct)"
      replacementPage="begrotingen-v2"
      replacementLabel="Ga naar Begrotingen 2.0"
      onNavigate={onNavigate}
    />
  );
}
```

**Resultaat:**
- Als een gebruiker via directe URL naar de legacy route navigeert, krijgen ze een nette melding
- De melding bevat een knop om naar de nieuwe "Begrotingen 2.0" module te gaan
- Er is geen crash of foutmelding, alleen een informatieve deprecation notice

---

### 3. App.tsx Routing Geüpdatet

**Bestand:** `src/App.tsx`

**Actie:** De `onNavigate` prop is toegevoegd aan de Begrotingen component:
```typescript
// Regel 232
{currentPage === 'begrotingen' && <Begrotingen onNavigate={handleNavigate} />}
```

**Resultaat:** De "Ga naar Begrotingen 2.0" knop werkt correct en navigeert naar de nieuwe module.

---

### 4. UI Links Gecontroleerd

**Actie:** Gezocht naar alle verwijzingen naar de legacy 'begrotingen' route in de codebase.

**Resultaat:**
- Er zijn GEEN directe navigatie calls gevonden buiten de menu-entry
- Alle andere referenties zijn naar `begrotingen-v2` (de nieuwe module) of bestandsnamen
- Geen verdere wijzigingen nodig

---

## Verificatie

### Build Status
- ✅ Project bouwt succesvol zonder errors
- ✅ Geen TypeScript fouten
- ✅ Alle imports en componenten correct

### Verwacht Gebruikersgedrag

**Scenario 1: Normale Gebruiker**
- Ziet ALLEEN "Begrotingen 2.0" in het KWALITEIT menu
- Heeft geen toegang meer tot de legacy module via UI

**Scenario 2: Directe URL Toegang**
- Als iemand navigeert naar de oude route (bijv. via bookmark):
  - Ziet een professionele deprecation notice
  - Krijgt uitleg waarom de module uitgefaseerd is
  - Kan met één klik naar de nieuwe "Begrotingen 2.0" module

**Scenario 3: Bestaande Data**
- Alle data in de database blijft intact
- Oude begrotingen zijn nog steeds opvraagbaar via de nieuwe interface
- Geen data verlies of migratie nodig

---

## Impact

### Wat is Verwijderd
- Menu-entry "Begrotingen (direct)" uit BEHEER sectie
- Directe UI toegang tot de legacy module
- Oude UI implementatie (vervangen door deprecation notice)

### Wat is Behouden
- De route zelf (voor backwards compatibility)
- Alle database data
- Volledige functionaliteit via "Begrotingen 2.0"

### Wat is Ongewijzigd
- "Begrotingen 2.0" module onder KWALITEIT
- Alle nieuwe budget flows via NewBudgetModal
- Database schema en queries

---

## Vervolgstappen (Optioneel)

**Later uitfaseren:**
1. Na 3-6 maanden zonder gebruik: volledig verwijderen van de route uit App.tsx
2. Analytics toevoegen om te monitoren of de legacy route nog wordt bezocht
3. Eventueel een 404 of redirect implementeren als niemand de route meer gebruikt

**Voorlopig:**
- Laat de deprecation notice staan
- Monitor of gebruikers hierop stuiten
- Behoud backwards compatibility

---

## Conclusie

De legacy "Begrotingen (direct)" module is succesvol uit het zicht gehaald. Gebruikers worden nu automatisch naar de nieuwe "Begrotingen 2.0" module geleid, met een nette fallback voor edge cases. De cleanup is compleet en productie-klaar.
