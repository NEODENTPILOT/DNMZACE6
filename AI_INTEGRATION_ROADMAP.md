# 🤖 AI Integration Roadmap - DNMZ+ Clinic Assistant

## ✅ Voltooide AI Integraties

### 1. **BegrotingComposer2025Modal** ✨
- ✅ Volledige AI analyse voor begrotingen
- ✅ Health score berekening (0-100)
- ✅ Slimme UPT code suggesties
- ✅ Prijsoptimalisatie tips
- ✅ Real-time feedback tijdens samenstellen
- ✅ Budget insights en warnings

**Service**: `begrotingenAI.ts`
**Functies**:
- `getBudgetAISuggestions()`
- `calculateBudgetHealthScore()`
- `getBudgetInsights()`

### 2. **DentalChart AI** 🦷
- ✅ Tandkaart analyse
- ✅ Treatment planning suggesties
- ✅ Finding detection en classificatie

**Service**: `dentalChartAI.ts`

### 3. **CaseComposer AI** 📋
- ✅ Case analysis
- ✅ Treatment recommendations
- ✅ Workflow suggesties

**Service**: `caseAI.ts`

### 4. **Behandelplan AI** 🎯
- ✅ Behandelplan analyse
- ✅ Interventie suggesties
- ✅ Protocol matching

**Service**: `behandelplanAI.ts`

### 5. **Protocol AI** 📝
- ✅ Protocol generatie
- ✅ Step-by-step AI assistentie

**Service**: `protocolAI.ts`

### 6. **Recepten AI** 💊
- ✅ Prescription extraction
- ✅ Smart medication suggesties
- ✅ Template based generation

**Service**: `prescriptionExtractor.ts`

### 7. **DNMZ AI Suggestion Engine** 🧠
- ✅ Cross-module suggesties
- ✅ Context-aware recommendations
- ✅ Learning van user behavior

**Service**: `dnmzAiSuggestionEngine.ts`

### 8. **AI Orchestrator** 🎭 (NIEUW!)
- ✅ Centrale AI coördinatie
- ✅ Request logging en feedback
- ✅ Training data collectie
- ✅ Module analytics

**Service**: `aiOrchestrator.ts`
**Database**: `ai_requests_log` tabel

---

## 🚧 Te Implementeren AI Modules

### 🔥 PRIORITEIT 1 - Kritische Workflows

#### 1. **BehandelplanCreateModal**
**Status**: Geen AI
**Implementatie complexiteit**: Medium
**Impact**: Hoog

**Benodigde AI features**:
- ✨ Analyse van behandelplan volledigheid
- 💡 Suggesties voor interventies o.b.v. categorie
- ⚠️ Waarschuwingen voor ontbrekende stappen
- 📊 Health score voor behandelplan kwaliteit
- 🎯 Auto-suggestie van workflows

**Implementatie**:
```typescript
// Voeg toe aan BehandelplanCreateModal:
import AIAssistantPanel from './AIAssistantPanel';
import { aiOrchestrator } from '../services/aiOrchestrator';

// In component:
const [aiAnalysis, setAiAnalysis] = useState(null);
const [loadingAI, setLoadingAI] = useState(false);

async function analyzeBehandelplan() {
  setLoadingAI(true);
  const result = await aiOrchestrator.analyzeBehandelplan({
    naam: formData.naam,
    doel: formData.doel,
    categorie: formData.categorie,
    interventies: interventies
  });
  setAiAnalysis(result);
  setLoadingAI(false);
}

// In render - rechter sidebar:
<AIAssistantPanel
  module="behandelplan"
  analysisResult={aiAnalysis}
  loading={loadingAI}
  onAnalyze={analyzeBehandelplan}
  compact={false}
/>
```

**Geschatte tijd**: 2-3 uur

---

#### 2. **ZorgplanCreateModal**
**Status**: Geen AI
**Implementatie complexiteit**: Medium
**Impact**: Hoog

**Benodigde AI features**:
- 🏥 Zorgplan volledigheid check
- 🔗 Koppeling behandelplannen validatie
- 💰 Begroting ontbreekt waarschuwing
- 📈 Progress tracking suggesties
- 🎯 Smart case categorization

**Implementatie**: Vergelijkbaar met BehandelplanCreateModal
**Geschatte tijd**: 2-3 uur

---

#### 3. **WorkflowCreateModal / WorkflowEditor**
**Status**: Geen AI
**Implementatie complexiteit**: Medium-High
**Impact**: Zeer Hoog

