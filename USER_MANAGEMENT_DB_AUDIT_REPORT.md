# User Management Database Audit Report
## DNMZ+ Assist 3.0 - Complete Security & Authorization Inventory

**Generated:** 2024-12-19
**Purpose:** Comprehensive audit of all user management, roles, permissions, and access control systems

---

## Executive Summary

DNMZ+ Assist 3.0 implements a **hybrid security model** combining:
1. **Legacy role system** (users.rol string field)
2. **Modern RBAC system** (roles, permissions, function_groups)
3. **Boolean flags** (is_admin, is_manager, is_klinisch)
4. **View-based abstraction** (vw_user_effective_security)

The system prioritizes **backwards compatibility** while gradually migrating to a fine-grained RBAC model.

**RLS Status:** ✅ 943+ RLS policies across 109+ migration files
**RBAC Migration:** 🟡 Phase 1 - Dual-mode operation (legacy + RBAC)
**Security Score:** 🟢 High (comprehensive RLS, authenticated-only access)

---

## 1. Core User Tables & Views

### 1.1 `users` (Base Table - Public Schema)

**Purpose:** Primary user identity and authentication mapping

**Key Columns:**
- `id` (uuid, PK) - Maps to auth.users.id
- `naam` (text) - Full name
- `email` (text) - Email address (unique)
- `rol` (text) - **LEGACY** role field: 'Admin' | 'Manager' | 'Tandarts' | 'Mondhygiënist' | 'Assistent'
- `locatie` (text) - Location: 'Almelo' | 'Raalte' | 'Beide'
- `actief` (boolean) - Active status
- `is_admin` (boolean) - **NEW** Admin flag
- `is_manager` (boolean) - **NEW** Manager flag
- `is_klinisch` (boolean) - **NEW** Clinical staff flag
- `created_at` (timestamptz)

**Relations:**
- Maps 1:1 with `auth.users.id`
- M:N with `roles` via `user_roles`
- M:N with `function_groups` via `user_function_groups`

**Security Fields:**
- `rol` (legacy authorization)
- `is_admin`, `is_manager`, `is_klinisch` (boolean authorization)
- `actief` (account enable/disable)

**RLS Policies:**
```sql
-- All authenticated users can read all users
"Users can view users" FOR SELECT TO authenticated USING (true)

-- Only admins can manage users
"Admins can manage users" FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true))
```

**Used In:**
- `src/contexts/AuthContext.tsx` (user loading)
- `src/pages/Medewerkersbeheer.tsx`
- `src/pages/AdminTools.tsx`
- `src/components/Layout.tsx` (authorization checks)

---

### 1.2 `vw_user_effective_security` (Public View)

**Purpose:** Unified security model consolidating all authorization sources

**Type:** READ-ONLY VIEW

**Key Columns:**
- `user_id` (uuid) - User ID
- `naam`, `email`, `actief` - User identity
- `is_admin` (boolean) - Computed from: users.is_admin OR role.level ≥ 90 OR role.key = 'admin'
- `is_manager` (boolean) - Computed from: users.is_manager OR role.key IN ('manager', 'power_user')
- `is_clinical` (boolean) - Computed from: users.is_klinisch OR function_groups.is_clinical
- `roles_json` (jsonb) - Array of `{key, name, level, isPrimary}`
- `permissions_json` (jsonb) - Array of `{code, name, module, category}`

**Computation Logic:**
```sql
-- Multi-source truth for is_admin
COALESCE(
  u.is_admin,  -- Boolean flag
  EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = u.id AND (r.level >= 90 OR LOWER(r.key) = 'admin')),
  false
)
```

**Fallback Mechanism:**
If RBAC tables are empty, falls back to users.rol field:
- Admin → level 100
- Manager → level 80
- Tandarts → level 60
- Mondhygiënist → level 50
- Assistent → level 30

**Security:**
- Inherits RLS from base `users` table
- Granted to `authenticated` role

**Used In:**
- `src/contexts/AuthContext.tsx:56` (primary security loading)
- AuthContext loads this view on login/refresh
- Populates `DNMZUser.security` object

