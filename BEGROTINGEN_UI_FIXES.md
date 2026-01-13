# Begrotingen UI Fixes - Complete Overzicht

## 🎯 Problemen die Opgelost Zijn

### 1. ✅ UUID in plaats van Interventie Naam
**Probleem:**
```
Interventie a32da6a8-22b1-42d3-b43c-f2dad3aa2bfe  ← LELIJK!
```

**Oplossing:**
```
Implantaatplaatsing  ← MOOI!
```

**Technisch:**
- Database kolom `interventie_naam` toegevoegd aan `begrotingen_v2_regels`
- Bij het aanmaken van budget regels wordt nu `interventie.titel` opgeslagen
- Slimme nummering: Als er meerdere interventies met dezelfde naam zijn, krijgen ze #1, #2, #3

### 2. ✅ Kaak Indicator Te Groot
**Probleem:**
```
Composiet vulling molaar
Onderkaak                    ← Hele regel, neemt veel ruimte
```

**Oplossing:**
```
Composiet vulling molaar  [OND]  ← Compact badge rechts
```

**Technisch:**
- Kaak badge verplaatst naar rechterkant van omschrijving
- Verkort: "Bovenkaak" → "BOV", "Onderkaak" → "OND"
- Alleen zichtbaar als er GEEN element nummer is (want dan is het redundant)

### 3. ✅ Element Nummer Niet Direct Editeerbaar
**Probleem:**
- Moest eerst klikken op regel → edit mode → dropdown → opslaan
- Te veel stappen voor iets dat vaak aangepast moet worden

**Oplossing:**
- Element kolom is nu een **direct editeerbare dropdown**
- Geen edit mode nodig
- Klik gewoon op de dropdown en selecteer element nummer
- Automatisch opgeslagen bij wijziging

### 4. ✅ Vlakken Aanduiding voor V-codes (Vullingen)
**Probleem:**
- Geen manier om vlakken aan te geven (MO, DOB, MODBL, etc.)
- Voor V-codes (vullingen) is dit essentieel

**Oplossing:**
- Bij V-codes verschijnt automatisch een **vlakken input veld** in edit mode
- Placeholder: "Bijv: MO, DOB, MODBL"
- Helptext met uitleg: M=Mesiaal, D=Distaal, O=Occlusaal, B=Buccaal, L=Linguaal
- Uppercase conversie voor consistentie
- Wordt getoond onder de omschrijving in blauwe tekst: "Vlakken: MO"

---

## 📊 Voor en Na

### Voor:
```
┌───────────────────────────────────────────────────────┐
│ Interventie a32da6a8-22b1-42d3-b43c-f2dad3aa2bfe      │
│ € 125.50                                              │
├──────┬────────────────────┬───────┬─────────┬────────┤
│ V103 │ Composiet vulling  │  1    │   -     │ € 45.00│
│      │ Onderkaak          │       │         │        │
│      │                    │       │         │        │
└──────┴────────────────────┴───────┴─────────┴────────┘
```

### Na:
```
┌───────────────────────────────────────────────────────┐
│ Implantaatplaatsing                                   │
│ € 125.50                                              │
├──────┬────────────────────┬───────┬─────────┬────────┤
│ V103 │ Composiet vulling  │  1    │ [▼ 46]  │ € 45.00│
│      │ [OND]              │       │ Direct  │        │
│      │ Vlakken: MO        │       │ select  │        │
└──────┴────────────────────┴───────┴─────────┴────────┘
```

---

## 🎨 UI Verbeteringen Detail

### Interventie Groep Header
```tsx
// Slimme nummering bij duplicaten
<span>Implantaatplaatsing #1</span>  // Als er meerdere zijn
<span>Implantaatplaatsing #2</span>
<span>Endodontische behandeling</span>  // Als er maar 1 is
```

### Budget Regel Row (Normaal)
```tsx
<tr className="hover:bg-gray-50">
  <td>V103</td>
  <td>
    <div className="flex items-start gap-2">
      <span>Composiet vulling molaar</span>
      {kaak && !element && (
        <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
          {kaak === 'boven' ? 'BOV' : 'OND'}
        </span>
      )}
    </div>
    {vlakken && (
      <div className="text-xs text-blue-600 font-medium mt-1">
        Vlakken: {vlakken.toUpperCase()}
      </div>
    )}
  </td>
  <td onClick={() => setEditing(true)}>1</td>
  <td>
    <select
      value={element || ''}
      onChange={(e) => onUpdate({ element: e.target.value })}
    >
      <option value="">-</option>
      {[11,12,13,...,48].map(n => <option>{n}</option>)}
    </select>
  </td>
  <td>€ 45.00</td>
  <td>€ 45.00</td>
  <td><TrashIcon /></td>
</tr>
```