**Benodigde AI features**:
- 🔄 Workflow stappen suggesties
- ⏱️ Deadline estimation o.b.v. historische data
- 👥 Verantwoordelijke assignment suggesties
- 📋 Template matching voor vergelijkbare workflows
- ⚡ Bottleneck detection
- 🎨 Best practices voor workflow design

**Implementatie**: Complexer - meerdere stappen
**Geschatte tijd**: 4-5 uur

---

#### 4. **InterventieCreateModal**
**Status**: Geen AI
**Implementatie complexiteit**: Low-Medium
**Impact**: Medium

**Benodigde AI features**:
- 🦷 Element/tand suggesties o.b.v. behandelplan
- 💊 Medicatie recommendations
- 📝 Notitie templates
- ⏰ Timing suggesties
- 🔗 Related interventies

**Geschatte tijd**: 2 uur

---

### 📊 PRIORITEIT 2 - Quality & Compliance

#### 5. **ChecklistDetailModal**
**Status**: Geen AI
**Implementatie complexiteit**: Low
**Impact**: Medium

**Benodigde AI features**:
- ✅ Volledigheid check
- ⚠️ Kritische items highlight
- 🎯 Missing items detectie
- 📊 Completion prediction

**Geschatte tijd**: 1-2 uur

---

#### 6. **FormulierEditor / FormInstanceEditor**
**Status**: Geen AI
**Implementatie complexiteit**: Medium
**Impact**: Medium

**Benodigde AI features**:
- 📋 Formulier volledigheid check
- 🔍 Verplichte velden validatie
- 💡 Hulptekst suggesties
- 🎨 Layout optimalisatie tips

**Geschatte tijd**: 2-3 uur

---

#### 7. **PatientCreateModal**
**Status**: Geen AI
**Implementatie complexiteit**: Low-Medium
**Impact**: Medium-High

**Benodigde AI features**:
- 🔍 Duplicate patient detection
- 📱 Contact info validation
- 🏥 Insurance info suggesties
- ⚠️ Data completeness warnings
- 🎯 Risk profiling (o.b.v. medische geschiedenis)

**Geschatte tijd**: 2 uur

---

### 🔧 PRIORITEIT 3 - Operations & Maintenance

#### 8. **MaintenanceLogModal**
**Status**: Geen AI
**Implementatie complexiteit**: Low
**Impact**: Low-Medium

**Benodigde AI features**:
- 📅 Predictive maintenance suggesties
- 🔄 Onderhoud interval optimalisatie
- ⚠️ Warranty expiration alerts
- 💰 Cost trend analysis

**Geschatte tijd**: 1-2 uur

---

#### 9. **InventoryHub (Implants & Biomaterials)**
**Status**: Geen AI
**Implementatie complexiteit**: Medium
**Impact**: Medium

**Benodigde AI features**:
- 📊 Usage prediction
- 📦 Reorder point calculation
- 💰 Cost optimization
- 🔍 Supplier recommendations
- ⚠️ Expiry date warnings

**Geschatte tijd**: 3-4 uur

---

## 🎓 AI Training & Learning System

### Training Dashboard (NIEUW te bouwen)
**Doel**: Visualiseer hoe AI leert van user feedback

**Features**:
- 📊 **Feedback Analytics**
  - Gemiddelde scores per module
  - Most/least useful suggesties
  - User satisfaction trends

- 🧠 **Learning Insights**
  - Welke suggesties worden het meest geaccepteerd
  - Welke patterns worden herkend
  - Improvement over time

- 🎯 **Module Performance**
  - AI accuracy per module
  - Response times
  - User engagement metrics

**Database queries beschikbaar**:
```sql
-- Via vw_ai_module_analytics view
SELECT * FROM vw_ai_module_analytics
WHERE module = 'behandelplan'
ORDER BY request_date DESC;

-- Training data ophalen
SELECT * FROM get_ai_training_data('behandelplan', 4, 100);
```

**Implementatie**: Nieuwe page `/ai-training`
**Geschatte tijd**: 4-6 uur

---

## 💰 Betaalde Diensten Requirements

### Huidige Situatie: ✅ GEEN EXTERNE KOSTEN
Alle AI functionaliteit is **100% lokaal** geïmplementeerd met:
- **Rule-based AI** - Logica in TypeScript
- **Pattern matching** - Data analyse
- **Heuristics** - Domein-specifieke regels
- **Statistical analysis** - Basis statistiek

**Voordelen**:
- ✅ Geen API kosten
- ✅ Privacy-vriendelijk (data blijft lokaal)
- ✅ Snelle response
- ✅ Volledige controle
- ✅ Geen rate limits

