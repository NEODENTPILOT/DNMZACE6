# ⚠️ ASSIST STAP 7: Klinische Waarschuwingen per Diagnose

## 📋 Overzicht

Het diagnose-waarschuwingensysteem biedt klinische aandachtspunten, protocollen en veiligheidsinformatie per diagnose. Deze alerts zijn **informatief** en dwingen geen behandelbeslissingen af - ze bieden context en herinneringen voor de clinicus.

### Doel
Bij elke diagnose (bijv. `DXCHI001-AE`, `DXEND001-PA`) worden relevante aandachtspunten getoond zoals:
- Contraindicaties en anatomische risico's
- Protocollen en richtlijnen
- Verwacht beloop en herstelperiode
- Complicaties en follow-up timing

---

## 🎯 Design Principes

1. **Geen medisch advies afdwingen** - Alleen informatie en waarschuwingen
2. **Klinische autonomie** - De clinicus behoudt volledige beslissingsvrijheid
3. **Context-relevante informatie** - Getoond op het juiste moment
4. **Evidence-based** - Bronvermelding (NZa, KNMT, wetenschappelijke literatuur)

---

## 🏗️ Architectuur

### Database Schema

**Tabel: `diagnosis_alerts`**

| Kolom | Type | Beschrijving |
|-------|------|--------------|
| `id` | uuid | Primary key |
| `diagnosis_code` | text | Link naar diagnose code (bijv. DXCHI001-AE) |
| `severity` | enum | `'info'` \| `'warning'` \| `'critical'` |
| `title` | text | Korte alert titel |
| `message` | text | Volledige waarschuwing/advies |
| `source` | text | Optioneel: 'NZa', 'KNMT Richtlijn', etc. |
| `display_order` | integer | Sortering (lager = hoger) |
| `is_active` | boolean | Aan/uit toggle |
| `created_at` | timestamptz | Aanmaakdatum |
| `updated_at` | timestamptz | Laatste wijziging |

**Severity Enum:**
```sql
CREATE TYPE diagnosis_alert_severity AS ENUM ('info', 'warning', 'critical');
```

**Indexen:**
- `idx_diagnosis_alerts_code` - Snelle lookup per diagnose
- `idx_diagnosis_alerts_severity` - Filter op severity
- `idx_diagnosis_alerts_display_order` - Sortering

---

## 🎨 UI Implementatie

### Severity Badges

| Severity | Badge Kleur | Icon | Gebruik |
|----------|------------|------|---------|
| **critical** | Rood | `AlertCircle` | Medische urgentie, contraindicaties, systemische verspreiding |
| **warning** | Geel | `AlertTriangle` | Belangrijke aandachtspunten, protocollen, risicofactoren |
| **info** | Blauw | `Info` | Context, verwacht beloop, follow-up timing |

### Locaties

**1. Care Hub - DiagnosesPanel**
- Getoond onder elke diagnose in de diagnose-kaart
- Titel: "Aandachtspunten"
- Volledig uitgevouwen met alle alert details

**2. Clinical Reasoning - TriageReasoningPanel**
- Getoond onderaan het reasoning panel
- Titel: "AI Context: Klinische Aandachtspunten bij deze Diagnose"
- Optioneel, alleen als er alerts zijn

---

## 📊 Huidige Alerts (21 alerts, 7 diagnoses)

### DXCHI001-AE: Alveolitis na extractie (3 alerts)

**⚠️ WARNING:** Controleer systeemziekten en medicatie
> Let op bij patiënten met stollingsproblemen, gebruik van bisfosfonaten, of immunosuppressieve medicatie. Verhoogd risico op complicaties.
>
> **Bron:** KNMT Richtlijn

**ℹ️ INFO:** Verwacht beloop en herstel
> Pijn piekt meestal 2-4 dagen post-extractie. Bij adequate behandeling (spoelen, pijnstilling) verwacht herstel binnen 7-10 dagen. Chronische alveolitis is zeldzaam.
>
> **Bron:** Klinische ervaring

**⚠️ WARNING:** Osteïtis/osteonecrose risico
> Bij aanhoudende klachten >10 dagen: overweeg beeldvorming (OPT/CBCT) om osteonecrose of sequestervorming uit te sluiten.
>
> **Bron:** NZa

---

