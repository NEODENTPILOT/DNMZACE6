# DailyVoices Handmatige Controles

## Overzicht

Admins kunnen DailyVoices sessies nu volledig handmatig beheren via de UI. Dit document beschrijft alle handmatige controls en hoe deze werken samen met het automatische systeem.

## Admin Rollen

De volgende rollen hebben toegang tot handmatige controls:
- **Admin**
- **Manager**
- **Super Admin**

## UI Controls (Kalender Header)

In de linker sidebar, boven de sessies lijst, zie je een admin control panel met status informatie en actieknoppen.

### Control Panel Display

Het control panel toont:
- **Status info**: Aantal open en gesloten sessies voor de geselecteerde dag
- **Actieknop**: Dynamisch gebaseerd op huidige status

### Acties

#### 1. Start Dag
**Wanneer zichtbaar:** Als er GEEN sessies bestaan voor de geselecteerde dag

**Wat gebeurt er:**
- Maakt 3 nieuwe sessies aan (ALL, ALMELO, RAALTE)
- Session type: `manual`
- Status: `open`
- Audit trail: `opened_by` = current user

**Knop:**
```
[+ Start dag]  (emerald green)
```

**Feedback:**
- Success: "Dag gestart! 3 sessies aangemaakt."
- Error: "Er bestaat al een sessie voor deze dag"

---

#### 2. Sluit Dag
**Wanneer zichtbaar:** Als er 1 of meer OPEN sessies bestaan

**Wat gebeurt er:**
- Sluit ALLE open sessies voor die dag
- Status: `open` → `closed`
- Audit trail: `closed_by` = current user, `closed_at` = now()

**Knop:**
```
[🔒 Sluit dag]  (slate gray)
```

**Confirmatie:**
"Weet je zeker dat je alle sessies van deze dag wilt sluiten?"

**Feedback:**
- Success: "Dag gesloten! X sessies gesloten."
- Alle sessies worden read-only
- Chat input disabled voor gewone gebruikers

---

#### 3. Heropen Dag
**Wanneer zichtbaar:** Als ALLE sessies gesloten zijn

**Wat gebeurt er:**
- Heropent ALLE gesloten sessies voor die dag
- Status: `closed` → `open`
- Audit trail: `reopened_by` = current user, `reopened_at` = now()

**Knop:**
```
[🔓 Heropen dag]  (emerald green)
```

**Feedback:**
- Success: "Dag heropend! X sessies heropend."
- Sessies zijn weer actief
- Chat input enabled

---

## Status Badges

### In Sessions List

Elke sessie toont een status badge:

**🟢 Actief** (Emerald)
- Sessie is open
- Berichten mogelijk

**🔒 Gesloten** (Slate gray)
- Sessie is gesloten
- Read-only voor gewone gebruikers
- Admins kunnen heropenen

**📦 Gearchiveerd** (Light gray)
- Permanent gearchiveerd
- Read-only voor iedereen

### In Chat Header

De geselecteerde sessie toont een grote status badge in de chat header:
- **Actief** - Groene badge met vinkje icon
- **Gesloten om 18:00** - Grijze badge met slot icon
- Badge is altijd zichtbaar naast sessie titel

### Calendar Dots

Status indicator dots onder kalenderdagen:
- 🟢 **Groen** = Alle sessies open
- ⚫ **Grijs** = Alle sessies gesloten
- 🟡 **Amber** = Mix (sommige open, sommige gesloten)

---

## Gedrag: Open vs Gesloten Sessies

### Open Sessie
- ✅ Berichten versturen mogelijk
- ✅ Tags toevoegen mogelijk
- ✅ Realtime updates
- ✅ Volledig interactief

### Gesloten Sessie (Gewone Gebruikers)
- ❌ Input field disabled
- ❌ Tag drawer disabled
- ❌ Geen berichten versturen
- ✅ Berichten lezen mogelijk
- ⚠️ Amber warning banner: "Deze sessie is gesloten en read-only"

