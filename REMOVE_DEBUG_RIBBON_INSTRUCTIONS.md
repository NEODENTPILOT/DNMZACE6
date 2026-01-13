# DEBUG RIBBON REMOVAL INSTRUCTIONS

## Quick Removal Checklist

When the debug ribbon is no longer needed, follow these steps:

### 1. Delete the Debug Component
```bash
rm src/components/clinidoc/DevDebugRibbon.tsx
```

### 2. Remove from IntegraleQuickscanForm.tsx

**Remove import (line ~17):**
```typescript
import { DevDebugRibbon } from './DevDebugRibbon';
```

**Remove ribbon JSX (lines ~306-316):**
```tsx
<DevDebugRibbon
  draftId={currentDraftId}
  encounterType="integrale_quickscan"
  careStrategy={advies?.zorgrichting || null}
  lastAutoSave={lastSaved}
  extraInfo={{
    completionPct: `${completionPercentage}%`,
    hasAllRequired: hasAllRequired ? 'YES' : 'NO',
  }}
/>
```

**Clean up console.log statements in autoSave function (lines ~220-225, ~237, ~240-243, ~252):**
```typescript
// REMOVE:
console.log('🔴 DEV DEBUG: Auto-save triggered', ...);
console.error('🔴 DEV DEBUG: Auto-save FAILED', ...);
console.log('🔴 DEV DEBUG: Auto-save SUCCESS', ...);
console.error('🔴 DEV DEBUG: Auto-save EXCEPTION', ...);
```

### 3. Remove from EncounterFormPremium.tsx

**Remove import (line ~20):**
```typescript
import { DevDebugRibbon } from './DevDebugRibbon';
```

**Remove ribbon JSX (lines ~243-253):**
```tsx
<DevDebugRibbon
  draftId={currentDraftId}
  encounterType={encounterId}
  careStrategy={null}
  lastAutoSave={lastSaved}
  extraInfo={{
    completionPct: `${completionPercentage}%`,
    hasAllRequired: hasAllRequired ? 'YES' : 'NO',
  }}
/>
```

**Remove completion calculation (lines ~238-239):**
```typescript
const completionPercentage = calculateCompletionPercentage(encounterDef, values);
const hasAllRequired = validationResult?.missingRequired.length === 0;
```

**Clean up console.log statements in autoSave function (lines ~105-110, ~122, ~125-128, ~137):**
```typescript
// REMOVE:
console.log('🔴 DEV DEBUG: Auto-save triggered', ...);
console.error('🔴 DEV DEBUG: Auto-save FAILED', ...);
console.log('🔴 DEV DEBUG: Auto-save SUCCESS', ...);
console.error('🔴 DEV DEBUG: Auto-save EXCEPTION', ...);
```

### 4. Delete This File
```bash
rm REMOVE_DEBUG_RIBBON_INSTRUCTIONS.md
```

---

## What the Debug Ribbon Does

The red debug ribbon shows:
- **Draft ID**: Current draft UUID (or "NO DRAFT")
- **Encounter Type**: Which encounter is active
- **Care Strategy**: Computed care direction (quickscan only)
- **Last Save**: Timestamp of last successful autosave
- **Completion %**: How complete the form is
- **Has All Required**: YES/NO indicator

Console logs show the full payload on every autosave trigger, success, or failure.

This helps catch:
- Silent autosave failures
- Missing draft IDs
- Incorrect care strategy computation
- State sync issues

---

**Implementation Date**: 2024-12-21
**Purpose**: Temporary development visibility during CliniDoc stabilization