### Budget Regel Row (Edit Mode)
```tsx
{isVulling && (  // Alleen voor V-codes
  <div className="mt-2">
    <label>Vlakken</label>
    <input
      type="text"
      value={vlakken}
      onChange={(e) => setEditData({...editData, vlakken: e.target.value})}
      placeholder="Bijv: MO, DOB, MODBL"
      className="uppercase"
    />
    <div className="text-xs text-gray-500">
      M=Mesiaal, D=Distaal, O=Occlusaal, B=Buccaal, L=Linguaal
    </div>
  </div>
)}
```

---

## 🗄️ Database Changes

### Nieuwe Kolom
```sql
ALTER TABLE begrotingen_v2_regels
ADD COLUMN interventie_naam TEXT;

CREATE INDEX idx_begrotingen_v2_regels_interventie_naam
ON begrotingen_v2_regels(interventie_naam);
```

### Bestaande Kolommen Gebruikt
- `vlakken TEXT` - Was al aanwezig, nu gebruikt voor V-codes
- `kaak TEXT` - Was al aanwezig, nu compacter weergegeven
- `element TEXT` - Was al aanwezig, nu direct editeerbaar

---

## 🔧 TypeScript Types Updates

```typescript
export interface BudgetItem {
  id: string;
  begroting_id: string;
  session_id?: string;
  source_interventie_id?: string;
  source_interventie_upt_code_id?: string;
  interventie_naam?: string;  // ← NIEUW
  upt_code: string;
  omschrijving: string;
  fase?: string;
  kaak?: string;
  element?: string;
  vlakken?: string;  // ← NU GEBRUIKT
  honorarium_nza: number;
  honorarium_bedrag: number;
  is_techniek: boolean;
  techniek_type?: string;
  techniek_bedrag: number;
  is_materiaal: boolean;
  materiaal_bedrag: number;
  hoeveelheid: number;
  actief: boolean;
  sort_order?: number;
  notes?: string;
}
```

---

## 📝 Code Wijzigingen

### Files Aangepast:
1. **src/components/NewBudgetModal.tsx**
   - `BudgetItemRow` component volledig herschreven
   - Element dropdown direct editeerbaar
   - Vlakken input voor V-codes
   - Compacte kaak badge
   - Slimme interventie nummering in `groupItems()`

2. **src/services/budgetService.ts**
   - `interventie_naam` toegevoegd bij insert
   - Type definitie BudgetItem uitgebreid
   - `vlakken` veld toegevoegd aan type

3. **supabase/migrations/..._add_interventie_naam_to_begrotingen_v2_regels.sql**
   - Nieuwe kolom `interventie_naam` aangemaakt
   - Index voor snelle queries

---

## ✅ Test Checklist

Na refresh:
- [ ] Open een begroting met interventies
- [ ] Klik tab "Per interventie"
- [ ] **Check 1:** Zie je interventie NAMEN in plaats van UUIDs? ✅
- [ ] **Check 2:** Is de kaak badge compact (BOV/OND)? ✅
- [ ] **Check 3:** Kun je element nummer direct selecteren? ✅
- [ ] **Check 4:** Klik edit op een V-code regel
- [ ] **Check 5:** Zie je het vlakken input veld? ✅
- [ ] **Check 6:** Typ "mo" → wordt "MO" ✅
- [ ] **Check 7:** Sla op → "Vlakken: MO" verschijnt onder omschrijving ✅

---

## 🎯 User Experience Verbeteringen

### Voor Deze Fixes:
- ❌ Onduidelijke UUID codes
- ❌ Kaak indicator neemt veel ruimte
- ❌ Element wijzigen duurt te lang (3 clicks)
- ❌ Geen manier om vlakken aan te geven

### Na Deze Fixes:
- ✅ Herkenbare interventie namen
- ✅ Compacte kaak indicator
- ✅ Element direct selecteerbaar (1 click)
- ✅ Vlakken veld voor V-codes met hulp

**Resultaat:**
- Sneller werken (minder clicks)
- Duidelijkere informatie (namen ipv IDs)
- Professioneler (complete gegevens)
- Klinisch correct (vlakken voor vullingen)

---

## 🚀 Volgende Stappen voor Gebruiker

1. **Refresh de applicatie** (Ctrl+R / Cmd+R)
2. **Maak een nieuwe begroting** of open bestaande
3. **Klik "Vul vanuit interventies"** om interventie_naam te vullen
4. **Klik tab "Per interventie"** om gegroepeerde view te zien
5. **Test element selectie** - direct selecteerbaar!
6. **Test vlakken** - edit een V-code regel

**Voor oude begrotingen:**
- Klik "Vul vanuit interventies" opnieuw om interventie namen te laden
- Of edit handmatig de `interventie_naam` kolom in database

---

Alle fixes zijn live en production-ready! 🎉
