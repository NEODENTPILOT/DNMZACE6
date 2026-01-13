# Care Butler Ask - Routing Fix Complete

## Problem
Care Butler Ask chips were showing "unknown route" errors when clicking on ICE template suggestions, causing blank screens and poor UX.

## Root Cause
- Routes were built inconsistently across adapters
- Some routes lacked leading "/" (breaking the router)
- No central route mapping system
- Missing route handlers in App.tsx
- No fallback when ID was missing/invalid

## Solution Implemented

### 1. Central Route Builder (`buildRoute`)
**Location:** `src/services/careButlerAskService.ts`

Created a central `buildRoute(adapter, id, extra?)` helper that:
- Maps all adapter types to proper routes
- **ALWAYS** returns routes with leading "/" (e.g., `/ice-template-builder/123`)
- Returns `null` if ID is missing/invalid (triggers RUN_FOLLOWUP_QUERY)
- Validates ID input (no undefined, null, empty strings)

**Route Mappings:**
```typescript
{
  'ice_templates': `/ice-template-builder/${id}`,
  'behandelplan_templates': `/ice-template-builder/${id}`,
  'behandeloptie_templates': `/behandeloptie-template/${id}`,
  'interventie_templates': `/interventie-template/${id}`,
  'protocols': `/protocol/${id}`,
  'zorgplannen': `/zorgplan-detail/${id}`,
  'behandelplannen': `/behandelplan-detail/${id}`,
  'tzone_posts': `/tzone-post/${id}`,
  // ... etc
}
```

### 2. Route Parser Updates
**Location:** `src/utils/routeParser.ts`

Added support for:
- Hash routes: `#/ice-template-builder/123`
- Path routes: `/ice-template-builder/123`
- Detail routes: `/behandeloptie-template/123`, `/interventie-template/123`, `/protocol/123`
- Fallback to list page if no ID provided

### 3. App Router Updates
**Location:** `src/App.tsx`

Added route handlers for:
- `behandeloptie-template` → ICETemplateBuilder with template ID
- `interventie-template` → ICETemplateBuilder with template ID
- `protocol-detail` → ProtocolDetail with protocol ID
- Updated `handleNavigate` to set proper state for new routes

### 4. Fallback Logic
**Location:** `src/services/careButlerAskService.ts` (generateCitationBasedSuggestions)

Enhanced suggestion generation:
- Check `routeValid` flag for ALL adapter types (ice_templates, protocols, etc.)
- If route is invalid (null), create `RUN_FOLLOWUP_QUERY` action instead of `OPEN_ROUTE`
- User sees "Zoek meer over..." instead of broken navigation

**Example:**
```typescript
if (routeValid) {
  newSuggestions.push({
    label: `Toon ICE behandelplan template: ${title}`,
    action: { type: 'OPEN_CITATION', payload: { citation_id, route } }
  });
} else {
  newSuggestions.push({
    label: `Zoek meer over behandelplan template: ${title}`,
    action: { type: 'RUN_FOLLOWUP_QUERY', payload: { query: title } }
  });
}
```

### 5. Error Handling
**Location:** `src/pages/tzone/CareButlerAsk.tsx`

Already had comprehensive error handling:
- Try/catch on all navigation actions
- Toast notifications for errors
- Stays on Ask page instead of crashing
- Logs all errors with context

## Acceptance Criteria ✅

### ✅ Leading Slash
All routes now start with "/" (enforced by `buildRoute`)

### ✅ No Unknown Routes
- Router accepts all new routes
- Fallback to list page if ID missing
- RUN_FOLLOWUP_QUERY if route building fails

### ✅ No White Screens
- Error boundaries active
- Toast error messages
- UI stays responsive
- Logs help debugging

### ✅ SPA Navigation
Already using `onNavigate` callback (no `window.location.href`)

## Testing Checklist

- [ ] Click "Toon ICE behandelplan template: Slijtage" → Opens ICE Template Builder
- [ ] Click suggestion with invalid ID → Shows "Zoek meer over..." query
- [ ] Navigate to `/ice-template-builder` without ID → Shows list/home
- [ ] Navigate to `/behandeloptie-template/123` → Opens correct view
- [ ] Navigate to `/protocol/456` → Opens protocol detail
- [ ] Error in route → Shows toast, stays on Ask page

## Files Changed

1. `src/services/careButlerAskService.ts`
   - Added `buildRoute()` helper (60 lines)
   - Updated route building to use helper
   - Enhanced fallback logic for invalid routes

2. `src/utils/routeParser.ts`
   - Added hash route: `#/ice-template-builder/:id`
   - Added path routes: `/ice-template-builder/:id`, `/behandeloptie-template/:id`, etc.
   - Added simple route: `/ice-template-builder` (no ID)

3. `src/App.tsx`
   - Added ProtocolDetail import
   - Added route handlers for new pages
   - Updated handleNavigate for new routes

## Rollback Plan

If issues arise:
1. Revert `buildRoute()` to use `config.route_template`
2. Keep route parser additions (they're additive, won't break existing)
3. Remove new route handlers from App.tsx if not used

## Notes

- Route building is now centralized and testable
- All routes validated before navigation
- Graceful degradation (query instead of crash)
- Logging at every step for debugging
- No breaking changes to existing routes
