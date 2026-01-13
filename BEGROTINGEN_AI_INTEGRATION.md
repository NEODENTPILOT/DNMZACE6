# Begrotingen 2.0 AI Integration

## Overview

The Begrotingen (Budgets) module has been enhanced with comprehensive AI functionality to provide intelligent analysis, pricing insights, and workflow optimization for dental budgets and treatment planning.

## Features Implemented

### 1. AI Service (`src/services/begrotingenAI.ts`)

#### Core Functions:

**`getBudgetAISuggestions(context: BudgetAIContext)`**
- Provides context-aware suggestions for individual budgets
- Analyzes pricing ratios (honorarium/techniek/materiaal)
- Detects workflow issues (stale concepts, missing responses)
- Identifies documentation gaps (missing case links, behandelplannen)
- Suggests optimization opportunities
- Priority levels: urgent, high, medium, low
- Includes estimated savings and impact analysis

**`calculateBudgetHealthScore(context: BudgetAIContext)`**
- Comprehensive 5-metric health scoring system:
  - Pricing Accuracy (25%): Evaluates honorarium/techniek/materiaal ratios
  - Documentation Quality (20%): Checks case and behandelplan linkage
  - Approval Likelihood (25%): Predicts approval probability
  - Compliance Score (15%): Validates administrative requirements
  - Completeness (15%): Assesses UPT codes and behandelaar assignment
- Risk stratification: low/medium/high/critical
- Lists strengths, concerns, and actionable recommendations

**`getBudgetInsights(context: BudgetAIContext)`**
- Detailed pricing breakdown percentages
- Market comparison analysis (below/at/above/premium market)
- Approval prediction with positive/negative factors
- Optimization opportunities with potential savings
- Missing elements identification

**`analyzeBulkBudgets(budgets: BudgetAIContext[])`**
- Portfolio-wide analysis across all budgets
- Status distribution and approval rate metrics
- Pricing insights with outlier detection
- Revenue forecasting (pending, monthly, quarterly)
- Top actionable recommendations
- Integration with treatment plans without budgets

### 2. Enhanced BegrotingenV2 Page

#### Statistics Dashboard
- 5 key metric cards:
  - Total budgets count
  - Total portfolio value
  - Concept status count
  - Akkoord (approved) count
  - AI Analysis card (clickable to trigger analysis)

#### Treatment Plans Without Budgets Dashboard
- **Automatic Detection**: Queries database to find behandelplannen without associated begrotingen
- **Urgency Scoring System**:
  - Days old: 30+ days (+30), 14+ days (+20), 7+ days (+10)
  - Active status: +20 points
  - Color-coded priority indicators (red/orange/yellow)
- **Comprehensive Table View**:
  - Patient name
  - Case code (clickable to navigate to case)
  - Treatment plan name and goal
  - Category with color coding
  - Status badges
  - Priority reason explanation
  - Estimated value by category
  - Direct action button: "Maak Begroting"
- **Priority Reasons**:
  - "Zeer oud behandelplan zonder begroting" (30+ days)
  - "Actief behandelplan vereist begroting" (active status)
  - "Hoogwaardige behandeling" (high value)
  - "Begroting ontbreekt" (default)

#### Case Navigation
- Clickable case codes navigate directly to case detail page
- Format: `#/cases/{caseId}`
- Enables seamless workflow from budget dashboard to patient case

#### AI Portfolio Analysis Dashboard
- **Key Metrics Section**:
  - Total budgets with total value
  - Average budget value
  - Approval rate percentage
- **Pricing Insights Panel**:
  - Average honorarium ratio
  - Average techniek ratio
  - Average materiaal ratio
  - Outlier detection and count
- **Revenue Forecast Panel**:
  - Pending approval amount
  - Expected revenue this month
  - Expected revenue this quarter
- **AI Recommendations Section**:
  - Top 5 actionable recommendations
  - Numbered priority list
  - Based on portfolio-wide patterns

## Data Flow

### Treatment Plans Without Budgets Detection

