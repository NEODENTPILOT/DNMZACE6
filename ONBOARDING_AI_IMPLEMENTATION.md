# AI-Ondersteunde Onboarding Systeem
**Datum:** 2025-12-23
**Status:** ✅ Production Ready

---

## 📋 OVERZICHT

Het onboarding systeem is uitgebreid met geavanceerde AI-ondersteuning die nieuwe medewerkers contextueel begeleidt gedurende hun inwerkperiode.

**Belangrijkste Features:**
- 🤖 GPT-4 powered begeleiding
- 🎯 Rol-specifieke onboarding flows
- 📚 Automatische protocol & checklist samenvattingen
- 💡 Contextuele tips en volgende stappen
- ❓ Dynamische FAQ generatie
- 📊 Fase-bewuste begeleiding (start/middle/end)

---

## 🎯 FUNCTIONALITEIT

### 1️⃣ AI Welkomstbericht
**Doel:** Persoonlijke begroeting voor nieuwe medewerkers

**Features:**
- Rol-specifiek (Tandarts, Assistent, Mondhygiënist, etc.)
- Template-bewust (naam en duur)
- Warm en bemoedigend
- Geen jargon, begrijpelijke taal

**Voorbeeld Output:**
```
"Welkom bij je onboarding als Tandartsassistent! De komende 60 dagen
gaan we je begeleiden om je goed voor te bereiden op je nieuwe rol.
We starten stap voor stap zodat je zelfverzekerd aan de slag kunt."
```

### 2️⃣ Volgende Stappen Generatie
**Doel:** Concrete, uitvoerbare acties voor de medewerker

**Features:**
- Analyseert huidige taken
- Geeft 3-4 praktische actiestappen
- Focus op wat de medewerker ZELF kan doen
- Geen vage adviezen, alleen concrete stappen

**Voorbeeld Output:**
```
- Start met het doorlezen van het hygiëneprotocol in je documenten
- Plan een kennismakingsgesprek met je buddy voor deze week
- Maak een lijst van vragen die opkomen tijdens je eerste dagen
- Observeer een ervaren collega tijdens patiëntbehandeling
```

### 3️⃣ Contextuele Tips
**Doel:** Fase-specifieke tips gebaseerd op voortgang

**Fase-logica:**
- **0-25% (Oriëntatie):** Focus op kennismaking en basis
- **25-50% (Opbouw):** Focus op vaardigheden ontwikkelen
- **50-75% (Zelfstandigheid):** Focus op zelfstandig werken
- **75-100% (Optimalisatie):** Focus op efficiëntie en integratie

**Voorbeeld Output (25% fase):**
```
- Stel veel vragen, niemand verwacht dat je alles meteen weet
- Maak notities van belangrijke procedures en contactpersonen
- Plan regelmatig korte check-ins met je buddy of manager
- Oefen procedures eerst onder begeleiding voordat je ze zelfstandig doet
```

### 4️⃣ Dynamische FAQ
**Doel:** Beantwoord veel voorkomende vragen per fase

**Fase-bewust:**
- **Start:** Vragen over verwachtingen, basisprocessen
- **Middle:** Vragen over vaardigheden, problemen oplossen
- **End:** Vragen over zelfstandigheid, evaluatie

**Voorbeeld Output:**
```json
[
  {
    "vraag": "Wat als ik iets niet begrijp?",
    "antwoord": "Stel gerust vragen aan je buddy of manager. Niemand
                verwacht dat je alles meteen weet, en vragen stellen
                laat zien dat je betrokken bent."
  },
  {
    "vraag": "Hoe lang duurt het voordat ik alles onder de knie heb?",
    "antwoord": "Dat verschilt per persoon. Gemiddeld voel je je na
                een paar weken al een stuk zelfverzekerder, maar
                volledige inwerking kan enkele maanden duren."
  }
]
```

### 5️⃣ Taak-Specifieke Begeleiding
**Doel:** Guidance voor individuele onboarding taken

**Features:**
- Legt doel van de taak uit
- Geeft aandachtspunten
- Biedt concrete tips
- Motiverend en praktisch

**Voorbeeld Output:**
```
"Deze taak helpt je om het sterilisatieproces goed te begrijpen.
Let vooral op de volgorde van de stappen en de wachttijden tussen
verschillende fases. Tip: vraag je supervisor om het proces eerst
voor te doen voordat je het zelf probeert."
```