**Beperkingen**:
- ❌ Geen natural language understanding
- ❌ Geen complexe patroonherkenning
- ❌ Handmatig onderhouden regels
- ❌ Beperkt tot vooraf gedefinieerde scenarios

---

### Optie 1: OpenAI GPT-4 Integration 🤖

**Use cases**:
1. **Natural Language Processing**
   - Behandelplan beschrijvingen analyseren
   - Automatisch interventies voorstellen uit vrije tekst
   - Smart search over documentatie

2. **Advanced Pattern Recognition**
   - Complexe case analyses
   - Treatment outcome predictions
   - Risk assessment

**Kosten** (indicatief):
- GPT-4 Turbo: **$0.01 per 1K input tokens, $0.03 per 1K output tokens**
- Gemiddelde request: ~500 tokens input, ~300 tokens output = **~$0.014 per request**
- Bij 1000 AI analyses/maand: **~$14/maand**
- Bij 10000 AI analyses/maand: **~$140/maand**

**Implementatie**:
```typescript
// Nieuwe service: aiProviderService.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function analyzeBehandelplanWithGPT(data: any) {
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [{
      role: "system",
      content: "Je bent een AI assistent voor tandartspraktijken..."
    }, {
      role: "user",
      content: JSON.stringify(data)
    }]
  });

  return response.choices[0].message.content;
}
```

**Setup tijd**: 4-6 uur
**Maandelijkse kosten**: €15-150 (afhankelijk van gebruik)

---

### Optie 2: Anthropic Claude Integration 🧠

**Use cases**: Vergelijkbaar met OpenAI maar met:
- Betere reasoning voor medische contexts
- Grotere context window (100K tokens)
- Uitstekend voor lange documentanalyses

**Kosten** (indicatief):
- Claude 3 Sonnet: **$0.003/1K input, $0.015/1K output**
- Goedkoper dan GPT-4 voor vergelijkbare kwaliteit
- Bij 1000 analyses/maand: **~$9/maand**

**Setup tijd**: 4-6 uur

---

### Optie 3: Google Cloud AI (Vertex AI) 🌐

