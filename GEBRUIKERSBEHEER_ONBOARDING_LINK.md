# Gebruikersbeheer → AI Onboarding Link
**Datum:** 2025-12-23

---

## 🔗 WORKFLOW INTEGRATIE

### Van Gebruikersbeheer naar Onboarding

**Scenario:**
1. Admin maakt nieuwe gebruiker aan of wijzigt rol
2. Admin klikt op 🎓 **Onboarding button** in gebruikerskaart
3. Systeem navigeert naar **HQ Onboarding** pagina
4. Admin kan nieuw onboarding traject starten met AI-ondersteuning

### Button Implementatie
**Locatie:** `src/pages/Gebruikersbeheer.tsx:560-570`

```typescript
<a
  href="/hq-onboarding"
  onClick={(e) => {
    e.preventDefault();
    window.location.hash = '#/hq-onboarding';
  }}
  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
  title="Start onboarding"
>
  <GraduationCap className="w-5 h-5" />
</a>
```

---

## 🎯 GEBRUIKERSFLOW

### Stap 1: Gebruiker Aanmaken/Wijzigen
```
Admin → Gebruikersbeheer
  ├─ Zoek gebruiker
  ├─ Wijzig rol (inline)
  ├─ Koppel locatie(s)
  └─ Gebruiker is klaar voor onboarding
```

### Stap 2: Onboarding Starten
```
Admin klikt 🎓 button
  ↓
HQ Onboarding pagina
  ├─ Klik "Nieuw Traject"
  ├─ Selecteer medewerker
  ├─ Kies template (automatisch gekozen o.b.v. rol)
  ├─ Stel buddy/manager in
  └─ Start traject
```

### Stap 3: AI Begeleiding Activeert
```
Onboarding instance created
  ↓
Expand instance in lijst
  ↓
AI Guidance component laadt
  ├─ Welkomstbericht (rol-specifiek)
  ├─ Volgende stappen
  ├─ Contextuele tips
  ├─ FAQ (fase-bewust)
  └─ Task guidance (per taak)
```

---

## 🔄 ROL → TEMPLATE MAPPING

### Automatische Template Selectie
**Toekomstige feature:** Auto-suggest template based op rol

| Gebruikersrol | Aanbevolen Onboarding Template |
|---------------|-------------------------------|
| Tandarts | Onboarding Tandarts onder Supervisie (120d) |
| Mondhygiënist | Onboarding Mondhygiënist (30d) |
| Assistent | Onboarding Tandartsassistent (60d) |
| Praktijkmanager | Onboarding Praktijkmanager (90d) |
| Backoffice | Onboarding Backoffice Medewerker (45d) |
| Frontoffice | Onboarding Frontoffice Medewerker (45d) |

**Implementatie (future):**
```typescript
function suggestTemplate(rol: string): string | null {
  const mapping = {
    'Tandarts': 'Onboarding Tandarts onder Supervisie',
    'Mondhygiënist': 'Onboarding Mondhygiënist',
    'Assistent': 'Onboarding Tandartsassistent',
    'Manager': 'Onboarding Praktijkmanager',
    // etc...
  };
  return mapping[rol] || null;
}
```

---

## 💡 UX IMPROVEMENTS (TOEKOMST)

### Fase 1: Direct Link
**Current:**
- Button navigeert naar HQ Onboarding
- Admin moet handmatig nieuwe traject starten

**Improved:**
- Pre-select gebruiker in onboarding form
- Auto-suggest template based op rol
- One-click start

### Fase 2: Inline Onboarding Start
**Vision:**
- Modal opent direct in Gebruikersbeheer
- Selecteer template → Start
- Bevestiging: "Onboarding gestart voor [User]"
- Link naar HQ Onboarding voor monitoring

### Fase 3: Smart Automation
**Features:**
- Automatisch buddy assignment (ervaren collega zelfde rol)
- Manager auto-select (based op locatie)
- Start datum suggestie (eerstvolgende maandag)
- Email notificatie naar nieuwe medewerker

---

## 🎨 VISUAL FLOW

```
┌────────────────────────────────────┐
│  GEBRUIKERSBEHEER                  │
│                                    │
│  👤 Jan Jansen                     │
│  📧 jan@praktijk.nl                │
│  Rol: [Tandarts ▼]  ← inline edit │
│  📍 2 locaties                     │
│                                    │
│  [⚡] [🎓] [▼]  ← Onboarding btn  │
└────────────────────────────────────┘
             │
             ↓ (click 🎓)
             │
┌────────────────────────────────────┐
│  HQ ONBOARDING                     │
│                                    │
│  [+ Nieuw Traject]                 │
│                                    │
│  Actieve Trajecten:                │
│  ┌──────────────────────────────┐ │
│  │ 👤 Jan Jansen                │ │
│  │ Template: Tandarts (120d)    │ │
│  │ Voortgang: 15%               │ │
│  │ [▼ Expand voor AI guidance]  │ │
│  └──────────────────────────────┘ │
└────────────────────────────────────┘
             │
             ↓ (expand)
             │
┌────────────────────────────────────┐
│  AI BEGELEIDING                    │
│                                    │
│  ✨ Welkom Jan! Je onboarding...  │
│  ✓ Volgende stappen: ...          │
│  💡 Tips: ...                      │
│  ❓ FAQ: ...                       │
│                                    │
│  TAKEN (2 / 15)                    │
│  ☐ Lees praktijkhandboek          │
│  ☐ Observeer behandeling           │
│  ...                               │
└────────────────────────────────────┘
```