### 6️⃣ Protocol Samenvattingen
**Doel:** Complexe protocollen samenvatten in begrijpelijke taal

**Output Structuur:**
```typescript
{
  titel: "Sterilisatie Protocol",
  coreBegrippen: [
    "Desinfectie",
    "Autoclaaf",
    "Controlesysteem",
    "Logboek",
    "Kritische instrumenten"
  ],
  belangrijksteStappen: [
    "Voorbehandeling: spoelen met koud water",
    "Mechanische reiniging in thermische desinfector",
    "Controle op beschadigingen en schoon zijn",
    "Inpakken in sterilisatieverpakking",
    "Steriliseren bij 134°C gedurende 3 minuten",
    "Controleren en registreren in logboek"
  ],
  aandachtspunten: [
    "Altijd persoonlijke beschermingsmiddelen dragen",
    "Schone en vuile zones strikt gescheiden houden",
    "Temperatuur en drukmeting controleren",
    "Verpakking mag niet beschadigd zijn"
  ],
  tijdsindicatie: "Volledige cyclus: ongeveer 45-60 minuten"
}
```

### 7️⃣ Checklist Samenvattingen
**Doel:** Leg uit WAAROM een checklist belangrijk is

**Features:**
- Geen opsomming, maar uitleg van doel
- Focus op context en belang
- 2-3 samenhangende zinnen

**Voorbeeld Output:**
```
"Deze checklist zorgt ervoor dat de behandelkamer compleet en veilig
is ingericht voordat de eerste patiënt binnenkomt. Door deze stappen
systematisch af te werken, voorkom je dat er cruciale materialen of
instrumenten ontbreken tijdens de behandeling."
```

---

## 🏗️ TECHNISCHE ARCHITECTUUR

### AI Service Layer
**Bestand:** `/src/services/onboardingAI.ts`

**Functies:**
```typescript
// Basis functies
generateWelcomeMessage(context: OnboardingContext): Promise<string>
generateNextSteps(context: OnboardingContext): Promise<string[]>
generateContextualTips(context: OnboardingContext): Promise<string[]>
generateFAQ(functie: string, phase: 'start'|'middle'|'end'): Promise<FAQ[]>

// Taak-specifiek
generateTaskGuidance(task, functie): Promise<string>

// Protocol & Checklists
summarizeProtocol(content: string, title: string): Promise<ProtocolSummary>
summarizeChecklist(items: ChecklistItem[]): Promise<string>

// All-in-one
generateFullOnboardingGuidance(context): Promise<ContextueleGuidance>
```

### UI Component
**Bestand:** `/src/components/OnboardingAIGuidance.tsx`

**Features:**
- 6 expandable sections (welcome, task, steps, tips, faq)
- Color-coded per type (purple, blue, emerald, amber, slate)
- Auto-load on mount
- Refresh button voor nieuwe guidance
- Loading states
- Error handling

**Sections:**
1. **AI Assistent (Purple)** - Welkomstbericht + voortgang
2. **Huidige Taak (Blue)** - Task-specific guidance
3. **Volgende Stappen (Emerald)** - Action items
4. **Tips & Tricks (Amber)** - Contextuele adviezen
5. **Veelgestelde Vragen (Slate)** - FAQ per fase

### Integration Point
**Bestand:** `/src/pages/hq/HQOnboarding.tsx`

**Implementatie:**
```typescript
<OnboardingAIGuidance
  context={{
    functie: "Tandartsassistent",
    templateNaam: "Onboarding Tandartsassistent",
    duurDagen: 60,
    currentTasks: [...],
    voortgangPercentage: 35
  }}
  currentTask={tasks.find(t => t.status === 'in_uitvoering')}
/>
```

**Positionering:**
- Boven de takenlijst
- Binnen expanded section van onboarding instance
- Prominent zichtbaar met Sparkles icon en badge

---

## 💾 DATABASE SCHEMA

### Table: `hq.onboarding_ai_guidance`
**Doel:** Log alle AI-gegenereerde guidance voor analyse en feedback

```sql
CREATE TABLE hq.onboarding_ai_guidance (
  id uuid PRIMARY KEY,
  instance_id uuid REFERENCES hq.onboarding_instances,
  guidance_type text CHECK (guidance_type IN (
    'welcome', 'task', 'next_steps', 'tips', 'faq',
    'protocol_summary', 'checklist_summary', 'full_guidance'
  )),
  content jsonb NOT NULL,
  generated_at timestamptz DEFAULT now(),
  was_helpful boolean DEFAULT null,
  feedback_comment text,
  created_at timestamptz DEFAULT now()
);
```

