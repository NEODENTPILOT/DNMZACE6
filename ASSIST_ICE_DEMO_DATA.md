# DNMZ+ ASSIST ICE Demo Data Generator

## Overview

The ICE Demo Data Generator is a safe, repeatable system for creating test data to demonstrate the complete DNMZ+ ICE (Intelligent Care Engine) architecture.

## Purpose

- Provide realistic demo data for development and presentations
- Enable testing of Clinical Reasoning algorithms
- Populate Begrotingen 3.0 with sample budgets
- Demonstrate complete patient care workflows

## Features

### Safety First
- All test data is marked with `is_test = true`
- Clear naming conventions (prefixed with "TEST -")
- Isolated cleanup that never affects production data
- Idempotent script (can run multiple times safely)

### Complete Data Chain
Creates a full hierarchy:
```
Patients → Zorgplannen → Behandelplannen → Interventies → Begrotingen
```

## Usage

### Running the Script

```bash
npm run seed:ice-demo
```

The script will:
1. Clear any existing test data (is_test = true only)
2. Create 5 demo patients
3. Create 5 zorgplannen (care plans)
4. Create 8 behandelplannen (treatment plans)
5. Create interventions with UPT codes
6. Generate sample begrotingen with pricing

### Verification

After running the script, verify the data in:

1. **ICE+ HUB** (`/ice-hub`)
   - Shows 5 demo patients
   - Displays statistics per patient

2. **Care Hub** (`/patient-care-hub/:patientId`)
   - View zorgplannen and behandelplannen
   - See treatment plan details

3. **Clinical Reasoning** (`/clinical-reasoning-demo`)
   - Should show all 8 behandelplannen
   - Run reasoning checks to test algorithms

4. **Begrotingen 3.0** (`/begrotingen`)
   - View sample budgets
   - Test budget calculations

## Test Scenarios

### Scenario 1: Restauratieve Slijtage
**Patient**: TEST - Piet Bakker
**Zorgplan**: Functionele reconstructie – Ernstige slijtage
**Behandelplannen**:
- Conserverend herstel (composiet)
- Indirect herstel (onlays/kronen)

**UPT Codes**: V93, V94 (composiet vullingen)

### Scenario 2: Endodontie
**Patient**: TEST - Anna de Vries
**Zorgplan**: Endodontische behandeling + kroon
**Behandelplannen**:
- Acuut traject
- Definitieve endodontische behandeling

**UPT Codes**: E13, E14, E19, E63 (wortelkanaalbehandeling)

### Scenario 3: Chirurgie
**Patient**: TEST - Jan van Berg
**Zorgplan**: Complexe chirurgische ingreep
**Behandelplannen**:
- Incisie en drainage
- Complexe chirurgische ingreep

### Scenario 4: Preventie
**Patient**: TEST - Lisa Jansen
**Zorgplan**: Periodieke controle + preventie
**Behandelplannen**:
- Periodieke controle

**UPT Codes**: C002 (consult)

### Scenario 5: Volledige Rehabilitatie
**Patient**: TEST - Kees van der Meer
**Zorgplan**: Volledige rehabilitatie
**Behandelplannen**:
- Volledige rehabilitatie BKOK

## Cleanup

To remove all test data:

```typescript
// Manual cleanup via Supabase
const { error } = await supabase
  .from('patients')
  .delete()
  .eq('is_test', true);
```

Or simply run the seed script again - it automatically cleans up before creating fresh data.

## Database Schema

### Tables with is_test flag:
- `patients`
- `zorgplannen`
- `behandelplannen`
- `interventies`
- `begrotingen_v2`
- `begrotingen_v2_regels`
- `interventie_upt_codes`

## Development Notes

### Adding New Scenarios

To add new test scenarios, edit `scripts/seedIceDemoData.ts`:

1. Add patient to `createDemoPatients()`
2. Add zorgplan to `createDemoZorgplannen()`
3. Add behandelplannen to `createDemoBehandelplannen()`
4. Add interventies with UPT codes
5. Optionally add begrotingen

### Code System Reference

- **DX codes**: Diagnosis codes (e.g., DXEND003, DXCHI001)
- **TX codes**: Treatment plan codes (e.g., TXREST001, TXEND001)
- **IV codes**: Intervention codes (automatically generated)
- **CP codes**: Care plan codes (e.g., CPTEST001)
- **UPT codes**: Dutch dental tariff codes (e.g., E13, V93)

### UPT Codes Used

| Code | Description | Tariff |
|------|-------------|--------|
| C002 | Periodieke controle | €28.83 |
| E13 | Wortelkanaal 1 kanaal | €136.56 |
| E14 | Wortelkanaal 2 kanalen | €197.25 |
| E19 | Tijdelijk afsluiten | €22.76 |
| E63 | Toeslag calciumsilicaat | €56.90 |
| V93 | Drievlaksvulling composiet | €94.83 |
| V94 | Meervlaksvulling composiet | €121.38 |
| X11 | Röntgenfoto beoordelen | €15.93 |

## Safety Guarantees

- Never deletes data where `is_test = false`
- Uses proper foreign key cascade order
- Validates Supabase connection before operations
- Comprehensive error handling with rollback
- Clear logging at each step

## Troubleshooting

### Script fails with RLS policy violations
- **Solution**: Add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env file
- The seeding script needs elevated permissions to bypass RLS
- Service role key available in Supabase Dashboard → Settings → API
- Update .env:
  ```
  VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
  ```

### Script fails with "Failed to run sql query"
- Check that .env file exists with Supabase credentials
- Verify VITE_SUPABASE_URL and keys are set correctly

### No data visible after seeding
- Check that filters in UI don't exclude is_test = true
- Verify RLS policies allow access to test data
- Check browser console for any query errors

### "Column does not exist" errors
- Ensure migrations have been run
- Check that is_test columns were added successfully

## Future Enhancements

- Add more specialized scenarios (orthodontics, implantology)
- Include Y01 combination rules testing
- Add NZA-compliant scenarios
- Create patient journey scenarios (multiple visits)
- Add clinical reasoning test cases
- Generate patient photos/avatars
- Add appointment scheduling data

## Support

For issues or questions about the demo data system:
1. Check the logs in the console output
2. Verify .env configuration
3. Review the migration history
4. Check ASSIST_ICE_DEMO_DATA_REPORT.md for implementation details