### DXCHI004-GV: Geïmpacteerde verstandskies (3 alerts)

**🚨 CRITICAL:** Anatomische risico's: nervus alveolaris inferior
> Controleer CBCT voor relatie tot nervus alveolaris inferior. Bij directe nabijheid (<2mm): waarschuw patiënt voor risico op tijdelijke/permanente hypoesthesie onderkaak.
>
> **Bron:** KNMT Richtlijn Chirurgie

**⚠️ WARNING:** Postoperatieve zwelling en trismus
> Voorkom postoperatieve zwelling: profylactisch methylprednisolon 40mg pre-op (indien geen contraindicaties). Instrueer patiënt over verwachte kaakopening-beperking eerste dagen.
>
> **Bron:** Klinische ervaring

**ℹ️ INFO:** Herstelperiode
> Standaard herstelperiode: 7-14 dagen. Werkverzuim: gemiddeld 2-4 dagen. Volledige wondgenezing: 6-8 weken.

---

### DXEND001-PA: Pulpitis acuta (3 alerts)

**⚠️ WARNING:** Differentiaaldiagnose: cracked tooth
> Bij lokaliseerbare pijn op bijten: denk ook aan cracked tooth syndrome. Overweeg transilluminatie, bitewing, of CBCT voor verticale fracturen.
>
> **Bron:** Richtlijn Endodontie

**ℹ️ INFO:** Vitaliteitstests vaak onbetrouwbaar
> Bij acute pulpitis kunnen koude-tests vals positief/negatief zijn. Klinische presentatie (spontane pijn, nachtelijke pijn) is leidend.
>
> **Bron:** Richtlijn Endodontie

**⚠️ WARNING:** Indicatie directe pulpaoverkapping
> Alleen bij traumatische pulpa-expositie <24h én vitale pulpa. Bij carieuze expositie: altijd wortelkanaalbehandeling.
>
> **Bron:** NZa

---

### DXEND002-ADA: Tandabces (4 alerts)

**🚨 CRITICAL:** Systemische verspreiding: ziekenhuisverwijzing
> Bij koorts >38.5°C, trismus, dysfagie, of diffuse zwelling hals/gelaatshelft: directe verwijzing naar ziekenhuis (Ludwigs angina/mediastinitis risico).
>
> **Bron:** KNMT Spoedeisende Hulp

**⚠️ WARNING:** Antibiotica indicatie
> Antibiotica alleen bij systemische verschijnselen, diffuse zwelling, of immunocompromitteerde patiënt. Drainage/wortelkanaalbehandeling is primaire behandeling.
>
> **Bron:** SWAB Richtlijn

**⚠️ WARNING:** Incisie en drainage
> Bij fluctuerende zwelling: directe I&D geïndiceerd. Drain plaatsen indien mogelijk. Controle binnen 24-48u.
>
> **Bron:** Richtlijn Endodontie

**ℹ️ INFO:** Follow-up timing
> Evalueer patiënt binnen 2-3 dagen post-drainage. Definitieve endodontische behandeling kan vaak pas na 1-2 weken (wacht op afname acute inflammatie).

---

### DXEND004-MW: Mislukte wortelkanaalbehandeling (3 alerts)

**⚠️ WARNING:** CBCT noodzakelijk voor herbehandeling
> Maak altijd CBCT voor herbehandeling: detecteer gemiste kanalen, perforaties, instrumentfracturen, of apicale pathologie. Essentieel voor treatment planning.
>
> **Bron:** Richtlijn Endodontie

**ℹ️ INFO:** Succeskans herbehandeling vs. chirurgie
> Orthograde herbehandeling: 70-80% succes. Apicale chirurgie (retrograde vulling): 85-90% succes. Overweeg chirurgie bij anatomische limitaties, calcificatie, of gebroken instrumenten.
>
> **Bron:** Wetenschappelijke literatuur

**⚠️ WARNING:** Extractie indicatie
> Overweeg extractie bij: verticale wortelfractuur, ernstig coronaal weefselsverlies (niet restaurabel), parodontale destructie, of herhaalde mislukte herbehandelingen.
>
> **Bron:** NZa

---

### DXPARO001-PC: Parodontitis chronisch (4 alerts)