### Gesloten Sessie (Admins)
- ✅ Kunnen sessie heropenen
- ✅ Kunnen individuele sessie openen (via oude controls)
- ✅ Volledige controle

---

## Interactie met Auto-Close Systeem

### Auto-Close om 18:00
- Automatische sluiting blijft actief
- Ook handmatig geopende sessies worden automatisch gesloten
- `closed_by` = `NULL` (system auto-close)

### Handmatig Sluiten
- Admin sluit handmatig
- `closed_by` = admin user_id
- Badge toont: "Handmatig gesloten"

### Na Heropenen
- Status: `open`
- Wordt OPNIEUW automatisch gesloten om 18:00 (als dezelfde dag)
- Admin kan opnieuw heropenen indien nodig

---

## Database Audit Trail

Elke actie wordt gelogd:

```sql
-- Start dag
opened_by: uuid (admin user)
opened_at: timestamptz

-- Sluit dag (handmatig)
closed_by: uuid (admin user)
closed_at: timestamptz

-- Sluit dag (automatisch)
closed_by: NULL (system)
closed_at: timestamptz

-- Heropen dag
reopened_by: uuid (admin user)
reopened_at: timestamptz
```

### View met Audit Info

```sql
SELECT * FROM daily_voice_sessions_with_admin_info
WHERE session_date = '2026-01-06';
```

Bevat:
- `opened_by_name` - Wie heeft sessie gestart
- `closed_by_name` - Wie heeft sessie gesloten (NULL = auto)
- `reopened_by_name` - Wie heeft sessie heropend
- Alle timestamps

---

## Database RPC Functies

### Start Dag Sessies
```sql
SELECT start_day_sessions(
  target_date := '2026-01-06',
  scopes := ARRAY['ALL', 'ALMELO', 'RAALTE']
);
```

**Response:**
```json
{
  "success": true,
  "created_count": 3,
  "existing_count": 0,
  "date": "2026-01-06"
}
```

### Sluit Dag
```sql
SELECT close_day_sessions(target_date := '2026-01-06');
```

**Response:**
```json
{
  "success": true,
  "closed_count": 3,
  "date": "2026-01-06",
  "closed_by": "uuid-here"
}
```

### Heropen Dag
```sql
SELECT reopen_day_sessions(target_date := '2026-01-06');
```

**Response:**
```json
{
  "success": true,
  "reopened_count": 3,
  "date": "2026-01-06",
  "reopened_by": "uuid-here"
}
```

### Check Dag Status
```sql
SELECT check_day_has_sessions(target_date := '2026-01-06');
```

**Response:**
```json
{
  "has_sessions": true,
  "session_count": 3,
  "open_count": 2,
  "closed_count": 1,
  "all_closed": false,
  "recommended_action": "close"
}
```

**Recommended Actions:**
- `start` - Geen sessies, kan starten
- `close` - Open sessies, kan sluiten
- `reopen` - Alle gesloten, kan heropenen
- `none` - Geen actie aanbevolen

---

## Gebruiksscenarios

### Scenario 1: Nieuwe Dag Starten (Weekend/Feestdag)
1. Selecteer datum in kalender
2. Control panel toont: "Geen sessies"
3. Klik **[+ Start dag]**
4. 3 sessies worden aangemaakt
5. Sessies zijn actief en bruikbaar

### Scenario 2: Vroegtijdig Sluiten (Bijv. 16:00)
1. Selecteer huidige dag
2. Control panel toont: "3 open"
3. Klik **[🔒 Sluit dag]**
4. Bevestig in dialog
5. Alle sessies gesloten
6. Gewone gebruikers zien read-only mode

### Scenario 3: Spoedoverleg na 18:00
1. Auto-close heeft sessies gesloten om 18:00
2. Admin selecteert vandaag
3. Control panel toont: "3 gesloten"
4. Klik **[🔓 Heropen dag]**
5. Alle sessies weer actief
6. Team kan weer posten
7. Om 18:00 volgende dag: opnieuw auto-close