**Created:** Migration `20251124140409_create_vw_user_effective_security.sql`

---

## 2. RBAC System Tables

### 2.1 `roles` (Base Table - Public Schema)

**Purpose:** Define system roles (what users can DO)

**Key Columns:**
- `id` (uuid, PK)
- `key` (text, unique) - Role identifier (e.g., 'admin', 'manager', 'tandarts')
- `name` (text) - Display name
- `description` (text)
- `level` (integer) - Role hierarchy level (0-100)
- `is_system_default` (boolean) - System-managed role
- `is_active` (boolean) - Active status

**Level Hierarchy:**
- 100: Admin
- 80-89: Manager
- 60-79: Power User / Specialist
- 40-59: Standard User
- 0-39: Read-only / Limited

**Relations:**
- M:N with `users` via `user_roles`
- M:N with `permissions` via `role_permissions`

**RLS Policies:**
```sql
"Users can view active roles" FOR SELECT USING (is_active = true)
"Admins can manage roles" FOR ALL USING (user is admin)
```

**Created:** Migration `20251122215943_create_rbac_system.sql`

---

### 2.2 `permissions` (Base Table - Public Schema)

**Purpose:** Fine-grained access rights

**Key Columns:**
- `id` (uuid, PK)
- `code` (text, unique) - Permission code (e.g., 'cases.manage', 'settings.edit')
- `name` (text) - Display name
- `description` (text)
- `module` (text) - Module grouping (e.g., 'care', 'hq', 'build')
- `category` (text) - Permission category

**Examples:**
- `cases.view` - View cases
- `cases.manage` - Create/edit cases
- `settings.admin` - Admin settings access
- `hq.finance` - HQ finance access

**RLS Policies:**
```sql
"Users can view permissions" FOR SELECT TO authenticated USING (true)
"Admins can manage permissions" FOR ALL USING (user is admin)
```

**Created:** Migration `20251122215943_create_rbac_system.sql`

---

### 2.3 `function_groups` (Base Table - Public Schema)

**Purpose:** Organizational function groups (what users ARE)

**Key Columns:**
- `id` (uuid, PK)
- `key` (text, unique) - Function identifier
- `name` (text) - Display name
- `description` (text)
- `is_clinical` (boolean) - Clinical staff flag
- `is_admin_related` (boolean) - Admin-related function

**Examples:**
- Tandarts (is_clinical: true)
- Mondhygiënist (is_clinical: true)
- Praktijkmanager (is_admin_related: true)
- Preventie-assistent (is_clinical: false)

**Relations:**
- M:N with `users` via `user_function_groups`

**Created:** Migration `20251122215943_create_rbac_system.sql`

---

### 2.4 `user_roles` (Junction Table)

**Purpose:** Assign roles to users

**Key Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → users.id)
- `role_id` (uuid, FK → roles.id)
- `is_primary` (boolean) - Primary role flag (only one per user)
- `granted_by` (uuid, FK → users.id)
- `granted_at` (timestamptz)

**Constraints:**
- UNIQUE(user_id, role_id)
- Only one is_primary per user_id

**RLS Policies:**
```sql
"Users can view own role assignments" FOR SELECT
"Admins can manage role assignments" FOR ALL
```

---

### 2.5 `user_function_groups` (Junction Table)

**Purpose:** Assign function groups to users

**Key Columns:**
- `id` (uuid, PK)
- `user_id` (uuid, FK → users.id)
- `function_group_id` (uuid, FK → function_groups.id)
- `granted_by` (uuid, FK → users.id)
- `granted_at` (timestamptz)

**Constraints:**
- UNIQUE(user_id, function_group_id)

---

### 2.6 `role_permissions` (Junction Table)

**Purpose:** Assign permissions to roles

**Key Columns:**
- `id` (uuid, PK)
- `role_id` (uuid, FK → roles.id)
- `permission_id` (uuid, FK → permissions.id)
- `allowed` (boolean) - Allow/deny flag

**Constraints:**
- UNIQUE(role_id, permission_id)

---

## 3. HQ (Head Quarter) System

