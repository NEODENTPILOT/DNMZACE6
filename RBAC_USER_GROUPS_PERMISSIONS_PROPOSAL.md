# RBAC User Groups + Permissions Design Proposal
## DNMZ+ Assist 3.0 - Complete Authorization System

**Date:** 2024-12-19
**Status:** PROPOSAL - Ready for Implementation
**Based On:** USER_MANAGEMENT_DB_AUDIT_REPORT.md

---

## Executive Summary

This proposal extends the existing RBAC foundation with:
1. **User Groups** (teams, departments, locations)
2. **Granular Permissions** per module (CRUD + Approve)
3. **Group-based access control** (users inherit permissions via groups)
4. **Backwards compatible** migration path
5. **Simple frontend helper**: `can(permission)` for all authorization checks

**Recommendation:** ✅ **Option B - Role + Permission Join Tables** (already partially exists, extend with groups)

---

## 1. User Groups Definition

### 1.1 Organizational Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                        SuperOwner                           │
│                    (Praktijkhouder)                         │
│  - Full system access                                       │
│  - Finance module                                           │
│  - Strategic planning                                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼────────┐         ┌────────▼────────┐
│  SuperAdmin    │         │    Manager      │
│  - All modules │         │  - Operations   │
│  - User mgmt   │         │  - Team mgmt    │
│  - Config      │         │  - Reports      │
└───────┬────────┘         └────────┬────────┘
        │                           │
        └───────────┬───────────────┘
                    │
        ┌───────────┴────────────────────────────────┐
        │                                            │