**⚠️ WARNING:** Systemische co-morbiditeit: diabetes
> Bij diabetespatiënten: verhoogd risico op progressie parodontitis. Wederzijdse relatie: paro verslechtert glucose-controle. Overleg met huisarts over HbA1c.
>
> **Bron:** NHG Standaard

**ℹ️ INFO:** Roken: belangrijkste risicofactor
> Rokers hebben 2-7x verhoogd risico op parodontitis en 50% lagere succeskans bij behandeling. Stoppen-met-roken-advies is essentieel onderdeel van behandeling.
>
> **Bron:** NVvP Richtlijn

**⚠️ WARNING:** Onderhoudsfrequentie
> Na actieve behandeling: evaluatie na 3 maanden. Bij stabiele situatie: minimaal 2x per jaar profylaxe. Bij risicopatiënten (rokers, diabetes): 3-4x per jaar.
>
> **Bron:** NZa Zorgstandaard

**🚨 CRITICAL:** Implantaten bij actieve parodontitis
> Plaats GEEN implantaten bij onbehandelde parodontitis. Eerst volledige parodontale behandeling + 6-12 maanden stabiele situatie. Verhoogd peri-implantitis risico.
>
> **Bron:** KNMT Richtlijn Implantologie

---

### DXCHI010-SP: Acute pericoronitis (2 alerts)

**⚠️ WARNING:** Antibiotica alleen bij systemische verschijnselen
> Pericoronitis is meestal lokaal behandelbaar (spoelen, OHI). Antibiotica alleen bij koorts, trismus, of lymfadenopathie.
>
> **Bron:** SWAB Richtlijn

**ℹ️ INFO:** Extractie timing
> Verstandskies extractie idealiter 6-8 weken na afloop acute fase. Bij recidiverende pericoronitis: elektieve extractie plannen.

---

## 🔧 API & Gebruik

### TypeScript Interface

```typescript
export type DiagnosisAlertSeverity = 'info' | 'warning' | 'critical';

export interface DiagnosisAlert {
  id: string;
  diagnosis_code: string;
  severity: DiagnosisAlertSeverity;
  title: string;
  message: string;
  source: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### Service Usage

```typescript
import { diagnosisAlertService } from '@/services/diagnosisAlertService';

// Alerts voor één diagnose
const alerts = await diagnosisAlertService.getAlertsForDiagnosis('DXCHI001-AE');

// Alerts voor meerdere diagnoses
const alertsMap = await diagnosisAlertService.getAlertsForDiagnoses([
  'DXCHI001-AE',
  'DXEND001-PA'
]);

// Alle diagnoses met alerts
const codesWithAlerts = await diagnosisAlertService.getAllActiveDiagnosisCodesWithAlerts();

// Severity helpers
const color = diagnosisAlertService.getSeverityColor('critical'); // 'red'
const icon = diagnosisAlertService.getSeverityIcon('warning'); // 'AlertTriangle'
const label = diagnosisAlertService.getSeverityLabel('info'); // 'Informatie'
```

### UI Component

```tsx
import DiagnosisAlertsPanel from '@/components/DiagnosisAlertsPanel';

<DiagnosisAlertsPanel
  diagnosisCode="DXCHI001-AE"
  title="Klinische aandachtspunten"
  compact={false}
  className="mt-4"
/>
```

---

## ➕ Alerts Toevoegen

### Optie 1: Direct SQL

```sql
INSERT INTO diagnosis_alerts
  (diagnosis_code, severity, title, message, source, display_order)
VALUES
  (
    'DXREST001-DC',
    'warning',
    'Cariësdiepte en pulpa-expositie risico',
    'Bij diepe cariës >5mm van pulpa: verhoogd risico op expositie. Overweeg indirect pulpacapping met calciumhydroxide/MTA.',
    'Richtlijn Restauratief',
    10
  );
```

### Optie 2: Nieuwe Migratie

```sql
-- supabase/migrations/YYYYMMDD_add_custom_diagnosis_alerts.sql

/*
  # Add custom diagnosis alerts

  Nieuwe klinische aandachtspunten voor [diagnose]
*/

INSERT INTO diagnosis_alerts
  (diagnosis_code, severity, title, message, source, display_order)
VALUES
  ('DXCODE', 'warning', 'Titel', 'Boodschap', 'Bron', 10);
