# HR Documenten Herstructurering - Implementatierapport

**Datum:** 2025-12-14
**Module:** DNMZ+ HQ
**Status:** ✅ COMPLEET

---

## 📋 OVERZICHT

De HR-documenten module is volledig geherstructureerd volgens de vastgestelde architectuur. Alle documenten zijn nu logisch gecategoriseerd, gekoppeld aan medewerkerprofielen, en voorbereid voor integratie met bekwaamheden, roosters en finance.

---

## ✅ GEÏMPLEMENTEERDE FEATURES

### 1. **Document Categorieën (Gestandaardiseerd)**

De volgende categorieën zijn geïmplementeerd en afgedwongen op database niveau:

| Categorie Code | Label | Omschrijving |
|---|---|---|
| `contracten` | Contracten | Arbeidscontracten en addenda |
| `diploma_certificaat` | Diploma's & Certificaten | Opleidingsdiploma's en certificeringen |
| `identificatie` | Identificatie | ID documenten (extra beveiligd) |
| `gesprek` | Gesprekken & Beoordelingen | Functioneringsgesprekken en beoordelingen |
| `pop` | POP | Persoonlijk Ontwikkel Plan |
| `onboarding` | Onboarding Docs | Onboarding documenten |
| `financieel_hr` | Financieel (HR) | Financiële HR documenten |

**Database constraint:**
```sql
CHECK (category IN ('contracten', 'diploma_certificaat', 'identificatie', 'gesprek', 'pop', 'onboarding', 'financieel_hr'))
```

---

### 2. **Verplichte Medewerker Koppeling**

- ✅ Elk document **MOET** gekoppeld zijn aan `hq.employees.id`
- ✅ Geen "losse" documenten toegestaan
- ✅ `employee_id` is NOT NULL constraint

**Database structuur:**
```sql
CREATE TABLE hq.documents (
  id uuid PRIMARY KEY,
  employee_id uuid REFERENCES hq.employees(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL CHECK (...),
  titel text NOT NULL,
  omschrijving text,
  file_url text NOT NULL,
  valid_until date,
  vertrouwelijk boolean DEFAULT false,
  zichtbaar_voor_medewerker boolean DEFAULT true,
  status text DEFAULT 'actief',
  ...
);
```

---

### 3. **Privacy & Security (RLS Policies)**

#### **Super Admin + HR:**
- ✅ Kunnen **alle** documenten lezen, aanmaken, updaten en verwijderen
- ✅ Hebben volledige toegang tot identificatie documenten

#### **Medewerkers:**
- ✅ Kunnen **alleen eigen** documenten lezen
- ✅ Alleen als `zichtbaar_voor_medewerker = true`
- ✅ **GEEN** toegang tot identificatie documenten

#### **Extra Beveiliging Identificatie:**
```sql
CREATE POLICY "Only Super Admin and HR can read identification documents"
  ON hq.documents FOR SELECT
  TO authenticated
  USING (
    category = 'identificatie'
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND rol IN ('super_admin', 'hr'))
  );
```

---

### 4. **Bekwaamheden ↔ Documenten Koppeling**

✅ **Database koppeling:**
- `hq.employee_skills.document_id` → `hq.documents.id`
- Foreign key met ON DELETE SET NULL

✅ **UI Functionaliteit:**
- Bij het toekennen van een bekwaamheid kan je een document selecteren
- Alleen diploma/certificaat documenten worden getoond
- Verloopdatum wordt gevalideerd en getoond
- Document icoon wordt getoond bij skills met gekoppeld document

✅ **View voor status tracking:**
```sql
CREATE VIEW hq.employee_skills_with_document_status AS
SELECT
  es.*,
  d.category as document_category,
  d.titel as document_titel,
  d.valid_until as document_valid_until,
  CASE
    WHEN d.valid_until >= CURRENT_DATE THEN 'geldig'
    WHEN d.valid_until < CURRENT_DATE THEN 'verlopen'
    WHEN es.gecertificeerd = true THEN 'geldig_zonder_document'
    ELSE 'niet_gecertificeerd'
  END as bekwaamheid_status
FROM hq.employee_skills es
LEFT JOIN hq.documents d ON es.document_id = d.id;
```

---

### 5. **UI/UX Implementatie**

#### **Medewerkerprofiel - Documenten Tab**

**Component:** `src/components/HQDocumentsTab.tsx`

**Features:**
- ✅ Categorie filters met document counts
- ✅ Document upload met drag-and-drop zone
- ✅ Document preview met status indicators
- ✅ Verloopdatum waarschuwingen (rood/geel/groen)
- ✅ Privacy indicatoren (vertrouwelijk, zichtbaar voor medewerker)
- ✅ Download en view functionaliteit
- ✅ Responsive design
- ✅ Empty states per categorie

**Visual Features:**
- 🟢 **Geldig** - Document actief en geldig
- 🟡 **Binnenkort verlopen** - Binnen 30 dagen
- 🔴 **Verlopen** - Verloopdatum gepasseerd
- 🔒 **Vertrouwelijk** - Extra security indicator
- 👁️ **Zichtbaarheid** - Wel/niet zichtbaar voor medewerker