┌───────▼────────┐  ┌──────────────┐  ┌─────────────▼────────┐
│   Clinical     │  │ Front Office │  │   Back Office        │
│   Staff        │  │              │  │                      │
│  - Tandarts    │  │ - Balie      │  │ - Admin support      │
│  - MH          │  │ - Triage     │  │ - HR admin           │
│  - Assistent   │  │ - Planning   │  │ - Inventory          │
└────────────────┘  └──────────────┘  └──────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐
│ Technical Department │  │ Viewer (Read-Only)   │
│  - Maintenance       │  │  - Auditors          │
│  - Equipment         │  │  - Consultants       │
│  - Repairs           │  │  - Temp staff        │
└──────────────────────┘  └──────────────────────┘
```

---

### 1.2 Group Definitions

| Group ID | Group Name | Description | Parent Group | Default Permissions Level |
|----------|------------|-------------|--------------|---------------------------|
| `owner` | SuperOwner | Practice owner(s) | - | ALL |
| `superadmin` | SuperAdmin | Technical admin, full access | - | ALL (except finance) |
| `manager` | Manager | Practice manager, operational control | - | HIGH |
| `clinical_tandarts` | Tandarts | Dentist - clinical operations | `clinical_staff` | CLINICAL_FULL |
| `clinical_mh` | Mondhygiënist | Dental hygienist | `clinical_staff` | CLINICAL_LIMITED |
| `clinical_assist` | Assistent | Dental assistant | `clinical_staff` | CLINICAL_SUPPORT |
| `front_office` | Front Office | Reception, triage, scheduling | - | FRONT_DESK |
| `back_office` | Back Office | Admin support, HR, inventory | - | OPERATIONS |
| `technical` | Technical Dept | Maintenance, equipment, IT | - | MAINTENANCE |
| `viewer` | Read-Only Viewer | Auditors, consultants, temp staff | - | READ_ONLY |

---

## 2. Permissions Per Module (CRUD + Approve)

### 2.1 Permission Structure

Each permission follows the pattern: `{module}.{resource}.{action}`

**Actions:**
- `read` - View data
- `create` - Create new records
- `update` - Edit existing records
- `delete` - Delete records
- `approve` - Approve/sign-off on records (clinical, financial)
- `admin` - Full module administration

---

### 2.2 Module Permission Matrix

#### T-ZONE+ Module

| Permission Code | Description | Read | Create | Update | Delete | Approve |
|-----------------|-------------|------|--------|--------|--------|---------|
| `tzone.zones.read` | View zones | ✅ | - | - | - | - |
| `tzone.zones.create` | Create new zones | - | ✅ | - | - | - |
| `tzone.zones.update` | Edit zone settings | - | - | ✅ | - | - |
| `tzone.zones.delete` | Delete zones | - | - | - | ✅ | - |
| `tzone.zones.admin` | Full zone management | ✅ | ✅ | ✅ | ✅ | - |
| `tzone.posts.read` | View posts in zones | ✅ | - | - | - | - |
| `tzone.posts.create` | Create posts | - | ✅ | - | - | - |
| `tzone.posts.update` | Edit own posts | - | - | ✅ | - | - |
| `tzone.posts.delete` | Delete own posts | - | - | - | ✅ | - |
| `tzone.posts.moderate` | Moderate all posts | - | - | ✅ | ✅ | - |
| `tzone.hr_compliance.read` | View HR compliance docs | ✅ | - | - | - | - |
| `tzone.hr_compliance.update` | Update compliance status | - | - | ✅ | - | - |

---

#### HQ+ Module

| Permission Code | Description | Read | Create | Update | Delete | Approve |
|-----------------|-------------|------|--------|--------|--------|---------|
| `hq.employees.read` | View employee data | ✅ | - | - | - | - |
| `hq.employees.create` | Add new employees | - | ✅ | - | - | - |
| `hq.employees.update` | Edit employee data | - | - | ✅ | - | - |
| `hq.employees.delete` | Deactivate employees | - | - | - | ✅ | - |
| `hq.skills.read` | View skills & bekwaamheden | ✅ | - | - | - | - |
| `hq.skills.assign` | Assign skills to employees | - | ✅ | ✅ | - | ✅ |
| `hq.documents.read` | View HR documents | ✅ | - | - | - | - |
| `hq.documents.read_confidential` | View confidential docs | ✅ | - | - | - | - |
| `hq.documents.create` | Upload documents | - | ✅ | - | - | - |
| `hq.documents.approve` | Approve/sign documents | - | - | - | - | ✅ |
| `hq.roster.read` | View rosters | ✅ | - | - | - | - |
| `hq.roster.create` | Create/edit rosters | - | ✅ | ✅ | - | - |
| `hq.roster.approve` | Approve rosters | - | - | - | - | ✅ |
| `hq.venues.read` | View locations/venues | ✅ | - | - | - | - |
| `hq.venues.update` | Edit venue settings | - | - | ✅ | - | - |
| `hq.finance.read` | View financial data | ✅ | - | - | - | - |
| `hq.finance.update` | Edit financial data | - | - | ✅ | - | - |
| `hq.finance.approve` | Approve financial transactions | - | - | - | - | ✅ |

---

#### CARE+ Module

| Permission Code | Description | Read | Create | Update | Delete | Approve |
|-----------------|-------------|------|--------|--------|--------|---------|
| `care.notes.read` | View clinical notes | ✅ | - | - | - | - |
| `care.notes.create` | Create clinical notes | - | ✅ | - | - | - |
| `care.notes.update` | Edit own notes | - | - | ✅ | - | - |
| `care.notes.update_any` | Edit any notes | - | - | ✅ | - | - |
| `care.notes.approve` | Sign-off clinical notes | - | - | - | - | ✅ |
| `care.prescriptions.read` | View prescriptions | ✅ | - | - | - | - |
| `care.prescriptions.create` | Write prescriptions | - | ✅ | - | - | - |
| `care.prescriptions.update` | Edit prescriptions | - | - | ✅ | - | - |
| `care.triage.read` | View triage queue | ✅ | - | - | - | - |
| `care.triage.create` | Create triage entries | - | ✅ | ✅ | - | - |

---

#### D-ICE+ Module

| Permission Code | Description | Read | Create | Update | Delete | Approve |
|-----------------|-------------|------|--------|--------|--------|---------|
| `ice.patients.read` | View patient data | ✅ | - | - | - | - |
| `ice.patients.create` | Register new patients | - | ✅ | - | - | - |
| `ice.patients.update` | Edit patient data | - | - | ✅ | - | - |
| `ice.status_praesens.read` | View status praesens | ✅ | - | - | - | - |
| `ice.status_praesens.update` | Update status praesens | - | - | ✅ | - | - |
| `ice.treatment_plans.read` | View treatment plans | ✅ | - | - | - | - |
| `ice.treatment_plans.create` | Create treatment plans | - | ✅ | - | - | - |
| `ice.treatment_plans.update` | Edit treatment plans | - | - | ✅ | - | - |
| `ice.treatment_plans.approve` | Approve treatment plans | - | - | - | - | ✅ |
| `ice.budgets.read` | View budgets/begrotingen | ✅ | - | - | - | - |
| `ice.budgets.create` | Create budgets | - | ✅ | - | - | - |
| `ice.budgets.update` | Edit budgets | - | - | ✅ | - | - |
| `ice.budgets.approve` | Approve budgets | - | - | - | - | ✅ |

---

#### AIR+ (Inventory) Module

| Permission Code | Description | Read | Create | Update | Delete | Approve |
|-----------------|-------------|------|--------|--------|--------|---------|
| `inventory.items.read` | View inventory items | ✅ | - | - | - | - |
| `inventory.items.update` | Edit stock levels | - | - | ✅ | - | - |
| `inventory.orders.read` | View orders | ✅ | - | - | - | - |
| `inventory.orders.create` | Create purchase orders | - | ✅ | - | - | - |
| `inventory.orders.approve` | Approve orders | - | - | - | - | ✅ |
| `inventory.implants.read` | View implants inventory | ✅ | - | - | - | - |
| `inventory.implants.update` | Update implants stock | - | - | ✅ | - | - |
| `inventory.biomaterials.read` | View biomaterials | ✅ | - | - | - | - |
| `inventory.biomaterials.update` | Update biomaterials stock | - | - | ✅ | - | - |

---

#### Maintenance Module

| Permission Code | Description | Read | Create | Update | Delete | Approve |
|-----------------|-------------|------|--------|--------|--------|---------|
| `maintenance.incidents.read` | View maintenance incidents | ✅ | - | - | - | - |
| `maintenance.incidents.create` | Report new incidents | - | ✅ | - | - | - |
| `maintenance.incidents.update` | Update incident status | - | - | ✅ | - | - |
| `maintenance.incidents.close` | Close/resolve incidents | - | - | - | ✅ | - |
| `maintenance.equipment.read` | View equipment inventory | ✅ | - | - | - | - |
| `maintenance.equipment.update` | Update equipment data | - | - | ✅ | - | - |
| `maintenance.schedule.read` | View maintenance schedule | ✅ | - | - | - | - |
| `maintenance.schedule.update` | Edit maintenance schedule | - | - | ✅ | - | - |

---

#### BUILD+ (Templates/Protocols) Module

| Permission Code | Description | Read | Create | Update | Delete | Approve |
|-----------------|-------------|------|--------|--------|--------|---------|
| `build.protocols.read` | View protocols | ✅ | - | - | - | - |
| `build.protocols.create` | Create protocols | - | ✅ | - | - | - |
| `build.protocols.update` | Edit protocols | - | - | ✅ | - | - |
| `build.protocols.publish` | Publish protocols | - | - | - | - | ✅ |
| `build.templates.read` | View templates | ✅ | - | - | - | - |
| `build.templates.create` | Create templates | - | ✅ | - | - | - |
| `build.templates.update` | Edit templates | - | - | ✅ | - | - |
| `build.templates.publish` | Publish templates | - | - | - | - | ✅ |
| `build.ice_templates.read` | View ICE templates | ✅ | - | - | - | - |
| `build.ice_templates.update` | Edit ICE templates | - | - | ✅ | - | - |

---

#### C-BUDDY+ (Checklists) Module

| Permission Code | Description | Read | Create | Update | Delete | Approve |
|-----------------|-------------|------|--------|--------|--------|---------|
| `checklists.instances.read` | View checklist instances | ✅ | - | - | - | - |
| `checklists.instances.create` | Start new checklists | - | ✅ | - | - | - |
| `checklists.instances.update` | Complete checklist items | - | - | ✅ | - | - |
| `checklists.templates.read` | View checklist templates | ✅ | - | - | - | - |
| `checklists.templates.update` | Edit templates | - | - | ✅ | - | - |
| `checklists.master.read` | View master checklists | ✅ | - | - | - | - |
| `checklists.master.update` | Edit master checklists | - | - | ✅ | - | - |

---

#### BEHEER (Settings) Module

| Permission Code | Description | Read | Create | Update | Delete | Approve |
|-----------------|-------------|------|--------|--------|--------|---------|
| `settings.system.read` | View system settings | ✅ | - | - | - | - |
| `settings.system.update` | Edit system settings | - | - | ✅ | - | - |
| `settings.users.read` | View user management | ✅ | - | - | - | - |
| `settings.users.create` | Create users | - | ✅ | - | - | - |
| `settings.users.update` | Edit users | - | - | ✅ | - | - |
| `settings.users.delete` | Deactivate users | - | - | - | ✅ | - |
| `settings.roles.read` | View roles & permissions | ✅ | - | - | - | - |
| `settings.roles.update` | Manage roles & permissions | - | - | ✅ | - | - |
| `settings.groups.read` | View groups | ✅ | - | - | - | - |
| `settings.groups.update` | Manage groups | - | - | ✅ | - | - |

---

## 3. Group × Module Permission Matrix

### 3.1 SuperOwner

| Module | Permissions |
|--------|-------------|
| **ALL** | ALL permissions (wildcard: `*`) |
| **HQ Finance** | `hq.finance.*` |
| **Settings** | `settings.*` |

---

### 3.2 SuperAdmin

| Module | Permissions |
|--------|-------------|
| T-ZONE+ | `tzone.zones.admin`, `tzone.posts.moderate`, `tzone.hr_compliance.*` |
| HQ+ | `hq.employees.*`, `hq.skills.*`, `hq.documents.*`, `hq.roster.*`, `hq.venues.*` |
| CARE+ | `care.notes.read`, `care.notes.update_any`, `care.prescriptions.read`, `care.triage.*` |
| D-ICE+ | `ice.patients.*`, `ice.status_praesens.*`, `ice.treatment_plans.*`, `ice.budgets.*` |
| AIR+ | `inventory.*` |
| Maintenance | `maintenance.*` |
| BUILD+ | `build.*` |
| C-BUDDY+ | `checklists.*` |
| BEHEER | `settings.system.*`, `settings.users.*`, `settings.roles.*`, `settings.groups.*` |
| **Excluded** | `hq.finance.*` (owner only) |

---

### 3.3 Manager

| Module | Permissions |
|--------|-------------|
| T-ZONE+ | `tzone.zones.read`, `tzone.posts.read`, `tzone.posts.create`, `tzone.hr_compliance.read` |
| HQ+ | `hq.employees.read`, `hq.employees.update`, `hq.skills.read`, `hq.skills.assign`, `hq.documents.read`, `hq.roster.*`, `hq.venues.read` |
| CARE+ | `care.notes.read`, `care.triage.read` |
| D-ICE+ | `ice.patients.read`, `ice.treatment_plans.read`, `ice.budgets.read`, `ice.budgets.approve` |
| AIR+ | `inventory.*.read`, `inventory.orders.create`, `inventory.orders.approve` |
| Maintenance | `maintenance.incidents.read`, `maintenance.incidents.update`, `maintenance.schedule.read` |
| BUILD+ | `build.protocols.read`, `build.templates.read`, `build.protocols.publish`, `build.templates.publish` |
| C-BUDDY+ | `checklists.instances.read`, `checklists.templates.read` |
| BEHEER | `settings.system.read`, `settings.users.read` |

---

### 3.4 Tandarts (Dentist)

| Module | Permissions |
|--------|-------------|
| T-ZONE+ | `tzone.zones.read`, `tzone.posts.read`, `tzone.posts.create`, `tzone.posts.update` (own), `tzone.posts.delete` (own) |
| HQ+ | `hq.employees.read`, `hq.skills.read`, `hq.roster.read` |
| CARE+ | `care.notes.*`, `care.prescriptions.*`, `care.triage.read` |
| D-ICE+ | `ice.patients.*`, `ice.status_praesens.*`, `ice.treatment_plans.*`, `ice.budgets.*` |
| AIR+ | `inventory.implants.read`, `inventory.implants.update`, `inventory.biomaterials.read`, `inventory.biomaterials.update` |
| Maintenance | `maintenance.incidents.read`, `maintenance.incidents.create` |
| BUILD+ | `build.protocols.read`, `build.templates.read`, `build.ice_templates.read` |
| C-BUDDY+ | `checklists.instances.*`, `checklists.templates.read` |

---

### 3.5 Mondhygiënist (Dental Hygienist)

| Module | Permissions |
|--------|-------------|
| T-ZONE+ | `tzone.zones.read`, `tzone.posts.read`, `tzone.posts.create` |
| HQ+ | `hq.employees.read`, `hq.roster.read` |
| CARE+ | `care.notes.read`, `care.notes.create`, `care.notes.update` (own), `care.prescriptions.read` |
| D-ICE+ | `ice.patients.read`, `ice.patients.update`, `ice.status_praesens.read`, `ice.status_praesens.update`, `ice.treatment_plans.read` |
| AIR+ | `inventory.*.read` |
| Maintenance | `maintenance.incidents.read`, `maintenance.incidents.create` |
| BUILD+ | `build.protocols.read`, `build.templates.read` |
| C-BUDDY+ | `checklists.instances.*`, `checklists.templates.read` |

---

### 3.6 Assistent (Dental Assistant)

| Module | Permissions |
|--------|-------------|
| T-ZONE+ | `tzone.zones.read`, `tzone.posts.read`, `tzone.posts.create` |
| HQ+ | `hq.employees.read`, `hq.roster.read` |
| CARE+ | `care.notes.read`, `care.triage.read`, `care.triage.create` |
| D-ICE+ | `ice.patients.read`, `ice.status_praesens.read` |
| AIR+ | `inventory.*.read`, `inventory.*.update` |
| Maintenance | `maintenance.incidents.read`, `maintenance.incidents.create` |
| BUILD+ | `build.protocols.read` |
| C-BUDDY+ | `checklists.instances.read`, `checklists.instances.create`, `checklists.instances.update` |

---

### 3.7 Front Office

| Module | Permissions |
|--------|-------------|
| T-ZONE+ | `tzone.zones.read`, `tzone.posts.read` |
| HQ+ | `hq.employees.read`, `hq.roster.read` |
| CARE+ | `care.triage.*`, `care.notes.read` |
| D-ICE+ | `ice.patients.read`, `ice.patients.create`, `ice.patients.update` |
| AIR+ | `inventory.*.read` |
| Maintenance | `maintenance.incidents.read`, `maintenance.incidents.create` |
| BUILD+ | `build.protocols.read` |
| C-BUDDY+ | `checklists.instances.read` |

---

### 3.8 Back Office

| Module | Permissions |
|--------|-------------|
| T-ZONE+ | `tzone.zones.read`, `tzone.posts.read`, `tzone.hr_compliance.read` |
| HQ+ | `hq.employees.read`, `hq.employees.create`, `hq.employees.update`, `hq.skills.read`, `hq.documents.read`, `hq.documents.create`, `hq.roster.read` |
| CARE+ | `care.notes.read` |
| D-ICE+ | `ice.patients.read`, `ice.budgets.read` |
| AIR+ | `inventory.*` |
| Maintenance | `maintenance.incidents.read` |
| BUILD+ | `build.protocols.read`, `build.templates.read` |
| C-BUDDY+ | `checklists.instances.read` |

---

### 3.9 Technical Department

| Module | Permissions |
|--------|-------------|
| T-ZONE+ | `tzone.zones.read`, `tzone.posts.read` |
| HQ+ | `hq.employees.read`, `hq.venues.read`, `hq.venues.update` |
| AIR+ | `inventory.equipment.read`, `inventory.equipment.update` |
| Maintenance | `maintenance.*` |
| BUILD+ | `build.protocols.read` |
| C-BUDDY+ | `checklists.instances.read`, `checklists.templates.read` |

---

### 3.10 Viewer (Read-Only)

| Module | Permissions |
|--------|-------------|
| T-ZONE+ | `tzone.zones.read`, `tzone.posts.read` |
| HQ+ | `hq.employees.read`, `hq.roster.read` |
| CARE+ | `care.notes.read` (non-sensitive) |
| D-ICE+ | `ice.patients.read` (anonymized), `ice.treatment_plans.read` |
| AIR+ | `inventory.*.read` |
| Maintenance | `maintenance.incidents.read` |
| BUILD+ | `build.protocols.read`, `build.templates.read` |
| C-BUDDY+ | `checklists.instances.read`, `checklists.templates.read` |

---

## 4. Storage Recommendation

### ✅ **Option B - Role + Permission Join Tables (RECOMMENDED)**

**Why:**
- Already partially implemented in existing schema
- Scalable and flexible
- Industry standard (RBAC best practice)
- Supports complex permission inheritance
- Easy to audit and manage
- No schema changes when adding new permissions

**Architecture:**
```
users ──┬──> user_groups ──> groups ──> group_permissions ──> permissions
        └──> user_roles ───> roles ───> role_permissions ──> permissions
