# PILOT BACKLOG - Prioritized Feature Checklist

**Status:** Pilot Focus Mode Active
**Last Updated:** 2024-12-25

---

## 🔴 P0 - CRITICAL FOR PILOT (Must Have)

### 1. User Management + Invite Flow + Roles + Locations

**Status:** 🟡 Partially Complete

- [x] Database: RBAC system (roles, permissions, user_roles)
- [x] Database: users table met rol field
- [x] Database: praktijk_locaties table
- [x] Database: user_locaties junction table
- [ ] **Frontend: User invite flow**
  - [ ] Invite modal met email input
  - [ ] Rol selectie (8 rollen)
  - [ ] Locatie(s) selectie (Almelo/Raalte/Beide)
  - [ ] Invite link genereren
  - [ ] Send invite (email integratie of copy link)
- [ ] **Frontend: User list/overview**
  - [ ] Tabel met alle users
  - [ ] Filter op rol
  - [ ] Filter op locatie
  - [ ] Edit user (rol/locaties wijzigen)
  - [ ] Deactivate user
- [ ] **Frontend: Role management view**
  - [ ] Overview van alle rollen
  - [ ] Permissions per rol tonen
  - [ ] Admin-only toegang
- [ ] **RLS Policies verifiëren**
  - [ ] Users kunnen alleen eigen data + team data zien
  - [ ] Location-based access control werkt
  - [ ] Role-based access control werkt

**Priority Actions:**
1. Build invite modal component (email + rol + locatie select)
2. Create user management page (list/edit/deactivate)
3. Test RLS policies met verschillende rollen
4. Test multi-location access scenarios

---

### 2. Onboarding (Templates, Instances, Auto-start, Quizzes + AI Tutor)

**Status:** 🟡 Partially Complete

- [x] Database: onboarding_templates table
- [x] Database: onboarding_instances table
- [x] Database: onboarding_template_steps table
- [x] Database: instance_step_responses table
- [x] Database: Seeded templates (Tandarts AIO, Mondhygiënist, etc.)
- [x] Frontend: HQOnboarding page exists
- [ ] **Auto-start onboarding bij nieuwe user**
  - [ ] Trigger na user invite accept
  - [ ] Juiste template selecteren op basis van rol
  - [ ] Instance aanmaken + starten
- [ ] **Onboarding UI improvements**
  - [ ] Step progress indicator (1/10, 2/10, etc.)
  - [ ] Vorige/Volgende knoppen
  - [ ] Quiz vragen tonen met multiple choice
  - [ ] Score tracking (correct/incorrect)
- [ ] **AI Tutor Helper integratie**
  - [ ] Chat interface tijdens onboarding
  - [ ] Context: huidige step + template info
  - [ ] Hints geven bij quiz vragen
  - [ ] Feedback op antwoorden
- [ ] **Completion flow**
  - [ ] Certificate genereren
  - [ ] Manager notificatie
  - [ ] User profile update (onboarding completed badge)

**Priority Actions:**
1. Implement auto-start trigger (user invite → template select → instance create)
2. Build step-by-step UI with progress
3. Add quiz functionality with scoring
4. Integrate AI tutor chat panel
5. Test complete flow: invite → onboarding → completion

---

### 3. T-ZONE Feed, Zones/Circles, Quick Posts (Simple)

**Status:** 🟢 Mostly Complete

- [x] Database: timeline_events table
- [x] Database: tzone_zones table
- [x] Database: tzone_circles table
- [x] Database: tzone_circle_members table
- [x] Frontend: TZone feed page
- [x] Frontend: TZoneZones page
- [x] Frontend: TZonePost detail page
- [x] Frontend: TZoneNewPost page
- [ ] **Quick Post improvements**
  - [ ] Simplified post composer (geen modal, inline)
  - [ ] Intent chips (Nieuws/Update/Vraag/Ticket/etc.)
  - [ ] Locatie select (Almelo/Raalte/Beide)
  - [ ] @mention support (tagged_user_ids)
  - [ ] Image upload (link naar media storage)
- [ ] **Feed filtering**
  - [ ] Filter op intent type
  - [ ] Filter op locatie
  - [ ] Filter op circle
  - [ ] Search/zoek functie
- [ ] **Reactions & Comments**
  - [ ] Quick reactions (emoji)
  - [ ] Comment thread (parent_event_id)
  - [ ] Nested replies (max 3 levels)

**Priority Actions:**
1. Simplify post composer (remove unnecessary modals)
2. Add intent selector to post form
3. Implement basic filtering (locatie + intent)
4. Test multi-location posts (beide → 2 rows)
5. Verify reactions & comments work

---

### 4. Inventory Basics (View/Update/Low Stock)

**Status:** 🟡 Partially Complete

- [x] Database: assets table
- [x] Database: asset_categories table
- [x] Database: maintenance_logs table
- [x] Frontend: Inventaris page exists
- [x] Frontend: AssetDetail page exists
- [ ] **Inventory overview improvements**
  - [ ] Filter op categorie
  - [ ] Filter op locatie
  - [ ] Filter op status (actief/maintenance/retired)
  - [ ] Low stock warning indicator
  - [ ] Sort by: naam, SKU, laatst gebruikt
- [ ] **Quick update functie**
  - [ ] Inline quantity edit
  - [ ] Status change (1-click)
  - [ ] Add to maintenance log (quick action)
