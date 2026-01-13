# 🔧 ICE SUPER HERSTEL PLAN
**Volledige Reparatie: Interventies → UPT Codes → Begrotingen**

Datum: 2025-12-08
Status: WACHT OP GO VAN GEBRUIKER

---

## 📋 PHASE 0 ANALYSE — BEVINDINGEN

### ✅ Wat ik heb geanalyseerd:

1. **Database Schema**
   - `interventie_templates`: 951 records
   - `interventie_template_upt_defaults`: 20 records (NIEUWE genormaliseerde tabel)
   - `interventies`: 161 records
   - `interventie_upt_codes`: 44 records
   - RPC functie: `copy_template_upt_codes_to_interventie`

2. **Data Quality**
   - ALLE `interventie_templates.upt_codes` (JSONB) → EMPTY ARRAY
   - Slechts 20 van 951 templates hebben UPT codes in `interventie_template_upt_defaults`
   - Bestaande `interventie_upt_codes` zien er correct uit (clean UPT codes zoals A15, V93, C022)
   - 44 van 161 interventies hebben UPT codes (27% coverage)

3. **Root Cause Identified**
   ```sql
   -- De RPC functie leest van het VERKEERDE veld:
   SELECT upt_codes INTO v_upt_codes
   FROM interventie_templates
   WHERE id = p_interventie_template_id;
   ```
   **Probleem**: Leest van `upt_codes` JSONB (leeg) in plaats van `interventie_template_upt_defaults` tabel (heeft data)

4. **Missende Kolommen**
   - `interventie_upt_codes` mist: `element`, `kaak`, `techniek_kosten`, `materiaal_kosten`
   - `interventie_template_upt_defaults` mist: `element`, `kaak`
   - `begrotingen_v2_regels` heeft wel: `element`, `kaak` ✅

5. **Fase Mapping Issues (OPGELOST)**
   - ✅ Interventie fase (acuut/kort/normaal/lang) → Budget fase (fase1/fase2/fase3)
   - ✅ Database constraint aangepast om NULL toe te staan
   - ✅ Conversie logica toegevoegd in budgetService.ts en NewBudgetModal.tsx

---

## 🎯 HOOFDDOELEN

1. **Template → Database Flow Herstellen**
   - RPC functie moet lezen van `interventie_template_upt_defaults` tabel
   - UPT codes moeten automatisch gekoppeld worden bij template instantiation

2. **Volledige Element/Kaak Support**
   - Toevoegen ontbrekende kolommen aan beide tabellen
   - UI uitbreiden met dropdowns voor element/kaak selectie
   - Techniek/materiaal kosten ondersteuning

3. **Begrotings-Module Moderniseren**
   - 100% afhankelijk van `interventie_upt_codes`
   - Legacy modules deactiveren (Verrichtingen 2.0, UPT Standaardsets)
   - Element/kaak/techniek/materiaal inputs toevoegen

4. **Data Integriteit Garanderen**
   - Geen data loss
   - Backward compatibility waar nodig
   - Duidelijke migratie paden

---

## 📊 PHASE 1: DATABASE REPARATIE

### 1.1 Kolommen Toevoegen aan `interventie_upt_codes`
```sql
ALTER TABLE interventie_upt_codes
ADD COLUMN element TEXT,
ADD COLUMN kaak TEXT CHECK (kaak IN ('boven', 'onder', NULL)),
ADD COLUMN techniek_kosten NUMERIC(10,2) DEFAULT 0,
ADD COLUMN materiaal_kosten NUMERIC(10,2) DEFAULT 0;
```

### 1.2 Kolommen Toevoegen aan `interventie_template_upt_defaults`
```sql
ALTER TABLE interventie_template_upt_defaults
ADD COLUMN element TEXT,
ADD COLUMN kaak TEXT CHECK (kaak IN ('boven', 'onder', NULL)),
ADD COLUMN techniek_kosten NUMERIC(10,2),
ADD COLUMN materiaal_kosten NUMERIC(10,2);
```

### 1.3 Index Optimalisatie
```sql
CREATE INDEX IF NOT EXISTS idx_interventie_upt_codes_element
ON interventie_upt_codes(element) WHERE element IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_interventie_upt_codes_kaak
ON interventie_upt_codes(kaak) WHERE kaak IS NOT NULL;
```

**Risico**: Geen. Alleen nieuwe kolommen met NULL defaults.
**Rollback**: `ALTER TABLE interventie_upt_codes DROP COLUMN element, DROP COLUMN kaak, ...`