```

**Benefits:**
- ✅ Users can belong to multiple groups
- ✅ Groups can have custom permissions
- ✅ Roles define functional capabilities
- ✅ Clear separation of concerns
- ✅ Easy to implement `can(permission)` helper
- ✅ Backend RLS can query efficiently

---

## 5. Database Schema Addition

### 5.1 New Tables

```sql
-- =====================================================
-- 1. GROUPS TABLE (Teams, Departments, Locations)
-- =====================================================

CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,                    -- 'owner', 'manager', 'tandarts'
  name text NOT NULL,                          -- 'SuperOwner', 'Manager', 'Tandarts'
  description text,
  group_type text DEFAULT 'functional',        -- 'functional', 'department', 'location', 'project'
  parent_group_id uuid REFERENCES groups(id),  -- Hierarchy support
  locatie_id uuid,                             -- Optional: location scoping
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_groups_key ON groups(key);
CREATE INDEX IF NOT EXISTS idx_groups_type ON groups(group_type);
CREATE INDEX IF NOT EXISTS idx_groups_parent ON groups(parent_group_id);

COMMENT ON TABLE groups IS
'User groups for team/department-based access control.
Supports hierarchy via parent_group_id.';

-- =====================================================
-- 2. USER GROUP MEMBERSHIPS (M:N junction)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_group_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  role_in_group text DEFAULT 'member',         -- 'member', 'moderator', 'admin'
  is_primary boolean DEFAULT false,            -- Primary group for user
  granted_by uuid REFERENCES users(id),
  granted_at timestamptz DEFAULT now(),
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,                     -- Optional: temporary access
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_ugm_user ON user_group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_ugm_group ON user_group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_ugm_valid ON user_group_memberships(valid_from, valid_until);

