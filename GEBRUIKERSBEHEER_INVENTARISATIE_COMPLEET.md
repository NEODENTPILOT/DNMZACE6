# GEBRUIKERSBEHEER INVENTARISATIE - COMPLEET RAPPORT
**Datum:** 2025-12-23
**Doel:** Volledige analyse voor pilot-readiness en productie-fundament

---

## EXECUTIVE SUMMARY

### Status: 🟡 HYBRIDE SYSTEEM - ONVOLLEDIG RBAC

**Huidige situatie:**
- ✅ Basis authenticatie werkt (Supabase auth)
- ⚠️ **DRIE concurrerende role systemen** naast elkaar
- 🔴 **RBAC systeem is leeg** (0 permissions, 0 role-permission links)
- 🔴 **vw_user_effective_security heeft GEEN RLS** - iedereen ziet alle security profiles
- ⚠️ **36 kolommen in users table** - te veel verantwoordelijkheden
- ⚠️ **18 boolean permission flags** direct op users
- 🔴 **Geen Super Admin, TD, of ICT rollen** - constraint staat dit niet toe

**Verdict voor pilot:** ⚠️ **Functioneel maar NIET toekomstvast**

---

## 1️⃣ AUTHENTICATIE & GEBRUIKERS

### 1.1 Hoe melden gebruikers zich aan?

**Authenticatie Flow:**
```typescript
1. Login via Supabase Email/Password (AuthContext.tsx)
2. Get auth.uid() from Supabase Auth
3. Load security profile from vw_user_effective_security
4. Map naar DNMZUser interface
5. Check actief=true
6. 5-second timeout safety
```

**AuthContext DNMZUser Interface:**
```typescript
{
  id: string;               // auth.uid()
  email: string;
  naam: string;
  actief: boolean;
  rol: 'Admin' | 'Manager' | 'Clinical' | 'User';  // SYNTHETISCHE ROL
  isAdmin: boolean;         // van view
  isManager: boolean;       // van view
  isClinical: boolean;      // van view
  roles: RoleJson[];        // van RBAC (indien gevuld)
  permissions: string[];    // van RBAC (momenteel leeg)
}
```

**Synthetische rol mapping logic:**
```typescript
// In AuthContext.tsx regel 101-109
if (data.is_admin) {
  rol = 'Admin';
} else if (data.is_manager) {
  rol = 'Manager';
} else if (data.is_clinical) {
  rol = 'Clinical';
}
// Default: 'User'
```

---

### 1.2 Users Table - Complete Schema

**Tabel:** `users` (36 kolommen!)

#### Basis Identificatie (5)
```sql
id                  uuid         PK, gen_random_uuid()
naam                text         NOT NULL
email               text         NOT NULL, UNIQUE
created_at          timestamptz  DEFAULT now()
actief              boolean      DEFAULT true
```

#### Legacy Role System (2)
```sql
rol                 text         NOT NULL
  CONSTRAINT: CHECK (rol IN ('Assistent', 'Mondhygiënist', 'Tandarts', 'Manager', 'Admin'))

locatie             text         NOT NULL
  VALUES: 'Almelo', 'Raalte', 'Beide'
```

❗ **KRITIEK:** Constraint ondersteunt GEEN:
- 'Super Admin'
- 'TD' (Technisch Directeur)
- 'ICT'
- 'Owner'
- Custom rollen

---

#### Boolean Role Flags (4)
```sql
is_admin            boolean      DEFAULT false
is_manager          boolean      DEFAULT false
is_owner            boolean      DEFAULT false  ⚠️ NIEMAND HEEFT DIT
is_klinisch         boolean      DEFAULT false
```

#### Boolean Permission Flags (14!)
```sql
kan_checklists_beheren                      boolean  DEFAULT false
kan_checklists_aftekenen_alle_kamers        boolean  DEFAULT false
kan_cases_beheren                           boolean  DEFAULT false
kan_begrotingen_accepteren                  boolean  DEFAULT false
kan_voorraad_beheren                        boolean  DEFAULT false
kan_backoffice                              boolean  DEFAULT false
kan_planning                                boolean  DEFAULT false
mag_recepten_invoeren                       boolean  DEFAULT false
mag_recepten_ondertekenen                   boolean  DEFAULT false
mag_voorschrijven                           boolean  DEFAULT false
is_voorschrijver                            boolean  DEFAULT false
mag_recept_versturen                        boolean  DEFAULT false
wordt_getoond_op_documenten                 boolean  DEFAULT true
```

---

#### Klinische Metadata (11)
```sql
voorletters                text
achternaam                 text
initialen                  text
titel                      text
titel_voor                 text
titel_achter               text
functie                    text        DEFAULT 'Overig'
big_nummer                 text
agb_code_zorgverlener      text
email_praktijk             text
telefoon_praktijk          text
standaard_locatie_id       uuid        FK → praktijk_locaties
```

---

### 1.3 Huidige Users in Database