#### **Document Upload Modal**

**Velden:**
- Categorie selectie (verplicht)
- Titel (verplicht)
- Omschrijving (optioneel)
- Geldig tot datum (optioneel)
- Bestand upload (verplicht)
- Vertrouwelijk checkbox
- Zichtbaar voor medewerker checkbox

#### **Bekwaamheden Tab - Document Selector**

**Features:**
- ✅ Dropdown met beschikbare diploma/certificaat documenten
- ✅ Verloopdatum wordt getoond per document
- ✅ Verlopen documenten krijgen ⚠️ indicator
- ✅ Real-time validatie feedback
- ✅ Link naar documenten tab als er geen documenten zijn

---

## 📊 DATABASE VIEWS

### **hq.document_categories**
Reference view voor categorie labels en omschrijvingen.

### **hq.documents_with_employee**
Documenten met medewerker informatie en computed status.

### **hq.employee_skills_with_document_status**
Skills met gekoppelde documenten en bekwaamheid status.

---

## 🔧 TECHNISCHE DETAILS

### **Migratie:**
`supabase/migrations/YYYYMMDD_hr_documents_restructure_categories_and_privacy_v3.sql`

**Stappen:**
1. Drop oude category constraint
2. Migreer bestaande data naar nieuwe categorieën
3. Add nieuwe category constraint
4. Drop oude RLS policies
5. Implementeer nieuwe privacy-aware RLS policies
6. Create views voor categorie labels en document status
7. Add indexes voor performance

### **Indexes:**
```sql
CREATE INDEX idx_documents_category ON hq.documents(category);
CREATE INDEX idx_documents_valid_until ON hq.documents(valid_until);
CREATE INDEX idx_documents_employee_category ON hq.documents(employee_id, category);
CREATE INDEX idx_employee_skills_document ON hq.employee_skills(document_id);
```

---

## 🚀 DEPLOYMENT REQUIREMENTS

### **Supabase Storage Bucket**

⚠️ **BELANGRIJK:** Maak de volgende storage bucket aan in Supabase:

**Bucket naam:** `hr-documents`

**Settings:**
- Public: `false`
- File size limit: `10MB` (aanbevolen)
- Allowed MIME types: `application/pdf, image/jpeg, image/png, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document`

**RLS Policies (bucket):**
```sql
-- Super Admin en HR kunnen uploaden
CREATE POLICY "Super Admin and HR can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'hr-documents'
  AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND rol IN ('super_admin', 'hr'))
);

-- Super Admin en HR kunnen lezen
CREATE POLICY "Super Admin and HR can read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'hr-documents'
  AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND rol IN ('super_admin', 'hr'))
);
```

---

## 📝 GEBRUIKERSINSTRUCTIES

### **HR Manager / Super Admin:**

1. **Documenten Uploaden:**
   - Ga naar HQ → Medewerkers
   - Selecteer een medewerker
   - Klik op tabblad "Documenten"
   - Klik "Document Toevoegen"
   - Vul categorie, titel, en andere velden in
   - Upload bestand
   - Sla op

2. **Bekwaamheid met Document Koppelen:**
   - Ga naar tabblad "Bekwaamheden"
   - Klik "Bekwaamheid Toevoegen"
   - Selecteer skill
   - Scroll naar "Bewijs / Certificaat"
   - Selecteer document uit dropdown
   - Sla op

3. **Document Status Monitoren:**
   - Verlopen documenten worden rood getoond
   - Binnenkort verlopende documenten (< 30 dagen) worden geel getoond
   - Geldige documenten worden groen getoond

---

## 🎯 STOPCRITERIA (VOLDAAN)

- ✅ Elk medewerkerprofiel heeft een Documenten-tab
- ✅ Documenten correct gecategoriseerd
- ✅ Bekwaamheden kunnen documenten koppelen
- ✅ Privacy policies geïmplementeerd voor identificatie
- ✅ Niets buiten HR is aangepast
- ✅ Build succesvol (geen errors)

---

## 🔮 TOEKOMSTIGE INTEGRATIES (VOORBEREID)

### **Roosters:**
- Document verloopdatum kan worden gebruikt om medewerkers te blokkeren van shifts
- Bekwaamheden met verlopen certificaten worden gemarkeerd

### **Finance:**
- Document categorie "financieel_hr" is voorbereid voor salarisstroken, bonussen, etc.
- Contracten kunnen worden gekoppeld aan financiële gegevens

### **Compliance:**
- Document expiry tracking is voorbereid voor compliance dashboards
- Identificatie documenten hebben extra beveiliging

---

## 📞 SUPPORT

Bij vragen of problemen:
1. Check database logs voor RLS policy issues
2. Verifieer dat storage bucket `hr-documents` bestaat
3. Check user rol (moet `super_admin` of `hr` zijn voor volledige toegang)

---

**Implementatie door:** Claude AI
**Review status:** Klaar voor productie
**Laatste update:** 2025-12-14