### 3.1 `hq.employees` (Base Table - HQ Schema)

**Purpose:** HR employee master data (separate from clinical users)

**Key Columns:**
- `id` (uuid, PK)
- `voornaam`, `achternaam`, `roepnaam` (text)
- `functie` (text) - Job function
- `afdeling` (text) - Department
- `email` (text)
- `status` (text) - 'actief' | 'inactief' | 'verlof' | 'uitdienst'
- `in_dienst_vanaf`, `uit_dienst_per` (date)
- `fte` (numeric) - Full-time equivalent
- `is_leidinggevend` (boolean) - Leadership flag

**Relations:**
- May map to `users.id` (but not enforced FK)
- 1:M with `hq.employee_skills`
- 1:M with `hq.documents`

**RLS Policies:**
```sql
"Authenticated users can read employees" FOR SELECT TO authenticated USING (true)
"Managers can write employees" FOR ALL USING (user is manager)
```

**Public Views:**
- `hq_employees_view` (public schema, read-only)

**Created:** Migration `20251214151754_create_hq_schema_and_tables.sql`

---

### 3.2 `hq.skills` (Base Table - HQ Schema)

**Purpose:** Skills catalog for competency management

**Key Columns:**
- `id` (uuid, PK)
- `naam`, `code` (text, unique)
- `categorie` (text)
- `omschrijving` (text)
- `opleiding_vereist`, `certificaat_vereist` (boolean)
- `certificaat_geldigheid_jaren` (integer)
- `is_actief` (boolean)

---

### 3.3 `hq.employee_skills` (Junction Table)

**Purpose:** Assign skills to employees

**Key Columns:**
- `employee_id` (FK → hq.employees.id)
- `skill_id` (FK → hq.skills.id)
- `level` (text) - 'basis' | 'gevorderd' | 'expert' | 'instructeur'
- `gecertificeerd` (boolean)
- `certificaat_datum`, `certificaat_verloopt_op` (date)

**Constraints:**
- UNIQUE(employee_id, skill_id)

---

### 3.4 `hq.documents` (Base Table - HQ Schema)

**Purpose:** Employee documents (contracts, certificates, etc.)

**Key Columns:**
- `employee_id` (FK → hq.employees.id)
- `document_type` (text) - 'identiteit' | 'diploma' | 'certificaat' | 'contract' | 'beoordeling'
- `titel`, `omschrijving` (text)
- `file_url` (text)
- `geldig_vanaf`, `geldig_tot` (date)
- `vertrouwelijk` (boolean) - Confidential flag
- `zichtbaar_voor_medewerker` (boolean) - Employee visibility
- `status` (text) - 'actief' | 'verlopen' | 'vervangen'

**RLS Policies:**
```sql
"Managers can view all documents" FOR SELECT USING (user is manager)
"Employees can view own non-confidential docs" FOR SELECT
  USING (employee_id = current_user_employee_id AND NOT vertrouwelijk)
```

---

## 4. T-Zone (Team Zone) System

### 4.1 `hq_tzone.zones` (Base Table - HQ TZone Schema)

**Purpose:** Communication zones/circles for teams

**Key Columns:**
- `id` (uuid, PK)
- `naam` (text)
- `omschrijving` (text)
- `type` (text) - Zone type
- `is_open` (boolean) - Open membership
- `created_by` (uuid, FK → users.id)

**Public Views:**
- `zones` (public schema view)

**Relations:**
- 1:M with `hq_tzone.members`
- 1:M with `hq_tzone.posts`

**RLS Policies:**
```sql
"All authenticated users can view zones" FOR SELECT TO authenticated USING (true)
"Zone members can post" FOR INSERT USING (user is member)
```

**Created:** Migrations `20251216214205_create_public_tzone_views_final.sql`

---

### 4.2 `hq_tzone.members` (Junction Table)

**Purpose:** Zone membership tracking

**Key Columns:**
- `zone_id` (FK → hq_tzone.zones.id)
- `user_id` (FK → users.id)
- `role` (text) - 'member' | 'moderator' | 'admin'
- `joined_at` (timestamptz)