**5 users totaal:**
```sql
ID                                   | Naam          | Rol      | is_admin | is_manager | is_owner | actief
-------------------------------------|---------------|----------|----------|------------|----------|-------
54ac82cb-5dd7-40be-8266-12799400941c | Faro Sana     | Admin    | ✓        | ✓          | ✗        | ✓
b6a21968-ac4a-4315-9f25-21b3906188b2 | SUPER ADMIN   | Admin    | ✓        | ✓          | ✗        | ✓
7030f904-9f71-4e01-8271-008f8fcc3ff3 | Test Gebruiker| Tandarts | ✓        | ✓          | ✗        | ✓
ff1f49c7-4738-4503-b9b9-5ed944299d25 | Faro Sana     | Admin    | ✗        | ✗          | ✗        | ✓
c2d3f21a-2761-4dd3-b77b-4dc506953ee1 | Maxilo Facial | Manager  | ✗        | ✗          | ✗        | ✗ (inactive)
```

**Observatie:**
- 3 users met rol='Admin', maar niet allemaal is_admin=true (inconsistent!)
- 0 users met is_owner=true
- "SUPER ADMIN" naam maar gewoon Admin rol
- Test user heeft Admin + Manager + Klinisch (alles)

---

### 1.4 Users Table RLS Policies

**7 policies totaal:**

```sql
1. "Users can read own data"                     ✓ VEILIG
   SELECT WHERE auth.uid() = id

2. "Authenticated users can read all users"      🔴 TE BREED
   SELECT WHERE true

3. "Admins can read all users"                   ✓ OK (maar redundant door #2)
   SELECT WHERE EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)

4. "Managers can read all users"                 ✓ OK (maar redundant door #2)
   SELECT WHERE EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_manager = true)

5. "Users can read own profile"                  ✓ VEILIG (duplicate van #1)
   SELECT WHERE auth.uid() = id

6. "Users can update own profile"                ⚠️ BEPERKT
   UPDATE WHERE auth.uid() = id
   WITH CHECK: Cannot change own is_admin/is_manager flags (good!)

7. "Admins can update users"                     ✓ OK
   UPDATE WHERE is_admin check
```

**Probleem:** Policy #2 (`WHERE true`) maakt alle andere read policies overbodig.

---

## 2️⃣ ROLLEN & RECHTEN

### 2.1 Legacy Role System (users.rol)

**5 Hardcoded Rollen:**

| Rol              | Level | Huidige Users | Constraint |
|------------------|-------|---------------|------------|
| **Admin**        | 100   | 3             | ✓ Toegestaan |
| **Manager**      | 80    | 1             | ✓ Toegestaan |
| **Tandarts**     | 60    | 1             | ✓ Toegestaan |
| **Mondhygiënist**| 50    | 0             | ✓ Toegestaan |
| **Assistent**    | 30    | 0             | ✓ Toegestaan |

**Ontbrekende Rollen:**
- ❌ **Super Admin** / System Administrator
- ❌ **Owner** / Praktijkhouder
- ❌ **ICT** / Technical Director
- ❌ **Teamlead** / Coördinator
- ❌ **Balie** / Receptie

**Gebruik in Frontend:**
- 24 files met `user?.rol === 'Admin'` checks
- Vooral in admin tools, import functies, config pages

---

### 2.2 RBAC System (Database)

#### Table: `roles`

**8 Rollen gedefinieerd:**

| Key             | Name                       | Level | System Default | Actief |
|-----------------|----------------------------|-------|----------------|--------|
| admin           | Administrator              | 100   | ✓              | ✓      |
| power_user      | Power User                 | 80    | ✗              | ✓      |
| manager         | Manager                    | 80    | ✓              | ✓      |
| teamlead        | Teamlead / Coördinator     | 70    | ✗              | ✓      |
| tandarts        | Tandarts                   | 60    | ✓              | ✓      |
| mondhygienist   | Mondhygiënist              | 50    | ✓              | ✓      |
| standard_user   | Standaard gebruiker        | 50    | ✓              | ✓      |
| assistent       | Assistent                  | 30    | ✓              | ✓      |

**Goed:** Teamlead en Power User zijn aanwezig!

---

#### Table: `permissions`

**Status:** 🔴 **VOLLEDIG LEEG**

```sql
SELECT COUNT(*) FROM permissions;
-- Result: 0
```

**Schema:**
```sql
id          uuid        PK
code        text        NOT NULL UNIQUE  (e.g., 'patient.create', 'budget.approve')
name        text        NOT NULL
description text
module      text                         (e.g., 'CARE', 'HQ', 'ICE')
category    text                         (e.g., 'clinical', 'admin', 'finance')
```

**Impact:** Geen granulaire permissions mogelijk.

---

#### Table: `role_permissions`

**Status:** 🔴 **GEEN KOPPELINGEN**

```sql
SELECT r.name, COUNT(rp.permission_id)
FROM roles r
LEFT JOIN role_permissions rp ON rp.role_id = r.id
GROUP BY r.name;

-- Alle results: 0 permissions
```

**Conclusie:** RBAC systeem is aanwezig maar **niet geïmplementeerd**.

---

