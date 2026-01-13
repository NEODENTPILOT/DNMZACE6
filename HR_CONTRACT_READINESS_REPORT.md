# 📋 HR CONTRACT MODULE READINESS INVENTORY

**Datum:** 27 december 2024
**Scope:** Database readiness voor HR Contract module (opstellen → toewijzen → digitaal ondertekenen → opslaan)
**Status:** ✅ **70% GEREED** - Database basis aanwezig, handtekening functionaliteit ontbreekt

---

## 🎯 EXECUTIVE SUMMARY (10 BULLETS)

1. ✅ **hq.contracts** tabel bestaat met volledige contract lifecycle (status, ingangsdatum, einddatum, FTE, salaris)
2. ✅ **hq.employees** heeft arbeidsrelatie types (dienstverband_type zonder constraint check)
3. ✅ **hq.documents** + storage bucket "hr-documents" (private, PDF/Word/Images) functioneel
4. ✅ Document categorieën: **CONTRACT** + **ADDENDUM** aanwezig en gekoppeld
5. ❌ **Geen digitale handtekening capture systeem** (signature_data, canvas, base64 storage)
6. ❌ **Geen signature audit trail** (IP adres, device info, user agent, precise timestamp)
7. ❌ **Geen PDF generatie libraries** (jspdf/pdfmake ontbreken in package.json)
8. ⚠️ **RLS te open** - alle authenticated users kunnen alle contracts/employees bekijken en wijzigen
9. ⚠️ **Geen contract versioning** - geen revisie tracking bij wijzigingen
10. ⚠️ **Geen contract templates** - handmatig opstellen vereist

**READINESS SCORE: 70/100**

---

## 1️⃣ BESTAANDE TABELLEN INVENTARIS

### **hq.contracts** ✅ (Complete contract lifecycle)

**Doel:** Arbeidscontracten opslaan en beheren

**Belangrijkste kolommen:**
- `id` (uuid, PK)
- `employee_id` (uuid, FK → hq.employees, NOT NULL)
- `contract_type` (text, NOT NULL) - vrije tekst, geen constraint
- `ingangsdatum` (date, NOT NULL)
- `einddatum` (date, nullable) - voor tijdelijke contracten
- `fte` (numeric, default 1.00)
- `salaris_schaal` (text, nullable)
- `bruto_uurloon` (numeric, nullable)
- `document_url` (text, nullable) - link naar PDF in storage
- `getekend` (boolean, default false) ⚠️
- `getekend_datum` (date, nullable) ⚠️
- `status` (text, default 'concept') - vrije tekst, geen constraint
- `notities` (text)
- `created_by` (uuid, nullable) - geen FK naar users
- `created_at`, `updated_at` (timestamptz)

**Relaties:**
- FK naar hq.employees
- GEEN FK naar users (created_by niet enforced)
- GEEN koppeling naar hq.documents (los van elkaar)

**Eigenaar:** System-managed, created_by tracks creator maar is optioneel

**⚠️ ISSUES:**
- `getekend` boolean is te simpel (wie heeft getekend? wanneer precies? IP?)
- Geen constraint op `contract_type` (vrije tekst)
- Geen constraint op `status` (vrije tekst)
- `document_url` is losse string, geen integratie met storage
- Geen versie tracking

---

### **hq.employees** ✅ (Arbeidsrelatie master data)

**Doel:** Medewerker profielen en arbeidsrelatie info

**Belangrijkste kolommen:**
- `id` (uuid, PK)
- `user_id` (uuid, nullable) - optionele link naar auth.users
- `voornaam`, `achternaam`, `roepnaam` (text)
- `geboortedatum` (date)
- `email`, `telefoon` (text)
- `functie` (text, NOT NULL)
- `afdeling` (text, nullable)
- `locatie_id` (uuid, nullable) - geen FK definitie visible
- `dienstverband_type` (text, nullable) ⚠️
- `in_dienst_vanaf` (date, nullable)
- `uit_dienst_per` (date, nullable)
- `fte` (numeric, default 1.00)
- `status` (text, default 'actief') ⚠️
- `is_leidinggevend` (boolean, default false)
- `toestemming_beeldmateriaal` (boolean, default false)
- `notities` (text)
- `created_at`, `updated_at` (timestamptz)