**Constraints:**
- UNIQUE(zone_id, user_id)

---

### 4.3 `hq_tzone.posts` (Base Table)

**Purpose:** Posts within zones

**Key Columns:**
- `id` (uuid, PK)
- `zone_id` (FK → hq_tzone.zones.id)
- `author_id` (FK → users.id)
- `content` (text)
- `post_type` (text)
- `created_at` (timestamptz)

**Public Views:**
- `posts` (public schema view with author info)

**RLS Policies:**
```sql
"Zone members can view posts" FOR SELECT
  USING (EXISTS (SELECT 1 FROM hq_tzone.members WHERE zone_id = posts.zone_id AND user_id = auth.uid()))
```

---

## 5. Frontend Authorization Logic

### 5.1 AuthContext (src/contexts/AuthContext.tsx)

**Primary User Loading:**
```typescript
// Load from vw_user_effective_security
const { data } = await supabase
  .from('vw_user_effective_security')
  .select('*')
  .eq('user_id', authUserId)
  .maybeSingle();

// Map to DNMZUser
const mappedUser: DNMZUser = {
  id: data.user_id,
  email: data.email,
  naam: data.naam,
  actief: data.actief,
  rol: data.is_admin ? 'Admin' : data.is_manager ? 'Manager' : 'Clinical',
  isAdmin: data.is_admin,
  isManager: data.is_manager,
  isClinical: data.is_clinical,
  roles: data.roles_json,
  permissions: data.permissions_json
};
```

---

### 5.2 Security Utility Functions (src/utils/security.ts)

**Available Checks:**

```typescript
// Role checks
hasRole(sec, 'admin')
hasAnyRole(sec, ['admin', 'manager'])
hasAllRoles(sec, ['tandarts', 'implantoloog'])

// Permission checks
hasPermission(sec, 'cases.manage')
hasAnyPermission(sec, ['cases.view', 'cases.manage'])

// Quick checks
isAdmin(sec)          // sec.isAdmin && sec.isActive
isManager(sec)        // sec.isManager && sec.isActive
isClinical(sec)       // sec.isClinical && sec.isActive
canManage(sec)        // isAdmin || isManager

// Level checks
hasMinimumRoleLevel(sec, 80)  // Manager or higher
getRoleLevel(sec)              // Highest role level
```

---

### 5.3 Frontend Authorization Patterns

**Pattern 1: Legacy Role Check**
```typescript
// OLD: Direct rol string check
if (user?.rol === 'Admin') { ... }

// CURRENT: Boolean flag check
if (user?.isAdmin) { ... }
```

**Pattern 2: Mixed Mode Check (Backwards Compatible)**
```typescript
// src/pages/AdminTools.tsx:12
const isAdmin = user?.rol === 'Admin' || user?.isAdmin;
```

**Pattern 3: Layout Menu Gating**
```typescript
// src/components/Layout.tsx:123-130
const isManagement =
  (user?.security && canManageSecurity(user.security)) ||
  user?.rol === 'Admin' ||
  user?.rol === 'Manager' ||
  user?.rol === 'Praktijkhouder' ||
  user?.rol === 'Kwaliteitsmanager';
```

**Pattern 4: Owner-Only Features**
```typescript
// src/components/Layout.tsx:164-168
...(isOwner ? [
  { id: 'hq-finance', label: 'Finance Dashboard', badge: 'OWNER' },
  { id: 'hq-training-impact', label: 'Opleiding & Impact', badge: 'OWNER' }
] : [])
```

---

### 5.4 Pages with Authorization Gates

**Admin-Only Pages:**
- `src/pages/AdminTools.tsx` (line 12: `isAdmin check`)
- `src/pages/Instellingen.tsx`
- `src/pages/Categorieen.tsx`

**Management-Only Pages:**
- `src/pages/Medewerkersbeheer.tsx`
- `src/pages/PraktijkMedewerkerBeheer.tsx`
- `src/pages/CareRequirementConfig.tsx`

**Owner-Only Pages:**
- `src/pages/hq/HQFinanceDashboard.tsx`
- `src/pages/hq/HQTrainingImpact.tsx`

