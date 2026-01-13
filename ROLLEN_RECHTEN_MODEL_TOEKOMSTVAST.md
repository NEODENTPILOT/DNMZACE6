# ROLLEN & RECHTEN MODEL - TOEKOMSTVAST
**Versie:** 2.0
**Datum:** 2025-12-23
**Doel:** Production-ready authorization model voor ARMIN CARE ENGINE (ACE+)

---

## 📋 INHOUDSOPGAVE

1. [Rol Definities](#1-rol-definities)
2. [Module Toegangsmatrix](#2-module-toegangsmatrix)
3. [Granulaire Permissions](#3-granulaire-permissions)
4. [Data Access Beperkingen](#4-data-access-beperkingen)
5. [Mapping naar Database](#5-mapping-naar-database)
6. [Migratie Strategie](#6-migratie-strategie)
7. [Implementatie Roadmap](#7-implementatie-roadmap)

---

## 1️⃣ ROL DEFINITIES

### 1.1 Rol Hiërarchie (8 Rollen)

```
LEVEL 200  🔴 SUPER ADMIN      Platform-level toegang
LEVEL 150  🟠 ICT              Technische infrastructuur
LEVEL 140  🟠 TD (Technische Dienst)  Apparatuur & onderhoud
LEVEL 100  🟡 ADMIN            Praktijk administratie
LEVEL 80   🟢 MANAGER          Dagelijks management
LEVEL 60   🔵 TANDARTS         Klinische behandelingen
LEVEL 50   🔵 MONDHYGIËNIST    Preventie & hygiëne
LEVEL 30   🟣 ASSISTENT        Klinische ondersteuning
```

**Hierarchie Principe:**
- Hogere level kan alles van lagere levels (tenzij specifiek beperkt)
- Exception: TD & ICT hebben GEEN toegang tot patiëntdata (privacy/GDPR)
- Exception: Finance data is OWNER-only (niet via level hierarchy)

---

### 1.2 Rol: SUPER ADMIN

**Level:** 200
**Key:** `super_admin`
**Badge:** 🔴 SUPER ADMIN

#### Verantwoordelijkheden
- **Platform Beheer:** Systeem configuratie, feature flags, database maintenance
- **User Management:** Alle gebruikers aanmaken/wijzigen/verwijderen
- **Security:** Rollen toewijzen, permissions beheren, audit logs inzien
- **Emergency Access:** Kan alles ontgrendelen bij calamiteiten
- **Multi-Practice:** Toegang tot ALLE praktijklocaties tegelijk
- **Development:** Debug tools, AI systemen kalibreren, data migraties

#### Toegang per Module
| Module | Toegang | Notes |
|--------|---------|-------|
| T-ZONE+ | **ADMIN** | Alle zones, kan posts modereren/verwijderen |
| CARE+ | **ADMIN** | Alle patiënten, alle documenten, clinical reasoning inzien |
| D-ICE+ | **ADMIN** | Alle workflows, budgets, diagnoses - VOLLEDIGE TOEGANG |
| C-BUDDY+ | **ADMIN** | Alle checklists, templates aanpassen |
| AIR+ | **ADMIN** | Alle voorraad, onderhoud, QR systeem beheer |
| BUILD+ | **ADMIN** | Protocollen, templates, AI kennisbank volledige controle |
| HQ+ | **ADMIN** | HR, financiën (indien ook owner), roosters, onboarding |
| BEHEER | **ADMIN** | Alle admin tools, imports, configuratie |

#### Specifieke Rights
- ✅ Kan andere Super Admins aanmaken
- ✅ Kan Admin rechten verlenen/intrekken
- ✅ Toegang tot raw database queries (via admin tools)
- ✅ Kan is_owner flag togglen (voor finance toegang)
- ✅ Ziet audit logs van alle users
- ✅ Kan RLS policies bypassen voor troubleshooting
- ✅ Toegang tot development/debug features
- ⚠️ **Let op:** Met grote macht komt grote verantwoordelijkheid

#### Beperkingen
- Geen beperkingen (full access)
- Moet wel 2FA enabled hebben (security requirement)
- Audit log van alle acties (accountability)

---

### 1.3 Rol: ICT

**Level:** 150
**Key:** `ict_admin`
**Badge:** 🟠 ICT

#### Verantwoordelijkheden
- **IT Infrastructuur:** Servers, netwerk, backups, security monitoring
- **System Integration:** API koppelingen, data exports, externe systemen
- **Performance:** Database optimalisatie, caching, monitoring dashboards
- **Security:** SSL certificaten, firewall, vulnerability scans
- **Support:** Technische helpdesk voor medewerkers (niet klinisch)
- **Documentation:** Technische documentatie bijhouden

#### Toegang per Module
| Module | Toegang | Notes |
|--------|---------|-------|
| T-ZONE+ | **READ** | Kan posts lezen voor troubleshooting, NIET modereren |
| CARE+ | **NONE** | 🔒 GEEN toegang tot patiëntdata (GDPR/privacy) |
| D-ICE+ | **NONE** | 🔒 GEEN toegang tot diagnoses, budgets, behandelplannen |
| C-BUDDY+ | **READ** | Kan checklists inzien voor systeem troubleshooting |
| AIR+ | **ADMIN** | Volledige toegang: QR systeem, inventory database, imports |
| BUILD+ | **WRITE** | Kan protocollen uploaden, media beheren, NIET AI systemen |
| HQ+ | **READ** | Kan roosters, locaties, taken inzien - GEEN HR documenten/finance |
| BEHEER | **ADMIN** | Import tools, UPT data, systeem configuratie, database tools |

#### Specifieke Rights
- ✅ Kan imports uitvoeren (UPT codes, standaardteksten)
- ✅ Toegang tot database admin tools (zonder patiëntdata queries)
- ✅ Kan media uploads beheren
- ✅ QR code systeem volledig beheren
- ✅ API keys en integraties configureren
- ✅ Backup en restore operaties
- ✅ Performance monitoring dashboards
- ❌ **NIET:** Patiëntdata, klinische documenten, budgets, HR dossiers

#### Beperkingen
- 🔒 **GEEN patiëntdata:** Alle tables met patient_id, zorgplannen, behandelplannen, diagnoses
- 🔒 **GEEN HR data:** Contracten, salarissen, performance reviews, disciplinaire acties
- 🔒 **GEEN financiële data:** Omzet, kosten, winst/verlies, investeringen
- ⚠️ Kan NIET andere ICT/Admin users aanmaken (moet via Super Admin)
- RLS policies filteren automatisch patiëntdata weg (WHERE patient_id IS NULL enforcement)

---

### 1.4 Rol: TD (Technische Dienst)

**Level:** 140
**Key:** `technische_dienst`
**Badge:** 🟠 TD

#### Verantwoordelijkheden
- **Apparatuur Beheer:** Onderhoud, keuringen, reparaties medische apparatuur
- **Inventory Management:** Voorraad, bestellingen, leveranciers contacten
- **Ruimte Beheer:** Checklists, reinigingsprotocollen, veiligheid
- **Preventief Onderhoud:** Planning, uitvoeren, documenteren
- **Storingen:** Afhandelen, troubleshooting, externe technicians coördineren
- **Compliance:** CE-keuringen, NEN-normen, veiligheidsinspecties

#### Toegang per Module
| Module | Toegang | Notes |
|--------|---------|-------|
| T-ZONE+ | **WRITE** | Kan updates posten, teamcommunicatie, NIET modereren |
| CARE+ | **NONE** | 🔒 GEEN toegang tot patiëntdata |
| D-ICE+ | **NONE** | 🔒 GEEN toegang tot klinische workflows |
| C-BUDDY+ | **WRITE** | Kan ruimte checklists invullen/beheren, master checklists inzien |
| AIR+ | **ADMIN** | VOLLEDIGE toegang: apparatuur, onderhoud, storingen, leveranciers |
| BUILD+ | **READ** | Kan protocollen inzien (voor onderhoudsprocedures) |
| HQ+ | **READ** | Kan taken inzien/updaten, locaties, GEEN HR/finance |
| BEHEER | **NONE** | Geen toegang tot admin configuratie |

#### Specifieke Rights
- ✅ Onderhoud & storingen volledig beheren
- ✅ Apparatuur inventaris aanpassen
- ✅ QR labels scannen en asset info updaten
- ✅ Leveranciers contacteren via systeem
- ✅ Onderhoudslogboek bijhouden
- ✅ Ruimte checklists aftekenen
- ✅ Preventief onderhoudsschema opstellen
- ✅ Kan onderhoud plannen en voltooien
- ❌ **NIET:** Patiëntdata, klinische info, HR, financiën

#### Beperkingen
- 🔒 **GEEN patiëntdata:** Kan NIET zien welke apparaten bij welke patiënt gebruikt zijn
- 🔒 **GEEN klinische info:** Geen behandelplannen, diagnoses, recepten
- 🔒 **GEEN HR/Finance:** Geen contracten, salarissen, omzet
- ⚠️ Kan GEEN gebruikers aanmaken of rechten wijzigen
- Assets gekoppeld aan cases: TD ziet alleen asset_id, NIET patient_id/case details
- RLS policies: WHERE patient_id IS NULL or user is klinisch

---

### 1.5 Rol: ADMIN

**Level:** 100
**Key:** `admin`
**Badge:** 🟡 ADMIN

#### Verantwoordelijkheden
- **Praktijk Administratie:** Dagelijkse praktijkvoering, configuratie, instellingen
- **User Management:** Medewerkers aanmaken/beheren (behalve andere Admins/Super Admins)
- **Master Data:** Protocollen, templates, categorieën, UPT sets
- **Quality Control:** Checklists, protocollen compliance, documentatie
- **System Config:** Locaties, ruimtes, functiegroepen, clinical titles
- **Training Coordination:** Onboarding templates, instructie materialen

#### Toegang per Module
| Module | Toegang | Notes |
|--------|---------|-------|
| T-ZONE+ | **ADMIN** | Alle zones, kan posts verwijderen/modereren binnen praktijk |
| CARE+ | **ADMIN** | Alle patiënten, documenten, AI systemen - VOLLEDIGE klinische toegang |
| D-ICE+ | **ADMIN** | Alle workflows, budgets goedkeuren, templates beheren |
| C-BUDDY+ | **ADMIN** | Alle checklists, templates aanpassen, compliance monitoring |
| AIR+ | **ADMIN** | Voorraad, onderhoud, bestellingen, QR systeem |
| BUILD+ | **ADMIN** | Protocollen, templates, AI kennisbank, media |
| HQ+ | **WRITE** | HR (behalve finance), roosters, onboarding, GEEN salaris/contracten |
| BEHEER | **ADMIN** | Admin tools, imports, configuratie (praktijk-level) |

#### Specifieke Rights
- ✅ Kan Manager, Tandarts, MH, Assistent, TD users aanmaken
- ✅ Kan rechten toewijzen (binnen eigen level en lager)
- ✅ Begrotingen goedkeuren/afwijzen
- ✅ Protocollen publiceren
- ✅ Master checklists aanmaken
- ✅ UPT sets beheren
- ✅ Onboarding templates aanpassen
- ✅ AI systemen kalibreren (UPT learning, diagnosis matching)
- ✅ Audit logs inzien (praktijk-level)
- ❌ **NIET:** Andere Admins aanmaken, Super Admin rechten, raw database

#### Beperkingen
- ⚠️ Kan GEEN Super Admin of ICT users aanmaken/wijzigen
- ⚠️ Kan GEEN is_owner flag togglen
- ⚠️ Geen toegang tot Finance Dashboard (tenzij ook owner)
- ⚠️ Geen toegang tot raw database queries
- Gefilterd op praktijk_locatie (multi-practice: alleen eigen locaties)

---

### 1.6 Rol: MANAGER

**Level:** 80
**Key:** `manager`
**Badge:** 🟢 MANAGER

#### Verantwoordelijkheden
- **Team Coördinatie:** Dagelijkse aansturing, planning, roosters
- **Operational Excellence:** Workflows optimaliseren, efficiëntie bewaken
- **Quality Monitoring:** Checklists controleren, protocollen naleving
- **Patient Flow:** Triage, planning, wachttijden monitoren
- **Inventory Oversight:** Voorraad bijhouden, bestellingen autoriseren
- **Reporting:** KPI's, team performance, incident rapportage

#### Toegang per Module
| Module | Toegang | Notes |
|--------|---------|-------|
| T-ZONE+ | **WRITE** | Kan posten, teamcommunicatie, beperkt modereren (eigen posts) |
| CARE+ | **WRITE** | Recepten invoeren, triage, GEEN behandelplannen aanmaken |
| D-ICE+ | **READ** | Kan workflows/budgets inzien voor planning, NIET goedkeuren |
| C-BUDDY+ | **WRITE** | Checklists invullen, controleren, rapportage - NIET templates |
| AIR+ | **WRITE** | Voorraad beheren, bestellingen, onderhoud inplannen |
| BUILD+ | **READ** | Protocollen inzien, templates lezen |
| HQ+ | **WRITE** | Roosters, taken, onboarding volgen, GEEN HR documenten |
| BEHEER | **NONE** | Geen admin tools toegang |

#### Specifieke Rights
- ✅ Roosters opstellen en wijzigen
- ✅ Taken toewijzen aan teamleden
- ✅ Triage uitvoeren (balie)
- ✅ Voorraad bestellingen plaatsen
- ✅ Onderhoud inplannen
- ✅ Checklists controleren en aftekenen (alle ruimtes)
- ✅ KPI dashboards inzien
- ✅ Team T-ZONE posts maken
- ❌ **NIET:** Gebruikers aanmaken, protocollen wijzigen, budgets goedkeuren

#### Beperkingen
- ⚠️ Kan GEEN users aanmaken of rechten wijzigen
- ⚠️ Kan GEEN protocollen of templates wijzigen
- ⚠️ Kan GEEN begrotingen goedkeuren
- ⚠️ Beperkte toegang tot patiëntdata (alleen voor planning/triage)
- Gefilterd op eigen locatie (multi-practice: hoofdlocatie + toegewezen)

---

### 1.7 Rol: TANDARTS

**Level:** 60
**Key:** `tandarts`
**Badge:** 🔵 TANDARTS

#### Verantwoordelijkheden
- **Klinische Zorg:** Diagnose, behandelplanning, uitvoering
- **Documentation:** Status praesens, klinische notes, verslagen
- **Prescribing:** Recepten voorschrijven (indien bevoegd)
- **Treatment Planning:** ICE workflows, begrotingen opstellen
- **Quality:** Protocollen volgen, evidence-based practice
- **Mentoring:** AIO's/assistenten begeleiden (optioneel)

#### Toegang per Module
| Module | Toegang | Notes |
|--------|---------|-------|
| T-ZONE+ | **WRITE** | Team communicatie, cases delen (geanonimiseerd indien extern) |
| CARE+ | **WRITE** | VOLLEDIGE klinische toegang: patiënten, documenten, AI tools |
| D-ICE+ | **WRITE** | Workflows aanmaken, budgets opstellen, diagnoses stellen |
| C-BUDDY+ | **WRITE** | Behandelkamer checklists invullen, compliance |
| AIR+ | **READ** | Kan voorraad inzien, verbruik registreren |
| BUILD+ | **READ** | Protocollen inzien, templates gebruiken |
| HQ+ | **READ** | Eigen rooster, eigen taken, GEEN team roosters wijzigen |
| BEHEER | **NONE** | Geen admin tools |

#### Specifieke Rights
- ✅ Patiënten aanmaken
- ✅ Status praesens vastleggen (volledige dental chart)
- ✅ Diagnoses stellen
- ✅ Behandelplannen aanmaken (ICE workflows)
- ✅ Begrotingen opstellen
- ✅ Recepten voorschrijven (indien is_voorschrijver=true)
- ✅ Verrichtingen registreren
- ✅ Klinische documenten genereren (AI assistentie)
- ✅ Informed consent ondertekenen
- ✅ Implantaten/biomaterialen registreren bij gebruik
- ❌ **NIET:** Begrotingen goedkeuren (moet via Admin/Manager), users beheren

#### Beperkingen
- ⚠️ Kan ALLEEN eigen patiënten zien (RLS: WHERE behandelaar_id = auth.uid())
- ⚠️ Kan GEEN andere tandartsen patiënten wijzigen (zonder overdracht)
- ⚠️ Kan GEEN protocollen aanpassen
- ⚠️ Voorschrijfrechten afhankelijk van BIG registratie (is_voorschrijver flag)
- Multi-practice: Alleen patiënten op eigen locaties

---

### 1.8 Rol: MONDHYGIËNIST

**Level:** 50
**Key:** `mondhygienist`
**Badge:** 🔵 MONDHYGIËNIST

#### Verantwoordelijkheden
- **Preventieve Zorg:** Preventie, hygiëne, voorlichting
- **Periodontal Care:** Paro behandelingen, metingen, monitoring
- **Documentation:** Status praesens (paro indices), behandelverslagen
- **Patient Education:** Instructie, motivatie, nazorg
- **Recall System:** Periodieke controles plannen
- **Collaboration:** Overleg met tandarts bij complexe cases

#### Toegang per Module
| Module | Toegang | Notes |
|--------|---------|-------|
| T-ZONE+ | **WRITE** | Team communicatie |
| CARE+ | **WRITE** | Klinische toegang: patiënten, paro-specifieke documenten |
| D-ICE+ | **LIMITED** | Kan paro-workflows zien, BEPERKTE budget toegang |
| C-BUDDY+ | **WRITE** | Behandelkamer checklists |
| AIR+ | **READ** | Voorraad inzien, verbruik registreren |
| BUILD+ | **READ** | Protocollen inzien |
| HQ+ | **READ** | Eigen rooster, eigen taken |
| BEHEER | **NONE** | Geen admin tools |

#### Specifieke Rights
- ✅ Patiënten aanmaken (preventie/hygiëne)
- ✅ Status praesens vastleggen (periodontal indices: BOP, PPS, recessie)
- ✅ Paro diagnoses stellen (binnen bevoegdheid)
- ✅ Hygiëne behandelplannen aanmaken
- ✅ Behandelverslagen schrijven
- ✅ Voorlichting documenteren
- ✅ Recall afspraken plannen
- ⚠️ **BEPERKT:** Kan GEEN recepten voorschrijven
- ⚠️ **BEPERKT:** Kan GEEN implantaten plaatsen/registreren
- ❌ **NIET:** Complexe restauraties, chirurgie, prothetiek

#### Beperkingen
- ⚠️ Kan ALLEEN eigen patiënten zien + patiënten doorverwezen door tandarts
- ⚠️ Geen voorschrijfrechten (tenzij specifiek bevoegd: is_voorschrijver check)
- ⚠️ Beperkte ICE workflows (alleen preventie/paro gerelateerd)
- ⚠️ Kan GEEN begrotingen goedkeuren
- RLS: WHERE behandelaar_id = auth.uid() OR shared_with_user_id = auth.uid()

---

### 1.9 Rol: ASSISTENT

**Level:** 30
**Key:** `assistent`
**Badge:** 🟣 ASSISTENT

#### Verantwoordelijkheden
- **Behandel Assistentie:** Voorbereiden, assisteren, afronden behandelingen
- **Sterilisatie:** Instrumenten reinigen, steriliseren, registreren
- **Voorraad:** Materialen bijvullen, verbruik registreren
- **Patient Care:** Patiënten ontvangen, nazorg instructies
- **Checklists:** Behandelkamer checklists uitvoeren
- **Administrative Support:** Basisregistratie, agenda ondersteuning

#### Toegang per Module
| Module | Toegang | Notes |
|--------|---------|-------|
| T-ZONE+ | **WRITE** | Team communicatie, shift updates |
| CARE+ | **LIMITED** | Kan patiëntgegevens LEZEN, beperkt invoeren (nazorg notes) |
| D-ICE+ | **READ** | Kan behandelplannen inzien (voor voorbereiding), NIET wijzigen |
| C-BUDDY+ | **WRITE** | Behandelkamer checklists invullen, sterilisatie registreren |
| AIR+ | **WRITE** | Voorraad bijvullen, verbruik registreren, bestellingen aanvragen |
| BUILD+ | **READ** | Protocollen inzien (werkinstructies) |
| HQ+ | **READ** | Eigen rooster, eigen taken |
| BEHEER | **NONE** | Geen admin tools |

#### Specifieke Rights
- ✅ Patiëntgegevens lezen (voor behandelassistentie)
- ✅ Checklists invullen (behandelkamer, sterilisatie)
- ✅ Verbruik registreren (materialen, instrumenten)
- ✅ Voorraad bijvullen
- ✅ Afspraken inplannen (balie functie)
- ✅ Nazorg instructies noteren
- ✅ T-ZONE communicatie (shift handovers)
- ❌ **NIET:** Status praesens wijzigen, diagnoses, behandelplannen, recepten

#### Beperkingen
- ⚠️ **READ-ONLY** voor meeste patiëntdata
- ⚠️ Kan GEEN behandelplannen aanmaken of wijzigen
- ⚠️ Kan GEEN diagnoses stellen
- ⚠️ Kan GEEN recepten invoeren of voorschrijven
- ⚠️ Kan GEEN begrotingen opstellen
- RLS: WHERE (patient behandeld door accessible tandarts) OR (balie: alle patiënten read)
- Specifieke velden editable: nazorg_notes, verbruik_registratie, checklist_items

---

## 2️⃣ MODULE TOEGANGSMATRIX

### 2.1 Complete Matrix (Rol × Module)

| Module | Super Admin | ICT | TD | Admin | Manager | Tandarts | MH | Assistent |
|--------|-------------|-----|----|----|---------|----------|-------|-----------|
| **T-ZONE+** | ADMIN | READ | WRITE | ADMIN | WRITE | WRITE | WRITE | WRITE |
| **CARE+** | ADMIN | NONE 🔒 | NONE 🔒 | ADMIN | WRITE | WRITE | WRITE | LIMITED |
| **D-ICE+** | ADMIN | NONE 🔒 | NONE 🔒 | ADMIN | READ | WRITE | LIMITED | READ |
| **C-BUDDY+** | ADMIN | READ | WRITE | ADMIN | WRITE | WRITE | WRITE | WRITE |
| **AIR+** | ADMIN | ADMIN | ADMIN | ADMIN | WRITE | READ | READ | WRITE |
| **BUILD+** | ADMIN | WRITE | READ | ADMIN | READ | READ | READ | READ |
| **HQ+** | ADMIN | READ* | READ* | WRITE | WRITE | READ | READ | READ |
| **BEHEER** | ADMIN | ADMIN | NONE | ADMIN | NONE | NONE | NONE | NONE |

**Legend:**
- **ADMIN:** Full control (create, read, update, delete, configure)
- **WRITE:** Create + update own data
- **READ:** View only
- **LIMITED:** Restricted subset (e.g., only own patients, specific workflows)
- **NONE:** No access
- **🔒:** Explicit privacy/security block (GDPR/business rule)
- **\*:** Exceptions apply (HQ+ ICT/TD: geen HR documenten/finance)

---

### 2.2 Module Details

#### T-ZONE+ (Team Communication)
**Doel:** Interne communicatie, kennisdeling, social learning

| Rol | Create Post | Comment | Edit Own | Edit Others | Moderate | Delete | Private Circles |
|-----|-------------|---------|----------|-------------|----------|--------|-----------------|
| Super Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ All |
| ICT | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ ICT only |
| TD | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ Technical |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ All |
| Manager | ✅ | ✅ | ✅ | ⚠️ Team | ⚠️ Team | ❌ | ✅ Management |
| Tandarts | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ Clinical |
| MH | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ Clinical |
| Assistent | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ General |

**Privacy Rule:** Case-related posts MOETEN geanonimiseerd zijn (geen patient_id in public zones)

---

#### CARE+ (Clinical Operations)
**Doel:** Klinische zorgverlening, documentatie, AI assistentie

| Rol | View Patients | Edit Patients | Prescribe | Status Praesens | Clinical Notes | AI Tools |
|-----|---------------|---------------|-----------|-----------------|----------------|----------|
| Super Admin | ✅ All | ✅ All | ⚠️ If licensed | ✅ | ✅ | ✅ |
| ICT | 🔒 NONE | 🔒 NONE | 🔒 NONE | 🔒 NONE | 🔒 NONE | 🔒 NONE |
| TD | 🔒 NONE | 🔒 NONE | 🔒 NONE | 🔒 NONE | 🔒 NONE | 🔒 NONE |
| Admin | ✅ All | ✅ All | ❌ | ✅ | ✅ | ✅ |
| Manager | ⚠️ Triage | ⚠️ Basic | ❌ | ❌ | ⚠️ Limited | ❌ |
| Tandarts | ✅ Own | ✅ Own | ✅ | ✅ | ✅ | ✅ |
| MH | ✅ Own | ✅ Own | ⚠️ Limited | ✅ | ✅ | ✅ |
| Assistent | ✅ Read | ❌ | ❌ | ❌ | ⚠️ Notes only | ❌ |

**RLS Enforcement:**
```sql
-- ICT & TD: WHERE FALSE (complete block)
-- Tandarts/MH: WHERE behandelaar_id = auth.uid() OR shared_with_user = auth.uid()
-- Manager: WHERE locatie_id = user.locatie AND (triage context only)
-- Assistent: WHERE behandelaar_id IN (SELECT user_id FROM team WHERE assistent = auth.uid())
```

---

#### D-ICE+ (Diagnostic Intelligence & Care Economics)
**Doel:** Clinical reasoning, behandelplanning, budgettering

| Rol | View Workflows | Create Plans | Diagnose | Approve Budgets | View All Budgets | Edit Templates |
|-----|----------------|--------------|----------|-----------------|------------------|----------------|
| Super Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ICT | 🔒 NONE | 🔒 NONE | 🔒 NONE | 🔒 NONE | 🔒 NONE | 🔒 NONE |
| TD | 🔒 NONE | 🔒 NONE | 🔒 NONE | 🔒 NONE | 🔒 NONE | 🔒 NONE |
| Admin | ✅ | ✅ | ⚠️ Review | ✅ | ✅ | ✅ |
| Manager | ✅ | ❌ | ❌ | ⚠️ Pre-approve | ✅ | ❌ |
| Tandarts | ✅ Own | ✅ | ✅ | ❌ | ❌ | ❌ |
| MH | ⚠️ Hygiene | ⚠️ Hygiene | ⚠️ Paro | ❌ | ❌ | ❌ |
| Assistent | ✅ Read | ❌ | ❌ | ❌ | ❌ | ❌ |

**Business Rules:**
- Budgets > €5000 require Admin approval
- Complex cases (multi-discipline) require tandarts review
- ICE workflows with AI reasoning: Tandarts can override, Admin can calibrate

---

#### C-BUDDY+ (Checklist & Compliance)
**Doel:** Checklists, protocollen compliance, kwaliteitsbewaking

| Rol | View | Fill Checklists | Approve | Edit Templates | Master Checklists | Generate |
|-----|------|-----------------|---------|----------------|-------------------|----------|
| Super Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ICT | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| TD | ✅ | ✅ | ⚠️ Technical | ❌ | ❌ | ⚠️ Maintenance |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Tandarts | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| MH | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Assistent | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

**Checklist Types:**
- Behandelkamer: Alle klinische rollen
- Sterilisatie: Assistent + Manager
- Technisch onderhoud: TD + Manager
- Ruimte algemeen: Manager + Admin

---

#### AIR+ (Assets, Inventory, Resources)
**Doel:** Voorraad, apparatuur, onderhoud, bestellingen

| Rol | View Inventory | Update Stock | Maintenance | Orders | QR System | Assets Admin |
|-----|----------------|--------------|-------------|--------|-----------|--------------|
| Super Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ICT | ✅ | ✅ | ⚠️ IT only | ✅ | ✅ Admin | ✅ |
| TD | ✅ | ✅ | ✅ Full | ✅ | ✅ Admin | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ | ⚠️ Schedule | ✅ | ✅ | ❌ |
| Tandarts | ✅ | ⚠️ Usage | ❌ | ⚠️ Request | ❌ | ❌ |
| MH | ✅ | ⚠️ Usage | ❌ | ⚠️ Request | ❌ | ❌ |
| Assistent | ✅ | ✅ | ❌ | ⚠️ Request | ⚠️ Scan | ❌ |

**Privacy Note:** Assets linked to cases: TD/ICT zien NIET patient_id (RLS filter)

---

#### BUILD+ (Protocols, Templates, Knowledge)
**Doel:** Protocollen, templates, AI kennisbank, media library

| Rol | View Protocols | Edit Protocols | Publish | Templates | AI Knowledge | Media Upload |
|-----|----------------|----------------|---------|-----------|--------------|--------------|
| Super Admin | ✅ | ✅ | ✅ | ✅ | ✅ Admin | ✅ |
| ICT | ✅ | ⚠️ Technical | ❌ | ❌ | ❌ | ✅ |
| TD | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ Train | ✅ |
| Manager | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ Limited |
| Tandarts | ✅ | ⚠️ Suggest | ❌ | ⚠️ Use | ✅ Use | ⚠️ Clinical |
| MH | ✅ | ⚠️ Suggest | ❌ | ⚠️ Use | ✅ Use | ⚠️ Clinical |
| Assistent | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Workflow:** Tandarts/MH kunnen suggesties indienen → Admin reviews → Admin publiceert

---

#### HQ+ (Human Capital & Practice Management)
**Doel:** HR, roosters, onboarding, financiën (owner), compliance

| Rol | View Team | Edit Team | Contracts | Roosters | Onboarding | Finance | Tasks |
|-----|-----------|-----------|-----------|----------|------------|---------|-------|
| Super Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ICT | ✅ | ❌ | 🔒 NONE | ✅ | ❌ | 🔒 NONE | ✅ View |
| TD | ✅ | ❌ | 🔒 NONE | ✅ | ❌ | 🔒 NONE | ✅ Own |
| Admin | ✅ | ✅ | ⚠️ View | ✅ | ✅ | ⚠️ Owner | ✅ |
| Manager | ✅ | ⚠️ Team | 🔒 NONE | ✅ Edit | ✅ Track | 🔒 NONE | ✅ |
| Tandarts | ⚠️ Team | ❌ | 🔒 NONE | ✅ Own | ❌ | 🔒 NONE | ✅ Own |
| MH | ⚠️ Team | ❌ | 🔒 NONE | ✅ Own | ❌ | 🔒 NONE | ✅ Own |
| Assistent | ⚠️ Team | ❌ | 🔒 NONE | ✅ Own | ❌ | 🔒 NONE | ✅ Own |

**HQ+ Exceptions:**
- **Finance Dashboard:** ONLY visible if `is_owner = true` (regardless of role level)
- **HR Documents (contracts/salary):** Admin can view, ONLY Super Admin can edit
- **ICT/TD:** Can see team list, roosters for planning - GEEN personal HR data

---

#### BEHEER (System Administration)
**Doel:** Admin tools, imports, configuratie, debugging

| Rol | Admin Tools | Imports | Config | UPT Learning | Debug Tools | Database |
|-----|-------------|---------|--------|--------------|-------------|----------|
| Super Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Raw SQL |
| ICT | ✅ | ✅ | ✅ | ⚠️ Data | ⚠️ Performance | ⚠️ No patient tables |
| TD | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Admin | ✅ | ✅ | ✅ | ✅ | ⚠️ Limited | ❌ |
| Manager | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Tandarts | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| MH | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Assistent | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**BEHEER Access = Admin Level + Explicit Flag**

---

## 3️⃣ GRANULAIRE PERMISSIONS

### 3.1 Permission Structure

**Format:** `{module}.{resource}.{action}`

**Modules:**
- `tzone` - T-ZONE+
- `care` - CARE+
- `dice` - D-ICE+
- `buddy` - C-BUDDY+
- `air` - AIR+
- `build` - BUILD+
- `hq` - HQ+
- `system` - BEHEER

**Actions:**
- `view` - Read access
- `create` - Create new
- `update` - Edit existing (own or all, determined by RLS)
- `delete` - Remove
- `approve` - Approve workflows/budgets
- `admin` - Administrative functions (configure, manage)

---

### 3.2 Core Permissions List (60 Essential)

#### T-ZONE+ (6)
```
tzone.posts.view
tzone.posts.create
tzone.posts.update
tzone.posts.delete
tzone.posts.moderate
tzone.circles.admin
```

#### CARE+ (12)
```
care.patients.view
care.patients.create
care.patients.update
care.patients.delete
care.documents.view
care.documents.create
care.documents.update
care.prescriptions.view
care.prescriptions.create
care.prescriptions.sign
care.status_praesens.view
care.status_praesens.update
```

#### D-ICE+ (10)
```
dice.workflows.view
dice.workflows.create
dice.workflows.update
dice.diagnoses.view
dice.diagnoses.create
dice.budgets.view
dice.budgets.create
dice.budgets.approve
dice.templates.view
dice.templates.admin
```

#### C-BUDDY+ (7)
```
buddy.checklists.view
buddy.checklists.fill
buddy.checklists.approve
buddy.templates.view
buddy.templates.create
buddy.templates.admin
buddy.master.admin
```

#### AIR+ (8)
```
air.inventory.view
air.inventory.update
air.assets.view
air.assets.admin
air.maintenance.view
air.maintenance.create
air.orders.create
air.qr.admin
```

#### BUILD+ (7)
```
build.protocols.view
build.protocols.create
build.protocols.publish
build.templates.view
build.templates.admin
build.media.view
build.media.upload
```

#### HQ+ (8)
```
hq.team.view
hq.team.admin
hq.contracts.view
hq.contracts.admin
hq.roosters.view
hq.roosters.edit
hq.finance.view        ← Owner-only
hq.onboarding.admin
```

#### SYSTEM (2)
```
system.admin.access
system.config.edit
```

---

### 3.3 Permission-to-Role Mapping

**Voorbeeld: care.prescriptions.sign**

| Rol | Has Permission? | Condition |
|-----|-----------------|-----------|
| Super Admin | ✅ | IF is_voorschrijver=true |
| Admin | ❌ | NEVER (niet klinisch) |
| Tandarts | ✅ | IF is_voorschrijver=true AND BIG registered |
| MH | ⚠️ | IF is_voorschrijver=true AND specific license |
| Assistent | ❌ | NEVER |

**Implementatie:**
```typescript
function canSignPrescription(user: DNMZUser): boolean {
  const hasRole = ['super_admin', 'tandarts', 'mondhygienist'].includes(user.primaryRole);
  return hasRole && user.is_voorschrijver === true && user.big_nummer !== null;
}
```

---

## 4️⃣ DATA ACCESS BEPERKINGEN

### 4.1 Patient Data Access Rules

**Principe:** Minimale toegang noodzakelijk voor functie-uitoefening (GDPR)

| Rol | Access Scope | Filter Rule |
|-----|--------------|-------------|
| Super Admin | ALL | No filter (audit logged) |
| ICT | **NONE** | `WHERE FALSE` |
| TD | **NONE** | `WHERE FALSE` |
| Admin | ALL | `WHERE praktijk_locatie_id IN (user.locaties)` |
| Manager | LIMITED | `WHERE locatie = user.locatie AND (triage context)` |
| Tandarts | OWN | `WHERE behandelaar_id = auth.uid() OR shared_with = auth.uid()` |
| MH | OWN | `WHERE behandelaar_id = auth.uid() OR shared_with = auth.uid()` |
| Assistent | TEAM | `WHERE behandelaar_id IN (SELECT id FROM users WHERE team...)` |

---

### 4.2 HR Data Access Rules

**Principe:** HR data is zeer gevoelig (salaris, contracten, performance)

| Rol | Can View | Can Edit | Can View Salary | Can View Contracts | Can View Reviews |
|-----|----------|----------|-----------------|--------------------|--------------------|
| Super Admin | ✅ ALL | ✅ ALL | ✅ | ✅ | ✅ |
| ICT | ❌ | ❌ | ❌ | ❌ | ❌ |
| TD | ❌ | ❌ | ❌ | ❌ | ❌ |
| Admin | ✅ Team | ⚠️ Limited | ❌ | ⚠️ View only | ✅ |
| Manager | ✅ Team | ❌ | ❌ | ❌ | ⚠️ Team only |
| Others | ⚠️ OWN | ⚠️ OWN | ⚠️ OWN | ⚠️ OWN | ⚠️ OWN |

**RLS Implementation:**
```sql
-- hq.contracts
CREATE POLICY "HR access restricted" ON hq.contracts FOR SELECT
USING (
  auth.uid() IN (SELECT id FROM users WHERE role_level >= 100)  -- Admin+
  OR employee_id = auth.uid()  -- Own contract
);
```

---

### 4.3 Financial Data Access Rules

**Principe:** Finance = Owner-only (ongeacht role level)

| Rol | Revenue Data | Cost Data | P&L | Investments | Supplier Contracts |
|-----|--------------|-----------|-----|-------------|--------------------|
| Super Admin | ⚠️ IF owner | ⚠️ IF owner | ⚠️ IF owner | ⚠️ IF owner | ⚠️ IF owner |
| Owner Flag | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | ❌ | ❌ | ❌ | ❌ | ❌ |
| All Others | ❌ | ❌ | ❌ | ❌ | ❌ |

**RLS Implementation:**
```sql
CREATE POLICY "Owner only" ON hq_finance_transactions FOR SELECT
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_owner = true)
);
```

---

### 4.4 Technical Data (ICT/TD Allowed)

**Tables ICT/TD MAG zien:**

```sql
-- ICT Full Access:
assets, asset_maintenance, asset_logs
rooms, room_checklists
suppliers, supplier_contacts
media_library, protocols (non-clinical)
upt_tarief_2025, upt_code_sets
system_config, import_logs

-- TD Full Access:
assets, asset_maintenance, asset_logs, maintenance_schedules
rooms, room_checklists, room_templates
suppliers, supplier_contacts
qr_tokens

-- ICT/TD BLOCKED:
patients, zorgplannen, behandelplannen, interventies
diagnoses, status_praesens, prescriptions
budgets (begrotingen_v2), case_workflows
hq_contracts, hq_finance_*
```

**RLS Enforcement:**
```sql
-- Example: assets table
CREATE POLICY "ICT/TD can view assets" ON assets FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.rol IN ('ICT', 'Technische Dienst', 'Admin', 'Super Admin')
  )
);

-- Example: patients table (BLOCK ICT/TD)
CREATE POLICY "No ICT/TD access" ON patients FOR SELECT
USING (
  NOT EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.rol IN ('ICT', 'Technische Dienst')
  )
  AND (
    -- Normal patient access rules here for other roles
  )
);
```

---

### 4.5 Asset-Patient Link Anonymization

**Probleem:** Assets gebruikt in behandelingen hebben `case_id` → patient_id traceerbaar

**Oplossing:**
```sql
-- View voor TD/ICT: anonymized asset usage
CREATE VIEW assets_anonymous AS
SELECT
  id,
  naam,
  categorie,
  locatie_id,
  laatste_onderhoud,
  volgende_onderhoud,
  status,
  -- GEEN case_id, patient_id, behandelaar_id
  COUNT(*) FILTER (WHERE case_id IS NOT NULL) as aantal_keer_gebruikt
FROM assets
GROUP BY id, naam, categorie, locatie_id, ...;

-- RLS:
CREATE POLICY "TD sees anonymous only" ON assets_anonymous FOR SELECT
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND rol IN ('TD', 'ICT'))
);
```

---

## 5️⃣ MAPPING NAAR DATABASE

### 5.1 Users Table Aanpassingen

#### Huidige users table (behouden):
```sql
users (
  id                  uuid        PK
  email               text        NOT NULL UNIQUE
  naam                text        NOT NULL
  actief              boolean     DEFAULT true

  -- LEGACY SYSTEM (blijft bestaan voor backwards compatibility):
  rol                 text        NOT NULL  ← UITBREIDEN constraint
  locatie             text        NOT NULL  ← Deprecated, migrate to user_praktijk_locaties

  -- BOOLEAN FLAGS (blijven voor snelle checks):
  is_admin            boolean     DEFAULT false
  is_manager          boolean     DEFAULT false
  is_owner            boolean     DEFAULT false
  is_klinisch         boolean     DEFAULT false

  -- CLINICAL DATA (blijven):
  big_nummer          text
  agb_code_zorgverlener text
  is_voorschrijver    boolean     DEFAULT false
  functie             text
  titel, titel_voor, titel_achter

  -- LOCATIE LINK (nieuw):
  standaard_locatie_id uuid       FK → praktijk_locaties

  -- METADATA:
  created_at, updated_at
)
```

#### Constraint Update:
```sql
ALTER TABLE users DROP CONSTRAINT users_rol_check;
ALTER TABLE users ADD CONSTRAINT users_rol_check
CHECK (rol IN (
  'Super Admin',        -- Level 200
  'ICT',                -- Level 150
  'Technische Dienst',  -- Level 140
  'Admin',              -- Level 100
  'Manager',            -- Level 80
  'Tandarts',           -- Level 60
  'Mondhygiënist',      -- Level 50
  'Assistent'           -- Level 30
));
```

---

### 5.2 RBAC Tables (primair systeem)

#### roles (update):
```sql
INSERT INTO roles (key, name, level, description, is_system_default) VALUES
  ('super_admin', 'Super Administrator', 200, 'Platform-level access', false),
  ('ict_admin', 'ICT Administrator', 150, 'Technical infrastructure', false),
  ('technische_dienst', 'Technische Dienst', 140, 'Equipment & maintenance', false),
  ('admin', 'Administrator', 100, 'Practice administration', true),
  ('manager', 'Manager', 80, 'Daily operations', true),
  ('tandarts', 'Tandarts', 60, 'Clinical dentist', true),
  ('mondhygienist', 'Mondhygiënist', 50, 'Dental hygienist', true),
  ('assistent', 'Assistent', 30, 'Dental assistant', true);
```

#### permissions (populate):
```sql
-- 60 core permissions (zie sectie 3.2)
INSERT INTO permissions (code, name, module, category) VALUES
  ('care.patients.view', 'View Patients', 'CARE', 'clinical'),
  ('care.patients.create', 'Create Patients', 'CARE', 'clinical'),
  ('care.prescriptions.sign', 'Sign Prescriptions', 'CARE', 'clinical'),
  ('dice.budgets.approve', 'Approve Budgets', 'D-ICE', 'financial'),
  ('hq.finance.view', 'View Finance Dashboard', 'HQ', 'financial'),
  ('system.admin.access', 'Access Admin Tools', 'SYSTEM', 'admin'),
  -- ... (54 more)
;
```

#### role_permissions (map alle 60 × 8):
```sql
-- Super Admin: ALL permissions
INSERT INTO role_permissions (role_id, permission_id, allowed)
SELECT
  (SELECT id FROM roles WHERE key = 'super_admin'),
  id,
  true
FROM permissions;

-- ICT: Exclude patient/clinical permissions
INSERT INTO role_permissions (role_id, permission_id, allowed)
SELECT
  (SELECT id FROM roles WHERE key = 'ict_admin'),
  id,
  true
FROM permissions
WHERE module NOT IN ('CARE', 'D-ICE')  -- Block patient modules
  AND code NOT LIKE 'hq.finance.%'      -- Block finance
  AND code NOT LIKE 'hq.contracts.%';   -- Block HR sensitive

-- Admin: All except raw system
INSERT INTO role_permissions (role_id, permission_id, allowed)
SELECT
  (SELECT id FROM roles WHERE key = 'admin'),
  id,
  true
FROM permissions
WHERE code != 'system.config.edit';  -- Can't edit raw system config

-- Tandarts: Clinical full access
INSERT INTO role_permissions (role_id, permission_id, allowed)
SELECT
  (SELECT id FROM roles WHERE key = 'tandarts'),
  id,
  true
FROM permissions
WHERE module IN ('CARE', 'D-ICE')
   OR code IN ('tzone.posts.create', 'buddy.checklists.fill', 'air.inventory.view');

-- ... (etc voor elke rol)
```

---

### 5.3 User-Role Assignment

#### user_roles (gebruik):
```sql
-- User kan meerdere rollen hebben, maar 1 is primary

-- Voorbeeld: Praktijkhouder die ook tandarts is
INSERT INTO user_roles (user_id, role_id, is_primary) VALUES
  ('uuid-faro', (SELECT id FROM roles WHERE key = 'admin'), true),
  ('uuid-faro', (SELECT id FROM roles WHERE key = 'tandarts'), false);

-- Voorbeeld: ICT medewerker
INSERT INTO user_roles (user_id, role_id, is_primary) VALUES
  ('uuid-ict', (SELECT id FROM roles WHERE key = 'ict_admin'), true);
```

---

### 5.4 View: vw_user_effective_security (update)

**Nieuwe versie met full RBAC support:**

```sql
CREATE OR REPLACE VIEW vw_user_effective_security AS
SELECT
  u.id AS user_id,
  u.naam,
  u.email,
  u.actief,

  -- Determine highest role level
  COALESCE(
    (SELECT MAX(r.level) FROM user_roles ur JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = u.id AND r.is_active = true),
    -- Fallback to legacy rol
    CASE u.rol
      WHEN 'Super Admin' THEN 200
      WHEN 'ICT' THEN 150
      WHEN 'Technische Dienst' THEN 140
      WHEN 'Admin' THEN 100
      WHEN 'Manager' THEN 80
      WHEN 'Tandarts' THEN 60
      WHEN 'Mondhygiënist' THEN 50
      WHEN 'Assistent' THEN 30
      ELSE 10
    END
  ) as role_level,

  -- Boolean convenience flags (computed from role_level)
  (role_level >= 100) as is_admin,
  (role_level >= 80) as is_manager,
  u.is_owner,  -- Explicit flag, not derived from level
  u.is_klinisch OR (role_level BETWEEN 30 AND 60) as is_clinical,

  -- Roles array (from user_roles)
  COALESCE(
    (SELECT json_agg(
      json_build_object(
        'key', r.key,
        'name', r.name,
        'level', r.level,
        'isPrimary', ur.is_primary
      ) ORDER BY ur.is_primary DESC, r.level DESC
    )
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = u.id AND r.is_active = true),
    '[]'::json
  ) as roles_json,

  -- Permissions array (from role_permissions)
  COALESCE(
    (SELECT json_agg(DISTINCT
      json_build_object(
        'code', p.code,
        'name', p.name,
        'module', p.module
      )
    )
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id AND rp.allowed = true
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = u.id),
    '[]'::json
  ) as permissions_json,

  -- Locaties array (from user_praktijk_locaties)
  COALESCE(
    (SELECT json_agg(
      json_build_object(
        'locatie_id', upl.praktijk_locatie_id,
        'locatie_naam', pl.korte_naam,
        'is_hoofdlocatie', upl.is_hoofdlocatie
      )
    )
    FROM user_praktijk_locaties upl
    JOIN praktijk_locaties pl ON pl.id = upl.praktijk_locatie_id
    WHERE upl.user_id = u.id AND pl.is_actief = true),
    '[]'::json
  ) as locaties_json

FROM users u
WHERE u.actief = true;
```

**RLS op View:**
```sql
ALTER TABLE vw_user_effective_security ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own security profile" ON vw_user_effective_security FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins see all profiles" ON vw_user_effective_security FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (
      rol IN ('Super Admin', 'Admin')
      OR EXISTS (
        SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid() AND r.level >= 100
      )
    )
  )
);
```

---

### 5.5 Helper Functions

#### Function: has_permission(user_id, permission_code)
```sql
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id uuid,
  p_permission_code text
)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id AND rp.allowed = true
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = p_user_id
      AND p.code = p_permission_code
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

**Usage:**
```sql
SELECT has_permission(auth.uid(), 'care.prescriptions.sign');
```

#### Function: can_access_module(user_id, module_name)
```sql
CREATE OR REPLACE FUNCTION can_access_module(
  p_user_id uuid,
  p_module text
)
RETURNS text AS $$  -- Returns: 'ADMIN', 'WRITE', 'READ', 'NONE'
DECLARE
  v_level integer;
  v_rol text;
BEGIN
  SELECT role_level, rol INTO v_level, v_rol
  FROM vw_user_effective_security
  WHERE user_id = p_user_id;

  -- Super Admin: ADMIN on everything
  IF v_level >= 200 THEN
    RETURN 'ADMIN';
  END IF;

  -- ICT/TD: NONE on patient modules
  IF v_rol IN ('ICT', 'Technische Dienst') AND p_module IN ('CARE', 'D-ICE') THEN
    RETURN 'NONE';
  END IF;

  -- Module-specific logic
  CASE p_module
    WHEN 'CARE' THEN
      IF v_level >= 100 THEN RETURN 'ADMIN';
      ELSIF v_level >= 50 THEN RETURN 'WRITE';
      ELSIF v_level >= 30 THEN RETURN 'READ';
      ELSE RETURN 'NONE';
      END IF;
    WHEN 'HQ' THEN
      IF v_level >= 100 THEN RETURN 'ADMIN';
      ELSIF v_level >= 80 THEN RETURN 'WRITE';
      ELSE RETURN 'READ';
      END IF;
    -- ... (etc)
  END CASE;

  RETURN 'NONE';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

---

## 6️⃣ MIGRATIE STRATEGIE

### 6.1 Migratie Fasen (4 Weken)

#### FASE 1: Database Prep (Week 1)
**Doel:** Database ready, geen frontend impact

**Stappen:**
1. ✅ Extend users.rol constraint (+ 3 nieuwe rollen)
2. ✅ Populate roles table (8 rollen compleet)
3. ✅ Populate permissions table (60 permissions)
4. ✅ Create role_permissions mappings (8 × 60 = 480 rows)
5. ✅ Update vw_user_effective_security (nieuwe kolommen)
6. ✅ Add RLS policies op view
7. ✅ Create helper functions (has_permission, can_access_module)
8. ✅ Test met sample data

**Verify:**
```sql
SELECT * FROM vw_user_effective_security WHERE user_id = 'test-user';
-- Moet roles_json + permissions_json bevatten
```

---

#### FASE 2: User Assignment (Week 2)
**Doel:** Alle bestaande users krijgen RBAC rollen

**Stappen:**
1. ✅ Audit huidige users.rol values
2. ✅ Map legacy → RBAC:
   ```sql
   -- Migratie script
   INSERT INTO user_roles (user_id, role_id, is_primary)
   SELECT
     u.id,
     r.id,
     true
   FROM users u
   JOIN roles r ON (
     (u.rol = 'Admin' AND r.key = 'admin')
     OR (u.rol = 'Manager' AND r.key = 'manager')
     OR (u.rol = 'Tandarts' AND r.key = 'tandarts')
     OR (u.rol = 'Mondhygiënist' AND r.key = 'mondhygienist')
     OR (u.rol = 'Assistent' AND r.key = 'assistent')
   );
   ```
3. ✅ Create Super Admin user(s)
   ```sql
   UPDATE users SET rol = 'Super Admin' WHERE email = 'admin@dnmz.nl';
   INSERT INTO user_roles (user_id, role_id, is_primary)
   VALUES ('uuid', (SELECT id FROM roles WHERE key = 'super_admin'), true);
   ```
4. ✅ Set is_owner flag voor praktijkhouder
5. ✅ Test: Elke user moet >= 1 user_roles record hebben

**Verify:**
```sql
-- Alle users hebben rol assignment
SELECT COUNT(*) FROM users u
WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = u.id);
-- Should be 0

-- View toont permissions
SELECT user_id, jsonb_array_length(permissions_json::jsonb)
FROM vw_user_effective_security;
-- Should be > 0 for all
```

---

#### FASE 3: Frontend Migration (Week 3)
**Doel:** Frontend gebruikt nieuwe authorization system

**Stappen:**
1. ✅ Update AuthContext.tsx:
   ```typescript
   interface DNMZUser {
     id: string;
     email: string;
     naam: string;
     actief: boolean;

     // NEW: RBAC properties
     roleLevel: number;            // Highest role level
     primaryRole: {                // Primary user_role
       key: string;
       name: string;
       level: number;
     };
     roles: RoleJson[];            // All assigned roles
     permissions: string[];        // Flat array of permission codes
     locaties: LocationJson[];     // Assigned locations

     // LEGACY (deprecated maar blijven voor backwards compatibility)
     rol: string;                  // Legacy string
     isAdmin: boolean;
     isManager: boolean;
     isClinical: boolean;
     isOwner: boolean;
   }
   ```

2. ✅ Create authorization helpers:
   ```typescript
   // src/utils/authorization.ts

   export function can(user: DNMZUser, permission: string): boolean {
     return user.permissions.includes(permission);
   }

   export function hasRole(user: DNMZUser, roleKey: string): boolean {
     return user.roles.some(r => r.key === roleKey);
   }

   export function hasMinLevel(user: DNMZUser, minLevel: number): boolean {
     return user.roleLevel >= minLevel;
   }

   export function canAccessModule(user: DNMZUser, module: string): 'ADMIN' | 'WRITE' | 'READ' | 'NONE' {
     // Implement module access matrix logic
   }
   ```

3. ✅ Migrate checks:
   ```typescript
   // OLD:
   if (user?.rol === 'Admin') { ... }

   // NEW:
   if (can(user, 'system.admin.access')) { ... }
   // Or:
   if (hasMinLevel(user, 100)) { ... }
   ```

4. ✅ Update Layout.tsx module visibility:
   ```typescript
   const showBeheerSection = can(user, 'system.admin.access');
   const showHQFinance = user?.isOwner === true;
   const showClinical = can(user, 'care.patients.view');
   ```

5. ✅ Add route guards (new):
   ```typescript
   // src/components/ProtectedRoute.tsx
   export function ProtectedRoute({ permission, children }) {
     const { user } = useAuth();

     if (!can(user, permission)) {
       return <AccessDenied />;
     }

     return children;
   }
   ```

6. ✅ Update alle 24 files met `user?.rol` checks

**Verify:**
- Login als verschillende rollen
- Check module visibility
- Test permission-gated actions
- Verify RLS filters werken

---

#### FASE 4: Legacy Cleanup (Week 4)
**Doel:** Deprecate legacy system

**Stappen:**
1. ⚠️ Mark legacy fields as deprecated:
   ```sql
   COMMENT ON COLUMN users.rol IS 'DEPRECATED: Use user_roles + RBAC system';
   COMMENT ON COLUMN users.locatie IS 'DEPRECATED: Use user_praktijk_locaties';
   ```

2. ⚠️ Make users.rol nullable (optioneel):
   ```sql
   ALTER TABLE users ALTER COLUMN rol DROP NOT NULL;
   -- Nu kan rol = NULL (RBAC only users)
   ```

3. ✅ Add monitoring:
   ```sql
   -- Count legacy-only users (geen user_roles)
   SELECT COUNT(*) FROM users u
   WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = u.id);
   ```

4. ✅ Update documentatie
5. ✅ Train team op nieuw systeem

**Verify:**
- Legacy fields nog steeds werkend (backwards compatible)
- Nieuwe users krijgen ONLY RBAC assignment
- Monitoring dashboard toont migratie progress

---

### 6.2 Backwards Compatibility

**Strategie: Dual System (6-12 maanden)**

**users.rol blijft bestaan:**
- Oude code blijft werken
- View vw_user_effective_security synced beide systemen
- Frontend kan geleidelijk migreren

**Sync Logic:**
```sql
-- Trigger: When user_roles changes, update users.rol
CREATE OR REPLACE FUNCTION sync_user_rol()
RETURNS trigger AS $$
BEGIN
  UPDATE users u SET rol = (
    SELECT r.name
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = u.id AND ur.is_primary = true
    LIMIT 1
  )
  WHERE u.id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_user_rol_after_insert
AFTER INSERT OR UPDATE ON user_roles
FOR EACH ROW EXECUTE FUNCTION sync_user_rol();
```

**Frontend Compatibility Layer:**
```typescript
// Old code keeps working:
if (user?.rol === 'Admin') { ... }  // ← Still works

// New code uses RBAC:
if (can(user, 'system.admin.access')) { ... }  // ← Better

// Both evaluate to same result (via sync)
```

---

### 6.3 Testing Checklist

**Per Rol Test (8 rollen × tests):**

```markdown
## TEST: Super Admin
- [ ] Login succesvol
- [ ] Alle modules zichtbaar in menu
- [ ] Kan patient aanmaken/wijzigen
- [ ] Kan user aanmaken (alle rollen)
- [ ] Kan protocollen publiceren
- [ ] Finance Dashboard zichtbaar (als owner=true)
- [ ] Kan import tools gebruiken
- [ ] RLS: Ziet alle data (geen filters)

## TEST: ICT
- [ ] Login succesvol
- [ ] GEEN CARE/D-ICE modules in menu
- [ ] Kan QR systeem beheren
- [ ] Kan imports uitvoeren
- [ ] Kan T-ZONE posts lezen, NIET modereren
- [ ] RLS: GEEN patiëntdata zichtbaar
- [ ] RLS: WEL assets/voorraad zichtbaar

## TEST: TD
- [ ] Login succesvol
- [ ] GEEN CARE/D-ICE modules in menu
- [ ] Kan onderhoud registreren
- [ ] Kan apparatuur beheren
- [ ] Kan ruimte checklists invullen
- [ ] RLS: GEEN patiëntdata zichtbaar
- [ ] RLS: Assets zichtbaar (zonder case details)

## TEST: Admin
- [ ] Login succesvol
- [ ] Alle modules zichtbaar (behalve Finance indien niet owner)
- [ ] Kan users aanmaken (behalve Super Admin/ICT)
- [ ] Kan begrotingen goedkeuren
- [ ] Kan protocollen publiceren
- [ ] RLS: Ziet alle praktijk data

## TEST: Manager
- [ ] Login succesvol
- [ ] Kan roosters wijzigen
- [ ] Kan voorraad beheren
- [ ] Kan GEEN users aanmaken
- [ ] Kan GEEN protocollen wijzigen
- [ ] RLS: Ziet team data, beperkte patiëntdata

## TEST: Tandarts
- [ ] Login succesvol
- [ ] Kan patiënten aanmaken
- [ ] Kan behandelplannen opstellen
- [ ] Kan recepten voorschrijven (indien licensed)
- [ ] RLS: Ziet ALLEEN eigen patiënten
- [ ] Kan GEEN andere tandarts patiënten wijzigen

## TEST: Mondhygiënist
- [ ] Login succesvol
- [ ] Kan paro-behandelingen registreren
- [ ] Kan preventie workflows aanmaken
- [ ] Kan GEEN recepten voorschrijven
- [ ] RLS: Ziet ALLEEN eigen patiënten + shared

## TEST: Assistent
- [ ] Login succesvol
- [ ] Kan checklists invullen
- [ ] Kan voorraad bijvullen
- [ ] Kan patiëntdata LEZEN (voor assistentie)
- [ ] Kan NIET behandelplannen wijzigen
- [ ] RLS: Read-only access op meeste data
```

---

## 7️⃣ IMPLEMENTATIE ROADMAP

### 7.1 Timeline (4 Weken)

```
WEEK 1: Database Foundation
├── Day 1-2: Extend constraints, populate roles/permissions
├── Day 3-4: Update view, create functions, add RLS
└── Day 5: Test database layer, verify RLS enforcement

WEEK 2: User Migration
├── Day 1-2: Audit current users, create mapping script
├── Day 3: Execute migration, assign RBAC roles
├── Day 4: Create Super Admin, set owner flags
└── Day 5: Verify all users have permissions, test access

WEEK 3: Frontend Update
├── Day 1-2: Update AuthContext, create authorization utils
├── Day 3-4: Migrate role checks (24 files), add route guards
└── Day 5: Test all modules with different roles, fix bugs

WEEK 4: QA & Documentation
├── Day 1-2: Full regression testing (8 roles × modules)
├── Day 3: Performance testing, optimize RLS queries
├── Day 4: Write documentation, create training materials
└── Day 5: Final deployment prep, backup & rollback plan
```

---

### 7.2 Rollback Plan

**Rollback Triggers:**
- Critical security vulnerability discovered
- RLS policies blocking legitimate access
- Performance degradation > 30%
- Major bugs in production

**Rollback Steps:**
```sql
-- 1. Revert RLS policies (disable RBAC enforcement)
ALTER TABLE vw_user_effective_security DISABLE ROW LEVEL SECURITY;

-- 2. Revert view to old version
CREATE OR REPLACE VIEW vw_user_effective_security AS
  -- (Old definition from before migration)

-- 3. Keep user_roles/permissions (don't delete)
-- Users keep RBAC assignments, but system uses legacy

-- 4. Frontend: Toggle feature flag
UPDATE system_config SET use_rbac = false;
```

**Rollback Testing:**
- Test rollback in staging first
- Verify legacy system still functional
- < 5 minute downtime acceptable

---

### 7.3 Success Criteria

**Go-Live Checklist:**

✅ **Technical:**
- [ ] All 60 permissions defined and mapped
- [ ] All 8 roles have correct permission sets
- [ ] RLS policies prevent ICT/TD from seeing patient data
- [ ] View vw_user_effective_security returns correct data for all users
- [ ] Helper functions (has_permission, can_access_module) working
- [ ] No SQL errors in logs (24h monitoring)
- [ ] Performance: queries < 200ms p95

✅ **Functional:**
- [ ] All 8 roles tested (login + module access + specific actions)
- [ ] Super Admin can create other Super Admins
- [ ] Admin can create users (except Super Admin/ICT)
- [ ] Finance Dashboard only visible to owner
- [ ] ICT/TD blocked from patient data (RLS verified)
- [ ] Tandarts can only see own patients
- [ ] Assistent read-only access working

✅ **Business:**
- [ ] All current users migrated successfully
- [ ] No user reported access issues (first 48h)
- [ ] Team trained on new permission system
- [ ] Documentation complete and accessible
- [ ] Rollback plan tested and ready

---

## 📊 SAMENVATTING

### Kernpunten

1. **8 Rollen Gedefinieerd:**
   - Super Admin (200) → Alles
   - ICT (150) → Tech, GEEN patiënt/HR/finance
   - TD (140) → Onderhoud, GEEN patiënt/HR/finance
   - Admin (100) → Praktijk beheer
   - Manager (80) → Operationeel
   - Tandarts (60) → Klinisch full
   - MH (50) → Klinisch preventie
   - Assistent (30) → Support

2. **Privacy by Design:**
   - ICT/TD hebben GEEN toegang tot patiëntdata (RLS enforced)
   - Finance = Owner-only (ongeacht role level)
   - HR sensitive data (salaris/contracten) = Super Admin/Owner only

3. **Granulaire Permissions:**
   - 60 core permissions gedefinieerd
   - Module.resource.action pattern
   - Flexibel uitbreidbaar naar 100+ permissions

4. **Backwards Compatible:**
   - Legacy users.rol blijft bestaan (6-12 maanden)
   - Dual system: oude + nieuwe code werken samen
   - Geen big-bang migration, geleidelijke adoptie

5. **Database-First Security:**
   - RLS policies primaire enforcement
   - Frontend checks = UX, RLS = security
   - ICT/TD: WHERE FALSE op patient tables

6. **Migratie: 4 Weken**
   - Week 1: Database prep
   - Week 2: User migration
   - Week 3: Frontend update
   - Week 4: QA + docs

---

**Volgende Stap:**
Review ontwerp → Goedkeuring → Start implementatie Fase 1 (Database Prep)