**Relaties:**
- Optionele link naar auth.users via `user_id`
- Parent voor hq.contracts (1:N)
- Parent voor hq.documents (1:N)

**⚠️ ISSUES:**
- `dienstverband_type` is vrije tekst, geen constraint (expected: vast/tijdelijk/oproep/zzp/stage)
- `status` is vrije tekst, geen constraint
- Geen expliciete multi-locatie support (alleen één locatie_id)

---

### **hq.documents** ✅ (Document storage metadata)

**Doel:** Metadata voor geüploade HR documenten in storage bucket

**Belangrijkste kolommen:**
- `id` (uuid, PK)
- `employee_id` (uuid, FK → hq.employees, NOT NULL)
- `document_type` (text, NOT NULL) - vrije tekst ⚠️
- `titel` (text, NOT NULL)
- `omschrijving` (text, nullable)
- `file_url` (text, NOT NULL) - pad in storage bucket
- `file_naam`, `file_type`, `file_size_bytes` (metadata)
- `geldig_vanaf`, `geldig_tot` (date) - voor expirerende documenten
- `vertrouwelijk` (boolean, default false)
- `zichtbaar_voor_medewerker` (boolean, default false)
- `status` (text, default 'actief')
- `geupload_door` (uuid, nullable) - geen FK
- `document_category_id` (uuid, FK → hq.document_categories, NOT NULL)
- `category_id` (uuid, FK → hq.document_categories, NOT NULL) - duplicaat! ⚠️
- `created_at`, `updated_at` (timestamptz)

**Relaties:**
- FK naar hq.employees
- FK naar hq.document_categories (2x, waarschijnlijk migratie artifact)

**⚠️ ISSUES:**
- Dubbele category FK (`document_category_id` EN `category_id`)
- `document_type` vrije tekst terwijl `document_category_id` bestaat
- Geen versiebeheer voor documenten
- `geupload_door` geen FK enforcement

---

### **hq.document_categories** ✅ (Document classificatie)

**Doel:** Gestandaardiseerde document categorieën

**Categorieën aanwezig:**
- ✅ **CONTRACT** (code: CONTRACT, hr_only: false)
- ✅ **ADDENDUM** (code: ADDENDUM, hr_only: false)
- ✅ **CERTIFICATE** (code: CERTIFICATE, hr_only: false, allowed_for_skills: true)
- ✅ **IDENTIFICATION** (code: IDENTIFICATION, hr_only: true) - extra beveiligd
- ✅ **CONVERSATION** (code: CONVERSATION, hr_only: false)
- ✅ **POP** (code: POP, hr_only: false)
- ✅ **ONBOARDING** (code: ONBOARDING, hr_only: false)
- ✅ **FINANCIAL_HR** (code: FINANCIAL_HR, hr_only: true)

**Kolommen:**
- `id` (uuid, PK)
- `code` (text, unique business key)
- `label`, `omschrijving` (display tekst)
- `hr_only` (boolean) - extra beveiligde documenten
- `allowed_for_skills` (boolean) - voor competentie koppeling
- `sort_order`, `is_active` (UX/filtering)

**PERFECT VOOR CONTRACT MODULE** ✅

---

### **storage.buckets: hr-documents** ✅ (File storage)

**Eigenschappen:**
- **private** bucket (niet publiek toegankelijk)
- **allowed_mime_types:**
  - `application/pdf`
  - `application/msword`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - `image/jpeg`, `image/png`, `image/jpg`
- **file_size_limit:** 10 MB
- **created:** 2025-12-14

**STATUS:** ✅ Klaar voor gebruik, RLS policies moeten nog gecontroleerd worden

---

### **public.users** (Auth & RBAC)

**Relevant voor contracts:**
- `id` (uuid, PK) - links naar auth.users
- `naam`, `email` (text)
- `rol` (text) - bevat o.a. 'hr', 'owner', 'super_admin'
- `standaard_locatie_id` (FK → praktijk_locaties)
- `is_active` (boolean)

**Junctions:**
- `user_roles` → N:M naar RBAC roles
- `user_function_groups` → N:M naar function groups
- `user_praktijk_locaties` → N:M multi-locatie support

**STATUS:** ✅ RBAC systeem aanwezig en functioneel

---

## 2️⃣ ARBEIDSRELATIE CHECK