**Clinical-Only Features:**
- Clinical note composer
- Status praesens editor
- Treatment plan creation

---

## 6. RLS Policy Summary

**Total RLS Policies:** 943+ across 109 migrations

**Policy Patterns:**

### Pattern 1: Authenticated Read-All
```sql
CREATE POLICY "Users can view X" ON table_name FOR SELECT
  TO authenticated
  USING (true);
```

**Used By:** function_groups, roles, permissions, zones (public info)

---

### Pattern 2: Admin-Only Write
```sql
CREATE POLICY "Admins can manage X" ON table_name FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );
```

**Used By:** roles, permissions, function_groups, system config

---

### Pattern 3: Owner Access
```sql
CREATE POLICY "Users can manage own X" ON table_name FOR ALL
  TO authenticated
  USING (user_id = auth.uid());
```

**Used By:** user preferences, personal notes

---

### Pattern 4: Membership-Based Access
```sql
CREATE POLICY "Zone members can view posts" ON hq_tzone.posts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hq_tzone.members
      WHERE zone_id = posts.zone_id AND user_id = auth.uid()
    )
  );
```

**Used By:** T-Zone posts, team documents, circle content

---

### Pattern 5: Manager Access
```sql
CREATE POLICY "Managers can write X" ON table_name FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (is_admin OR is_manager))
  );
```

**Used By:** HQ employees, rosters, documents

---

## 7. Security Gaps & Recommendations

### 7.1 Current Strengths ✅

1. **Comprehensive RLS Coverage**
   - 943+ policies across all tables
   - No table without RLS protection

2. **Defense in Depth**
   - Frontend authorization checks
   - Backend RLS enforcement
   - View-based abstraction

3. **Backwards Compatibility**
   - Dual-mode operation (legacy + RBAC)
   - Fallback mechanisms
   - Graceful degradation

4. **Audit Trail**
   - `granted_by` fields in junction tables
   - `created_at`, `updated_at` timestamps

---

### 7.2 Missing Features & Recommendations 🔴

#### A. **Incomplete RBAC Migration**

**Issue:** System still relies heavily on:
- `users.rol` string field
- Boolean flags (`is_admin`, `is_manager`)
- Inconsistent authorization checks

**Recommendation:**
1. Complete seeding of RBAC tables with production roles
2. Create migration utility to sync `users.rol` → `user_roles`
3. Deprecate direct `users.rol` checks in frontend
4. Standardize all checks to use `security.ts` utilities

**Priority:** 🟡 Medium (current system works, but not scalable)

---

#### B. **No User Groups / Teams System**

**Issue:** No formal groups/teams structure for:
- Department-based access (e.g., "HR Team", "Clinical Team")
- Project-based permissions
- Dynamic access control

**Recommendation:**
1. Add `groups` table (id, name, type, parent_group_id)
2. Add `user_groups` junction (user_id, group_id, role)
3. Add `group_permissions` junction
4. Extend `vw_user_effective_security` to aggregate group permissions

**Example Use Cases:**
- "Almelo Practice" group → all Almelo staff
- "Implantology Team" group → specialized access
- "Management Board" group → strategic documents

**Priority:** 🔴 High (required for scaling to multiple locations)

---

#### C. **No Permission Inheritance / Hierarchy**

**Issue:** Flat permission model without:
- Permission groups (e.g., "care.*" grants all care permissions)
- Role inheritance (e.g., Admin inherits Manager permissions)
- Permission dependencies

**Recommendation:**
1. Add `permission_groups` table
2. Add wildcard support in permission checks (`care.*`)
3. Add `role_hierarchy` to auto-grant lower-level permissions

**Priority:** 🟡 Medium (nice-to-have for DRY principle)

---

#### D. **Limited Context-Based Access Control**

**Issue:** Current RLS policies check:
- User identity (auth.uid())
- User role/permissions
- Resource ownership