### Scenario 4: Mixed Status
1. Admin heropent 1 sessie individueel (oude functie)
2. Control panel toont: "1 open, 2 gesloten"
3. Admin ziet beide knoppen:
   - **[🔒 Sluit dag]** - Voor laatste open sessie
   - Geen heropen knop (niet ALLE gesloten)

---

## Best Practices

### Voor Admins

1. **Start dag alleen wanneer nodig**
   - Automatische sessies zijn meestal voldoende
   - Gebruik voor weekenden/feestdagen

2. **Sluit dag vroegtijdig met reden**
   - Communiceer naar team waarom
   - Post bericht in sessie voor sluiten

3. **Heropenen is OK, maar tijdelijk**
   - Heropende sessies worden opnieuw auto-closed
   - Overweeg nieuwe dag starten voor permanent gebruik

4. **Check audit trail regelmatig**
   - Wie heeft wat gedaan en wanneer
   - Gebruik admin_info view

### Voor Ontwikkelaars

1. **RLS Policies**
   - Alleen admins kunnen start/close/reopen
   - Gewone users kunnen alleen lezen in gesloten sessies

2. **Status Sync**
   - UI reloadt sessions na elke actie
   - Calendar wordt ook gerefreshed
   - Selected session wordt ge-update

3. **Error Handling**
   - Alle RPCs retourneren success/error
   - UI toont duidelijke feedback
   - Confirmatie dialogs voor destructieve acties

---

## Troubleshooting

### "Kan dag niet starten"
**Probleem:** Er bestaan al sessies voor deze dag

**Oplossing:**
- Check of auto-daily sessies al bestaan
- Bekijk sessies in lijst
- Heropenen indien gesloten
- Of verwijder oude sessies (database actie)

### Knop is niet zichtbaar
**Probleem:** Admin control panel toont niet

**Oplossingen:**
1. Check gebruikersrol: moet Admin/Manager/Super Admin zijn
2. Refresh page
3. Check `dayStatus` in browser console
4. Verifieer RPC functie `check_day_has_sessions` werkt

### Sessie blijft gesloten na heropenen
**Probleem:** Status update niet doorgevoerd

**Oplossingen:**
1. Hard refresh (Ctrl+Shift+R)
2. Check RPC response in Network tab
3. Verifieer database: `SELECT status FROM daily_voice_sessions WHERE id = 'uuid'`
4. Check RLS policies op sessies tabel

### Berichten versturen niet mogelijk
**Probleem:** Input blijft disabled

**Checks:**
1. Sessie status: moet `open` zijn
2. RLS policy op `daily_voice_messages` controleert session status
3. Frontend `canSendMessages` logic
4. Browser console voor errors

---

## API Reference

### Check Day Status
```typescript
const { data, error } = await supabase.rpc('check_day_has_sessions', {
  target_date: '2026-01-06'
});
```

### Start Day
```typescript
const { data, error } = await supabase.rpc('start_day_sessions', {
  target_date: '2026-01-06',
  scopes: ['ALL', 'ALMELO', 'RAALTE']
});
```

### Close Day
```typescript
const { data, error } = await supabase.rpc('close_day_sessions', {
  target_date: '2026-01-06'
});
```

### Reopen Day
```typescript
const { data, error } = await supabase.rpc('reopen_day_sessions', {
  target_date: '2026-01-06'
});
```

---

## Security

### RLS Policies
- Alle RPC functies checken `rol IN ('Admin', 'Manager', 'Super Admin')`
- Returns `success: false` + error message indien unauthorized
- Frontend disabled knoppen voor niet-admins

### Audit Trail
- Alle acties worden gelogd met user_id en timestamp
- NULL `closed_by` = system auto-close (geen user actie)
- View `daily_voice_sessions_with_admin_info` voor rapportage

### Data Integriteit
- Geen orphaned data
- Cascade deletes waar nodig
- FK constraints op user references