#### Table: `user_roles`

**Assignments:** ✅ **3 users hebben RBAC rollen**

```sql
User ID (naam)         | Role Key       | Role Name          | Level | Is Primary
-----------------------|----------------|--------------------| ------|------------
Faro Sana              | admin          | Administrator      | 100   | false
Faro Sana              | standard_user  | Standaard gebruiker| 50    | false
SUPER ADMIN            | admin          | Administrator      | 100   | true
Test Gebruiker         | admin          | Administrator      | 100   | false
Test Gebruiker         | standard_user  | Standaard gebruiker| 50    | false
```

**Observatie:**
- Users hebben zowel legacy `users.rol` als RBAC `user_roles`
- Sommige hebben meerdere RBAC rollen tegelijk
- `is_primary` flag wordt soms gebruikt

---

### 2.3 Function Groups System

**Table:** `function_groups` (6 groepen)

| Key                 | Name                          | is_clinical | is_admin_related |
|---------------------|-------------------------------|-------------|------------------|
| eigenaar            | Praktijk-eigenaar / DGA       | ✗           | ✓                |
| management          | Management                    | ✗           | ✓                |
| tandarts_specialist | Tandarts-specialisten         | ✓           | ✗                |
| mondhygienist       | Mondhygiënisten               | ✓           | ✗                |
| klinisch_assistent  | Klinisch assistenten          | ✓           | ✗                |
| bali_planning       | Bali & Planning               | ✗           | ✗                |
| backoffice          | Backoffice & administratie    | ✗           | ✗                |

**Junction:** `user_function_groups` (maar geen actieve data)

**Gebruik:** Minimal - vooral voor `is_clinical` bepaling in view.

---

### 2.4 Clinical Titles System

**Table:** `clinical_titles` (Voor documentatie/prescriptions)

Schema:
```sql
id              uuid
key             text    e.g., 'tandarts', 'mh', 'kaakchirurg'
label           text    Display name
description     text
is_active       boolean
```

**Geen actual data** in deze tabel gevonden.

**Doel:** Voor voorschrijver registratie, BIG/AGB koppeling.

---

### 2.5 View: vw_user_effective_security

**Schema (9 kolommen):**
```sql
user_id           uuid           (= users.id)
naam              text
email             text
actief            boolean
is_admin          boolean        Hybrid: users.is_admin OR role level >= 90
is_manager        boolean        Hybrid: users.is_manager OR role key IN ('manager', 'power_user')
is_clinical       boolean        Hybrid: users.is_klinisch OR function_groups.is_clinical
roles_json        json           Array van {key, name, level, isPrimary}
permissions_json  json           Array van {code, name, module, category} - MOMENTEEL LEEG
```

**View Logic:**
```sql
-- is_admin computed:
COALESCE(
  users.is_admin,
  EXISTS (SELECT 1 FROM user_roles ur JOIN roles r
          WHERE r.level >= 90 OR r.key IN ('admin', 'administrator')),
  false
)

-- roles_json:
- Haalt user_roles op als JSON array
- Als GEEN user_roles: synthetisch genereren vanuit users.rol
- Tandarts → level 60, Manager → 80, Admin → 100

-- permissions_json:
- Haalt role_permissions op (momenteel 0)
- Returns '[]' als leeg
```

---

### 2.6 RLS op vw_user_effective_security

**Status:** 🔴 **GEEN POLICIES - VOLLEDIG OPEN**

```sql
SELECT COUNT(*) FROM pg_policies
WHERE tablename = 'vw_user_effective_security';

-- Result: 0
```

**Impact:**
- **Elke authenticated user kan security profiles van ALLE users zien**
- Inclusief: is_admin status, roles, permissions
- Kan gebruikt worden voor privilege escalation reconnaissance
- ERNSTIG SECURITY RISK

---

## 3️⃣ PRAKTIJK / LOCATIE CONTEXT

### 3.1 Praktijk Locaties

**Table:** `praktijk_locaties`

**2 Locaties:**
```sql
ID                                   | Naam                         | Korte Naam | Plaats | Actief
-------------------------------------|------------------------------|------------|--------|-------
fc1126c5-3a79-475c-ba28-ffd5c83e8b61 | De Nieuwe Mondzorg Almelo    | Almelo     | Almelo | ✓
d5ed65b7-45f1-44d5-b857-f2abbbe316f6 | De Nieuwe Mondzorg Raalte    | Raalte     | Raalte | ✓
```

**Schema (16 kolommen):**
```sql
id, naam, korte_naam
adres_regel_1, adres_regel_2, postcode, plaats
telefoon, email
agb_code_praktijk, kvk_nummer, btw_nummer
website_url
is_actief
created_at, updated_at
```

**Multi-practice Support:** ✅ Volledig voorbereid

---

### 3.2 User-Locatie Koppeling

**Table:** `user_praktijk_locaties`

Schema:
```sql
id                                uuid
user_id                           uuid    FK → users
praktijk_locatie_id               uuid    FK → praktijk_locaties
is_hoofdlocatie                   boolean DEFAULT false
is_voorschrijver_op_locatie       boolean DEFAULT false
mag_recept_versturen_op_locatie   boolean DEFAULT false
created_at, updated_at
```