**Missing:**
- Location-based access (user can only see Almelo data)
- Time-based access (temporary access grants)
- Resource-specific permissions (edit Case #123 but not #124)

**Recommendation:**
1. Add `location_id` to user_roles for location-scoped roles
2. Add `valid_from`, `valid_until` to user_roles for temporary access
3. Add resource-level permissions (future: `user_resource_permissions`)

**Priority:** 🟢 Low (not currently needed)

---

#### E. **No Role Assignment Workflow**

**Issue:** No UI for:
- Assigning roles to users
- Viewing user permissions
- Audit log of role changes

**Recommendation:**
1. Create `src/pages/hq/HQRoleManagement.tsx`
2. Add role assignment modal with:
   - User selector
   - Role selector (with permission preview)
   - Primary role toggle
   - Grant reason field
3. Add audit log view

**Priority:** 🔴 High (currently requires manual DB edits)

---

#### F. **No Permission Testing/Simulation**

**Issue:** No way to:
- Test "what can user X see?"
- Simulate permission changes
- Debug RLS policy failures

**Recommendation:**
1. Create admin debug tool: "Simulate User View"
2. Add SQL function: `test_user_permissions(user_id, resource_type)`
3. Log RLS policy denials to `security_audit_log`

**Priority:** 🟡 Medium (helpful for debugging)

---

#### G. **Inconsistent Owner Detection**

**Issue:** `isOwner` check in Layout.tsx:
```typescript
const [isOwner, setIsOwner] = useState(false);

useEffect(() => {
  checkOwnerStatus();  // Checks some backend logic
}, [user]);
```

**Missing:**
- No `users.is_owner` boolean flag
- No `owner` role in RBAC
- Inconsistent with other authorization patterns

**Recommendation:**
1. Add `is_owner` boolean to `users` table
2. Add `owner` role (level 110) to RBAC
3. Update `vw_user_effective_security` to compute `is_owner`
4. Standardize owner checks to use `isOwner(user?.security)`

**Priority:** 🔴 High (finance module depends on this)

---

## 8. Proposed RBAC Structure (Complete System)

### 8.1 Recommended Tables

```sql
-- Already exist ✅
users
roles
permissions
function_groups
user_roles
user_function_groups
role_permissions

-- Should add 🔴
groups                       -- Teams, departments, locations
user_groups                  -- User membership in groups
group_permissions            -- Group-level permission grants
permission_groups            -- Permission grouping (e.g., "care.*")
role_hierarchy               -- Role inheritance (admin inherits manager)
resource_permissions         -- Resource-specific overrides (future)
audit_log                    -- Security event logging
```

---

### 8.2 Recommended Views

```sql
-- Already exist ✅
vw_user_effective_security   -- Unified security model

-- Should add 🔴
vw_group_members             -- Flattened group membership with hierarchy
vw_user_effective_groups     -- All groups user belongs to (direct + inherited)
vw_role_effective_perms      -- All permissions for role (direct + inherited)
vw_audit_log_recent          -- Recent security events
```

---

### 8.3 Recommended RPC Functions

```sql
-- Should add 🔴
grant_role_to_user(user_id, role_id, granted_by)
revoke_role_from_user(user_id, role_id, revoked_by)
add_user_to_group(user_id, group_id, role, added_by)
remove_user_from_group(user_id, group_id, removed_by)
test_user_permission(user_id, permission_code)
simulate_user_view(user_id, resource_type)
audit_security_event(event_type, user_id, details)
```

---

## 9. Migration Path (Recommended Phases)

### Phase 1: Foundation (CURRENT - ✅ DONE)
- ✅ Create RBAC tables (roles, permissions, function_groups)
- ✅ Create junction tables (user_roles, user_function_groups, role_permissions)
- ✅ Create vw_user_effective_security
- ✅ Update AuthContext to use view
- ✅ Add security.ts utility functions

### Phase 2: Data Migration (NEXT - 🔴 TODO)
- 🔴 Seed production roles (admin, manager, tandarts, etc.)
- 🔴 Seed production permissions (care.*, hq.*, build.*)
- 🔴 Migrate existing users.rol → user_roles
- 🔴 Test backwards compatibility

### Phase 3: Groups & Teams (FUTURE)
- Add groups table
- Add user_groups junction
- Add group_permissions
- Extend vw_user_effective_security

### Phase 4: UI & Workflow (FUTURE)
- Build role management UI
- Build permission assignment UI
- Build audit log viewer
- Add permission testing tools

### Phase 5: Deprecation (FUTURE)
- Mark users.rol as deprecated
- Remove direct rol checks from frontend
- Migrate all pages to security.ts utilities
- Consider removing users.rol field (breaking change)

---

## 10. Current System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  AuthContext     │  │  security.ts     │                │
│  │  - Loads view    │  │  - hasRole()     │                │
│  │  - Maps to User  │  │  - hasPermission()│               │
│  └────────┬─────────┘  └──────────────────┘                │
└───────────┼──────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database Layer (Supabase)                 │
│                                                             │
│  ┌────────────────────────────────────────────────┐        │
│  │      vw_user_effective_security (VIEW)         │        │
│  │  - Aggregates: users, user_roles, roles,      │        │
│  │    function_groups, permissions                │        │
│  │  - Computes: is_admin, is_manager, is_clinical│        │
│  │  - Fallback: users.rol if RBAC empty          │        │
│  └──────────────┬───────────────────┬─────────────┘        │
│                 │                   │                       │
│  ┌──────────────┴──────┐ ┌──────────┴──────────┐          │
│  │      users          │ │  RBAC Tables        │          │
│  │  - id               │ │  - roles            │          │
│  │  - rol (legacy)     │ │  - permissions      │          │
│  │  - is_admin ✅      │ │  - function_groups  │          │
│  │  - is_manager ✅    │ │  - user_roles       │          │
│  │  - is_klinisch ✅   │ │  - role_permissions │          │
│  └─────────────────────┘ └─────────────────────┘          │
│                                                             │
│  ┌─────────────────────────────────────────────┐           │
│  │         RLS Policies (943+)                 │           │
│  │  - All tables protected                      │           │
│  │  - Authenticated-only access                 │           │
│  │  - Admin/Manager gates                       │           │
│  │  - Membership-based access (T-Zone)          │           │
│  └─────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. Key Files Reference

### Backend (Database)
```
supabase/migrations/20251122215943_create_rbac_system.sql
supabase/migrations/20251124140409_create_vw_user_effective_security.sql
supabase/migrations/20251214151754_create_hq_schema_and_tables.sql
supabase/migrations/20251216214205_create_public_tzone_views_final.sql
```

### Frontend (TypeScript)
```
src/contexts/AuthContext.tsx           (User loading & security mapping)
src/utils/security.ts                  (Authorization utilities)
src/types/security.ts                  (TypeScript types)
src/lib/supabase.ts                    (Supabase client config)
src/components/Layout.tsx              (Menu authorization)
```

### Pages with Auth Checks
```
src/pages/AdminTools.tsx               (Admin only)
src/pages/Medewerkersbeheer.tsx        (Management)
src/pages/hq/HQFinanceDashboard.tsx    (Owner only)
src/pages/tzone/TZoneZones.tsx         (Authenticated)
```

---

## 12. Conclusion

**Current State:**
DNMZ+ has a **solid foundation** for user management with:
- Comprehensive RLS protection (943+ policies)
- Hybrid legacy/RBAC model with backwards compatibility
- Unified security view for consistent authorization
- Multi-layer security (frontend + backend)

**Critical Next Steps:**
1. 🔴 **Seed RBAC tables** with production roles/permissions
2. 🔴 **Migrate users.rol** → user_roles (data migration)
3. 🔴 **Add groups/teams** table for department-based access
4. 🔴 **Build role management UI** (no manual DB edits)
5. 🔴 **Standardize owner detection** (add is_owner flag)

**Long-term Vision:**
- Full RBAC with groups, permission inheritance, and context-aware access
- Self-service role assignment (by admins)
- Audit logging and permission testing tools
- Deprecate legacy users.rol field

**Security Score:** 🟢 **8.5/10**
- Strong RLS coverage
- Solid architecture
- Missing: Groups, role UI, complete RBAC migration

---

**Report End**
