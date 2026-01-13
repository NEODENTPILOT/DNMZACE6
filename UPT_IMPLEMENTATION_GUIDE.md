# UPT Integration - Complete Implementation Guide

## ✅ Foundation Complete

### What's Ready:
1. ✅ Database columns added (kaak, element, is_materiaal)
2. ✅ TypeScript types created (`src/types/upt.ts`)
3. ✅ Mapping functions implemented
4. ✅ PriceDeltaBadge component created
5. ✅ UPT Master data utility created
6. ✅ Build succeeds

---

## 🎯 UI Implementation Steps

### Step 1: Update ProcedureUptCodesManager

**File:** `src/components/ProcedureUptCodesManager.tsx` (if exists, or create in Verrichtingen component)

**Add these columns to the table:**

```tsx
<table>
  <thead>
    <tr>
      <th>⭐</th>
      <th>Code</th>
      <th>Omschrijving</th>
      <th>Bedrag</th>              {/* With PriceDeltaBadge */}
      <th>Aantal</th>
      <th>M</th>                   {/* NEW: Materiaal checkbox */}
      <th>Kaak</th>                {/* NEW: Dropdown */}
      <th>Element</th>             {/* NEW: Text input */}
      <th>Type</th>
      <th>Actief</th>
      <th>Acties</th>
    </tr>
  </thead>
  <tbody>
    {codes.map(code => (
      <tr key={code.id}>
        {/* Star for primary */}
        <td>
          <button onClick={() => handleSetPrimary(code.id)}>
            <Star fill={code.is_primair ? 'currentColor' : 'none'} />
          </button>
        </td>

        {/* Code + Set Badge */}
        <td>
          <code>{code.upt_code}</code>
          {code.upt_set_naam && (
            <span className="badge-set">
              {code.upt_set_naam}
            </span>
          )}
        </td>

        {/* Description */}
        <td>{code.omschrijving_override || '-'}</td>

        {/* Bedrag + Badge */}
        <td>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              value={code.standaard_bedrag || ''}
              onChange={(e) => handleUpdateBedrag(code.id, parseFloat(e.target.value))}
            />
            <PriceDeltaBadge
              bedragNZa={getNZaTarief(code.upt_code)}
              bedragActueel={code.standaard_bedrag}
              prijsDeltaPct={calculateDelta(code)}
            />
          </div>
        </td>

        {/* Aantal */}
        <td>
          <input
            type="number"
            min="1"
            value={code.standaard_aantal}
            onChange={(e) => handleUpdateAantal(code.id, parseInt(e.target.value))}
          />
        </td>

        {/* M (Materiaal) - NEW! */}
        <td>
          <input
            type="checkbox"
            checked={code.is_materiaal || false}
            onChange={(e) => handleUpdateMateriaal(code.id, e.target.checked)}
            title="Materiaalcomponent (extra materiaalkosten)"
          />
        </td>

        {/* Kaak - NEW! */}
        <td>
          <select
            value={code.kaak || 'geen'}
            onChange={(e) => handleUpdateKaak(code.id, e.target.value)}
          >
            <option value="geen">Geen</option>
            <option value="boven">Boven</option>
            <option value="onder">Onder</option>
            <option value="beide">Beide</option>
          </select>
        </td>

        {/* Element - NEW! */}
        <td>
          <input
            type="text"
            value={code.element || ''}
            onChange={(e) => handleUpdateElement(code.id, e.target.value)}
            placeholder="16"
            maxLength={10}
          />
        </td>

        {/* Type */}
        <td>
          <select
            value={getCodeType(code)}
            onChange={(e) => handleUpdateType(code.id, e.target.value)}
          >
            <option value="verplicht">Verplicht</option>
            <option value="optioneel">Optioneel</option>
            <option value="techniek">Techniek</option>
          </select>
        </td>

        {/* Actief */}
        <td>
          <input
            type="checkbox"
            checked={code.actief}
            onChange={() => handleToggleActief(code.id, code.actief)}
          />
        </td>

        {/* Delete */}
        <td>
          <button onClick={() => handleDelete(code.id)}>
            <Trash2 />
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

---

### Step 2: Add New Handlers

```typescript
// Import utilities
import { loadUptMasterData, getUptMaster } from '../utils/uptMasterData';
import { mapProcedureUptCodeToViewModel } from '../types/upt';
import { PriceDeltaBadge } from './PriceDeltaBadge';

// Load master data on mount
useEffect(() => {
  loadUptMasterData();
}, []);