**Per-location Permissions:** ✅ Granular rechten mogelijk

**Huidige Status:** ⚠️ **Geen actieve mappings** in database

**Impact:** Users hebben `locatie` veld ('Almelo', 'Raalte', 'Beide') maar geen user_praktijk_locaties records.

---

### 3.3 Legacy Locatie Systeem

**users.locatie field:**
```sql
locatie    text    NOT NULL
  VALUES: 'Almelo' | 'Raalte' | 'Beide'
```

**Current distribution:**
```sql
Beide:  4 users
Almelo: 1 user
Raalte: 0 users
```

**Probleem met 'Beide':**
- Te brede toegang
- Geen expliciete hoofdlocatie
- Inconsistent met `user_praktijk_locaties` design

---

## 4️⃣ ONBOARDING FLOW

### 4.1 Onboarding Systeem - Tables (4)

#### onboarding_templates
```sql
id, naam, rol, beschrijving, duur_dagen, actief
```

**3 Templates:**
- Assistent Onboarding (30 dagen)
- Tandarts Onboarding (60 dagen)
- Balie Onboarding (14 dagen)

#### onboarding_template_steps
```sql
id, template_id, volgorde, stap_type, titel, beschrijving,
resource_type, resource_id, verplicht
```

**stap_type:** 'checklist', 'protocol', 'media', 'quiz', 'document'

#### onboarding_instances
```sql
id, medewerker_id, template_id, rol, begeleider_id,
start_datum, eind_datum, status, voortgang_percentage
```

**Status:** ⚠️ **0 actieve instances** in database

#### onboarding_instance_steps
```sql
id, instance_id, template_step_id, status,
voltooid_datum, feedback, voltooid_door_id
```

---

### 4.2 Onboarding RPC Functions

**3 HQ functions gedefinieerd:**
```sql
hq_list_onboarding_templates()       → Templates overzicht
hq_create_onboarding_instance(...)   → Start nieuwe onboarding
hq_get_employee_onboarding(user_id)  → Check progress
```

**Status:** ✅ Functions bestaan en werkend

---

### 4.3 Onboarding Flow - Huidige Status

**Wat ER IS:**
- ✅ Professionele database structuur
- ✅ Template systeem met steps
- ✅ Progress tracking
- ✅ RPC functions voor CRUD

**Wat ER NIET IS:**
- ❌ Automatische onboarding bij nieuwe user
- ❌ First-login wizard
- ❌ Default template assignment op basis van rol
- ❌ Email notificaties
- ❌ Onboarding dashboard in frontend

**First Login Behavior:**
```
Nieuwe user logt in → Gaat naar dashboard → GEEN onboarding prompt
```

**Handmatige Start Nodig:**
```
Manager moet:
1. Ga naar HQ > Medewerker Onboardings
2. Klik "Nieuwe Onboarding"
3. Selecteer medewerker, template, begeleider
4. Start handmatig
```

---

### 4.4 Onboarding-User Koppeling

**Koppeling via:**
```sql
onboarding_instances.medewerker_id → users.id
```

**Observatie:**
- Gebruikt users.id (niet aparte employees table)
- Field heet "medewerker_id" (medewerker = user)
- Kan gekoppeld worden aan elk user account

---

## 5️⃣ MODULE-TOEGANG

### 5.1 Frontend Module Structuur (Layout.tsx)

**8 Module Groepen:**

```typescript
1. T-ZONE+       MessageCircle  'teal'    // Team communicatie
2. CARE+         Stethoscope    'blue'    // Klinische zorg
3. D-ICE+        Workflow       'teal'    // Diagnostic reasoning & budgets
4. C-BUDDY+      ClipboardList  'green'   // Checklists
5. AIR+          Boxes          'blue'    // Assets/Inventory
6. BUILD+        ShieldCheck    'yellow'  // Protocollen/Templates
7. HQ+           Briefcase      'blue'    // HR & Management
8. BEHEER        Cog            'gray'    // Admin tools
```

---

### 5.2 Module Toegang per Rol

**BEHEER Section:**
```typescript
if (isManagement) {
  beheerItems.push(
    'Admin Tools', 'Documenttype Beheer', 'CliniDoc Demo',
    'Ambiance', 'Instellingen', 'Medewerkersbeheer',
    'Praktijk & Locaties', 'Ruimtes', 'UPT AI Learning',
    'UPT Pattern Correctie', 'Categorieen', 'Import tools'
  );
}
```

**isManagement Bepaling:**
```typescript
const isManagement =
  (user?.security && canManageSecurity(user.security)) ||
  user?.rol === 'Admin' ||
  user?.rol === 'Manager' ||
  user?.rol === 'Praktijkhouder' ||      // ⚠️ Bestaat niet in constraint!
  user?.rol === 'Kwaliteitsmanager';     // ⚠️ Bestaat niet in constraint!
```

---

