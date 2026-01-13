
## Conditional Flow Logging

The system includes explicit logging for conditional UI rendering:

### Temporiseerde Afbouw Flow

**Condition:** `careStrategy === "temporiseerde_afbouw"`

When this condition evaluates:
- ✅ **MET**: Console logs "CONDITION MET" and renders:
  - Element Diagnosis & Prognosis Schema
  - Zorgdoelen Panel
  - AI Behandelplan Generator

- ❌ **NOT MET**: Console logs "CONDITION NOT MET" and renders nothing (no placeholder UI)

**Console Output Example:**
```
🔍 CLINIDOC DEBUG: IntegraleQuickscanForm
⏰ Timestamp: 2024-12-21T...
🎬 Action: CONDITIONAL_FLOW_EVALUATION
📦 Data: {
  careStrategy: "temporiseerde_afbouw",
  conditionMet: true,
  extendedWorkflowActive: true,
  message: "✅ CONDITION MET: Rendering extended workflow..."
}
```

This ensures conditional logic is never invisible - all flow decisions are logged explicitly.

  - ✅ Conditional flow logging (temporiseerde_afbouw)