```typescript
1. Load all behandelplannen with zorgplan and case data
2. For each behandelplan with case_id:
   a. Query begrotingen_v2 to check for existing budgets
   b. If count === 0, calculate urgency score
   c. Estimate value based on category
   d. Determine priority reason
3. Sort by urgency score (highest first)
4. Display in dashboard table
```

### Urgency Scoring Algorithm

```typescript
Base score: 50
+ Days old: >30 (+30), >14 (+20), >7 (+10)
+ Active status: +20
= Final urgency score (0-100)

Color coding:
- Red (urgent): score >= 80
- Orange (high): score >= 60
- Yellow (medium): score < 60
```

### Category Value Estimates

```typescript
Implantologie: €5,000
Prothetiek: €3,500
Orthodontie: €4,000
Chirurgie: €2,000
Parodontologie: €1,500
Restauratief: €1,200
Endodontie: €800
Preventief: €300
```

## User Interface

### Color Scheme
- Primary: Teal (consistent with DNMZ brand)
- Alert/Warning: Orange/Red for missing budgets
- Success: Green for approved budgets
- Info: Blue for analysis insights

### Dashboard Layout
1. Header with title and "Nieuwe Begroting" button
2. 5-card statistics row
3. Treatment plans without budgets (expandable)
4. AI analysis dashboard (triggered, dismissible)
5. Search and filters
6. Main budget list table

### Interaction Patterns
- Click case code → Navigate to case detail
- Click AI Analysis card → Trigger portfolio analysis
- Click "Maak Begroting" → Open budget composer with pre-filled case
- Click treatment plan row → (hover effect for visibility)

## Integration Points

### Database Tables Used
- `begrotingen_v2`: Main budget data
- `behandelplannen`: Treatment plans
- `zorgplannen`: Care plans (links behandelplannen to cases)
- `cases`: Patient cases
- `praktijk_locaties`: Practice locations
- `users`: Behandelaar information

### Key Queries
1. Load all budgets with joins to locations, users, and cases
2. Find behandelplannen without budgets (nested joins)
3. Count existing budgets per case

## Business Value

### Workflow Optimization
- Identifies treatment plans requiring budgets immediately
- Prioritizes urgent cases automatically
- Reduces administrative overhead

### Financial Insights
- Portfolio-level pricing analysis
- Revenue forecasting
- Optimization opportunities with savings estimates

### Quality Assurance
- Detects pricing outliers
- Ensures proper documentation
- Validates compliance requirements

### Proactive Management
- Flags stale concepts (>14 days)
- Tracks unanswered budget proposals (>14 days)
- Recommends follow-up actions

## Technical Implementation

### State Management
```typescript
const [bulkAnalysis, setBulkAnalysis] = useState<BulkBudgetAnalysis | null>(null);
const [treatmentPlansWithoutBudgets, setTreatmentPlansWithoutBudgets] = useState<TreatmentPlanWithoutBudget[]>([]);
const [showAnalysis, setShowAnalysis] = useState(false);
const [showTreatmentPlansDashboard, setShowTreatmentPlansDashboard] = useState(false);
```

### Performance Considerations
- Treatment plans loaded once on mount
- Bulk analysis triggered on-demand
- Efficient count queries for budget existence
- Sorted results for optimal UX

## Future Enhancements

1. Individual budget detail page with per-budget AI suggestions
2. Historical trend analysis for pricing
3. Machine learning-based approval prediction
4. Automated budget template generation from behandelplannen
5. Integration with UPT code pricing system
6. Budget comparison across similar treatment categories
7. Patient communication suggestions for follow-up

## Testing Scenarios

1. **No Treatment Plans Without Budgets**: Dashboard section hidden
2. **Multiple Missing Budgets**: Table shows sorted by urgency
3. **Case Navigation**: Clicking case code navigates correctly
4. **Empty Portfolio**: AI analysis handles zero budgets gracefully
5. **Outlier Detection**: Identifies extreme pricing ratios
6. **Revenue Forecasting**: Calculates based on pending approvals

## Conclusion

The Begrotingen 2.0 module now provides comprehensive AI-powered insights for budget management, with special emphasis on identifying and prioritizing treatment plans that require budgets. The dashboard enables seamless workflow from treatment plan to budget creation, with intelligent prioritization and case navigation.