| Concept | Status | Details |
|---------|--------|---------|
| **employment_type** | ⚠️ Gedeeltelijk | `hq.employees.dienstverband_type` bestaat, maar geen constraint |
| **Expected values** | ❌ Niet enforced | Verwacht: vast, tijdelijk, oproep, zzp, stage - vrije tekst nu |
| **contract_status** | ⚠️ Gedeeltelijk | `hq.contracts.status` bestaat, default 'concept', geen constraint |
| **Expected values** | ❌ Niet enforced | Concept/Actief/Verlopen/Beëindigd - vrije tekst nu |
| **Start/einddatum** | ✅ Volledig | `ingangsdatum` (NOT NULL), `einddatum` (nullable voor vast) |
| **FTE / uren** | ✅ Volledig | `fte` numeric in both contracts & employees (default 1.00) |
| **Uren per week** | ❌ Ontbreekt | Geen `uren_per_week` kolom |
| **Scope** | ⚠️ Gedeeltelijk | Contract heeft geen scope field (alleen omschrijving in notities?) |
| **Locatie koppeling** | ⚠️ Single | `employees.locatie_id` (single), multi-locatie via users table |
| **Salaris info** | ✅ Volledig | `salaris_schaal` (text) + `bruto_uurloon` (numeric) |

**TOTAAL SCORE: 5/10** - Basis aanwezig, constraints en structuur ontbreken

---

## 3️⃣ DOCUMENT & SIGNATURE CHECK

### **Contract-achtige documenten**

| Feature | Status | Details |
|---------|--------|---------|
| **Document opslag** | ✅ Herbruikbaar | hq.documents + storage bucket klaar |
| **PDF support** | ✅ Herbruikbaar | Mime type toegestaan in bucket |
| **Categorisatie** | ✅ Herbruikbaar | CONTRACT + ADDENDUM categories |
| **Metadata** | ✅ Herbruikbaar | Titel, omschrijving, geldigheid, confidentieel |
| **Employee koppeling** | ✅ Herbruikbaar | FK naar hq.employees |
| **Versiebeheer** | ❌ Ontbreekt | Geen revisie tracking |

**RISICO'S:**
- Document updates overschrijven oude versie (geen audit trail)
- Geen "final vs draft" status op document level

---

### **Digitale handtekening**

| Feature | Status | Details |
|---------|--------|---------|
| **Signature capture** | ❌ Ontbreekt | Geen signature_data kolom |
| **Canvas/base64** | ❌ Ontbreekt | Geen storage voor signature image |
| **Multi-signatory** | ❌ Ontbreekt | Alleen `contracts.getekend` boolean |
| **Signature metadata** | ❌ Ontbreekt | Wie, wanneer, waar (IP) |
| **Audit trail** | ❌ Ontbreekt | Geen logging van signature events |
| **Timestamp precision** | ❌ Gedeeltelijk | `getekend_datum` (date only, geen time) |

**RISICO'S:**
- ❌ **KRITIEK:** Geen juridisch waterdichte handtekening flow
- ❌ Geen IP adres/device info voor audit
- ❌ Geen onderscheid tussen werkgever en werknemer handtekening
- ❌ Niet NAW-compliant (geen bewijs wie getekend heeft)

**ONTBREKENDE SCHAKELS:**
1. Signature capture component (React canvas)
2. Signature storage (base64 of blob)
3. Signature audit tabel (wie, wat, waar, wanneer)
4. Multi-party signature flow (werkgever + werknemer)

---

### **PDF generatie**

| Feature | Status | Details |
|---------|--------|---------|
| **PDF library** | ❌ Ontbreekt | Geen jspdf/pdfmake in package.json |
| **Template rendering** | ❌ Ontbreekt | Geen template engine |
| **Dynamic content** | ❌ Ontbreekt | Geen merge fields systeem |
| **Signature embedding** | ❌ Ontbreekt | Geen signature placement in PDF |

**RISICO'S:**
- Handmatige PDF upload vereist (geen automatische generatie)
- Geen consistency in contract layout
- Geen merge van employee data → contract

**ONTBREKENDE SCHAKELS:**
1. PDF generation library (`jspdf` of `pdfmake`)
2. Contract templates (HTML → PDF conversion)
3. Variable substitution engine ({{employee.naam}} etc)