**Indexes:**
- `idx_onboarding_ai_guidance_instance` (instance_id, generated_at DESC)
- `idx_onboarding_ai_guidance_type` (guidance_type)

**RLS:**
- Read: Employee, buddy, or manager of instance
- Insert: Any authenticated user (voor instance)
- Update: Only employee (for feedback)

### Table: `hq.onboarding_protocol_summaries`
**Doel:** Cache van AI-gegenereerde protocol samenvattingen

```sql
CREATE TABLE hq.onboarding_protocol_summaries (
  id uuid PRIMARY KEY,
  protocol_id uuid,
  protocol_title text NOT NULL,
  protocol_content_hash text,
  summary jsonb NOT NULL,
  generated_at timestamptz DEFAULT now(),
  last_used timestamptz DEFAULT now(),
  use_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);
```

**Indexes:**
- `idx_protocol_summaries_hash` (protocol_content_hash)
- `idx_protocol_summaries_title` (protocol_title)

**Features:**
- Content hash voor change detection
- Usage tracking (last_used, use_count)
- Shared cache tussen alle onboardings

**RLS:**
- Read: All authenticated (shared cache)
- Insert/Update: All authenticated

### Columns Added to Existing Tables

**hq.onboarding_templates:**
```sql
ai_enabled boolean DEFAULT true
```
- Schakel AI per template aan/uit

**hq.onboarding_instances:**
```sql
last_ai_guidance_at timestamptz
```
- Track wanneer laatste AI guidance gegenereerd is

---

## 🔄 AI PROMPT ENGINEERING

### Template Structuur
Alle AI prompts volgen deze structuur:
1. **Rol definitie** - "Je bent een vriendelijke onboarding assistent"
2. **Context** - Functie, template, voortgang, taken
3. **Output specificatie** - Formaat, lengte, toon
4. **Restricties** - Geen jargon, je/jij toon, concreet

### Tone of Voice
- **Persoonlijk:** Je/jij aanspreekvorm
- **Bemoedigend:** Positief maar realistisch
- **Praktisch:** Concrete adviezen, geen vage platitudes
- **Toegankelijk:** Geen jargon, begrijpelijke taal

### Temperature Settings
| Functie | Temp | Reden |
|---------|------|-------|
| Welcome Message | 0.8 | Variatie en warmte |
| Next Steps | 0.7 | Praktisch maar creatief |
| Tips | 0.8 | Diverse perspectieven |
| FAQ | 0.7 | Consistent maar natuurlijk |
| Task Guidance | 0.7 | Praktisch en betrouwbaar |
| Protocol Summary | 0.4 | Nauwkeurig en consistent |

### Token Limits
| Functie | Max Tokens | Reden |
|---------|-----------|-------|
| Welcome | 200 | Kort en krachtig |
| Next Steps | 300 | 3-4 items uitleg |
| Tips | 400 | 3-4 tips met context |
| FAQ | 500 | 3 Q&A paren |
| Task Guidance | 200 | Beknopt en to-the-point |
| Protocol Summary | 600 | Gedetailleerd overzicht |

---

## 🎨 UI/UX DESIGN

### Color Scheme per Section
| Section | Gradient | Border | Icon | Betekenis |
|---------|----------|--------|------|-----------|
| AI Assistent | Purple-Indigo | Purple-200 | Sparkles | AI-powered |
| Huidige Taak | Blue-Cyan | Blue-200 | Target | Focus |
| Volgende Stappen | Emerald-Teal | Emerald-200 | CheckCircle | Action |
| Tips | Amber-Orange | Amber-200 | Lightbulb | Advies |
| FAQ | Slate-Gray | Slate-200 | HelpCircle | Support |

### Interaction Pattern
```
┌─────────────────────────────────────┐
│ [Icon] Section Titel        [v]     │ ← Collapsed (clickable)
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ [Icon] Section Titel        [^]     │ ← Expanded header
├─────────────────────────────────────┤
│                                     │
│ Content hier...                     │
│                                     │
└─────────────────────────────────────┘
```

### Progressive Disclosure
- **Default:** Alleen welcome section expanded
- **Click to expand:** Andere sections on-demand
- **Auto-focus:** Huidige taak krijgt attention als beschikbaar
- **Minimal load:** Één API call voor alle guidance