**HQ+ Section:**
```typescript
const hqItems = [
  // Altijd zichtbaar:
  'Medewerkers', 'Bekwaamheden', 'Roosters', 'Onboarding', 'Locaties', 'Taken'

  // Owner-only (conditional):
  ...(isOwner ? [
    'Finance Dashboard',
    'Opleiding & Impact'
  ] : [])
];
```

**isOwner Check:**
```typescript
const [isOwner, setIsOwner] = useState(false);

useEffect(() => {
  const { data } = await supabase
    .from('users')
    .select('is_owner')
    .eq('id', user.id)
    .maybeSingle();

  setIsOwner(data?.is_owner || false);
}, [user]);
```

**Probleem:** is_owner=false voor ALLE users → Finance altijd hidden

---

### 5.3 Toegangsmatrix

| Module          | Admin | Manager | Tandarts | MH | Assistent | Checks |
|-----------------|-------|---------|----------|----|-----------|--------|
| **T-ZONE+ Feed**    | ✓     | ✓       | ✓        | ✓  | ✓         | None (public) |
| **CARE+ Dashboard** | ✓     | ✓       | ✓        | ✓  | ✓         | None (public) |
| **D-ICE+ Hub**      | ✓     | ✓       | ✓        | Limited | Read | RLS backed |
| **HQ+ HR**          | ✓     | ✓       | ✗        | ✗  | ✗         | isManagement |
| **HQ+ Finance**     | Owner | ✗       | ✗        | ✗  | ✗         | is_owner=true |
| **BEHEER**          | ✓     | ✓       | ✗        | ✗  | ✗         | isManagement |

**Enforcement Layers:**
1. **UI/Menu:** Conditional rendering (zwak)
2. **RLS:** Database policies (sterk maar inconsistent)
3. **Route Guards:** ❌ Ontbreekt

**Gap:** Direct URL navigation kan UI bypass.

---

### 5.4 Role Checks in Code

**Pattern 1: Legacy rol string**
```typescript
if (user?.rol === 'Admin') { ... }
```
**Gebruikt in:** 24 files

**Pattern 2: Boolean flags**
```typescript
if (user?.isAdmin) { ... }
```
**Gebruikt in:** 1 file (AdminTools.tsx)

**Pattern 3: Security helper**
```typescript
if (canManageSecurity(user?.security)) { ... }
```
**Gebruikt in:** Layout.tsx, enkele admin pages

**Pattern 4: Direct database check**
```typescript
const { data } = await supabase
  .from('users')
  .select('is_owner')
  .eq('id', user.id);
```
**Gebruikt in:** Layout.tsx, HQFinanceDashboard.tsx

---

## 6️⃣ KRITIEKE RISICO'S

### 6.1 🔴 PRIORITY 1: Security View Exposed

**Probleem:**
```sql
-- vw_user_effective_security heeft GEEN RLS policies
SELECT * FROM vw_user_effective_security;
-- → Alle authenticated users zien ALLE security profiles
```

**Impact:**
- Users kunnen zien wie admin/manager is
- Reconnaissance voor privilege escalation
- Privacy schending (roles, permissions)

**Fix:**
```sql
CREATE POLICY "Users can only see own security profile"
ON vw_user_effective_security FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND (is_admin = true OR is_manager = true)
  )
);
```

---

### 6.2 🔴 PRIORITY 2: RBAC Systeem Leeg

**Probleem:**
- 0 permissions in permissions table
- 0 role-permission koppelingen
- permissions_json in view is altijd `[]`
- AuthContext.permissions is altijd leeg array

**Impact:**
- Granulaire permission checks werken niet
- `can(user.security, 'permission')` pattern is onmogelijk
- Alles moet via coarse-grained rol checks

**Fix Opties:**
1. **Snel:** Blijf bij legacy system, voeg ontbrekende rollen toe aan constraint
2. **Ideaal:** Populate RBAC met 50-100 granulaire permissions

---

### 6.3 🟠 PRIORITY 3: users.rol Constraint te Beperkt

**Probleem:**
```sql
CHECK (rol IN ('Assistent', 'Mondhygiënist', 'Tandarts', 'Manager', 'Admin'))
```

**Ontbrekende Rollen:**
- Super Admin (voor platform beheer)
- Owner (voor finance toegang)
- ICT / TD (voor technisch beheer)
- Teamlead (voor dagelijkse operaties)
- Balie/Receptie (voor front office)

**Impact:**
- Frontend checks op 'Praktijkhouder', 'Kwaliteitsmanager' falen altijd
- is_owner flag bestaat maar constraint heeft geen 'Owner' rol
- Inconsistentie tussen intent en implementatie

**Fix:**
```sql
ALTER TABLE users DROP CONSTRAINT users_rol_check;
ALTER TABLE users ADD CONSTRAINT users_rol_check
CHECK (rol IN (
  'Super Admin', 'Owner', 'ICT',
  'Admin', 'Manager', 'Teamlead',
  'Tandarts', 'Mondhygiënist', 'Assistent',
  'Balie', 'Receptie'
));
```

---

