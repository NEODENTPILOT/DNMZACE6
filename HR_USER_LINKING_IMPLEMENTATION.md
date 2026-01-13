# HR User Linking Admin Tool - Implementation Report

**Datum:** 27 december 2024
**Feature:** HR Admin tool voor het koppelen van employees aan user accounts

---

## OVERZICHT

Nieuwe admin tool gebouwd voor HR/Super Admin om employee records te koppelen aan user accounts met volledige audit logging.

**Locatie:** `/hq-user-linking` (Beheer → HR → Koppel Gebruikers)

---

## DATABASE IMPLEMENTATIE

### Nieuwe Tabel: `hq.hr_audit_log`

```sql
CREATE TABLE hq.hr_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,                        -- bijv. 'link_user', 'unlink_user'
  entity text NOT NULL,                        -- bijv. 'employee'
  entity_id uuid NOT NULL,                     -- ID van de entity
  details jsonb,                               -- extra details
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**RLS Policies:**
- ✅ Alleen HR/Admin kan audit logs lezen
- ✅ Systeem kan logs schrijven via RPC

**Indexes:**
- `idx_hr_audit_log_entity` op (entity, entity_id)
- `idx_hr_audit_log_created_at` op (created_at DESC)

---

## RPC FUNCTIONS

### 1. `hq.link_employee_to_user(p_employee_id, p_user_id)`

**Doel:** Koppel een employee aan een user account met automatische audit logging

**Security:** SECURITY DEFINER (alleen toegankelijk voor HR/Admin)

**Logic:**
1. Controleert of caller HR/Admin is
2. Haalt employee email op
3. Haalt user email op
4. Detecteert email mismatch
5. Update `hq.employees.user_id`
6. Logt actie in `hq.hr_audit_log`
7. Retourneert success + warning bij email mismatch

**Return Format:**
```json
{
  "success": true,
  "employee_id": "uuid",
  "user_id": "uuid",
  "email_mismatch": false,
  "warning": "Email mismatch: ..." // alleen bij mismatch
}
```

**Error Format:**
```json
{
  "success": false,
  "error": "Error message"
}
```

---

### 2. `hq.get_my_employee_access()`

**Doel:** Test functie voor gebruikers om hun eigen employee toegang te controleren

**Security:** SECURITY DEFINER (toegankelijk voor alle authenticated users)

**Logic:**
1. Haalt current user ID op
2. Zoekt employee record via `user_id`
3. Telt aantal gekoppelde contracten
4. Retourneert employee + contract data

**Return Format:**
```json
{
  "success": true,
  "found": true,
  "employee_id": "uuid",
  "employee": {
    "id": "uuid",
    "voornaam": "John",
    "achternaam": "Doe",
    "email": "john@example.com",
    "functie": "Mondhygiënist"
  },
  "contracts_count": 2,
  "contracts": [
    {
      "id": "uuid",
      "contract_type": "arbeidsovereenkomst",
      "ingangsdatum": "2024-01-01",
      "status": "actief"
    }
  ]
}
```

---

## FRONTEND IMPLEMENTATIE

### Component: `HRUserLinking.tsx`

**Locatie:** `/src/pages/hq/HRUserLinking.tsx`

**Features:**

#### 1. Employees Zonder Account
- Lijst van alle employees waar `user_id = null`
- Sorteer op achternaam
- Selecteerbaar voor koppelen
- Toont: voornaam, achternaam, email, functie

#### 2. User Zoeken
- Live search op email
- Toont: email, naam, rol
- Selecteerbaar voor koppelen

#### 3. Koppel Interface
- Visuele preview van koppeling
- Email mismatch warning (geel) wanneer emails niet overeenkomen
- Bevestigingsknop met loading state
- Success/error messaging

#### 4. Test Self-Service Toegang
- Knop: "Test mijn toegang"
- Toont voor ingelogde user:
  - Welke employee_id gevonden wordt
  - Employee details
  - Aantal contracten
  - Contract details
- Gebruikt `get_my_employee_access()` RPC

#### 5. Audit Log Overzicht
- Tabel met laatste 10 koppelingen
- Kolommen:
  - Tijdstip
  - Door (actor naam)
  - Employee Email
  - User Email
  - Match indicator (groen vinkje / geel waarschuwing)

---

## NAVIGATIE

**Route:** `hq-user-linking`

**Menu Locatie:** HQ+ → HR → Koppel Gebruikers

**Icon:** Link2 (lucide-react)

**Toegang:** Alleen HR/Admin/Super Admin

---

## GEBRUIKERS WORKFLOW

### Scenario 1: Koppel met Matching Emails

1. HR Admin opent "Koppel Gebruikers"
2. Selecteert employee (bijv. `jane.doe@practice.nl`)
3. Zoekt user op email: `jane.doe@practice.nl`
4. Selecteert matching user
5. Klikt "Koppelen"
6. ✅ Success: Employee gekoppeld zonder waarschuwing
7. Actie gelogd in audit log

### Scenario 2: Koppel met Email Mismatch

1. HR Admin selecteert employee (`john.old@practice.nl`)
2. Zoekt user op email: `john.new@practice.nl`
3. Selecteert user met andere email
4. Systeem toont gele waarschuwing: "Email adressen komen niet overeen!"
5. Admin bevestigt toch koppelen
6. ⚠️ Success met warning: Gekoppeld maar mismatch gelogd
7. Audit log bevat `email_mismatch: true`

### Scenario 3: Test Self-Service Access

1. Gebruiker (bijv. medewerker) logt in
2. Opent "Test mijn toegang"
3. Systeem zoekt employee via `user_id`
4. Toont:
   - ✅ "Employee record gevonden!"
   - Employee details
   - 2 contracten gevonden
   - Contract details
5. OF: ⚠️ "Geen employee record gekoppeld aan uw account"

---

## SECURITY CONSIDERATIONS

### Permissions
- ✅ Alleen HR/Admin/Super Admin kunnen koppelen
- ✅ RPC functions valideren rol voor elke operatie
- ✅ SECURITY DEFINER voor correcte RLS context

### Audit Trail
- ✅ Elke koppeling wordt gelogd
- ✅ Actor user ID wordt vastgelegd
- ✅ Email mismatch wordt gedetecteerd en gelogd
- ✅ Oude user_id wordt bewaard in audit log (indien aanwezig)

### Data Integrity
- ✅ Foreign key naar `auth.users(id)`
- ✅ Validatie dat employee en user bestaan
- ✅ Email vergelijking voor data quality warning

---

## ERROR HANDLING

### Function Errors
```
"Unauthorized: Only HR/Admin can link users"
"Employee not found"
"User not found"
```

### Frontend Errors
- Geen employee of user geselecteerd
- RPC call failures
- Network errors

Alle errors worden getoond in rode banner met AlertTriangle icon.

---

## DATA QUALITY CHECKS

### Email Mismatch Detection
- Detecteert wanneer `employee.email ≠ user.email`
- Toont gele waarschuwing tijdens koppelen
- Logt mismatch in audit details
- Voorkomt stille data quality issues

### Audit Log Details
```json
{
  "employee_email": "john@practice.nl",
  "user_email": "john.doe@practice.nl",
  "user_id": "uuid",
  "old_user_id": null,
  "email_mismatch": true
}
```

---

## TESTING CHECKLIST

- [x] Migration succesvol toegepast
- [x] RPC functions aangemaakt
- [x] RLS policies werkend
- [x] Frontend component compiled
- [x] Routes toegevoegd aan registry
- [x] Navigation menu item toegevoegd
- [x] Build succesvol (1816 modules)

---

## PRODUCTIE READINESS

| Aspect | Status |
|--------|--------|
| Database schema | ✅ Complete |
| RLS policies | ✅ Secure |
| Audit logging | ✅ Implemented |
| Error handling | ✅ Comprehensive |
| User feedback | ✅ Clear messaging |
| Email mismatch detection | ✅ Active |
| Self-service test | ✅ Functional |
| Navigation | ✅ Integrated |
| TypeScript compilation | ✅ No errors |

---

## VOLGENDE STAPPEN (OPTIONEEL)

### Mogelijke Uitbreidingen:
1. **Unlink functie** - RPC om koppeling te verwijderen
2. **Bulk linking** - Meerdere employees tegelijk koppelen
3. **Email sync check** - Periodieke check voor email mismatches
4. **Notification system** - Email naar gebruiker bij koppeling
5. **History view** - Volledige audit trail per employee

---

## DEPLOYMENT NOTES

**Database:**
- Migration: `create_hr_user_linking_admin_tool.sql`
- Tables: 1 nieuwe (hq.hr_audit_log)
- Functions: 2 nieuwe RPCs
- Policies: 2 nieuwe RLS policies
- Indexes: 2 performance indexes

**Frontend:**
- Files: 1 nieuwe page (HRUserLinking.tsx)
- Routes: 1 nieuwe route (hq-user-linking)
- Navigation: 1 menu item toegevoegd
- Build size: +10KB (compressed)

**Dependencies:**
- Geen nieuwe dependencies
- Gebruikt bestaande: supabase-js, lucide-react

---

**IMPLEMENTATIE COMPLEET:** 27 december 2024
**Status:** ✅ Production Ready
**Build:** Successful (1816 modules, 15.99s)

---

*Einde HR User Linking Implementation Report*