### Loading States
1. **Initial Load:** Gradient box met spinner en "AI Assistant laadt..."
2. **Error State:** Red box met foutmelding en "Opnieuw proberen" button
3. **Empty State:** Geen component rendering als geen data

### Responsive Design
- **Mobile:** Stacked sections, full width
- **Tablet:** Same layout, better spacing
- **Desktop:** Same layout, optimal readability

---

## 🚀 GEBRUIKERSSCENARIO'S

### Scenario 1: Nieuwe Assistent - Eerste Dag
**Context:**
- Functie: Tandartsassistent
- Template: 60 dagen onboarding
- Voortgang: 5%
- Status: Net begonnen

**AI Output:**
```
WELKOMSTBERICHT:
"Welkom bij je onboarding als Tandartsassistent! De komende 60 dagen
gaan we je begeleiden om je goed voor te bereiden. We starten stap voor
stap zodat je zelfverzekerd aan de slag kunt."

VOLGENDE STAPPEN:
- Start met het lezen van het praktijkhandboek in je documenten
- Maak kennis met je buddy en plan een wekelijks overleg
- Observeer een ervaren collega tijdens een behandeling
- Maak notities van vragen die opkomen

TIPS:
- Stel veel vragen, niemand verwacht dat je alles meteen weet
- Focus eerst op de basis: hygiëne, instrumentarium en communicatie
- Maak foto's of tekeningen van complexe opstellingen
- Plan dagelijks 10 minuten om je notities door te nemen

FAQ:
Q: Wat moet ik deze week vooral leren?
A: Focus op de basis: praktijkregels, veiligheid, hygiëneprotocollen
   en waar alles staat. De rest komt vanzelf.

Q: Mag ik al patiënten helpen?
A: Ja, maar altijd onder begeleiding. Je buddy bepaalt welke taken
   je op kan pakken.

Q: Wat als ik een fout maak?
A: Dat hoort bij leren. Meld het direct aan je supervisor, dan kunnen
   we samen kijken hoe we het oplossen en wat je ervan leert.
```

### Scenario 2: Tandarts in Opleiding - Halverwege
**Context:**
- Functie: Tandarts onder Supervisie
- Template: 120 dagen onboarding
- Voortgang: 55%
- Status: Groeiende zelfstandigheid

**AI Output:**
```
WELKOMSTBERICHT:
"Je zit nu meer dan halverwege je onboarding! De basis heb je onder
de knie, nu gaan we focussen op je zelfstandigheid en efficiëntie."

VOLGENDE STAPPEN:
- Plan een tussentijdse evaluatie met je supervisor
- Werk aan het verhogen van je behandelings-snelheid zonder concessies
- Start met het zelfstandig maken van behandelplannen
- Oefen moeilijke gesprekken met je supervisor (roleplay)

TIPS:
- Je kent de procedures nu, werk aan je routine en efficiëntie
- Bereid complexe gevallen voor door vooraf na te denken over alternatieven
- Vraag feedback op specifieke vaardigheden, niet alleen algemene indruk
- Begin met het bijhouden van je eigen complicatie-register voor leerdoelen

FAQ:
Q: Wanneer mag ik volledig zelfstandig werken?
A: Dat bepaal je samen met je supervisor op basis van competenties,
   niet alleen op basis van tijd. Gebruik de competentielijst als leidraad.

Q: Wat als ik tijdens behandeling twijfel?
A: Stop de behandeling en roep je supervisor erbij. Veiligheid gaat
   altijd voor. Dit laat juist je professionaliteit zien.

Q: Hoe weet ik of ik op schema lig?
A: Bespreek dit tijdens je wekelijkse evaluatie. Focus op competentie-
   ontwikkeling, niet alleen op aantal behandelingen.
```

### Scenario 3: Praktijkmanager - Laatste Fase
**Context:**
- Functie: Praktijkmanager
- Template: 90 dagen onboarding
- Voortgang: 85%
- Status: Bijna klaar