COMMENT ON TABLE user_group_memberships IS
'M:N junction between users and groups.
Supports temporary access via valid_from/valid_until.';

-- =====================================================
-- 3. GROUP PERMISSIONS (M:N junction)
-- =====================================================

CREATE TABLE IF NOT EXISTS group_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  allowed boolean DEFAULT true,                -- true = grant, false = deny (explicit deny)
  resource_filter jsonb,                       -- Optional: scope permission to specific resources
  granted_by uuid REFERENCES users(id),
  granted_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_gp_group ON group_permissions(group_id);
CREATE INDEX IF NOT EXISTS idx_gp_permission ON group_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_gp_allowed ON group_permissions(allowed);

COMMENT ON TABLE group_permissions IS
'M:N junction between groups and permissions.
Defines which permissions are granted to each group.';

-- =====================================================
-- 4. EXTEND EXISTING PERMISSIONS TABLE
-- =====================================================

-- Add wildcard support and permission hierarchy
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS
  is_wildcard boolean DEFAULT false;

ALTER TABLE permissions ADD COLUMN IF NOT EXISTS
  parent_permission_id uuid REFERENCES permissions(id);

CREATE INDEX IF NOT EXISTS idx_permissions_wildcard ON permissions(is_wildcard);
CREATE INDEX IF NOT EXISTS idx_permissions_parent ON permissions(parent_permission_id);

COMMENT ON COLUMN permissions.is_wildcard IS
'True if permission is a wildcard (e.g., "care.*" grants all care permissions)';

COMMENT ON COLUMN permissions.parent_permission_id IS
'Parent permission for hierarchy (e.g., "care.notes.update" inherits from "care.notes")';

-- =====================================================
-- 5. AUDIT LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,                    -- 'permission_granted', 'permission_denied', 'role_assigned', etc.
  user_id uuid REFERENCES users(id),
  target_user_id uuid REFERENCES users(id),    -- For events affecting another user
  resource_type text,                          -- 'permission', 'role', 'group'
  resource_id uuid,
  action text,                                 -- 'grant', 'revoke', 'check', 'deny'
  permission_code text,
  details jsonb,                               -- Additional context
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_target ON security_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_event ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_created ON security_audit_log(created_at DESC);

COMMENT ON TABLE security_audit_log IS
'Audit trail for all security-related events.
Use for compliance, debugging, and security monitoring.';
```

---

### 5.2 RLS Policies

```sql
-- =====================================================
-- RLS POLICIES FOR NEW TABLES
-- =====================================================

-- GROUPS TABLE
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active groups"
  ON groups FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage groups"
  ON groups FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- USER GROUP MEMBERSHIPS
ALTER TABLE user_group_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own group memberships"
  ON user_group_memberships FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "All authenticated users can view public memberships"
  ON user_group_memberships FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = user_group_memberships.group_id
      AND g.is_active = true
    )
  );

CREATE POLICY "Admins and managers can manage memberships"
  ON user_group_memberships FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND (is_admin = true OR is_manager = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND (is_admin = true OR is_manager = true)
    )
  );

-- GROUP PERMISSIONS
ALTER TABLE group_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view group permissions"
  ON group_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage group permissions"
  ON group_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- SECURITY AUDIT LOG
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit log"
  ON security_audit_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR target_user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs"
  ON security_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "System can insert audit logs"
  ON security_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

---

### 5.3 Helper Views

