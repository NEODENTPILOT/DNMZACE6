# ASSIST 3.0 CLEANUP - INVENTARISATIE RAPPORT
**Datum:** 2025-12-08
**Doel:** App opschonen voor ASSIST 3.0 - alleen nieuwe ICE/interventie/begrotings-flow actief houden

---

## 📋 FASE 1: INVENTARISATIE RESULTATEN

### 🔴 LEGACY MODULES - MOETEN UIT UI

#### 1. **Verrichtingen (oud)**
- **Locatie:** `src/components/Layout.tsx` line 87
- **Menu Status:** `disabled: true`
- **Route:** `verrichtingen` → redirect naar `DeprecatedPageNotice` ✅
- **Actie:** Menu item volledig verwijderen (niet alleen disable)

#### 2. **Verrichtingen 2.0**
- **Locatie:** `src/components/Layout.tsx` line 86 (uitgecommentarieerd)
- **Route:** `verrichtingen-v2` → redirect naar `DeprecatedPageNotice` ✅
- **Actie:** Geen - al correct uitgeschakeld

#### 3. **UPT Standaardsets**
- **Locatie:** `src/components/Layout.tsx` line 164
- **Menu Status:** `disabled: true`, `badge: 'LEGACY'`
- **Route:** `upt-standaardsets` → redirect naar `DeprecatedPageNotice` ✅
- **Actie:** Menu item volledig verwijderen (niet alleen disable)
- **Pagina:** `src/pages/UptStandaardsets.tsx` (niet meer gebruikt)

#### 4. **Behandel Workflows (Legacy)** ⚠️ NOG ACTIEF
- **Locatie:** `src/components/Layout.tsx` line 107
- **Menu Status:** ACTIEF in menu, label: 'Behandel Workflows (Legacy)'
- **Route:** `behandel-workflows` → rendert `<BehandelWorkflows />` ❌
- **Pagina:** `src/pages/BehandelWorkflows.tsx`
- **Actie:** Menu item verwijderen + route disablen

#### 5. **ICE Flow Test** ⚠️ NOG ACTIEF
- **Locatie:** `src/components/Layout.tsx` line 104 (uitgecommentarieerd in menu)
- **Route:** `ice-flow-test` → rendert `<ICEFlowTest />` ❌
- **Pagina:** `src/pages/ICEFlowTest.tsx`
- **Actie:** Route verwijderen of disablen (test pagina)

#### 6. **ICE Template Test** ⚠️ NOG ACTIEF
- **Locatie:** `src/components/Layout.tsx` line 105
- **Menu Status:** ACTIEF in menu, `badge: 'NEW'`
- **Route:** `ice-template-test` → rendert `<ICETemplateTest />` ❌
- **Pagina:** `src/pages/ICETemplateTest.tsx`
- **Actie:** Menu item verwijderen (test pagina, niet voor productie)

---

### 💰 BEGROTINGSMODALS STATUS

#### **NewBudgetModal** ✅ GEWENST
- **Locatie:** `src/components/NewBudgetModal.tsx`
- **Gebruikt in:**
  - `CaseDetail.tsx` - met feature flag
  - `BehandelplanDetail.tsx` - alleen deze ✅
- **Status:** Moderne modal met UPT Code Browser

#### **BegrotingComposer2025Modal** ❌ LEGACY
- **Locatie:** `src/components/BegrotingComposer2025Modal.tsx`
- **Gebruikt in:**
  - `CaseDetail.tsx` - als fallback via feature flag ❌
  - `ZorgplanDetail.tsx` - zonder feature flag ❌
  - `BegrotingComposerPage.tsx` - standalone wizard
  - `Begrotingen.tsx` - standalone overzicht
- **Actie:** Vervangen door NewBudgetModal in CaseDetail en ZorgplanDetail

#### **BegrotingComposerModal** ❓
- **Locatie:** `src/components/BegrotingComposerModal.tsx`
- **Status:** Onduidelijk of nog gebruikt
- **Actie:** Nagaan of nog in gebruik

---

### 🎯 FEATURE FLAGS

**File:** `src/utils/featureFlags.ts`

```typescript
USE_NEW_BUDGET_MODAL: true
```

**Probleem:** Code heeft nog steeds else-tak die oude modal gebruikt:

**In CaseDetail.tsx:**
```typescript
const useNewBudgetModal = isFeatureEnabled('USE_NEW_BUDGET_MODAL');

if (useNewBudgetModal) {
  setShowNewBudgetModal(true);     // ✅ Nieuwe flow
} else {
  setShowBegroting2025Modal(true); // ❌ Legacy fallback moet weg
}
```

**Actie:**
- Verwijder alle `else` takken die legacy modal openen
- Verwijder feature flag check (altijd nieuwe modal)

---

### 📁 BESTANDEN ANALYSE

#### React Componenten die WEG kunnen:
1. `src/pages/BehandelWorkflows.tsx`
2. `src/pages/ICEFlowTest.tsx`
3. `src/pages/ICETemplateTest.tsx`
4. `src/pages/UptStandaardsets.tsx`
5. `src/pages/VerrichtingenV2.tsx` (al disabled)
6. `src/pages/Verrichtingen.backup.tsx`
7. `src/pages/VerrichtingCategorieen.tsx`

#### Componenten die mogelijk WEG kunnen:
1. `src/components/BegrotingComposer2025Modal.tsx` (na migratie)
2. `src/components/BegrotingComposerModal.tsx` (na verificatie)
3. `src/components/BegrotingCreateModal.tsx` (na verificatie)
4. `src/components/UptSetCreateModal.tsx`
5. `src/components/UptStandardSetSelectorModal.tsx`
6. `src/components/ProcedureUptCodesManager.tsx` (na verificatie)
7. `src/components/VerrichtingForm.tsx`

---

## 🎯 ACTIEPLAN

### FASE 2: Legacy uit navigatie & routes
1. ✅ Verrichtingen (oud) - menu item verwijderen
2. ✅ UPT Standaardsets - menu item verwijderen
3. ❌ Behandel Workflows (Legacy) - menu item verwijderen
4. ❌ ICE Template Test - menu item verwijderen
5. Routes disablen of redirecten naar DeprecatedPageNotice

### FASE 3: Altijd nieuwe begrotingsmodal
1. `CaseDetail.tsx` - verwijder feature flag + else tak
2. `ZorgplanDetail.tsx` - vervang BegrotingComposer2025Modal door NewBudgetModal
3. Standalone flows (BegrotingComposerPage, Begrotingen) - laten staan of migreren

### FASE 4: Legacy bronknoppen uit NewBudgetModal
1. Open `src/components/NewBudgetModal.tsx`
2. Verwijder knoppen:
   - "+ Standaardset"
   - "+ Verrichting"
3. Behoud alleen: "UPT Code Browser"

### FASE 5: UPT badges overal
1. Controleer BehandelplanExpandedView
2. Controleer InterventieEditModal
3. Controleer alle plekken waar interventies worden getoond

---

## ⚠️ BELANGRIJKE CONSTRAINTS

1. **GEEN database migraties** - alleen UI cleanup
2. **GEEN data deletes** - data blijft intact
3. **GEEN grote herbouw** - gerichte cleanup
4. Componenten alleen verwijderen als echt ongebruikt
5. TypeScript build moet slagen

---

**EINDE INVENTARISATIE**