### 6.4 🟠 PRIORITY 4: 36 Kolommen in Users Table

**Probleem:**
- Users table heeft te veel verantwoordelijkheden
- Mixen van: auth, profile, clinical data, permissions, preferences
- 18 boolean permission flags direct op users
- Single Responsibility Principle geschonden

**Impact:**
- Moeilijk onderhoud
- Permission logic verspreid
- Lastig te auditen
- Database queries complex

**Ideale Structuur:**
```
users              → Alleen auth + basis profile (5 kolommen)
user_profiles      → Extended profile data
user_clinical      → BIG/AGB/voorschrijver data
user_preferences   → Settings
```

**Maar:** Voor pilot OK, migreren later.

---

### 6.5 🟡 PRIORITY 5: Concurrent Role Systems

**3 Systemen tegelijk:**
1. **Legacy:** users.rol + is_admin/is_manager flags
2. **RBAC:** roles + user_roles (partieel gevuld)
3. **Function Groups:** function_groups + user_function_groups (niet gebruikt)

**Impact:**
- Verwarring over "source of truth"
- View vw_user_effective_security doet hybrid logic (complex)
- Moeilijk te redeneren over permissies
- Geen duidelijk migration pad

**Aanbeveling:** Kies ÉÉN systeem als primair.

---

### 6.6 🟡 PRIORITY 6: Locatie 'Beide' Te Breed

**Probleem:**
```sql
SELECT COUNT(*) FROM users WHERE locatie = 'Beide';
-- 4 van 5 users
```

**Impact:**
- 'Beide' geeft automatisch toegang tot ALLE locaties
- Geen expliciete hoofdlocatie
- Lastig voor multi-location filtering in queries
- user_praktijk_locaties systeem wordt niet gebruikt

**Fix:** Migreer naar expliciete user_praktijk_locaties records.

---

### 6.7 🟡 PRIORITY 7: is_owner Unused

**Probleem:**
```sql
SELECT COUNT(*) FROM users WHERE is_owner = true;
-- 0 users
```

**Impact:**
- Finance Dashboard is ALTIJD hidden (owner-only feature)
- Feature kan niet getest worden
- Geen owner assigned voor production

**Fix:**
```sql
UPDATE users
SET is_owner = true
WHERE email = 'admin@dnmz.nl';  -- Faro Sana
```

---

### 6.8 🔵 INFO: Onboarding Niet Geactiveerd

**Observatie:**
- 0 onboarding_instances in database
- Onboarding systeem gebouwd maar niet in gebruik
- Geen first-login trigger
- Handmatige start vereist

**Impact:** Minimaal - nice-to-have voor later.

---

## 7️⃣ WAAR ONTBREKEN SUPER ADMIN / TD / ICT?

### 7.1 Database Constraint

**Huidige Constraint:**
```sql
users.rol CHECK (rol IN ('Assistent', 'Mondhygiënist', 'Tandarts', 'Manager', 'Admin'))
```

**Gevolg:**
```sql
INSERT INTO users (rol) VALUES ('Super Admin');
-- ERROR: new row violates check constraint "users_rol_check"
```

---

### 7.2 RBAC Roles Table

**Wel aanwezig in RBAC:**
- ✅ 'admin' (level 100)
- ✅ 'power_user' (level 80)
- ✅ 'teamlead' (level 70)

**Maar:**
- ❌ Geen 'super_admin' key
- ❌ Geen 'owner' key
- ❌ Geen 'ict' key

**Aanmaak nodig:**
```sql
INSERT INTO roles (key, name, level, is_system_default) VALUES
  ('super_admin', 'Super Administrator', 150, false),
  ('owner', 'Praktijkhouder / Eigenaar', 140, false),
  ('ict_admin', 'ICT / Technisch Directeur', 130, false);
```

---

### 7.3 Frontend Checks

**Layout.tsx regel 127-130:**
```typescript
const isManagement =
  user?.rol === 'Admin' ||
  user?.rol === 'Manager' ||
  user?.rol === 'Praktijkhouder' ||      // ⚠️ BESTAAT NIET
  user?.rol === 'Kwaliteitsmanager';     // ⚠️ BESTAAT NIET
```

**Gevolg:** Laatste 2 checks zijn dead code, falen altijd.

---

### 7.4 Aanbeveling: Rollen Toevoegen

**Optie A: Uitbreiden Legacy Constraint**
```sql
ALTER TABLE users DROP CONSTRAINT users_rol_check;
ALTER TABLE users ADD CONSTRAINT users_rol_check
CHECK (rol IN (
  'Super Admin',           -- 150 - Platform beheer
  'Owner',                 -- 140 - Finance toegang
  'ICT',                   -- 130 - Tech beheer
  'Admin',                 -- 100 - Praktijk admin
  'Manager',               -- 80  - Dagelijks management
  'Teamlead',              -- 70  - Team coördinatie
  'Kwaliteitsmanager',     -- 70  - QA
  'Tandarts',              -- 60  - Clinical
  'Mondhygiënist',         -- 50  - Clinical
  'Assistent',             -- 30  - Support
  'Balie'                  -- 20  - Front office
));
```