// Handler: Update Materiaal
async function handleUpdateMateriaal(id: string, isMateriaal: boolean) {
  setSavingId(id);

  const { error } = await supabase
    .from('procedure_upt_codes')
    .update({
      is_materiaal: isMateriaal,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (!error) {
    setCodes(codes.map(c => c.id === id ? { ...c, is_materiaal: isMateriaal } : c));
  }

  setSavingId(null);
}

// Handler: Update Kaak
async function handleUpdateKaak(id: string, kaak: string) {
  setSavingId(id);

  const { error } = await supabase
    .from('procedure_upt_codes')
    .update({
      kaak: kaak,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (!error) {
    setCodes(codes.map(c => c.id === id ? { ...c, kaak } : c));
  }

  setSavingId(null);
}

// Handler: Update Element
async function handleUpdateElement(id: string, element: string) {
  setSavingId(id);

  const { error } = await supabase
    .from('procedure_upt_codes')
    .update({
      element: element || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (!error) {
    setCodes(codes.map(c => c.id === id ? { ...c, element } : c));
  }

  setSavingId(null);
}

// Handler: Update Bedrag (override)
async function handleUpdateBedrag(id: string, bedrag: number | null) {
  setSavingId(id);

  const { error } = await supabase
    .from('procedure_upt_codes')
    .update({
      standaard_bedrag: bedrag,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (!error) {
    setCodes(codes.map(c => c.id === id ? { ...c, standaard_bedrag: bedrag } : c));
  }

  setSavingId(null);
}

// Helper: Calculate price delta
function calculateDelta(code: any): number | null {
  const master = getUptMaster(code.upt_code);
  if (!master || !master.tariefNZa) return null;

  const bedragActueel = code.standaard_bedrag !== null ? code.standaard_bedrag : master.tariefNZa;
  const epsilon = 0.01;

  if (Math.abs(bedragActueel - master.tariefNZa) < epsilon) return null;

  return Math.round(((bedragActueel / master.tariefNZa) - 1) * 1000) / 10;
}

// Helper: Get NZa tarief
function getNZaTarief(code: string): number | null {
  const master = getUptMaster(code);
  return master?.tariefNZa || null;
}
```

---

### Step 3: Update handleAddStandardSet

**Copy kaak, element, is_materiaal from set to procedure:**

```typescript
async function handleAddStandardSet(setId: string, items: any[]) {
  // ... existing code ...

  for (const item of items) {
    const master = getUptMaster(item.upt_code);

    const newCode = {
      procedure_id: procedureId,
      upt_code: item.upt_code,
      omschrijving_override: master?.omschrijving || null,
      standaard_bedrag: master?.tariefNZa || null,
      standaard_aantal: item.default_aantal || 1,
      is_techniek: item.is_techniek || false,
      is_verplicht: item.is_verplicht !== false,
      is_materiaal: item.is_materiaal || master?.heeft_materiaal || false, // NEW!
      kaak: item.default_kaak || 'geen',                                    // NEW!
      element: item.default_element || null,                                 // NEW!
      is_primair: codes.length === 0 && i === 0,
      sort_order: maxSortOrder + i + 1,
      actief: true,
      upt_set_id: setId,
      upt_set_item_id: item.id || null
    };

    await supabase.from('procedure_upt_codes').insert(newCode);
  }

  // ... rest of code ...
}
```

---

### Step 4: Update UPT Standaardsets Page

**File:** `src/pages/UptStandaardsets.tsx` (or similar)

**Add M column to the set items table:**

```tsx
<table>
  <thead>
    <tr>
      <th>Code</th>
      <th>Omschrijving</th>
      <th>Bedrag</th>
      <th>Aantal</th>
      <th>M</th>         {/* NEW! */}
      <th>Kaak</th>
      <th>Element</th>
      <th>V</th>
      <th>T</th>
      <th>Acties</th>
    </tr>
  </thead>
  <tbody>
    {setItems.map(item => (
      <tr key={item.id}>
        {/* ... existing columns ... */}

        {/* M column - NEW! */}
        <td>
          <input
            type="checkbox"
            checked={item.is_materiaal || false}
            onChange={(e) => updateSetItem(item.id, { is_materiaal: e.target.checked })}
            title="Materiaalcomponent"
          />
        </td>

        {/* ... rest of columns ... */}
      </tr>
    ))}
  </tbody>
</table>
```

---

### Step 5: Price Badge Legend

**Add below the UPT table:**

```tsx
<div className="flex items-center gap-4 text-xs text-gray-600 mt-4">
  <div className="flex items-center gap-2">
    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800">
      −X%
    </span>
    <span>Lager dan NZa (vrijheid tariefstelling)</span>
  </div>
  <div className="flex items-center gap-2">
    <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
      +X%
    </span>
    <span>Hoger dan NZa (check regels)</span>
  </div>
</div>
```

---

## 🧪 Testing Checklist

### Test 1: Standard Set with All Features
```
1. Create set "Implantaat + kroon"
2. Add codes with:
   - J45: kaak=boven, element=16, M=yes, override bedrag -10%
   - C15: verplicht, no override
   - R10: techniek, M=no
3. Add set to procedure
4. Verify all columns copied correctly
5. Verify badges show correct percentages
```

### Test 2: Per-Procedure Customization
```
1. Open procedure with codes from set
2. Edit:
   - Change aantal: 1 → 2
   - Change kaak: boven → onder
   - Change element: 16 → 46
   - Toggle M: on → off
   - Change bedrag: €83.23 → €75.00
3. Save and reload
4. Verify all changes persisted
5. Verify badge updated (−9.9%)
6. Verify original set unchanged
```

### Test 3: Price Badges
```
1. Code with bedrag = NZa → No badge
2. Code with bedrag < NZa → Green badge (−X%)
3. Code with bedrag > NZa → Orange badge (+X%)
4. Code without NZa tarief → Gray text "Geen NZa-tarief"
```

### Test 4: Calculations
```
1. Add 3 codes: €100, €50, €25
2. Set amounts: 1, 2, 1
3. Expected total: €100 + €100 + €25 = €225
4. Deactivate middle code
5. Expected total: €100 + €25 = €125
6. Change first to techniek
7. Expected total: €125 (no techniek in total)
```

---

## 📊 Column Summary

### All Columns Now Available:

| Column | Verrichtingen 2.0 | UPT Standaardsets | Type | Editable |
|--------|-------------------|-------------------|------|----------|
| ⭐ Primair | ✅ | ❌ | Button | Yes |
| Code | ✅ | ✅ | Text | No |
| Omschrijving | ✅ | ✅ | Text | No |
| Bedrag | ✅ | ✅ | Number + Badge | Yes |
| Aantal | ✅ | ✅ | Number | Yes |
| **M (Materiaal)** | ✅ | ✅ | Checkbox | **Yes** |
| **Kaak** | ✅ | ✅ | Dropdown | **Yes** |
| **Element** | ✅ | ✅ | Text | **Yes** |
| Type (V/O/T) | ✅ | ✅ | Dropdown | Yes |
| Actief | ✅ | ❌ | Checkbox | Yes |
| Acties | ✅ | ✅ | Button | Yes |

**✅ Fully Consistent!**

---

## 🎨 Styling Reference

### Badge Classes:
```css
/* Green: Lower than NZa */
.badge-price-lower {
  @apply bg-green-100 text-green-800 border-green-200;
}

/* Orange: Higher than NZa */
.badge-price-higher {
  @apply bg-orange-100 text-orange-800 border-orange-200;
}

/* Gray: No NZa */
.badge-no-nza {
  @apply bg-gray-100 text-gray-600;
}

/* Set origin badge */
.badge-set {
  @apply inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700;
}
```

### Column Widths:
```css
th:nth-child(1)  { width: 32px;  } /* Star */
th:nth-child(2)  { width: auto;  } /* Code */
th:nth-child(3)  { flex: 1;      } /* Description */
th:nth-child(4)  { width: 140px; } /* Bedrag + badge */
th:nth-child(5)  { width: 80px;  } /* Aantal */
th:nth-child(6)  { width: 60px;  } /* M */
th:nth-child(7)  { width: 100px; } /* Kaak */
th:nth-child(8)  { width: 80px;  } /* Element */
th:nth-child(9)  { width: 120px; } /* Type */
th:nth-child(10) { width: 80px;  } /* Actief */
th:nth-child(11) { width: 60px;  } /* Acties */
```

---

## 🚀 Build & Deploy

```bash
# Build
npm run build

# Should succeed with no TypeScript errors
✓ built in ~8s

# Verify:
# - All imports resolve
# - No console errors
# - Tables render correctly
# - Badges show up
# - All handlers work
```

---

## 📚 Key Files Reference

```
src/
├── types/
│   └── upt.ts                    ✅ Shared types & mapping
├── utils/
│   └── uptMasterData.ts          ✅ NZa tarief lookup
├── components/
│   ├── PriceDeltaBadge.tsx       ✅ Badge component
│   └── ProcedureUptCodesManager  ⏳ Update needed
└── pages/
    └── UptStandaardsets.tsx      ⏳ Update needed
```

---

## ✅ Summary

**Database:** ✅ Ready (kaak, element, is_materiaal columns added)
**Types:** ✅ Ready (shared view model & mapping)
**Components:** ✅ Badge & utilities created
**UI:** ⏳ Implementation guide provided above

**Next:** Follow the UI implementation steps to complete the integration!

---

*Generated: 2025-11-28*
*Status: Foundation complete, UI implementation ready*