```sql
-- =====================================================
-- VIEW: User Effective Groups (Direct + Inherited)
-- =====================================================

CREATE OR REPLACE VIEW vw_user_effective_groups AS
WITH RECURSIVE group_hierarchy AS (
  -- Direct memberships
  SELECT
    ugm.user_id,
    g.id AS group_id,
    g.key,
    g.name,
    g.group_type,
    g.parent_group_id,
    0 AS depth,
    ugm.role_in_group
  FROM user_group_memberships ugm
  JOIN groups g ON g.id = ugm.group_id
  WHERE ugm.valid_from <= now()
    AND (ugm.valid_until IS NULL OR ugm.valid_until > now())
    AND g.is_active = true

  UNION ALL

  -- Parent groups (inherit from child)
  SELECT
    gh.user_id,
    g.id AS group_id,
    g.key,
    g.name,
    g.group_type,
    g.parent_group_id,
    gh.depth + 1,
    gh.role_in_group
  FROM group_hierarchy gh
  JOIN groups g ON g.id = gh.parent_group_id
  WHERE g.is_active = true
    AND gh.depth < 10  -- Prevent infinite recursion
)
SELECT DISTINCT
  user_id,
  group_id,
  key AS group_key,
  name AS group_name,
  group_type,
  depth,
  role_in_group
FROM group_hierarchy
ORDER BY user_id, depth, group_name;

GRANT SELECT ON vw_user_effective_groups TO authenticated;

COMMENT ON VIEW vw_user_effective_groups IS
'Flattened view of all groups a user belongs to, including inherited parent groups.';

-- =====================================================
-- VIEW: User Effective Permissions (Groups + Roles)
-- =====================================================

CREATE OR REPLACE VIEW vw_user_effective_permissions AS
WITH user_group_perms AS (
  -- Permissions from groups
  SELECT DISTINCT
    ugm.user_id,
    p.code AS permission_code,
    p.name AS permission_name,
    p.module,
    p.category,
    'group' AS source,
    g.name AS source_name
  FROM user_group_memberships ugm
  JOIN groups g ON g.id = ugm.group_id
  JOIN group_permissions gp ON gp.group_id = g.id
  JOIN permissions p ON p.id = gp.permission_id
  WHERE ugm.valid_from <= now()
    AND (ugm.valid_until IS NULL OR ugm.valid_until > now())
    AND g.is_active = true
    AND gp.allowed = true
),
user_role_perms AS (
  -- Permissions from roles
  SELECT DISTINCT
    ur.user_id,
    p.code AS permission_code,
    p.name AS permission_name,
    p.module,
    p.category,
    'role' AS source,
    r.name AS source_name
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  JOIN role_permissions rp ON rp.role_id = r.id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE r.is_active = true
    AND rp.allowed = true
)
SELECT * FROM user_group_perms
UNION ALL
SELECT * FROM user_role_perms
ORDER BY user_id, permission_code;

GRANT SELECT ON vw_user_effective_permissions TO authenticated;

COMMENT ON VIEW vw_user_effective_permissions IS
'All effective permissions for each user from both groups and roles.';

-- =====================================================
-- VIEW: Enhanced User Effective Security (v2)
-- =====================================================

DROP VIEW IF EXISTS vw_user_effective_security CASCADE;

CREATE VIEW vw_user_effective_security AS
SELECT
  u.id AS user_id,
  u.naam,
  u.email,
  COALESCE(u.actief, true) AS actief,

  -- Compute is_admin (multi-source)
  COALESCE(
    u.is_admin,
    EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = u.id AND (r.level >= 90 OR LOWER(r.key) = 'admin')),
    EXISTS (SELECT 1 FROM user_group_memberships ugm JOIN groups g ON g.id = ugm.group_id
            WHERE ugm.user_id = u.id AND LOWER(g.key) IN ('superadmin', 'owner')),
    false
  ) AS is_admin,

  -- Compute is_manager
  COALESCE(
    u.is_manager,
    EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = u.id AND LOWER(r.key) IN ('manager', 'power_user')),
    EXISTS (SELECT 1 FROM user_group_memberships ugm JOIN groups g ON g.id = ugm.group_id
            WHERE ugm.user_id = u.id AND LOWER(g.key) = 'manager'),
    false
  ) AS is_manager,

  -- Compute is_owner (NEW)
  COALESCE(
    u.is_owner,
    EXISTS (SELECT 1 FROM user_group_memberships ugm JOIN groups g ON g.id = ugm.group_id
            WHERE ugm.user_id = u.id AND LOWER(g.key) = 'owner'),
    false
  ) AS is_owner,

  -- Compute is_clinical
  COALESCE(
    u.is_klinisch,
    EXISTS (SELECT 1 FROM user_function_groups ufg JOIN function_groups fg ON fg.id = ufg.function_group_id
            WHERE ufg.user_id = u.id AND fg.is_clinical = true),
    EXISTS (SELECT 1 FROM user_group_memberships ugm JOIN groups g ON g.id = ugm.group_id
            WHERE ugm.user_id = u.id AND LOWER(g.key) LIKE 'clinical_%'),
    false
  ) AS is_clinical,

  -- Aggregate groups
  COALESCE(
    (SELECT JSON_AGG(JSON_BUILD_OBJECT(
      'key', g.key,
      'name', g.name,
      'groupType', g.group_type,
      'roleInGroup', ugm.role_in_group
    ))
    FROM user_group_memberships ugm
    JOIN groups g ON g.id = ugm.group_id
    WHERE ugm.user_id = u.id
      AND ugm.valid_from <= now()
      AND (ugm.valid_until IS NULL OR ugm.valid_until > now())
      AND g.is_active = true
    ),
    '[]'::json
  ) AS groups_json,

  -- Aggregate roles (existing logic)
  COALESCE(
    (SELECT JSON_AGG(JSON_BUILD_OBJECT(
      'key', r.key,
      'name', r.name,
      'level', r.level,
      'isPrimary', ur.is_primary
    ) ORDER BY ur.is_primary DESC NULLS LAST, r.level DESC, r.name)
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = u.id AND r.is_active = true
    ),
    CASE WHEN u.rol IS NOT NULL THEN
      JSON_BUILD_ARRAY(JSON_BUILD_OBJECT(
        'key', LOWER(REPLACE(u.rol, ' ', '_')),
        'name', u.rol,
        'level', CASE u.rol
          WHEN 'Admin' THEN 100
          WHEN 'Manager' THEN 80
          WHEN 'Tandarts' THEN 60
          WHEN 'Mondhygiënist' THEN 50
          ELSE 30 END,
        'isPrimary', true
      ))
    ELSE '[]'::json END
  ) AS roles_json,

  -- Aggregate permissions (from groups AND roles)
  COALESCE(
    (SELECT JSON_AGG(DISTINCT jsonb_build_object(
      'code', vep.permission_code,
      'name', vep.permission_name,
      'module', vep.module,
      'category', vep.category,
      'source', vep.source
    ))
    FROM vw_user_effective_permissions vep
    WHERE vep.user_id = u.id
    ),
    '[]'::json
  ) AS permissions_json

FROM users u
WHERE u.actief IS NOT FALSE;

GRANT SELECT ON vw_user_effective_security TO authenticated;

COMMENT ON VIEW vw_user_effective_security IS
'Enhanced User 2.0 Effective Security View with groups support.
Consolidates users.rol, RBAC tables, groups, and boolean flags.
Used by AuthContext to load complete user security model.';
```

---

## 6. Migration SQL Draft