---

## 🔄 PHASE 2: RPC FUNCTIE HERSCHRIJVEN

### 2.1 Nieuwe RPC Functie: `copy_template_upt_codes_to_interventie_v2`

**Doel**: Lezen van `interventie_template_upt_defaults` in plaats van JSONB field

```sql
CREATE OR REPLACE FUNCTION copy_template_upt_codes_to_interventie_v2(
  p_interventie_template_id UUID,
  p_interventie_id UUID
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER := 0;
  v_template_upt RECORD;
BEGIN
  -- Lees van de NIEUWE tabel
  FOR v_template_upt IN
    SELECT
      upt_code,
      standaard_aantal,
      declaratie_mode,
      element,
      kaak,
      techniek_kosten,
      materiaal_kosten,
      notitie,
      sort_order
    FROM interventie_template_upt_defaults
    WHERE interventie_template_id = p_interventie_template_id
      AND is_actief = true
    ORDER BY sort_order
  LOOP
    INSERT INTO interventie_upt_codes (
      interventie_id,
      upt_code,
      aantal,
      declaratie_mode,
      element,
      kaak,
      techniek_kosten,
      materiaal_kosten,
      notitie,
      sort_order,
      is_actief
    ) VALUES (
      p_interventie_id,
      v_template_upt.upt_code,
      v_template_upt.standaard_aantal,
      v_template_upt.declaratie_mode,
      v_template_upt.element,
      v_template_upt.kaak,
      v_template_upt.techniek_kosten,
      v_template_upt.materiaal_kosten,
      v_template_upt.notitie,
      v_template_upt.sort_order,
      true
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;
```

### 2.2 Update Frontend Service
**File**: `src/services/templateInstantiationService.ts`

```typescript
// Lijn 107-111: Wijzig RPC call
const { data: copyResult, error: copyError } = await supabase
  .rpc('copy_template_upt_codes_to_interventie_v2', {  // v2 !
    p_interventie_template_id: interventieTemplate.id,
    p_interventie_id: interventie.id,
  });
```

**Risico**: Medium. Als nieuwe functie faalt, blijven interventies zonder UPT codes.
**Mitigatie**: Oude functie blijft beschikbaar als fallback. Test eerst met 1 template.

---

## 🎨 PHASE 3: BEGROTINGS-MODULE MODERNISEREN

### 3.1 UI Uitbreidingen in `NewBudgetModal.tsx`

#### 3.1.1 Element Dropdown
```tsx
<select
  value={editingItem?.element || ''}
  onChange={(e) => updateEditingItem({ element: e.target.value })}
  className="..."
>
  <option value="">Geen specifiek element</option>
  <option value="11">11</option>
  <option value="12">12</option>
  <!-- ... alle FDI nummers 11-48 -->
</select>
```

#### 3.1.2 Kaak Dropdown
```tsx
<select
  value={editingItem?.kaak || ''}
  onChange={(e) => updateEditingItem({ kaak: e.target.value })}
  className="..."
>
  <option value="">Niet specifiek</option>
  <option value="boven">Bovenkaak</option>
  <option value="onder">Onderkaak</option>
</select>
```

#### 3.1.3 Techniek/Materiaal Inputs
```tsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <label className="text-xs font-medium text-gray-700">Techniek (€)</label>
    <input
      type="number"
      step="0.01"
      value={editingItem?.techniek_kosten || 0}
      onChange={(e) => updateEditingItem({ techniek_kosten: parseFloat(e.target.value) || 0 })}
      className="..."
    />
  </div>
  <div>
    <label className="text-xs font-medium text-gray-700">Materiaal (€)</label>
    <input
      type="number"
      step="0.01"
      value={editingItem?.materiaal_kosten || 0}
      onChange={(e) => updateEditingItem({ materiaal_kosten: parseFloat(e.target.value) || 0 })}
      className="..."
    />
  </div>
</div>
```

### 3.2 Budget Display Uitbreiden

**Toevoegen aan item display**:
```tsx
{item.element && (
  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
    Element {item.element}
  </span>
)}
{item.kaak && (
  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
    {item.kaak === 'boven' ? 'Bovenkaak' : 'Onderkaak'}
  </span>
)}
```

### 3.3 Totalen Berekening Updaten