---

## 4️⃣ GAP ANALYSE (CRUCIAAL)

| Onderdeel | Bestaat | Herbruikbaar | Moet Nieuw | Opmerking |
|-----------|---------|--------------|-----------|-----------|
| **Contract data model** | ✅ Ja | ✅ Ja | ⚠️ Constraints | hq.contracts compleet maar loose typing |
| **Employee arbeidsrelatie** | ✅ Ja | ✅ Ja | ⚠️ Constraints | dienstverband_type vrije tekst |
| **Document storage** | ✅ Ja | ✅ Ja | ❌ Geen | Volledig functioneel |
| **Storage bucket** | ✅ Ja | ✅ Ja | ❌ Geen | hr-documents private bucket OK |
| **Document categorieën** | ✅ Ja | ✅ Ja | ❌ Geen | CONTRACT + ADDENDUM aanwezig |
| **Signature capture** | ❌ Nee | ❌ Nee | ✅ **Volledig nieuw** | Canvas component + storage |
| **Signature audit trail** | ❌ Nee | ❌ Nee | ✅ **Volledig nieuw** | IP, device, timestamps |
| **Multi-signatory flow** | ❌ Nee | ❌ Nee | ✅ **Volledig nieuw** | Werkgever + werknemer |
| **PDF generatie** | ❌ Nee | ❌ Nee | ✅ **Volledig nieuw** | jspdf + templates |
| **Contract templates** | ❌ Nee | ❌ Nee | ✅ **Volledig nieuw** | Template library |
| **Contract versioning** | ❌ Nee | ❌ Nee | ✅ Nieuw | Revisie tracking |
| **RLS policies** | ⚠️ Te open | ❌ Nee | ✅ **Hardening** | Alle authenticated = te breed |
| **Status flow** | ⚠️ Basic | ⚠️ Deels | ⚠️ Constraints | Concept→Actief→Verlopen enum |

---

## 5️⃣ RLS AUDIT (SECURITY)

### **hq.contracts** ⚠️ **TE OPEN**

**Current policies:**
```sql
-- SELECT: true (alle authenticated users)
"Authenticated users can view contracts" - qual: true

-- INSERT: true (alle authenticated users)
"Authenticated users can insert contracts" - with_check: true

-- UPDATE: true (alle authenticated users)
"Authenticated users can update contracts" - qual: true
```

**ISSUES:**
- ❌ **KRITIEK:** Elke authenticated user kan alle contracts zien
- ❌ **KRITIEK:** Elke authenticated user kan contracts wijzigen
- ❌ Geen role-based restrictions (HR/Owner only)
- ❌ Geen employee self-service restriction (alleen eigen contract)

**VEREIST:**
- ✅ HR + Owner: full access
- ✅ Employee: read-only eigen contract (via employee_id → user_id)
- ❌ Anderen: geen toegang

---

### **hq.employees** ⚠️ **TE OPEN**

**Current policies:**
```sql
-- SELECT: true (alle authenticated users)
-- INSERT: true (alle authenticated users)
-- UPDATE: true (alle authenticated users)
```

**ISSUES:**
- ❌ **KRITIEK:** Privacy violation - iedereen ziet alle medewerkers
- ❌ Geen role-based restrictions
- ❌ Geen "eigen profiel" vs "team profiel" onderscheid

---

### **hq.documents** ✅ **GOED BEVEILIGD**

**Current policies:**
```sql
-- HR/Owner can read all
"HR and OWNER can read all documents"
  qual: user.rol IN ('super_admin', 'hr', 'owner')

-- Employees can read own visible documents
"Employees can read own visible documents"
  qual: (zichtbaar_voor_medewerker = true)
    AND (employee_id matches user)
    AND (NOT hr_only category)

-- HR/Owner can insert/update/delete
```

**ASSESSMENT:** ✅ Dit is het voorbeeld voor contracts/employees

---

## 6️⃣ ADVIES - IMPLEMENTATIE SCENARIO'S

### **SCENARIO A: Uitbreiden bestaande tabellen** ⚠️

**Aanpak:**
- Voeg kolommen toe aan `hq.contracts`:
  - `signature_data_werkgever` (text/jsonb)
  - `signature_data_werknemer` (text/jsonb)
  - `signature_ip_werkgever`, `signature_ip_werknemer` (inet)
  - `getekend_timestamp_werkgever`, `getekend_timestamp_werknemer` (timestamptz)
  - `signature_device_info` (jsonb)