**Optie B: Migreer naar Pure RBAC**
```sql
-- Maak users.rol nullable
ALTER TABLE users ALTER COLUMN rol DROP NOT NULL;

-- Gebruik alleen user_roles
-- Frontend check dan: user.roles.some(r => r.key === 'super_admin')
```

**Aanbeveling voor pilot:** Optie A (minste impact, snel)

---

## 8️⃣ INCONSISTENTIES & RISICO'S

### 8.1 Inconsistentie: rol vs is_admin

**Voorbeeld uit database:**
```sql
Faro Sana (ff1f49c7...)
  rol = 'Admin'
  is_admin = false
  is_manager = false
```

**Probleem:**
- Rol zegt Admin, maar boolean flags zeggen nee
- View vw_user_effective_security gebruikt flags EERST
- User heeft rol='Admin' maar is_admin=false → inconsistent

**Welke is Source of Truth?**

---

### 8.2 Inconsistentie: RBAC vs Legacy

**User heeft beide:**
```sql
users.rol = 'Admin'
user_roles: ['admin', 'standard_user']
```

**View logic:**
```sql
IF user_roles exists THEN use RBAC roles_json
ELSE synthesize from users.rol
```

**Probleem:** Onduidelijk welk systeem "wint" bij conflict.

---

### 8.3 Inconsistentie: Frontend Checks

**4 Verschillende Patterns:**
```typescript
1. if (user?.rol === 'Admin')
2. if (user?.isAdmin)
3. if (canManageSecurity(user?.security))
4. Direct DB query: SELECT is_owner WHERE id = user.id
```

**Probleem:** Geen consistent authorization pattern.

---

### 8.4 Risk: No Audit Trail

**Geen logging van:**
- Role changes
- Permission grants/revokes
- User activeren/deactiveren
- is_admin flag toggles

**Impact:**
- Geen accountability
- Moeilijk troubleshooten
- Compliance issues

---

### 8.5 Risk: No Role Hierarchy Enforcement

**users table UPDATE policy:**
```sql
"Users can update own profile"
WITH CHECK: is_admin = (SELECT is_admin WHERE id = auth.uid())
```

**Goed:** Users kunnen niet eigen is_admin upgraden.

**Maar:**
- Admin kan elke andere user is_admin maken (geen checks)
- Geen validatie: Only Super Admin can create Admin
- Geen level-based constraints

---

### 8.6 Risk: Locatie Bypass

**users.locatie = 'Beide':**
- Geeft toegang tot alle locaties
- Geen granulaire controle
- user_praktijk_locaties wordt genegeerd

**RLS Queries:**
```sql
-- Veel tables filteren op locatie:
WHERE praktijk_locatie_id = (SELECT standaard_locatie_id FROM users WHERE id = auth.uid())

-- Maar 'Beide' users hebben standaard_locatie_id = NULL of random
```

**Impact:** Locatie filtering is inconsistent.

---

## 9️⃣ ADVIES: WAT BEHOUDEN, WAT VERVANGEN

### 9.1 ✅ BEHOUDEN (Goed Genoeg voor Pilot)

**1. Basis Authenticatie:**
- ✅ Supabase Auth
- ✅ Email/Password login
- ✅ Session management
- ✅ AuthContext met security loading

**2. Users Table Basis:**
- ✅ id, naam, email, actief
- ✅ Legacy rol field (met uitgebreide constraint)
- ✅ Boolean flags (is_admin, is_manager, is_klinisch)

**3. RLS Policies:**
- ✅ Meeste tables hebben werkende policies
- ⚠️ Wel audit en fix `WHERE true` policies

**4. Locatie Systeem:**
- ✅ praktijk_locaties table
- ✅ user_praktijk_locaties infrastructure
- ⚠️ Migreer weg van locatie='Beide'

**5. Onboarding Systeem:**
- ✅ Volledige database structuur
- ✅ RPC functions
- ⚠️ Activeer met first-login trigger

---

### 9.2 🟡 UITBREIDEN (Voor Pilot Volledigheid)

**1. Rollen Toevoegen:**
```sql
ALTER TABLE users DROP CONSTRAINT users_rol_check;
ALTER TABLE users ADD CONSTRAINT users_rol_check
CHECK (rol IN (
  'Super Admin', 'Owner', 'ICT',
  'Admin', 'Manager', 'Teamlead', 'Kwaliteitsmanager',
  'Tandarts', 'Mondhygiënist',
  'Assistent', 'Balie'
));
```

**2. Fix is_owner:**
```sql
UPDATE users SET is_owner = true
WHERE email IN ('admin@dnmz.nl');
```

**3. RLS op View:**
```sql
ALTER TABLE vw_user_effective_security ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own security or admins see all"
ON vw_user_effective_security FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND is_admin = true
  )
);
```