```typescript
// In recalculateBudgetTotals functie
const totals = items.reduce((acc, item) => {
  const honorarium = item.honorarium_bedrag * item.hoeveelheid;
  const techniek = (item.techniek_bedrag || item.techniek_kosten || 0) * item.hoeveelheid;
  const materiaal = (item.materiaal_bedrag || item.materiaal_kosten || 0) * item.hoeveelheid;

  return {
    honorarium: acc.honorarium + honorarium,
    techniek: acc.techniek + techniek,
    materiaal: acc.materiaal + materiaal,
    totaal: acc.totaal + honorarium + techniek + materiaal
  };
}, { honorarium: 0, techniek: 0, materiaal: 0, totaal: 0 });
```

**Risico**: Laag. UI changes, geen data loss.

---

## 🚫 PHASE 4: LEGACY MODULES DEACTIVEREN

### 4.1 Verrichtingen 2.0 Module

**Actie**: Soft-disable (UI verbergen, data behouden)

```tsx
// In Layout.tsx - Comment out menu item
{/*
<NavItem href="/verrichtingen-v2" icon={Package}>
  Verrichtingen 2.0
</NavItem>
*/}
```

**Data**: Tabel `verrichtingen` blijft bestaan maar wordt niet meer gebruikt voor nieuwe flows.

### 4.2 UPT Standaardsets Module

**Actie**: Soft-disable

```tsx
// In Layout.tsx - Comment out menu item
{/*
<NavItem href="/upt-standaardsets" icon={BookOpen}>
  UPT Standaardsets
</NavItem>
*/}
```

**Data**: Tabel `upt_code_sets` blijft bestaan voor legacy support.

### 4.3 Oude ICE Workflows

**Actie**: Verwijder oude testpagina's

- `/ice-flow-test` → Verwijderen
- `/ice-template-test` → Behouden (dit is de goede testpagina)

**Risico**: Geen. Dit zijn alleen testpagina's.

---

## ✅ PHASE 5: TEST SUITE

### 5.1 Database Tests

```sql
-- Test 1: Check alle templates hebben UPT codes in nieuwe tabel
SELECT
  bt.naam as behandelplan,
  COUNT(DISTINCT bot.id) as opties,
  COUNT(DISTINCT it.id) as interventies,
  COUNT(itud.id) as upt_codes
FROM behandelplan_templates bt
LEFT JOIN behandeloptie_templates bot ON bot.behandelplan_template_id = bt.id
LEFT JOIN interventie_templates it ON it.behandeloptie_template_id = bot.id
LEFT JOIN interventie_template_upt_defaults itud ON itud.interventie_template_id = it.id
GROUP BY bt.id, bt.naam
ORDER BY upt_codes DESC;
```

### 5.2 Integration Tests

**Test Scenario**: Volledige flow van template tot begroting

1. ✅ Selecteer template "Volledige reconstructie bij ernstige slijtage"
2. ✅ Maak behandelplan aan → Check dat behandelplan bestaat
3. ✅ Verify behandelopties → Check 2 opties (Directe restauratie + Indirecte restauratie)
4. ✅ Verify interventies → Check 5 interventies totaal
5. ✅ Verify UPT codes → Check 27 UPT codes gekoppeld via `interventie_upt_codes`
6. ✅ Maak begroting → Check alle 27 codes in `begrotingen_v2_regels`
7. ✅ Verify totalen → Check honorarium + techniek + materiaal

### 5.3 UI Tests

**Test in Browser**:
1. Open `/ice-template-test`
2. Klik "Start Test: Behandelplan vanuit Template"
3. Selecteer "Volledige reconstructie bij ernstige slijtage"
4. Verify success message met "27 UPT codes automatisch gekoppeld"
5. Open behandelplan detail
6. Verify elke interventie heeft UPT codes
7. Maak begroting vanuit behandelplan
8. Verify begroting toont alle items met element/kaak/techniek/materiaal

---

## 📦 PHASE 6: DATA MIGRATIE (OPTIONEEL)

### 6.1 Beslispunt: Migreer Legacy Template Data?

**Optie A**: Niet migreren
- Pro: Geen risico, clean start
- Con: Oude templates blijven "leeg" in nieuwe systeem

**Optie B**: Migreer van JSONB naar nieuwe tabel
```sql
-- Script om oude upt_codes JSONB te converteren naar interventie_template_upt_defaults
INSERT INTO interventie_template_upt_defaults (
  interventie_template_id,
  upt_code,
  standaard_aantal,
  declaratie_mode,
  is_actief,
  sort_order
)
SELECT
  it.id,
  (upt_item->>'code')::TEXT,
  COALESCE((upt_item->>'aantal')::INTEGER, 1),
  COALESCE((upt_item->>'declaratie_mode')::TEXT, 'pakket'),
  true,
  ROW_NUMBER() OVER (PARTITION BY it.id ORDER BY ordinality) * 10
FROM interventie_templates it,
     jsonb_array_elements(it.upt_codes) WITH ORDINALITY AS upt_item
WHERE jsonb_typeof(it.upt_codes) = 'array'
  AND jsonb_array_length(it.upt_codes) > 0;
```