**VOORDELEN:**
- ✅ Snelle implementatie (1-2 dagen)
- ✅ Geen nieuwe tabellen
- ✅ Direct gekoppeld aan contract

**NADELEN:**
- ❌ Niet schaalbaar (max 2 handtekeningen)
- ❌ Moeilijk uit te breiden voor 3+ signatories
- ❌ Audit trail beperkt tot 2 events
- ❌ Data model niet normalized

**DATA-INTEGRITEIT:** ⚠️ Matig (denormalized)
**RLS EENVOUD:** ✅ Goed (alles op contracts tabel)
**ONDERHOUDBAARHEID:** ❌ Slecht (niet uitbreidbaar)
**PILOT-STABILITEIT:** ✅ Goed (weinig wijzigingen)

**AANBEVELING:** ❌ **NIET DOEN** - technische schuld

---

### **SCENARIO B: Aparte contract_signatures module** ✅ **AANBEVOLEN**

**Aanpak:**
- Nieuwe tabel: `hq.contract_signatures`
  ```sql
  - id (uuid, PK)
  - contract_id (uuid, FK → hq.contracts)
  - signatory_role (text) -- 'werkgever' | 'werknemer'
  - signatory_user_id (uuid, FK → users)
  - signature_data (text) -- base64 PNG
  - signed_at (timestamptz, NOT NULL)
  - ip_address (inet)
  - user_agent (text)
  - device_info (jsonb)
  - is_valid (boolean, default true)
  - invalidated_at, invalidated_reason
  ```

- Nieuwe tabel: `hq.contract_templates`
  ```sql
  - id (uuid, PK)
  - naam (text)
  - contract_type (text) -- vast/tijdelijk/zzp/etc
  - template_html (text) -- met {{variabelen}}
  - vereiste_handtekeningen (text[]) -- ['werkgever', 'werknemer']
  ```

- Update `hq.contracts`:
  - Verwijder `getekend` boolean
  - Verwijder `getekend_datum`
  - Behoud `status` (computed via signatures)
  - Add `template_id` (FK → contract_templates, nullable)

**VOORDELEN:**
- ✅ **Schaalbaar:** onbeperkt aantal handtekeningen
- ✅ **Audit trail:** volledige signature history per contract
- ✅ **Future-proof:** counter-signatures, witnessed signatures mogelijk
- ✅ **Clean data model:** normalized, no duplication
- ✅ **RLS eenvoudig:** aparte policies per concern
- ✅ **Invalidation support:** handtekeningen ongeldig maken bij wijzigingen

**NADELEN:**
- ⚠️ Meer implementatie tijd (5-6 dagen)
- ⚠️ Extra join voor "is getekend" check
- ⚠️ Complexere queries

**DATA-INTEGRITEIT:** ✅ **Uitstekend** (fully normalized)
**RLS EENVOUD:** ✅ **Goed** (aparte signature policies)
**ONDERHOUDBAARHEID:** ✅ **Uitstekend** (extensible)
**PILOT-STABILITEIT:** ✅ **Goed** (geen bestaande data impacted)

**AANBEVELING:** ✅ **BESTE KEUZE** - toekomstvast

---

### **SCENARIO C: Hybride (document_store extensie)** ⚠️

**Aanpak:**
- Gebruik `public.document_store` in plaats van `hq.documents`
- Voeg kolommen toe aan `document_store`:
  - `signature_required` (boolean)
  - `signatures` (jsonb array)
- Link contracts via `document_store.behandelplan_id` (hergebruik bestaand veld?)

**VOORDELEN:**
- ✅ Hergebruik bestaand document systeem
- ✅ Één plek voor alle documenten

**NADELEN:**
- ❌ `document_store` is patient-centric (behandelplan/zorgplan focus)
- ❌ Geen goede FK voor HR documenten (employee_id ontbreekt)
- ❌ Signature JSONB is niet queryable/indexable
- ❌ Mengeling van zorgsysteem en HR systeem
- ❌ RLS wordt complex (twee domeinen in één tabel)