```sql
/*
  # RBAC User Groups + Permissions System

  ## Overview

  This migration extends the existing RBAC foundation with:
  - User Groups (teams, departments, locations)
  - Group-based permission assignments
  - Permission hierarchy and wildcards
  - Security audit logging
  - Enhanced security view with groups

  ## New Tables

  1. **groups** - Teams, departments, locations
  2. **user_group_memberships** - User membership in groups
  3. **group_permissions** - Permissions granted to groups
  4. **security_audit_log** - Security event logging

  ## Changes to Existing Tables

  - **permissions** - Add wildcard support and hierarchy
  - **vw_user_effective_security** - Rebuild with groups support

  ## Security

  - All tables have RLS enabled
  - Authenticated users can read groups/permissions
  - Only admins/managers can manage
  - Audit log tracks all security events

  ## Backwards Compatibility

  - ✅ No destructive changes
  - ✅ Existing roles/permissions still work
  - ✅ Legacy users.rol field still supported
  - ✅ All existing queries unchanged
*/

-- =====================================================
-- 1. CREATE GROUPS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  group_type text DEFAULT 'functional' CHECK (group_type IN ('functional', 'department', 'location', 'project')),
  parent_group_id uuid REFERENCES groups(id),
  locatie_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_groups_key ON groups(key);
CREATE INDEX IF NOT EXISTS idx_groups_type ON groups(group_type);
CREATE INDEX IF NOT EXISTS idx_groups_parent ON groups(parent_group_id);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active groups"
  ON groups FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage groups"
  ON groups FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- =====================================================
-- 2. CREATE USER GROUP MEMBERSHIPS
-- =====================================================

CREATE TABLE IF NOT EXISTS user_group_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  role_in_group text DEFAULT 'member' CHECK (role_in_group IN ('member', 'moderator', 'admin')),
  is_primary boolean DEFAULT false,
  granted_by uuid REFERENCES users(id),
  granted_at timestamptz DEFAULT now(),
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_ugm_user ON user_group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_ugm_group ON user_group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_ugm_valid ON user_group_memberships(valid_from, valid_until);

ALTER TABLE user_group_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own group memberships"
  ON user_group_memberships FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "All authenticated users can view public memberships"
  ON user_group_memberships FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM groups g WHERE g.id = user_group_memberships.group_id AND g.is_active = true));

CREATE POLICY "Admins and managers can manage memberships"
  ON user_group_memberships FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (is_admin = true OR is_manager = true)))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (is_admin = true OR is_manager = true)));

-- =====================================================
-- 3. CREATE GROUP PERMISSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS group_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  allowed boolean DEFAULT true,
  resource_filter jsonb,
  granted_by uuid REFERENCES users(id),
  granted_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_gp_group ON group_permissions(group_id);
CREATE INDEX IF NOT EXISTS idx_gp_permission ON group_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_gp_allowed ON group_permissions(allowed);

ALTER TABLE group_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view group permissions"
  ON group_permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage group permissions"
  ON group_permissions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- =====================================================
-- 4. EXTEND PERMISSIONS TABLE
-- =====================================================

ALTER TABLE permissions ADD COLUMN IF NOT EXISTS is_wildcard boolean DEFAULT false;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS parent_permission_id uuid REFERENCES permissions(id);

CREATE INDEX IF NOT EXISTS idx_permissions_wildcard ON permissions(is_wildcard);
CREATE INDEX IF NOT EXISTS idx_permissions_parent ON permissions(parent_permission_id);

-- =====================================================
-- 5. CREATE SECURITY AUDIT LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid REFERENCES users(id),
  target_user_id uuid REFERENCES users(id),
  resource_type text,
  resource_id uuid,
  action text,
  permission_code text,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_target ON security_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_event ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_created ON security_audit_log(created_at DESC);

ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit log"
  ON security_audit_log FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR target_user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs"
  ON security_audit_log FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "System can insert audit logs"
  ON security_audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- =====================================================
-- 6. CREATE HELPER VIEWS
-- =====================================================

-- View: User Effective Groups
CREATE OR REPLACE VIEW vw_user_effective_groups AS
WITH RECURSIVE group_hierarchy AS (
  SELECT
    ugm.user_id, g.id AS group_id, g.key, g.name, g.group_type,
    g.parent_group_id, 0 AS depth, ugm.role_in_group
  FROM user_group_memberships ugm
  JOIN groups g ON g.id = ugm.group_id
  WHERE ugm.valid_from <= now()
    AND (ugm.valid_until IS NULL OR ugm.valid_until > now())
    AND g.is_active = true
  UNION ALL
  SELECT gh.user_id, g.id, g.key, g.name, g.group_type,
    g.parent_group_id, gh.depth + 1, gh.role_in_group
  FROM group_hierarchy gh
  JOIN groups g ON g.id = gh.parent_group_id
  WHERE g.is_active = true AND gh.depth < 10
)
SELECT DISTINCT user_id, group_id, key AS group_key, name AS group_name,
  group_type, depth, role_in_group
FROM group_hierarchy
ORDER BY user_id, depth, group_name;

GRANT SELECT ON vw_user_effective_groups TO authenticated;

-- View: User Effective Permissions
CREATE OR REPLACE VIEW vw_user_effective_permissions AS
WITH user_group_perms AS (
  SELECT DISTINCT ugm.user_id, p.code AS permission_code, p.name AS permission_name,
    p.module, p.category, 'group' AS source, g.name AS source_name
  FROM user_group_memberships ugm
  JOIN groups g ON g.id = ugm.group_id
  JOIN group_permissions gp ON gp.group_id = g.id
  JOIN permissions p ON p.id = gp.permission_id
  WHERE ugm.valid_from <= now()
    AND (ugm.valid_until IS NULL OR ugm.valid_until > now())
    AND g.is_active = true AND gp.allowed = true
),
user_role_perms AS (
  SELECT DISTINCT ur.user_id, p.code AS permission_code, p.name AS permission_name,
    p.module, p.category, 'role' AS source, r.name AS source_name
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  JOIN role_permissions rp ON rp.role_id = r.id
  JOIN permissions p ON p.id = rp.permission_id
  WHERE r.is_active = true AND rp.allowed = true
)
SELECT * FROM user_group_perms
UNION ALL
SELECT * FROM user_role_perms
ORDER BY user_id, permission_code;

GRANT SELECT ON vw_user_effective_permissions TO authenticated;

-- =====================================================
-- 7. REBUILD vw_user_effective_security WITH GROUPS
-- =====================================================

DROP VIEW IF EXISTS vw_user_effective_security CASCADE;

CREATE VIEW vw_user_effective_security AS
SELECT
  u.id AS user_id, u.naam, u.email, COALESCE(u.actief, true) AS actief,

  COALESCE(
    u.is_admin,
    EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = u.id AND (r.level >= 90 OR LOWER(r.key) = 'admin')),
    EXISTS (SELECT 1 FROM user_group_memberships ugm JOIN groups g ON g.id = ugm.group_id
            WHERE ugm.user_id = u.id AND LOWER(g.key) IN ('superadmin', 'owner')),
    false
  ) AS is_admin,

  COALESCE(
    u.is_manager,
    EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = u.id AND LOWER(r.key) IN ('manager', 'power_user')),
    EXISTS (SELECT 1 FROM user_group_memberships ugm JOIN groups g ON g.id = ugm.group_id
            WHERE ugm.user_id = u.id AND LOWER(g.key) = 'manager'),
    false
  ) AS is_manager,

  COALESCE(
    u.is_owner,
    EXISTS (SELECT 1 FROM user_group_memberships ugm JOIN groups g ON g.id = ugm.group_id
            WHERE ugm.user_id = u.id AND LOWER(g.key) = 'owner'),
    false
  ) AS is_owner,

  COALESCE(
    u.is_klinisch,
    EXISTS (SELECT 1 FROM user_function_groups ufg JOIN function_groups fg ON fg.id = ufg.function_group_id
            WHERE ufg.user_id = u.id AND fg.is_clinical = true),
    EXISTS (SELECT 1 FROM user_group_memberships ugm JOIN groups g ON g.id = ugm.group_id
            WHERE ugm.user_id = u.id AND LOWER(g.key) LIKE 'clinical_%'),
    false
  ) AS is_clinical,

  COALESCE(
    (SELECT JSON_AGG(JSON_BUILD_OBJECT('key', g.key, 'name', g.name, 'groupType', g.group_type, 'roleInGroup', ugm.role_in_group))
    FROM user_group_memberships ugm JOIN groups g ON g.id = ugm.group_id
    WHERE ugm.user_id = u.id AND ugm.valid_from <= now()
      AND (ugm.valid_until IS NULL OR ugm.valid_until > now()) AND g.is_active = true),
    '[]'::json
  ) AS groups_json,

  COALESCE(
    (SELECT JSON_AGG(JSON_BUILD_OBJECT('key', r.key, 'name', r.name, 'level', r.level, 'isPrimary', ur.is_primary)
             ORDER BY ur.is_primary DESC NULLS LAST, r.level DESC, r.name)
    FROM user_roles ur JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = u.id AND r.is_active = true),
    CASE WHEN u.rol IS NOT NULL THEN
      JSON_BUILD_ARRAY(JSON_BUILD_OBJECT('key', LOWER(REPLACE(u.rol, ' ', '_')), 'name', u.rol,
        'level', CASE u.rol WHEN 'Admin' THEN 100 WHEN 'Manager' THEN 80 WHEN 'Tandarts' THEN 60 WHEN 'Mondhygiënist' THEN 50 ELSE 30 END,
        'isPrimary', true))
    ELSE '[]'::json END
  ) AS roles_json,

  COALESCE(
    (SELECT JSON_AGG(DISTINCT jsonb_build_object('code', vep.permission_code, 'name', vep.permission_name,
      'module', vep.module, 'category', vep.category, 'source', vep.source))
    FROM vw_user_effective_permissions vep WHERE vep.user_id = u.id),
    '[]'::json
  ) AS permissions_json

FROM users u
WHERE u.actief IS NOT FALSE;

GRANT SELECT ON vw_user_effective_security TO authenticated;

COMMENT ON VIEW vw_user_effective_security IS
'Enhanced User 2.0 Effective Security View with groups support.';
```

---

## 7. Frontend Implementation Plan

### 7.1 Update TypeScript Types

**File:** `src/types/security.ts`

```typescript
// Add group types
export interface EffectiveGroup {
  key: string;
  name: string;
  groupType: 'functional' | 'department' | 'location' | 'project';
  roleInGroup: 'member' | 'moderator' | 'admin';
}

export interface EffectiveSecurity {
  userId: string;
  isActive: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isOwner: boolean;  // NEW
  isClinical: boolean;

  primaryRole?: EffectiveRole;
  roles: EffectiveRole[];
  groups: EffectiveGroup[];  // NEW
  permissions: EffectivePermission[];
}

export interface UserEffectiveSecurityView {
  user_id: string;
  naam: string;
  email: string;
  actief: boolean;
  is_admin: boolean;
  is_manager: boolean;
  is_owner: boolean;  // NEW
  is_clinical: boolean;
  groups_json: EffectiveGroup[] | null;  // NEW
  roles_json: EffectiveRole[] | null;
  permissions_json: EffectivePermission[] | null;
}
```

