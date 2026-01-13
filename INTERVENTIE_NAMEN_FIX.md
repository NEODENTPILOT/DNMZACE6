# Fix: Interventie Namen in Begroting

## Probleem
In de begroting werden interventies getoond als:
```
Interventie 5da5c329-cf0c-40c7-bd7f-e2056fe99b15
```

Dit is niet gebruiksvriendelijk - je ziet alleen de UUID in plaats van een herkenbare naam.

## Oplossing ✅

### 1. Interventie Titel Opslaan
Bij het toevoegen van UPT codes wordt nu de `interventie_naam` (titel) opgeslagen:

**In `NewBudgetModal.tsx`:**
```typescript
await supabase
  .from('begrotingen_v2_regels')
  .insert({
    // ... andere velden
    interventie_naam: interventie.titel,  // ← NIEUW
    upt_code: uptCodeRel.upt_code,
    // ...
  });
```

**In `budgetService.ts`:**
```typescript
items.push({
  // ... andere velden
  interventie_naam: interventie.titel,  // ← NIEUW
  upt_code: uptCode.upt_code,
  // ...
});
```

### 2. Slimme Nummering bij Duplicaten
Als er meerdere interventies met dezelfde naam zijn, krijgen ze automatisch een nummer:

**Voorbeeld:**
```
Implantaatplaatsing #1
Implantaatplaatsing #2
Endodontische behandeling #1
Endodontische behandeling #2
```

**Code:**
```typescript
// Count name occurrences
const nameCounts = new Map<string, number>();
interventieGroups.forEach((items, id) => {
  const name = items[0]?.interventie_naam || `Interventie ${id}`;
  nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
});

// Add number suffix if multiple interventies with same name
if (nameCounts.get(name)! > 1) {
  const currentIndex = (nameIndices.get(name) || 0) + 1;
  nameIndices.set(name, currentIndex);
  name = `${name} #${currentIndex}`;
}
```

### 3. Fallback voor Oude Data
Als er geen `interventie_naam` is opgeslagen (oude data), valt het terug op:
```typescript
const key = item.interventie_naam || `Interventie ${item.source_interventie_id}`;
```

## Resultaat

### Voor:
```
┌─────────────────────────────────────────┐
│ Interventie 5da5c329-cf0c-40c7-bd7f-... │
│   J43  Extractie...              € 45   │
│   J56  Implantaat...             € 850  │
└─────────────────────────────────────────┘
```

### Na:
```
┌─────────────────────────────────────────┐
│ Implantaatplaatsing #1                  │
│   J43  Extractie...              € 45   │
│   J56  Implantaat...             € 850  │
└─────────────────────────────────────────┘
```

## Test Stappen

1. **Refresh de app** (Ctrl+R)
2. **Maak een nieuwe begroting** (of gebruik "Vul vanuit interventies")
3. **Klik tab "Per interventie"**
4. **Zie interventie namen** in plaats van UUIDs ✨

**Voor bestaande begrotingen:**
- Oude regels tonen nog steeds de UUID (geen interventie_naam opgeslagen)
- Nieuwe regels tonen de interventie titel
- Gebruik "Vul vanuit interventies" opnieuw om oude begroting te refreshen

## Betrokken Files
- `src/components/NewBudgetModal.tsx`
- `src/services/budgetService.ts`

## Database Schema
De `begrotingen_v2_regels` tabel heeft het veld:
```sql
interventie_naam TEXT
```

Dit wordt nu gevuld met de interventie titel bij het aanmaken van budget regels.