```

### Optie 3: Via TypeScript (Admin UI)

```typescript
import { supabase } from '@/lib/supabase';
import { diagnosisAlertService } from '@/services/diagnosisAlertService';

const { data, error } = await supabase
  .from('diagnosis_alerts')
  .insert([
    {
      diagnosis_code: 'DXCHI001-AE',
      severity: 'warning',
      title: 'Nieuwe waarschuwing',
      message: 'Uitgebreide beschrijving...',
      source: 'KNMT',
      display_order: 40
    }
  ]);

// Clear cache
diagnosisAlertService.clearCache();
```

---

## 🎯 Display Order Richtlijnen

**Lagere waarde = hogere prioriteit**

| Display Order | Gebruik |
|--------------|---------|
| 1-10 | Critical alerts (systemische risico's, contraindicaties) |
| 10-30 | Warning alerts (protocollen, belangrijke aandachtspunten) |
| 30-50 | Info alerts (verwacht beloop, follow-up) |
| 50+ | Extra context, optionele informatie |

---

## 🔐 Security (RLS)

**Read:**
- Alle authenticated users kunnen active alerts lezen

**Write:**
- Alleen admins (`rol IN ('admin', 'super_admin')`) kunnen alerts aanmaken/wijzigen

---

## 🚀 Toekomstige Uitbreidingen

1. **Admin UI voor alert management**
   - CRUD interface voor alerts
   - Bulk import van CSV/JSON
   - Preview per diagnose

2. **Alert analytics**
   - Track welke alerts het meest gezien worden
   - User feedback ("Was deze alert nuttig?")
   - Optimalisatie op basis van usage data

3. **Gepersonaliseerde alerts**
   - Per praktijk/locatie (lokale protocollen)
   - Per clinicus specialisme
   - Dynamische alerts op basis van patiënt historie

4. **Multi-diagnose alerts**
   - Interacties tussen diagnoses
   - "Bij combinatie X+Y: let op Z"

5. **Versioning**
   - Track wijzigingen in alerts
   - Rollback functionaliteit
   - Historische data

6. **Externe bronnen integratie**
   - Link naar volledige richtlijnen
   - PubMed artikelen
   - Instructievideo's

---

## 📈 Statistieken

**Huidige status (2025-12-10):**
- ✅ 21 actieve alerts
- ✅ 7 diagnoses ondersteund
- ✅ 3 severity levels
- ✅ Database-backed systeem
- ✅ Care Hub integratie
- ✅ Clinical Reasoning integratie
- ✅ Caching (10 min TTL)
- ✅ RLS security

---

## 🛠️ Onderhoud

### Alert deactiveren

```sql
UPDATE diagnosis_alerts
SET is_active = false
WHERE id = 'uuid...';
```

### Alert prioriteit wijzigen

```sql
UPDATE diagnosis_alerts
SET display_order = 5
WHERE diagnosis_code = 'DXCHI001-AE'
AND title = 'Controleer systeemziekten en medicatie';
```

### Bulk check

```sql
-- Toon alle alerts per diagnose met counts
SELECT
  diagnosis_code,
  severity,
  COUNT(*) as alert_count
FROM diagnosis_alerts
WHERE is_active = true
GROUP BY diagnosis_code, severity
ORDER BY diagnosis_code, severity;

-- Toon alerts zonder bron
SELECT diagnosis_code, title, message
FROM diagnosis_alerts
WHERE is_active = true
AND source IS NULL
ORDER BY diagnosis_code, display_order;
```

---

## ✨ Conclusie

Het diagnose-waarschuwingensysteem biedt een flexibele, uitbreidbare manier om klinische context en veiligheidsinformatie te tonen. Het systeem:

- ✅ Respecteert klinische autonomie (geen dwang)
- ✅ Is evidence-based (bronvermelding)
- ✅ Schaalt goed (database-backed)
- ✅ Is beveiligd (RLS policies)
- ✅ Is makkelijk uit te breiden (SQL/TypeScript/UI)

Het dient als fundament voor intelligente, context-aware klinische ondersteuning zonder medische beslissingen af te dwingen.

---

**Laatste update:** 2025-12-10
**Status:** ✅ Productie-ready
**Migraties:**
- `create_diagnosis_alerts_system.sql`
- `seed_diagnosis_alerts_initial_data.sql`
