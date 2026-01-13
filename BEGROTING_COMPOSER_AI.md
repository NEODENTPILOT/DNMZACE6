# Begroting Composer 2025 AI Integration

## Overview

The Begroting Composer modal has been enhanced with comprehensive AI functionality to provide real-time intelligent analysis, health scoring, and optimization suggestions during budget creation and editing.

## Layout Fixes Implemented

### Case Selection Field
**Issue**: The "Case kiezen" button was floating outside its column due to flex layout issues.

**Solution**: Restructured the Case field layout:
- Input field now takes full width
- "Case kiezen" button placed below the input field
- Button has full width with proper spacing (mt-2)
- Improved visual hierarchy and accessibility
- Disabled state properly handled when case is pre-selected

```tsx
<div>
  <label>Case</label>
  <input
    type="text"
    value={header.caseCode ? `#${header.caseCode}` : ''}
    placeholder="Geen case gekoppeld"
    readOnly
    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
  />
  <button
    onClick={() => setIsCasePickerOpen(true)}
    disabled={!!caseId}
    className="w-full mt-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
  >
    Case kiezen
  </button>
</div>
```

## AI Features Implemented

### 1. Real-Time Budget Analysis

**AI Analysis Button**
- Prominent gradient button (teal to blue)
- Only visible when budget lines exist
- Shows loading state during analysis
- Positioned between Totals and Discount sections

**Trigger Conditions**:
- Minimum 1 budget line required
- Calculates totals automatically
- Analyzes pricing ratios in real-time

### 2. AI Analysis Function

```typescript
async function performAIAnalysis() {
  // Validates budget has lines
  // Calculates current totals
  // Builds context from header and lines
  // Calls three AI services in parallel:
  //   - getBudgetAISuggestions()
  //   - calculateBudgetHealthScore()
  //   - getBudgetInsights()
  // Displays results in AI Insights panel
}
```

### 3. Enhanced Totals Section

**Pricing Ratios Display**
- Shows honorarium percentage
- Shows techniek percentage
- Shows materiaal percentage
- Automatically calculated from totals
- Visible only when total > 0

Format: `{ratio}%` with 1 decimal precision

**Color Scheme**:
- Primary total: Teal-600 (matches DNMZ brand)
- Ratios: Gray-600 text with medium font weight
- Clean, professional appearance

### 4. AI Insights Panel

Comprehensive collapsible panel showing:

#### Health Score
- Overall score (0-100) with color-coded display
- Visual progress bar with risk-level colors:
  - Green (low risk): >= 80
  - Yellow (medium risk): 60-79
  - Orange (high risk): 40-59
  - Red (critical risk): < 40
- Real-time calculation based on 5 metrics

#### Approval Likelihood
- Percentage prediction of budget approval
- Based on multiple factors (pricing, documentation, completeness)
- Displayed in green with prominent font

#### Top Suggestions (Max 3)
- Priority-based recommendations
- Color-coded by urgency:
  - Red background: Urgent
  - Orange background: High priority
  - Yellow background: Medium priority
- Each suggestion shows:
  - Alert icon with matching color
  - Title (bold)
  - Description
  - Confidence level (implicit in priority)

#### Optimization Opportunities
- Shows potential cost savings
- Listed by area (honorarium, techniek, materiaal)
- Displays euro amount savings
- Green background indicating positive action
- Includes recommendations

### 5. Integration with AI Service

**Context Building**:
```typescript
const context = {
  budget_id: header.id,
  case_id: header.caseId,
  case_code: header.caseCode,
  patient_naam: header.patientNaam,
  locatie: header.locatieNaam,
  behandelaar: header.behandelaarNaam,
  status: header.status,
  totaal_honorarium: totals.totalHonorarium,
  totaal_techniek: totals.totalTechniek,
  totaal_materiaal: totals.totalMateriaal,
  totaal_bedrag: totals.totalBedrag,
  created_days_ago: daysOld,
  upt_codes_count: lines.length
};
```

**Parallel API Calls**:
- All three AI functions called simultaneously using `Promise.all()`
- Optimizes performance
- Single loading state for better UX

## Visual Design Updates

### Theme Consistency
Updated all colors to match DNMZ teal branding:
- Header background: `from-teal-50 to-white`
- Calculator icon: `bg-teal-100` with `text-teal-600`
- Primary buttons: `bg-teal-600` with hover `bg-teal-700`
- UPT-code button: `bg-teal-100 text-teal-700`
- Total amount: `text-teal-600`
- Case button: `bg-teal-100 text-teal-700`
- AI Analysis button: Gradient `from-teal-500 to-blue-500`

### Component Organization

**Left Column (3 cols)**: Context fields
- Patient name
- Birth date
- Case (with full-width button below)
- Location
- Behandelaar
- Title
- Internal notes

**Middle Column (6 cols)**: Budget lines
- Add buttons (UPT-code, Standaardset, Verrichting)
- Line items with editing capability
- Delete functionality

**Right Column (3 cols)**: Totals & AI
- Totals summary with ratios
- AI Analysis button
- AI Insights panel (collapsible)
- Discount section

## User Workflow

### Creating New Budget
1. Fill context fields (patient, case, location, behandelaar, title)
2. Add budget lines via UPT codes, sets, or procedures
3. Review totals and pricing ratios
4. Click "AI Analyse" button
5. Review AI suggestions and health score
6. Apply optimizations if recommended
7. Adjust discount if needed
8. Save as concept or definitief

### Editing Existing Budget
1. Modal loads with existing data
2. Modify lines as needed
3. Run AI analysis to validate changes
4. Review updated suggestions
5. Save changes

### AI-Guided Optimization
1. Run initial AI analysis
2. Review suggestions (top 3 displayed)
3. Check optimization opportunities
4. Implement recommended changes
5. Re-run analysis to see improvement
6. Monitor health score increase

## Error Handling

- Validates lines exist before analysis
- Shows alert if analysis attempted with 0 lines
- Gracefully handles API errors
- Loading states prevent multiple simultaneous analyses
- Panel can be closed/reopened without re-analysis

## State Management

```typescript
// AI-specific state
const [aiSuggestions, setAiSuggestions] = useState<BudgetAISuggestion[]>([]);
const [healthScore, setHealthScore] = useState<BudgetHealthScore | null>(null);
const [insights, setInsights] = useState<BudgetInsights | null>(null);
const [loadingAI, setLoadingAI] = useState(false);
const [showAIPanel, setShowAIPanel] = useState(false);
```

## Performance Considerations

- AI analysis only runs on-demand (not automatic)
- Parallel API calls minimize wait time
- Results cached until panel closed
- No continuous polling or updates
- Efficient context building from existing state

## Future Enhancements

1. **Auto-save AI recommendations**: Store suggestions with budget
2. **Historical analysis**: Track health score improvements over time
3. **Smart defaults**: Pre-fill based on AI analysis of similar cases
4. **Predictive pricing**: Suggest optimal pricing before adding lines
5. **Comparison mode**: Compare multiple budget versions side-by-side
6. **Export AI report**: Generate PDF with analysis results
7. **Real-time warnings**: Alert during editing if ratios become abnormal
8. **Integration with patient history**: Factor in previous budgets
9. **Market benchmarking**: Compare with similar practices
10. **Learning system**: Improve suggestions based on approval outcomes

## Technical Notes

- Uses TypeScript for type safety
- AI service functions are imported from `../services/begrotingenAI.ts`
- All icons from `lucide-react`
- Tailwind CSS for styling with custom gradients
- Modal is fully responsive
- Sticky positioning for sidebar sections
- Proper accessibility with disabled states

## Conclusion

The Begroting Composer modal now provides comprehensive AI-powered assistance for budget creation and optimization, with a fixed layout for the Case selection field and enhanced visual design matching DNMZ branding. The real-time analysis helps users create better, more compliant budgets with higher approval likelihood and optimal pricing structures.