**Use cases**:
- Document intelligence
- Medical image analysis (röntgenfoto's)
- Structured data extraction

**Kosten**: Variabel per feature
- Vision AI: $1.50 per 1000 images
- Natural Language: $0.001 per 1000 characters

**Setup tijd**: 6-8 uur (complexer setup)

---

### Optie 4: Self-Hosted Open Source LLM 🏠

**Models**: Llama 2, Mistral, Falcon
**Voordelen**:
- Geen recurring kosten
- Volledige privacy
- Geen rate limits

**Kosten**:
- **Initieel**: GPU server of cloud instance
- **Maandelijks**: ~€50-200 voor dedicated GPU instance (AWS/GCP)
- **Eenmalig**: €2000-5000 voor eigen server met GPU

**Beperkingen**:
- Lagere kwaliteit dan GPT-4/Claude
- Vereist ML expertise
- Onderhoud en updates

**Setup tijd**: 10-15 uur + ongoing maintenance

---

### Optie 5: Hybrid Approach (AANBEVELING) ⭐

**Strategie**:
1. **Behoud lokale AI** voor:
   - Snelle validaties
   - Basic suggesties
   - Privacy-sensitive analyses

2. **Gebruik externe AI** voor:
   - Complex reasoning (opt-in)
   - Natural language queries
   - Advanced predictions
   - Learning from patterns

**Implementatie**:
```typescript
// AI Provider Selector
class AIProvider {
  async analyze(data: any, mode: 'local' | 'gpt4' | 'claude') {
    switch(mode) {
      case 'local':
        return aiOrchestrator.analyzeBehandelplan(data);
      case 'gpt4':
        return analyzeBehandelplanWithGPT(data);
      case 'claude':
        return analyzeBehandelplanWithClaude(data);
    }
  }
}

// User kan kiezen in settings:
// - Alleen lokale AI (gratis, privacy, snel)
// - Geavanceerde AI (betaald, krachtiger)
```

**Kosten**: Flexibel
- Start met €0 (alleen lokaal)
- Schakel externe AI in per praktijk
- Pay-per-use model

**Setup tijd**: 6-8 uur

---

## 📊 ROI Analyse - Betaalde AI Services

### Cost-Benefit voor kleine praktijk (1-3 behandelaren)

**Kosten externe AI**: ~€20-50/maand

**Besparing/Voordeel**:
- ⏱️ **Tijdsbesparing**: 5-10 min per behandelplan = ~10 uur/maand
- 💰 **Waarde**: 10 uur × €80/uur = **€800/maand**
- 📈 **ROI**: 1600-4000% return on investment
- ✨ **Plus**: Betere kwaliteit zorgplannen
- 😊 **Plus**: Hogere user satisfaction

**Conclusie**: Zeer waardevol zelfs bij kleine schaal

---

## 🎯 Aanbevolen Implementatie Roadmap

### FASE 1: Foundation (Klaar ✅)
- ✅ AI Orchestrator
- ✅ Feedback systeem
- ✅ Database logging
- ✅ Herbruikbaar AI component

### FASE 2: Critical Modules (1-2 weken)
1. BehandelplanCreateModal met AI
2. ZorgplanCreateModal met AI
3. WorkflowEditor met AI
4. InterventieCreateModal met AI

**Totale implementatie tijd**: 10-13 uur
**Impact**: Zeer hoog - kernfunctionaliteit

### FASE 3: Quality & Operations (1 week)
1. ChecklistDetailModal met AI
2. FormulierEditor met AI
3. PatientCreateModal met AI
4. MaintenanceLogModal met AI

**Totale implementatie tijd**: 7-9 uur
**Impact**: Medium-hoog

### FASE 4: Training Dashboard (3-5 dagen)
1. AI Analytics page
2. Feedback visualization
3. Learning insights
4. Performance metrics

**Totale implementatie tijd**: 4-6 uur
**Impact**: Strategisch - laat zien hoe AI leert

### FASE 5: External AI (Optioneel)
1. OpenAI/Claude integratie
2. Hybrid AI provider
3. Advanced features
4. Cost monitoring

**Totale implementatie tijd**: 6-8 uur
**Kosten**: €20-150/maand
**Impact**: Hoog - next-level AI

---

## 🔧 Technische Architectuur

### Huidige Stack
```
┌─────────────────────────────────────┐
│         React Frontend              │
│  (Components + Local AI Logic)      │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│      AI Services Layer              │
│  - aiOrchestrator.ts                │
│  - begrotingenAI.ts                 │
│  - behandelplanAI.ts                │
│  - dentalChartAI.ts                 │
│  - caseAI.ts                        │
│  - protocolAI.ts                    │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│      Supabase Database              │
│  - ai_requests_log                  │
│  - vw_ai_module_analytics           │
│  - get_ai_training_data()           │
└─────────────────────────────────────┘
```

### Toekomstige Stack met Externe AI
```
┌─────────────────────────────────────┐
│         React Frontend              │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│      AI Provider Selector           │
│  - Local AI (default)               │
│  - External AI (opt-in)             │
└────┬────────────────────────────┬───┘
     │                            │
     ▼                            ▼
┌──────────────┐       ┌─────────────────┐
│  Local AI    │       │  External APIs  │
│  Services    │       │  - OpenAI       │
│              │       │  - Claude       │
│              │       │  - Vertex AI    │
└──────────────┘       └─────────────────┘
```

---

## 📝 Volgende Stappen

### Direct Beschikbaar (Geen Extra Werk)
1. ✅ AI Orchestrator is klaar
2. ✅ AIAssistantPanel component is klaar
3. ✅ Database logging werkt
4. ✅ Feedback system operational

### Volgende Sessie - Prioriteit
1. **BehandelplanCreateModal** - AI integratie (2-3 uur)
2. **ZorgplanCreateModal** - AI integratie (2-3 uur)
3. **WorkflowEditor** - AI integratie (4-5 uur)
4. **AI Training Dashboard** - Bouw nieuwe page (4-6 uur)

### Beslissingen Nodig
- ❓ **Externe AI**: Wel of niet? Budget beschikbaar?
- ❓ **Prioriteit**: Welke modules eerst?
- ❓ **Scope**: Alleen basis AI of ook advanced features?

---

## 📞 Contact & Ondersteuning

Voor vragen over AI implementatie:
- Zie deze documentatie voor technical details
- AI Orchestrator code: `src/services/aiOrchestrator.ts`
- AI Component: `src/components/AIAssistantPanel.tsx`
- Database schema: `supabase/migrations/create_ai_orchestrator_logging_system.sql`

**Kosten indicatie totaal**:
- Fase 2-4 implementatie: **Gratis** (local AI)
- Optioneel externe AI: **€20-150/maand**
- Self-hosted LLM: **€50-200/maand** of **€2000-5000 eenmalig**

**Aanbeveling**: Start met local AI (gratis), test uitgebreid, schakel later externe AI in voor specifieke use cases waar het echt waarde toevoegt.