---

### 7.2 Create `can()` Helper Function

**File:** `src/utils/permissions.ts` (NEW)

```typescript
import type { EffectiveSecurity } from '../types/security';

/**
 * Check if user has a specific permission
 *
 * @param sec - EffectiveSecurity object from user.security
 * @param permissionCode - Permission code (e.g., 'care.notes.create')
 * @returns true if user has the permission
 *
 * @example
 * if (can(user?.security, 'care.notes.create')) {
 *   // User can create clinical notes
 * }
 */
export function can(
  sec: EffectiveSecurity | undefined | null,
  permissionCode: string
): boolean {
  if (!sec || !sec.isActive) return false;

  // SuperOwner has ALL permissions
  if (sec.isOwner) return true;

  const normalizedCode = permissionCode.toLowerCase().trim();

  // Check exact permission match
  const hasExact = sec.permissions.some(
    (perm) => perm.code.toLowerCase() === normalizedCode
  );
  if (hasExact) return true;

  // Check wildcard permissions (e.g., "care.*" grants "care.notes.create")
  const parts = normalizedCode.split('.');
  for (let i = parts.length - 1; i > 0; i--) {
    const wildcardCode = parts.slice(0, i).join('.') + '.*';
    const hasWildcard = sec.permissions.some(
      (perm) => perm.code.toLowerCase() === wildcardcode
    );
    if (hasWildcard) return true;
  }

  // Check root wildcard (*)
  const hasRootWildcard = sec.permissions.some(
    (perm) => perm.code === '*'
  );
  if (hasRootWildcard) return true;

  return false;
}

/**
 * Check if user has ANY of the specified permissions
 *
 * @param sec - EffectiveSecurity object
 * @param permissionCodes - Array of permission codes
 * @returns true if user has at least one permission
 */
export function canAny(
  sec: EffectiveSecurity | undefined | null,
  permissionCodes: string[]
): boolean {
  return permissionCodes.some((code) => can(sec, code));
}

/**
 * Check if user has ALL of the specified permissions
 *
 * @param sec - EffectiveSecurity object
 * @param permissionCodes - Array of permission codes
 * @returns true if user has all permissions
 */
export function canAll(
  sec: EffectiveSecurity | undefined | null,
  permissionCodes: string[]
): boolean {
  return permissionCodes.every((code) => can(sec, code));
}

/**
 * Check if user belongs to a specific group
 *
 * @param sec - EffectiveSecurity object
 * @param groupKey - Group key (e.g., 'manager', 'clinical_tandarts')
 * @returns true if user is in the group
 */
export function inGroup(
  sec: EffectiveSecurity | undefined | null,
  groupKey: string
): boolean {
  if (!sec || !sec.isActive) return false;

  const normalizedKey = groupKey.toLowerCase().trim();
  return sec.groups.some((group) => group.key.toLowerCase() === normalizedKey);
}

/**
 * Check if user has admin role in a group
 *
 * @param sec - EffectiveSecurity object
 * @param groupKey - Group key
 * @returns true if user is group admin
 */
export function isGroupAdmin(
  sec: EffectiveSecurity | undefined | null,
  groupKey: string
): boolean {
  if (!sec || !sec.isActive) return false;

  const normalizedKey = groupKey.toLowerCase().trim();
  return sec.groups.some(
    (group) =>
      group.key.toLowerCase() === normalizedKey &&
      group.roleInGroup === 'admin'
  );
}
```

---

### 7.3 Update AuthContext to Load Groups

**File:** `src/contexts/AuthContext.tsx`

```typescript
// Add groups to DNMZUser interface
export interface DNMZUser {
  id: string;
  email: string;
  naam: string;
  actief: boolean;
  rol: 'Admin' | 'Manager' | 'Clinical' | 'User';
  isAdmin: boolean;
  isManager: boolean;
  isOwner: boolean;  // NEW
  isClinical: boolean;
  roles: RoleJson[];
  groups: GroupJson[];  // NEW
  permissions: string[];
}

type GroupJson = {
  key: string;
  name: string;
  groupType: string;
  roleInGroup: string;
};

// Update loadSecurityForUser function
async function loadSecurityForUser(authUserId: string): Promise<DNMZUser | null> {
  const { data, error } = await supabase
    .from('vw_user_effective_security')
    .select('*')
    .eq('user_id', authUserId)
    .maybeSingle();

  if (!data) return null;

  // Parse groups
  let groups: GroupJson[] = [];
  try {
    if (data.groups_json) {
      groups = Array.isArray(data.groups_json) ? data.groups_json : [];
    }
  } catch (e) {
    console.error('[AuthContext] Failed to parse groups JSON:', e);
  }

  // ... existing role parsing logic

  const mappedUser: DNMZUser = {
    id: data.user_id,
    email: data.email,
    naam: data.naam,
    actief: data.actief,
    rol,
    isAdmin: !!data.is_admin,
    isManager: !!data.is_manager,
    isOwner: !!data.is_owner,  // NEW
    isClinical: !!data.is_clinical,
    roles,
    groups,  // NEW
    permissions,
  };

  return mappedUser;
}
```

---

### 7.4 Gradual Migration Strategy

**Phase 1: Add `can()` alongside existing checks**

```typescript
// OLD (keep temporarily)
if (user?.rol === 'Admin' || user?.isAdmin) {
  // Admin action
}

// NEW (add alongside)
if (can(user?.security, 'settings.system.update')) {
  // Admin action
}
```

**Phase 2: Replace legacy checks incrementally**

```typescript
// src/pages/AdminTools.tsx (BEFORE)
const isAdmin = user?.rol === 'Admin' || user?.isAdmin;

// src/pages/AdminTools.tsx (AFTER)
const isAdmin = can(user?.security, 'settings.system.update');
```

**Phase 3: Update all pages systematically**

Priority order:
1. Settings pages → `can('settings.*')`
2. HQ pages → `can('hq.*')`
3. Clinical pages → `can('care.*')`, `can('ice.*')`
4. Inventory pages → `can('inventory.*')`
5. Maintenance pages → `can('maintenance.*')`

**Phase 4: Remove legacy checks**

```typescript
// DELETE these patterns entirely:
if (user?.rol === 'Admin') { ... }
if (user?.rol === 'Manager' || user?.rol === 'Admin') { ... }

// REPLACE with:
if (can(user?.security, 'specific.permission')) { ... }
```

---

### 7.5 Component Authorization HOC

**File:** `src/components/RequirePermission.tsx` (NEW)

```typescript
import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { can } from '../utils/permissions';

interface RequirePermissionProps {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function RequirePermission({
  permission,
  fallback = null,
  children,
}: RequirePermissionProps) {
  const { user } = useAuth();

  if (!can(user?.security, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Usage example:
// <RequirePermission permission="care.notes.create">
//   <button onClick={createNote}>New Note</button>
// </RequirePermission>
```

---

### 7.6 Menu Gating with Permissions

**File:** `src/components/Layout.tsx`