**4. Explode 'Beide' Locatie:**
```sql
-- Voor elke user met locatie='Beide':
INSERT INTO user_praktijk_locaties (user_id, praktijk_locatie_id, is_hoofdlocatie)
SELECT
  u.id,
  pl.id,
  pl.korte_naam = 'Almelo' as is_hoofdlocatie  -- Of bepaal anders
FROM users u
CROSS JOIN praktijk_locaties pl
WHERE u.locatie = 'Beide' AND pl.is_actief = true;

-- Dan update users:
UPDATE users SET
  locatie = (SELECT korte_naam FROM user_praktijk_locaties upl
             JOIN praktijk_locaties pl ON pl.id = upl.praktijk_locatie_id
             WHERE upl.user_id = users.id AND upl.is_hoofdlocatie = true
             LIMIT 1)
WHERE locatie = 'Beide';
```

---

### 9.3 🔴 VERVANGEN (Post-Pilot)

**1. RBAC Volledig Implementeren:**
- Populate permissions table (50-100 granular permissions)
- Define role-permission mappings
- Migrate alle hardcoded checks naar `can(user, 'permission')`

**2. User Table Normalisatie:**
```sql
-- Split users table:
users              → id, email, naam, actief (5 kolommen)
user_profiles      → klinische metadata
user_permissions   → obsolete, vervang door role_permissions
```

**3. Consolideer naar Enkel RBAC:**
```sql
-- Maak users.rol optional/deprecated
ALTER TABLE users ALTER COLUMN rol DROP NOT NULL;
-- Frontend gebruik: user.roles[0].key i.p.v. user.rol
```

**4. Audit Logging:**
```sql
CREATE TABLE user_audit_log (
  id uuid PRIMARY KEY,
  user_id uuid,
  action text,  -- 'role_granted', 'role_revoked', 'activated', 'deactivated'
  changed_by uuid,
  old_value jsonb,
  new_value jsonb,
  timestamp timestamptz DEFAULT now()
);
```

**5. Role Hierarchy Enforcement:**
```sql
-- Function: check_role_hierarchy_on_grant
-- Only level >= granter can grant roles < granter
```

---

### 9.4 🚫 VERWIJDEREN (Dead Code)

**1. Unused Boolean Flags:**
- kan_checklists_aftekenen_alle_kamers (gebruik RLS)
- wordt_getoond_op_documenten (lijkt niet gebruikt)

**2. Function Groups:**
- Momenteel niet actief gebruikt
- Duplicate van RBAC roles
- Overweeg deprecaten

**3. Synthetic rol Field:**
```typescript
// In AuthContext:
rol: 'Admin' | 'Manager' | 'Clinical' | 'User'
// → Vervang door: primaryRole: user.roles[0]
```

---

## 🎯 SAMENVATTING: PILOT READINESS

### Voor Pilot: 3-5 Dagen Fixes

**Dag 1-2: Critical Security**
- [ ] Add RLS policies op vw_user_effective_security
- [ ] Fix `USING (true)` policies op users table
- [ ] Test: Users kunnen NIET elkaars security zien

**Dag 3: Rollen Compleet Maken**
- [ ] Extend users.rol constraint met Super Admin, Owner, ICT, Teamlead, Balie
- [ ] Set is_owner=true voor praktijkhouder
- [ ] Update frontend isManagement logic

**Dag 4: Locatie Cleanup**
- [ ] Create user_praktijk_locaties records voor 'Beide' users
- [ ] Set hoofdlocatie
- [ ] Update queries om user_praktijk_locaties te respecteren

**Dag 5: Testing & Docs**
- [ ] Test login voor alle rollen
- [ ] Test module toegang per rol
- [ ] Test locatie filtering
- [ ] Document current role-permission matrix

---

### Post-Pilot: Structurele Verbetering (3-4 weken)

**Week 1-2: RBAC Implementatie**
- Populate permissions table (granular)
- Define role-permission mappings
- Migrate frontend checks naar `can(user, 'permission')`

**Week 3: User Table Refactor**
- Extract klinische data naar user_profiles
- Remove unused boolean flags
- Implement audit logging

**Week 4: Onboarding Activatie**
- First-login wizard
- Auto-assign templates
- Email notifications
- Progress dashboard

---

## 🔬 CONCLUSIE

### Sterke Punten
✅ Solide authenticatie basis (Supabase)
✅ Uitgebreide RLS op meeste tables
✅ Multi-location architecture voorbereid
✅ RBAC infrastructure aanwezig (database)
✅ Professioneel onboarding systeem gebouwd

### Kritieke Gaps
🔴 vw_user_effective_security GEEN RLS → Security leak
🔴 RBAC permissions table volledig leeg → Geen granulaire controle
🔴 users.rol constraint te beperkt → Missende rollen
🟠 3 concurrerende role systemen → Verwarring
🟠 36 kolommen in users → SRP schending

### Verdict
**⚠️ Met 3-5 dagen security fixes → VEILIG voor pilot**
**✅ Basis is solide, kan blijven in productie**
**🔨 RBAC implementatie = post-pilot verbetering**

---

**Volgende Stap:**
Prioriteer security fixes → Dan start pilot → Post-pilot: RBAC migration