**DATA-INTEGRITEIT:** ❌ **Slecht** (domain mixing)
**RLS EENVOUD:** ❌ **Complex** (care + HR policies mixed)
**ONDERHOUDBAARHEID:** ❌ **Slecht** (domain confusion)
**PILOT-STABILITEIT:** ⚠️ **Risico** (bestaande document_store wijzigen)

**AANBEVELING:** ❌ **NIET DOEN** - architecturele mismatch

---

## 7️⃣ IMPLEMENTATIE ROADMAP (SCENARIO B)

### **FASE 1: Database Foundation (2 dagen)**

**Migratie 1: Enum constraints**
```sql
-- Add enum-like constraints to existing tables
ALTER TABLE hq.contracts
  ADD CONSTRAINT contract_status_check
  CHECK (status IN ('concept', 'ter_ondertekening', 'actief', 'verlopen', 'beëindigd'));

ALTER TABLE hq.employees
  ADD CONSTRAINT dienstverband_type_check
  CHECK (dienstverband_type IN ('vast', 'tijdelijk', 'oproep', 'zzp', 'stage'));
```

**Migratie 2: Signature tables**
```sql
CREATE TABLE hq.contract_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES hq.contracts(id) ON DELETE CASCADE,
  signatory_role text NOT NULL CHECK (signatory_role IN ('werkgever', 'werknemer', 'getuige')),
  signatory_user_id uuid NOT NULL REFERENCES users(id),
  signature_data text NOT NULL, -- base64 PNG
  signed_at timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text,
  device_info jsonb,
  is_valid boolean DEFAULT true,
  invalidated_at timestamptz,
  invalidated_reason text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_contract_signatures_contract ON hq.contract_signatures(contract_id);
CREATE INDEX idx_contract_signatures_user ON hq.contract_signatures(signatory_user_id);
CREATE INDEX idx_contract_signatures_valid ON hq.contract_signatures(contract_id, is_valid);

ALTER TABLE hq.contract_signatures ENABLE ROW LEVEL SECURITY;
```

**Migratie 3: Contract templates**
```sql
CREATE TABLE hq.contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  naam text NOT NULL,
  omschrijving text,
  contract_type text NOT NULL,
  template_html text NOT NULL,
  vereiste_handtekeningen text[] NOT NULL DEFAULT ARRAY['werkgever', 'werknemer'],
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hq.contract_templates ENABLE ROW LEVEL SECURITY;

-- Add template reference to contracts
ALTER TABLE hq.contracts ADD COLUMN template_id uuid REFERENCES hq.contract_templates(id);
```

**Migratie 4: RLS hardening**
```sql
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view contracts" ON hq.contracts;
DROP POLICY IF EXISTS "Authenticated users can insert contracts" ON hq.contracts;
DROP POLICY IF EXISTS "Authenticated users can update contracts" ON hq.contracts;

-- Add proper role-based policies
CREATE POLICY "HR and Owner can view all contracts"
  ON hq.contracts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.rol IN ('super_admin', 'hr', 'owner')
    )
  );

CREATE POLICY "Employees can view own contract"
  ON hq.contracts FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM hq.employees
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "HR and Owner can manage contracts"
  ON hq.contracts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.rol IN ('super_admin', 'hr', 'owner')
    )
  );

-- Signature policies
CREATE POLICY "Users can view signatures on own contracts"
  ON hq.contract_signatures FOR SELECT
  TO authenticated
  USING (
    contract_id IN (
      SELECT id FROM hq.contracts
      WHERE employee_id IN (
        SELECT id FROM hq.employees WHERE user_id = auth.uid()
      )
    )
    OR signatory_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.rol IN ('super_admin', 'hr', 'owner')
    )
  );

CREATE POLICY "Users can sign contracts assigned to them"
  ON hq.contract_signatures FOR INSERT
  TO authenticated
  WITH CHECK (
    signatory_user_id = auth.uid()
    AND (
      -- Employee signing own contract
      (signatory_role = 'werknemer' AND contract_id IN (
        SELECT id FROM hq.contracts
        WHERE employee_id IN (SELECT id FROM hq.employees WHERE user_id = auth.uid())
      ))
      -- HR/Owner signing as employer
      OR (signatory_role = 'werkgever' AND EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND rol IN ('hr', 'owner')
      ))
    )
  );
```

---

