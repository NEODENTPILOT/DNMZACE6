# CliniDoc Conditional Flow Implementation

## Overview

Implemented strict conditional rendering in the IntegraleQuickscanForm based on computed care strategy.

## The Condition

```typescript
IF careStrategy === "temporiseerde_afbouw"
  THEN render extended workflow
  ELSE render nothing (no placeholder UI)
```

## Implementation Details

### Location
`src/components/clinidoc/IntegraleQuickscanForm.tsx`

### Conditional Block (lines 391-462)
```tsx
{advies?.zorgrichting === 'temporiseerde_afbouw' && (() => {
  // DEBUG: Log activation
  debugLog('CONDITIONAL_FLOW_ACTIVE', {
    careStrategy: 'temporiseerde_afbouw',
    trigger: 'User care direction requires extended treatment planning workflow',
    sections: ['diagnosis_schema', 'zorgdoelen_panel', 'ai_behandelplan_generator'],
  });

  return (
    <>
      {/* Section 1: Element Diagnosis & Prognosis Schema */}
      {/* Section 2: Zorgdoelen Panel */}
      {/* Section 3: AI Behandelplan Generator */}
    </>
  );
})()}
```

### Evaluation Logging (lines 280-294)
```tsx
useEffect(() => {
  if (advies) {
    const isTemporiseerdAfbouw = advies.zorgrichting === 'temporiseerde_afbouw';

    debugLog('CONDITIONAL_FLOW_EVALUATION', {
      careStrategy: advies.zorgrichting,
      conditionMet: isTemporiseerdAfbouw,
      extendedWorkflowActive: isTemporiseerdAfbouw,
      message: isTemporiseerdAfbouw
        ? '✅ CONDITION MET: Rendering extended workflow...'
        : '❌ CONDITION NOT MET: Extended workflow hidden...',
    });
  }
}, [advies, debugLog]);
```

## Sections Rendered (When Condition Met)

### 1. Element Diagnosis & Prognosis Schema
- **Purpose**: Detailed element-level diagnosis and prognosis analysis
- **UI**: Amber-themed card with warning context
- **Status**: Placeholder (implementation pending)

### 2. Zorgdoelen Panel
- **Purpose**: Define specific care goals for temporizing reduction phase
- **UI**: Green-themed card for goal definition
- **Status**: Placeholder (implementation pending)

### 3. AI Behandelplan Generator
- **Purpose**: AI-generated detailed treatment plan based on diagnosis and goals
- **UI**: Purple-gradient premium card with AI branding
- **Status**: Placeholder (implementation pending)

## Behavior

### When `careStrategy === "temporiseerde_afbouw"`
1. Console logs: `CONDITIONAL_FLOW_EVALUATION` with ✅ CONDITION MET
2. Console logs: `CONDITIONAL_FLOW_ACTIVE` with section details
3. Renders all 3 sections below the AI advice panel
4. Debug ribbon shows: `careStrategy: temporiseerde_afbouw`

### When `careStrategy !== "temporiseerde_afbouw"`
1. Console logs: `CONDITIONAL_FLOW_EVALUATION` with ❌ CONDITION NOT MET
2. Renders nothing (clean UI, no placeholders)
3. Form proceeds normally to document generation
4. Debug ribbon shows actual strategy value (e.g., `behoud`, `afbouw`)

## Console Output Examples

### Condition Met
```
🔍 CLINIDOC DEBUG: IntegraleQuickscanForm
⏰ Timestamp: 2024-12-21T10:30:45.123Z
🎬 Action: CONDITIONAL_FLOW_EVALUATION
📦 Data: {
  careStrategy: "temporiseerde_afbouw",
  conditionMet: true,
  extendedWorkflowActive: true,
  message: "✅ CONDITION MET: Rendering extended workflow (diagnosis schema, zorgdoelen, AI generator)"
}

🔍 CLINIDOC DEBUG: IntegraleQuickscanForm
⏰ Timestamp: 2024-12-21T10:30:45.124Z
🎬 Action: CONDITIONAL_FLOW_ACTIVE
📦 Data: {
  careStrategy: "temporiseerde_afbouw",
  trigger: "User care direction requires extended treatment planning workflow",
  sections: ["diagnosis_schema", "zorgdoelen_panel", "ai_behandelplan_generator"]
}
```

### Condition Not Met
```
🔍 CLINIDOC DEBUG: IntegraleQuickscanForm
⏰ Timestamp: 2024-12-21T10:30:45.123Z
🎬 Action: CONDITIONAL_FLOW_EVALUATION
📦 Data: {
  careStrategy: "behoud",
  conditionMet: false,
  extendedWorkflowActive: false,
  message: "❌ CONDITION NOT MET: Extended workflow hidden (no placeholder UI)"
}
```

## Key Features

✅ **Explicit condition**: Single boolean check, no complex logic
✅ **Debug logging**: Both evaluation and activation logged separately
✅ **No placeholder pollution**: When condition not met, nothing renders
✅ **Visual feedback**: Debug ribbon always shows current care strategy
✅ **Console visibility**: Every flow decision explicitly logged
✅ **Maintainable**: Clear IIFE pattern, easy to extend or remove

## Future Implementation

The 3 placeholder sections need to be replaced with:
1. Interactive element diagnosis form with prognosis selectors
2. Zorgdoelen editor with SMART goal framework
3. AI service integration for automated treatment plan generation

Each section should integrate with the existing autosave system and maintain the same premium UI/UX standards.

## Integration Points

- **Autosave**: Extended workflow data should be included in draft payload
- **Validation**: Additional required fields when temporiseerde_afbouw active
- **Document generation**: Include extended workflow data in clinical note
- **State management**: Extended workflow values stored in main `values` object

---

*Implementation completed: 2024-12-21*
*This is a production-ready conditional flow with full debug support*