**Aanbeveling**: **Optie A** - Oude templates zijn al niet bruikbaar (lege JSONB). Focus op nieuwe templates.

---

## 📋 UITVOERING CHECKLIST

### Pre-Flight Checks
- [ ] Database backup gemaakt
- [ ] Development environment getest
- [ ] User goedkeuring ontvangen voor plan

### Phase 1: Database
- [ ] Kolommen toegevoegd aan `interventie_upt_codes`
- [ ] Kolommen toegevoegd aan `interventie_template_upt_defaults`
- [ ] Indexes aangemaakt
- [ ] Verify met SQL queries

### Phase 2: RPC Functie
- [ ] Nieuwe RPC functie `copy_template_upt_codes_to_interventie_v2` aangemaakt
- [ ] Frontend service aangepast naar v2 functie
- [ ] Test met 1 template: "Ernstige slijtage"
- [ ] Verify 27 UPT codes correct gekoppeld

### Phase 3: UI Updates
- [ ] Element dropdown toegevoegd
- [ ] Kaak dropdown toegevoegd
- [ ] Techniek/materiaal inputs toegevoegd
- [ ] Budget totalen berekening geüpdatet
- [ ] Visual testing in browser

### Phase 4: Deactivatie
- [ ] Verrichtingen 2.0 menu item verborgen
- [ ] UPT Standaardsets menu item verborgen
- [ ] Oude ICE test pagina's verwijderd

### Phase 5: Tests
- [ ] Database test query's uitgevoerd
- [ ] Integration test scenario doorlopen
- [ ] UI test in browser uitgevoerd
- [ ] Bug fixes waar nodig

### Phase 6: Documentatie
- [ ] Update documentatie met nieuwe flow
- [ ] User guide voor element/kaak/techniek/materiaal
- [ ] Developer notes voor toekomstige wijzigingen

---

## 🎯 VERWACHTE RESULTATEN

### Na Voltooiing:

1. **Template Instantiation**
   - ✅ 27 UPT codes automatisch gekoppeld bij "Ernstige slijtage" template
   - ✅ Alle templates met UPT codes in `interventie_template_upt_defaults` werken

2. **Begrotingen**
   - ✅ Automatisch gevuld vanuit `interventie_upt_codes`
   - ✅ Element/kaak/techniek/materiaal volledig ondersteund
   - ✅ Correcte totalen (honorarium + techniek + materiaal)

3. **Data Flow**
   ```
   behandelplan_template
   └─→ interventie_template
       └─→ interventie_template_upt_defaults (20+ records)
           └─→ [RPC v2 copy]
               └─→ interventie_upt_codes (volledige data)
                   └─→ begrotingen_v2_regels (auto-filled)
   ```

4. **Legacy Modules**
   - ✅ Verrichtingen 2.0: Verborgen maar data intact
   - ✅ UPT Standaardsets: Verborgen maar data intact
   - ✅ Oude test pagina's: Verwijderd

---

## ⚠️ RISICO'S EN MITIGATIE

| Risico | Impact | Mitigatie |
|--------|--------|-----------|
| RPC functie faalt | Hoog | Oude functie behouden, test eerst |
| Kolommen toevoegen breekt bestaande queries | Medium | NULL defaults, backward compatible |
| UI changes breken bestaande flows | Laag | Alleen additive changes, geen removal |
| Data inconsistentie na migratie | Hoog | Geen migratie doen, clean start |

---

## 🚀 KLAAR VOOR UITVOERING

**Geschatte tijd**: 3-4 uur
**Vereist**: Database toegang, code deployment rechten
**Rollback plan**: Elke phase heeft eigen rollback stappen

---

## ✋ WACHT OP GOEDKEURING

Gebruiker, geef je GO voor één van:

1. **GO - Volle vaart vooruit**: Alle phases uitvoeren
2. **GO - Phase by phase**: Ik geef per phase goedkeuring
3. **STOP - Aanpassingen nodig**: Specificeer wijzigingen

Typ "GO" om te starten! 🚀