- [ ] **Low stock alerts**
  - [ ] Dashboard widget "Low Stock Items"
  - [ ] Threshold instellen per asset
  - [ ] Email notificatie (optional)
  - [ ] Restock reminder system
- [ ] **QR code scanning**
  - [ ] Test QR scanner pagina
  - [ ] Asset detail via QR
  - [ ] Quick actions via QR (check-in/out)

**Priority Actions:**
1. Add low stock threshold field to assets
2. Build dashboard widget voor low stock items
3. Implement quick update actions (inline edit)
4. Test QR code flow end-to-end
5. Add filtering & sorting to inventory page

---

## 🟡 P1 - HIGH PRIORITY (Should Have)

### 5. Tasks

**Status:** 🟢 Mostly Complete

- [x] Database: tasks table
- [x] Frontend: Taken page
- [ ] **Task improvements**
  - [ ] Assign to user (assigned_to field)
  - [ ] Due date tracking
  - [ ] Priority indicator (high/medium/low)
  - [ ] Task categories
  - [ ] Recurring tasks support
- [ ] **Task notifications**
  - [ ] Dashboard widget "My Tasks"
  - [ ] Overdue tasks highlight
  - [ ] Task completion notifications

**Priority Actions:**
1. Add task assignment feature
2. Build "My Tasks" dashboard widget
3. Implement due date & priority sorting

---

### 6. Messages Timeline

**Status:** 🟢 Complete (via T-ZONE Feed)

- [x] Database: timeline_events (event_type = 'message')
- [x] Frontend: Berichten page
- [ ] **Refinements**
  - [ ] Direct messages (1-on-1)
  - [ ] Group messages
  - [ ] Read receipts
  - [ ] Message search

**Priority Actions:**
1. Evaluate if additional messaging features needed beyond T-ZONE
2. Consider unifying with T-ZONE feed

---

## 🔵 P2 - FUTURE ENHANCEMENTS (Nice to Have)

### 7. Care Butler Full AI

**Status:** 🟠 ON HOLD (Pilot Focus)

- [x] Basic implementation complete
- [x] Route working (hidden from menu)
- [ ] **On hold until P0/P1 complete**
- [ ] OpenAI integration for better analysis
- [ ] ICE templates/workflows search integration
- [ ] Learning from user overrides
- [ ] Smart title generation
- [ ] Auto-tagging suggestions

**Unfreeze Criteria:**
- P0 features 100% complete and tested
- P1 features 80%+ complete
- Explicit user request to unfreeze

---

### 8. Advanced AI Orchestration

**Status:** 🔴 Not Started

- [ ] Multi-step AI reasoning chains
- [ ] Context-aware suggestions across modules
- [ ] Predictive maintenance alerts (AI-driven)
- [ ] Smart scheduling optimization
- [ ] Natural language querying

---

### 9. Full ICE Reasoning Chains

**Status:** 🟡 Partially Complete (Template System Done)

- [x] Database: ICE templates (behandelplannen)
- [x] Database: Diagnoses, interventies, care requirements
- [x] Frontend: ICE template builder
- [ ] **Clinical reasoning enhancements**
  - [ ] Multi-step treatment planning
  - [ ] Risk assessment integration
  - [ ] Cost-benefit analysis automation
  - [ ] Evidence-based recommendations
  - [ ] Treatment outcome predictions

---

## 📊 Progress Summary

| Priority | Category | Status | Completion |
|----------|----------|--------|------------|
| P0 | User Management | 🟡 In Progress | 40% |
| P0 | Onboarding | 🟡 In Progress | 50% |
| P0 | T-ZONE | 🟢 Mostly Done | 85% |
| P0 | Inventory | 🟡 In Progress | 60% |
| P1 | Tasks | 🟢 Mostly Done | 75% |
| P1 | Messages | 🟢 Complete | 95% |
| P2 | Care Butler | 🟠 On Hold | 70% |
| P2 | AI Orchestration | 🔴 Not Started | 0% |
| P2 | Full ICE | 🟡 Partial | 30% |

**Overall Pilot Readiness:** 58% (P0 focus: 59%)

---

## 🎯 Next Sprint Actions (Priority Order)

1. **User Invite Flow** - Build invite modal + email/link generation
2. **Auto-start Onboarding** - Trigger onboarding na invite accept
3. **Onboarding Step UI** - Progress indicator + quiz functionaliteit
4. **Low Stock Alerts** - Dashboard widget + threshold system
5. **Quick Post Improvements** - Intent selector + locatie handling
6. **Task Assignment** - Assign tasks to users + dashboard widget
7. **AI Tutor Integration** - Chat panel during onboarding steps

---

## 🚫 Frozen Features

**Do NOT work on these until explicitly unfrozen:**

- Care Butler full implementation
- Advanced AI features
- Complex ICE reasoning chains
- Non-essential T-ZONE features (beyond quick posts)

**To Unfreeze:**
User must explicitly say "unfreeze [feature name]" in a prompt.

---

## 📝 Notes

- PILOT_FOCUS_MODE = true in featureFlags.ts
- Care Butler remains accessible via direct route (not in menu)
- All P0 features must be production-ready before pilot launch
- Target pilot users: 5-10 team members (Almelo + Raalte)
- Timeline: Complete P0 within 2 weeks, P1 within 4 weeks

---

**Last Review:** 2024-12-25
**Next Review:** Every 3 days until P0 complete