```typescript
// OLD
const isManagement =
  user?.rol === 'Admin' ||
  user?.rol === 'Manager' ||
  user?.rol === 'Praktijkhouder';

// NEW
const canAccessHQ = can(user?.security, 'hq.employees.read');
const canAccessFinance = can(user?.security, 'hq.finance.read');
const canManageSettings = can(user?.security, 'settings.system.update');

// Menu items with permission checks
const hqItems: MenuItem[] = [
  { id: 'hq-employees', label: 'Medewerkers', icon: Users,
    visible: canAccessHQ },
  { id: 'hq-finance', label: 'Finance Dashboard', icon: DollarSign,
    visible: canAccessFinance, badge: 'OWNER' },
  // ... etc
].filter(item => item.visible !== false);
```

---

## 8. Step-by-Step Implementation Plan

### Week 1: Database Setup

**Day 1-2: Migration**
- [ ] Run migration SQL to create groups, user_group_memberships, group_permissions tables
- [ ] Verify RLS policies are active
- [ ] Test views (vw_user_effective_groups, vw_user_effective_permissions)
- [ ] Rebuild vw_user_effective_security with groups support

**Day 3-4: Seed Groups**
- [ ] Insert base groups (owner, superadmin, manager, clinical_tandarts, etc.)
- [ ] Verify group hierarchy if using parent_group_id

**Day 5: Seed Permissions**
- [ ] Insert all permissions from permission matrix (200+ permissions)
- [ ] Set is_wildcard = true for wildcard permissions (care.*, hq.*, etc.)
- [ ] Verify permission codes are correct

---

### Week 2: Assign Permissions to Groups

**Day 1-3: Group Permission Mapping**
- [ ] Create group_permissions entries for each group × permission combination
- [ ] Use permission matrix as reference
- [ ] Start with SuperOwner (all permissions) and SuperAdmin
- [ ] Then Manager, Clinical groups, etc.

**Day 4-5: Test User Memberships**
- [ ] Assign existing users to appropriate groups via user_group_memberships
- [ ] Test vw_user_effective_security returns correct groups + permissions
- [ ] Verify is_owner, is_admin, is_manager flags computed correctly

---

### Week 3: Frontend Integration

**Day 1: Update Types**
- [ ] Add EffectiveGroup type to security.ts
- [ ] Add groups field to EffectiveSecurity interface
- [ ] Add is_owner to UserEffectiveSecurityView
- [ ] Update DNMZUser interface in AuthContext

**Day 2: Create can() Helper**
- [ ] Implement can(), canAny(), canAll() in src/utils/permissions.ts
- [ ] Add wildcard support
- [ ] Test with example permission codes

**Day 3: Update AuthContext**
- [ ] Parse groups_json from view
- [ ] Add groups to DNMZUser object
- [ ] Test login with new security model

**Day 4-5: Create Authorization Components**
- [ ] Create RequirePermission HOC
- [ ] Update Layout menu gating to use can()
- [ ] Test menu visibility based on permissions

---

### Week 4: Gradual Migration

**Day 1-2: Settings & Admin Pages**
- [ ] Replace isAdmin checks with can('settings.system.update')
- [ ] Update AdminTools.tsx
- [ ] Update Instellingen.tsx
- [ ] Update Categorieen.tsx

**Day 3-4: HQ Pages**
- [ ] Update HQ pages with can('hq.*') checks
- [ ] Update HQEmployees, HQRoster, HQDocuments, etc.

**Day 5: Test & Verify**
- [ ] Full regression test with multiple user types
- [ ] Verify no broken pages
- [ ] Check console for errors

---

### Week 5: Remaining Modules

**Day 1: Clinical Pages**
- [ ] Update CARE+ pages (ClinicalNoteComposer, Recepten, etc.)
- [ ] Update D-ICE+ pages (Patienten, StatusPraesens, Begrotingen)

**Day 2: Inventory & Maintenance**
- [ ] Update AIR+ pages (Inventory, Implants, Biomaterials)
- [ ] Update Maintenance pages

**Day 3: Templates & Protocols**
- [ ] Update BUILD+ pages (Protocollen, Templates, ICE Template Builder)

**Day 4: Checklists**
- [ ] Update C-BUDDY+ pages

**Day 5: Final Testing**
- [ ] End-to-end test with all user groups
- [ ] Performance test (permission checks should be fast)
- [ ] Security audit

---

### Week 6: Cleanup & Documentation

**Day 1-2: Remove Legacy Code**
- [ ] Remove all direct user?.rol checks
- [ ] Remove hardcoded isManagement logic
- [ ] Clean up unused code

**Day 3: Create Role Management UI**
- [ ] Create HQRoleManagement.tsx page
- [ ] Add UI to assign users to groups
- [ ] Add UI to view user permissions
- [ ] Add audit log viewer

**Day 4: Documentation**
- [ ] Update developer docs with can() usage examples
- [ ] Document permission codes
- [ ] Create user guide for role management

**Day 5: Training & Handoff**
- [ ] Train team on new RBAC system
- [ ] Demo role management UI
- [ ] Handoff to operations team

---

## 9. Testing Checklist

### Unit Tests

- [ ] can() returns true for exact permission match
- [ ] can() returns true for wildcard permission (care.* grants care.notes.create)
- [ ] can() returns false when permission not granted
- [ ] isOwner grants all permissions via can()
- [ ] inGroup() correctly identifies group membership
- [ ] isGroupAdmin() correctly identifies group admin role

### Integration Tests

- [ ] User with 'owner' group can access all pages
- [ ] User with 'manager' group can access HQ but not Finance
- [ ] User with 'clinical_tandarts' group can create treatment plans
- [ ] User with 'viewer' group can only read data
- [ ] RLS policies block unauthorized database access
- [ ] Audit log correctly records permission checks

### Manual Testing

- [ ] Login as Owner → verify all menus visible
- [ ] Login as Manager → verify HQ visible, Finance hidden
- [ ] Login as Tandarts → verify clinical pages visible
- [ ] Login as Assistent → verify limited access
- [ ] Login as Viewer → verify read-only access
- [ ] Test permission denial shows appropriate message
- [ ] Test performance (permission checks < 10ms)

---

## 10. Rollback Plan

If issues arise, rollback is safe because:

1. **No destructive changes** - All existing tables/columns unchanged
2. **Backwards compatible** - Legacy checks still work if can() fails
3. **Views are additive** - vw_user_effective_security still includes roles_json

**Rollback Steps:**
1. Drop new tables: `DROP TABLE IF EXISTS security_audit_log, group_permissions, user_group_memberships, groups CASCADE;`
2. Revert vw_user_effective_security to previous version
3. Remove can() calls from frontend (git revert)
4. System returns to legacy rol-based authorization

---

## 11. Success Metrics

- [ ] **100% RLS coverage** - All new tables have RLS policies
- [ ] **Zero permission leaks** - No unauthorized data access in audit logs
- [ ] **< 50ms permission checks** - can() performance acceptable
- [ ] **Zero regressions** - All existing features still work
- [ ] **Self-service role management** - Admins can assign groups via UI
- [ ] **Audit trail complete** - All security events logged

---

## 12. Conclusion

This RBAC design provides:

✅ **Scalable** - Add new groups/permissions without code changes
✅ **Flexible** - Users can belong to multiple groups
✅ **Secure** - RLS enforced at database level
✅ **Backwards Compatible** - Legacy checks still work during migration
✅ **Maintainable** - Single can() helper for all authorization
✅ **Auditable** - Complete security event logging

**Recommendation:** Proceed with implementation in 6-week plan.

**Next Steps:**
1. Review and approve this proposal
2. Run migration SQL on development environment
3. Begin Week 1: Database Setup
4. Iterate based on feedback

---

**End of Proposal**