---

## 🔐 PERMISSIONS

### Wie kan Onboarding Starten?
**Via Gebruikersbeheer button:**
- ✅ Super Admin
- ✅ Admin
- ✅ Manager (voor eigen team)
- ❌ Tandarts
- ❌ Assistent

**Direct in HQ Onboarding:**
- ✅ Super Admin
- ✅ Admin
- ✅ Manager
- ❌ Others (geen toegang tot pagina)

### Data Access
**RLS Policies zorgen ervoor dat:**
- Medewerker ziet eigen onboarding + AI guidance
- Buddy ziet guidance van mentee
- Manager ziet guidance van team
- Admin/Super Admin ziet alles

---

## 📊 ANALYTICS OPPORTUNITY

### Track Onboarding Success
**Metrics per gebruikersrol:**
```sql
SELECT
  u.rol,
  COUNT(DISTINCT oi.id) as total_onboardings,
  AVG(oi.voortgang_percentage) as avg_progress,
  COUNT(*) FILTER (WHERE oi.status = 'afgerond') as completed,
  AVG(
    EXTRACT(EPOCH FROM (oi.werkelijke_eind_datum - oi.start_datum)) / 86400
  ) as avg_duration_days
FROM users u
JOIN hq.onboarding_instances oi ON oi.employee_id = u.id
GROUP BY u.rol
ORDER BY total_onboardings DESC;
```

### AI Impact Analysis
**Compare onboarding with/without AI:**
```sql
SELECT
  CASE WHEN oi.last_ai_guidance_at IS NOT NULL
    THEN 'With AI'
    ELSE 'Without AI'
  END as ai_usage,
  AVG(oi.voortgang_percentage) as avg_progress,
  AVG(
    EXTRACT(EPOCH FROM (
      COALESCE(oi.werkelijke_eind_datum, now()) - oi.start_datum
    )) / 86400
  ) as avg_duration_days,
  COUNT(*) FILTER (WHERE oi.status = 'afgerond') as completed_count,
  COUNT(*) as total_count
FROM hq.onboarding_instances oi
GROUP BY ai_usage;
```

---

## 🚀 ROLLOUT PLAN

### Week 1: Soft Launch
- Enable voor Super Admin en Admin only
- Monitor errors en feedback
- Collect first metrics

### Week 2: Team Rollout
- Enable voor alle Managers
- Training session voor admins
- Documentation distributed

### Week 3: Full Production
- All users with permissions
- Analytics dashboard live
- Feedback mechanism active

### Week 4: Optimization
- Review analytics
- Adjust AI prompts based on feedback
- Plan phase 2 features

---

## 📞 SUPPORT

**Voor gebruikers:**
- Gebruik 🎓 button in Gebruikersbeheer
- Of navigeer direct naar HQ Onboarding
- AI guidance is automatisch beschikbaar

**Voor admins:**
- Check HQ Onboarding voor alle actieve trajecten
- Monitor voortgang en AI usage
- Feedback verzamelen van nieuwe medewerkers

**Voor ontwikkelaars:**
- See `ONBOARDING_AI_IMPLEMENTATION.md` voor details
- OpenAI API key required in `.env`
- Database migrations applied automatically

---

## ✅ CHECKLIST VOOR ADMINS

Nieuwe Medewerker Onboarden:

- [ ] Maak gebruiker aan in Gebruikersbeheer
- [ ] Wijs juiste rol toe (bepaalt aanbevolen template)
- [ ] Koppel locatie(s)
- [ ] Stel account actief
- [ ] Klik op 🎓 Onboarding button
- [ ] Start nieuw traject in HQ Onboarding
- [ ] Selecteer juiste template
- [ ] Wijs buddy toe (ervaren collega)
- [ ] Wijs manager toe (direct leidinggevende)
- [ ] Stel startdatum in
- [ ] Start traject
- [ ] Expand traject om AI guidance te verifiëren
- [ ] Email nieuwe medewerker met login info
- [ ] Plan intake gesprek met buddy en manager

**Result:** Nieuwe medewerker heeft:
- ✅ Werkend account
- ✅ Juiste rol en rechten
- ✅ Locatie toegang
- ✅ Actief onboarding traject
- ✅ AI-begeleiding beschikbaar
- ✅ Buddy en manager toegewezen
- ✅ Duidelijke taken en stappen

---

**Status:** 🎉 **VOLLEDIG GEÏNTEGREERD**

De link tussen Gebruikersbeheer en AI Onboarding is actief en klaar voor gebruik!