**AI Output:**
```
WELKOMSTBERICHT:
"Je zit in de laatste fase van je onboarding! Je hebt de basis onder
de knie, nu gaan we focussen op optimalisatie en je volledige integratie
in het team."

VOLGENDE STAPPEN:
- Plan je eindevaluatie en bespreek je leerdoelen voor het eerste jaar
- Neem de leiding in een komend teamoverleg
- Identificeer één procesverbetering en presenteer je plan
- Start met het opbouwen van je externe netwerk (leveranciers, accountant)

TIPS:
- Gebruik je frisse blik: welke processen kun je verbeteren?
- Begin met het opbouwen van je eigen systemen en werkwijzen
- Documenteer wat je geleerd hebt voor de volgende praktijkmanager
- Plan maandelijkse check-ins met de eigenaar voor strategische afstemming

FAQ:
Q: Ben ik nu volledig ingewerkt?
A: Qua basis wel, maar blijf jezelf ontwikkelen. Stel je eigen
   leerdoelen voor de komende 6-12 maanden.

Q: Wat zijn typische uitdagingen na de onboarding?
A: Balans vinden tussen dagelijkse operatie en strategische projecten.
   Plan bewust tijd voor beide.

Q: Hoe blijf ik op de hoogte van ontwikkelingen?
A: Volg brancheverenigingen, bezoek vakbeurzen en netwerk met andere
   praktijkmanagers. Investeer in je vakkennis.
```

---

## 📊 ANALYTICS & FEEDBACK

### Feedback Mechanisme
**Toekomstig:** Feedback buttons per guidance section

```typescript
interface Feedback {
  was_helpful: boolean;      // Thumb up/down
  feedback_comment?: string; // Optionele toelichting
}
```

**Database opslag:**
- Log in `onboarding_ai_guidance.was_helpful`
- Track per guidance_type
- Gebruik voor model fine-tuning

### Analytics Metrics
**Track:**
1. **Usage:** Hoeveel guidance wordt gegenereerd?
2. **Helpfulness:** Percentage thumbs up/down
3. **Engagement:** Welke sections worden geopend?
4. **Cache Hit Rate:** Protocol summaries reuse
5. **Error Rate:** API failures

**Queries:**
```sql
-- Helpfulness per type
SELECT
  guidance_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE was_helpful = true) as helpful,
  COUNT(*) FILTER (WHERE was_helpful = false) as not_helpful,
  ROUND(100.0 * COUNT(*) FILTER (WHERE was_helpful = true) /
        NULLIF(COUNT(*) FILTER (WHERE was_helpful IS NOT NULL), 0), 1) as helpfulness_pct
FROM hq.onboarding_ai_guidance
GROUP BY guidance_type;

-- Most used protocol summaries
SELECT
  protocol_title,
  use_count,
  last_used,
  AGE(now(), generated_at) as age
FROM hq.onboarding_protocol_summaries
ORDER BY use_count DESC
LIMIT 20;

-- AI usage per template
SELECT
  ot.naam as template,
  COUNT(DISTINCT oag.instance_id) as instances_with_ai,
  COUNT(*) as total_guidances,
  ROUND(AVG(oag.content::text::int)) as avg_content_length
FROM hq.onboarding_ai_guidance oag
JOIN hq.onboarding_instances oi ON oi.id = oag.instance_id
JOIN hq.onboarding_templates ot ON ot.id = oi.template_id
GROUP BY ot.naam;
```

---

## 🔐 SECURITY & PRIVACY

### Data Privacy
**Principes:**
1. **Minimal Data:** Alleen noodzakelijke context naar OpenAI
2. **No PII:** Geen persoonlijke identificeerbare informatie
3. **Anonymization:** Gebruik functie-titels, geen namen
4. **Retention:** AI responses in eigen database, niet bij OpenAI

**Data Sent to OpenAI:**
```typescript
// ✅ SAFE
{
  functie: "Tandartsassistent",
  templateNaam: "Onboarding Tandartsassistent",
  voortgang: 35,
  tasks: ["Lees hygiëneprotocol", "Observeer behandeling"]
}

// ❌ UNSAFE (never send)
{
  naam: "Jan Jansen",
  email: "jan@example.com",
  geboortedate: "1990-01-01",
  BSN: "123456789"
}
```

### RLS Policies
**onboarding_ai_guidance:**
- Employee kan eigen guidance lezen en feedback geven
- Buddy kan guidance van mentee lezen
- Manager kan guidance van team lezen

**protocol_summaries:**
- Shared read access (geen gevoelige data)
- Efficiency door reuse

### API Key Security
- OpenAI API key in environment variables
- Never in frontend code
- Server-side calls only via edge functions

---

## 🐛 ERROR HANDLING