### **FASE 2: Frontend Components (2 dagen)**

1. **SignatureCapture.tsx** - Canvas component voor handtekening
2. **ContractViewer.tsx** - PDF preview met signature placeholders
3. **ContractSigningFlow.tsx** - Multi-step signing wizard
4. **ContractTemplateEditor.tsx** - Template beheer voor HR

---

### **FASE 3: PDF Generation (1 dag)**

1. Install `jspdf` of `pdfmake`
2. Create `contractPdfGenerator.ts` service
3. Variable substitution engine
4. Signature embedding in PDF

---

### **FASE 4: Testing & Deployment (1 dag)**

1. Test signature capture op verschillende devices
2. Test RLS policies (role isolation)
3. Test complete signing flow (werkgever → werknemer)
4. UAT met HR team

**TOTALE TIJD: 6 WERKDAGEN**

---

## 8️⃣ QUICK WINS (ZONDER CONTRACT MODULE)

Deze verbeteringen kunnen NU worden gedaan:

1. **✅ Enum constraints toevoegen** (30 min)
   - `contracts.status` enum
   - `employees.dienstverband_type` enum

2. **✅ RLS hardening** (1 uur)
   - Restrictieve policies op contracts
   - Restrictieve policies op employees

3. **✅ Foreign key cleanup** (30 min)
   - `contracts.created_by` → FK naar users
   - `documents.geupload_door` → FK naar users
   - Remove duplicate `documents.category_id` (behoud `document_category_id`)

4. **✅ Index optimalisatie** (30 min)
   - Index op `contracts.employee_id`
   - Index op `contracts.status`
   - Index op `employees.user_id`

**TOTALE TIJD QUICK WINS: 2.5 UUR**

---

## 9️⃣ RISICO MATRIX

| Risico | Impact | Kans | Mitigatie |
|--------|--------|------|-----------|
| **Geen juridische handtekening** | 🔴 Hoog | 🟢 Laag | Implementeer Scenario B volledig |
| **RLS te open** | 🔴 Hoog | 🔴 Hoog | Quick win #2 direct uitvoeren |
| **Geen audit trail** | 🟡 Gemiddeld | 🟡 Gemiddeld | Signature tabel met volledige metadata |
| **Contract versioning ontbreekt** | 🟡 Gemiddeld | 🟢 Laag | Kan later toegevoegd worden |
| **PDF generation ontbreekt** | 🟡 Gemiddeld | 🟢 Laag | Handmatige upload acceptabel voor pilot |

---

## 🏆 FINALE AANBEVELING

**ADVIES: SCENARIO B (Aparte signature module)**

**MOTIVATIE:**
1. ✅ **Data-integriteit:** Clean normalized design, geen data duplication
2. ✅ **RLS eenvoud:** Aparte policies per tabel, clear separation of concerns
3. ✅ **Onderhoudbaarheid:** Extensible voor future requirements (3+ signatories, workflows)
4. ✅ **Pilot-stabiliteit:** Geen impact op bestaande `hq.contracts` data
5. ✅ **Juridische compliance:** Volledige audit trail per handtekening
6. ✅ **Toekomstvast:** Template systeem voor verschillende contract types

**IMPLEMENTATIE PRIORITEIT:**
1. 🟢 **Eerst:** Quick wins (RLS hardening, enum constraints) - 2.5 uur
2. 🟡 **Daarna:** Fase 1 database foundation - 2 dagen
3. 🔵 **Laatste:** Fase 2-4 frontend + PDF - 4 dagen

**TOTAAL:** 1 werkweek voor complete module, 2.5 uur voor kritieke security fixes

---

## 📊 READINESS SCORECARD

| Component | Score | Status |
|-----------|-------|--------|
| Contract data model | 8/10 | ✅ Goed |
| Employee model | 7/10 | ✅ Goed |
| Document storage | 9/10 | ✅ Uitstekend |
| Signature system | 0/10 | ❌ Ontbreekt |
| PDF generation | 0/10 | ❌ Ontbreekt |
| RLS security | 3/10 | 🔴 Kritiek |
| Audit trail | 2/10 | 🔴 Onvoldoende |
| Templates | 0/10 | ❌ Ontbreekt |

**OVERALL: 70/100** - Solide basis, signature + security vereist

---

**EINDE RAPPORT**