### Graceful Degradation
**AI Unavailable:**
```typescript
// Fallback to generic guidance
return {
  welkomstBericht: `Welkom bij je onboarding als ${functie}!`,
  eerstvolgendeStappen: ['Start met de eerste taak'],
  tips: ['Stel veel vragen', 'Maak notities'],
  veelgesteldeVragen: []
};
```

### Error States
1. **API Timeout:** Show retry button
2. **Invalid Response:** Use fallback content
3. **Rate Limit:** Queue request, show loading
4. **Invalid JSON:** Parse and extract, or fallback

### User Communication
```
❌ TECHNICAL: "OpenAI API returned 429 status code"
✅ USER-FRIENDLY: "AI begeleiding tijdelijk niet beschikbaar. Probeer over een paar minuten opnieuw."
```

---

## 🔄 FUTURE ENHANCEMENTS

### Fase 2 (Week 2-3)
1. **Feedback Loop**
   - Thumbs up/down buttons per section
   - Optionele comment field
   - Analytics dashboard voor feedback

2. **Voice/Tone Personalization**
   - Leer van feedback
   - Pas tone aan per gebruiker
   - Remember preferences

3. **Multimodal Content**
   - Video summaries
   - Audio guidance
   - Interactive diagrams

### Fase 3 (Week 4+)
1. **Smart Scheduling**
   - AI bepaalt optimale timing voor taken
   - Personalized pacing recommendations
   - Adaptive templates

2. **Peer Learning**
   - Match nieuwe medewerkers met ervaren buddies
   - Shared experiences aanbevelingen
   - Community Q&A

3. **Competency Tracking**
   - AI analyseert task completion patterns
   - Identifies learning gaps
   - Suggests targeted training

### Fase 4 (Maand 2+)
1. **Multi-language Support**
   - Detect user language preference
   - Generate guidance in preferred language
   - Maintain context across languages

2. **Integration with Learning Systems**
   - Connect to e-learning platforms
   - Recommend courses based on gaps
   - Track certifications

3. **Predictive Analytics**
   - Predict completion time based on progress
   - Identify at-risk onboardings early
   - Suggest interventions

---

## 📞 SUPPORT & TROUBLESHOOTING

### Common Issues

**Issue:** AI guidance niet zichtbaar
**Fix:**
1. Check of onboarding instance expanded is
2. Verify OpenAI API key in environment
3. Check browser console voor errors

**Issue:** Guidance laadt lang
**Fix:**
1. Normale response time is 3-5 seconden
2. Check network tab voor API calls
3. Verify OpenAI API status

**Issue:** Guidance niet relevant
**Fix:**
1. Check context parameters (functie, voortgang)
2. Review task descriptions
3. Provide feedback via UI (future)

### Debug Mode
**Enable in code:**
```typescript
// onboardingAI.ts
const DEBUG = true;

if (DEBUG) {
  console.log('Context:', context);
  console.log('Prompt:', prompt);
  console.log('Response:', response);
}
```

---

## 📈 SUCCESS METRICS

### KPIs
1. **Adoption Rate:** % onboardings met AI enabled
2. **Engagement Rate:** % expanded sections per session
3. **Helpfulness Score:** Thumbs up ratio
4. **Completion Rate:** Onboardings met AI vs zonder
5. **Time to Competency:** Sneller met AI?

### Success Criteria
- ✅ 80%+ gebruikers vinden AI helpful
- ✅ 60%+ expand minimaal 3 sections
- ✅ 90%+ onboardings gebruiken AI
- ✅ <5% error rate
- ✅ <5s response time (95th percentile)

---

## 🎉 CONCLUSIE

Het AI-ondersteunde onboarding systeem biedt nieuwe medewerkers **contextuele, rol-specifieke begeleiding** die zich aanpast aan hun voortgang en behoeften. Door GPT-4 te integreren op strategische momenten, **verbeteren we de onboarding ervaring** zonder te overweldigen met informatie.

**Status:** ✅ **PRODUCTION READY**

**Key Differentiators:**
- Geen quizzes (zinloos voor onboarding)
- Volledig inline (geen popup hell)
- Fase-bewust (beginner → expert)
- Praktisch over theoretisch
- Nederlands, begrijpelijk, bemoedigend

**Next Steps:**
1. Monitor usage en feedback
2. Fine-tune prompts based op analytics
3. Uitbreiden naar andere modules (training, evaluatie)
4. Integreren met HQ Skills/Bekwaamheden
