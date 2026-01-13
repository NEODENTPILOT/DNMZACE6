import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

// Use service role key for seeding (bypasses RLS)
// Falls back to anon key if service role not available
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

if (!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  Warning: VITE_SUPABASE_SERVICE_ROLE_KEY not found in .env');
  console.warn('⚠️  Seeding may fail due to RLS policies');
  console.warn('⚠️  Add service role key from Supabase Dashboard → Settings → API\n');
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  supabaseKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface DemoPatient {
  id: string;
  voornaam: string;
  achternaam: string;
  epd_nummer: string;
}

interface DemoZorgplan {
  id: string;
  patient_id: string;
  cp_code: string;
  titel: string;
}

interface DemoBehandelplan {
  id: string;
  zorgplan_id: string;
  patient_id: string;
  tx_code: string;
  titel: string;
  diagnose: string;
}

async function clearOldDemoData() {
  console.log('🧹 Clearing old test data...');

  await supabase.from('begrotingen_v2_regels').delete().eq('is_test', true);
  await supabase.from('begrotingen_v2').delete().eq('is_test', true);
  await supabase.from('interventie_upt_codes').delete().eq('is_test', true);
  await supabase.from('interventies').delete().eq('is_test', true);
  await supabase.from('behandelopties').delete().eq('is_test', true);
  await supabase.from('behandelplannen').delete().eq('is_test', true);
  await supabase.from('zorgplannen').delete().eq('is_test', true);
  await supabase.from('patients').delete().eq('is_test', true);

  console.log('✅ Old test data cleared');
}

async function createDemoPatients(): Promise<DemoPatient[]> {
  console.log('👥 Creating demo patients...');

  const patients = [
    {
      voornaam: 'TEST - Piet',
      tussenvoegsel: null,
      achternaam: 'Bakker',
      epd_nummer: 'EPD-TEST-001',
      geboortedatum: '1975-05-15',
      email: 'test.bakker@example.com',
      telefoon: '0612345678',
      is_test: true,
    },
    {
      voornaam: 'TEST - Anna',
      tussenvoegsel: 'de',
      achternaam: 'Vries',
      epd_nummer: 'EPD-TEST-002',
      geboortedatum: '1982-11-22',
      email: 'test.devries@example.com',
      telefoon: '0687654321',
      is_test: true,
    },
    {
      voornaam: 'TEST - Jan',
      tussenvoegsel: 'van',
      achternaam: 'Berg',
      epd_nummer: 'EPD-TEST-003',
      geboortedatum: '1968-03-10',
      email: 'test.vberg@example.com',
      telefoon: '0698765432',
      is_test: true,
    },
    {
      voornaam: 'TEST - Lisa',
      tussenvoegsel: null,
      achternaam: 'Jansen',
      epd_nummer: 'EPD-TEST-004',
      geboortedatum: '1990-07-18',
      email: 'test.jansen@example.com',
      telefoon: '0634567890',
      is_test: true,
    },
    {
      voornaam: 'TEST - Kees',
      tussenvoegsel: 'van der',
      achternaam: 'Meer',
      epd_nummer: 'EPD-TEST-005',
      geboortedatum: '1955-12-01',
      email: 'test.vandermeer@example.com',
      telefoon: '0623456789',
      is_test: true,
    },
  ];

  const { data, error } = await supabase.from('patients').insert(patients).select();

  if (error) {
    console.error('Error creating patients:', error);
    throw error;
  }

  console.log(`✅ Created ${data.length} demo patients`);
  return data;
}

async function createDemoZorgplannen(patients: DemoPatient[]): Promise<DemoZorgplan[]> {
  console.log('📋 Creating demo zorgplannen...');

  const zorgplannen = [
    {
      patient_id: patients[0].id,
      cp_code: 'CPTEST001',
      titel: 'TEST - Functionele reconstructie – Ernstige slijtage',
      status: 'actief',
      is_test: true,
    },
    {
      patient_id: patients[1].id,
      cp_code: 'CPTEST002',
      titel: 'TEST - Endodontische behandeling + kroon',
      status: 'actief',
      is_test: true,
    },
    {
      patient_id: patients[2].id,
      cp_code: 'CPTEST003',
      titel: 'TEST - Complexe chirurgische ingreep',
      status: 'actief',
      is_test: true,
    },
    {
      patient_id: patients[3].id,
      cp_code: 'CPTEST004',
      titel: 'TEST - Periodieke controle + preventie',
      status: 'actief',
      is_test: true,
    },
    {
      patient_id: patients[4].id,
      cp_code: 'CPTEST005',
      titel: 'TEST - Volledige rehabilitatie',
      status: 'actief',
      is_test: true,
    },
  ];

  const { data, error } = await supabase.from('zorgplannen').insert(zorgplannen).select();

  if (error) {
    console.error('Error creating zorgplannen:', error);
    throw error;
  }

  console.log(`✅ Created ${data.length} demo zorgplannen`);
  return data;
}

async function createDemoBehandelplannen(
  zorgplannen: DemoZorgplan[]
): Promise<DemoBehandelplan[]> {
  console.log('🩺 Creating demo behandelplannen...');

  const behandelplannen = [
    {
      zorgplan_id: zorgplannen[0].id,
      patient_id: zorgplannen[0].patient_id,
      tx_code: 'TXREST001',
      titel: 'TEST - Conserverend herstel',
      diagnose: 'DXFUN001',
      status: 'actief',
      kaak_scope: 'BKOK',
      is_test: true,
    },
    {
      zorgplan_id: zorgplannen[0].id,
      patient_id: zorgplannen[0].patient_id,
      tx_code: 'TXREST002',
      titel: 'TEST - Indirect herstel (onlays/kronen)',
      diagnose: 'DXFUN001',
      status: 'concept',
      kaak_scope: 'BKOK',
      is_test: true,
    },
    {
      zorgplan_id: zorgplannen[1].id,
      patient_id: zorgplannen[1].patient_id,
      tx_code: 'TXEND001',
      titel: 'TEST - Acuut endodontisch traject',
      diagnose: 'DXEND003',
      status: 'actief',
      kaak_scope: 'BK',
      is_test: true,
    },
    {
      zorgplan_id: zorgplannen[1].id,
      patient_id: zorgplannen[1].patient_id,
      tx_code: 'TXEND002',
      titel: 'TEST - Definitieve endodontische behandeling',
      diagnose: 'DXEND003',
      status: 'concept',
      kaak_scope: 'BK',
      is_test: true,
    },
    {
      zorgplan_id: zorgplannen[2].id,
      patient_id: zorgplannen[2].patient_id,
      tx_code: 'TXCHI001',
      titel: 'TEST - Incisie en drainage',
      diagnose: 'DXCHI001',
      status: 'afgerond',
      kaak_scope: 'OK',
      is_test: true,
    },
    {
      zorgplan_id: zorgplannen[2].id,
      patient_id: zorgplannen[2].patient_id,
      tx_code: 'TXCHI002',
      titel: 'TEST - Complexe chirurgische ingreep',
      diagnose: 'DXCHI001',
      status: 'actief',
      kaak_scope: 'OK',
      is_test: true,
    },
    {
      zorgplan_id: zorgplannen[3].id,
      patient_id: zorgplannen[3].patient_id,
      tx_code: 'TXPREV001',
      titel: 'TEST - Periodieke controle',
      diagnose: 'DXPREV001',
      status: 'actief',
      kaak_scope: 'BKOK',
      is_test: true,
    },
    {
      zorgplan_id: zorgplannen[4].id,
      patient_id: zorgplannen[4].patient_id,
      tx_code: 'TXREHAB001',
      titel: 'TEST - Volledige rehabilitatie BKOK',
      diagnose: 'DXDES001',
      status: 'concept',
      kaak_scope: 'BKOK',
      is_test: true,
    },
  ];

  const { data, error } = await supabase.from('behandelplannen').insert(behandelplannen).select();

  if (error) {
    console.error('Error creating behandelplannen:', error);
    throw error;
  }

  console.log(`✅ Created ${data.length} demo behandelplannen`);
  return data;
}

async function createDemoInterventies(behandelplannen: DemoBehandelplan[]) {
  console.log('💉 Creating demo interventies...');

  const interventies = [
    {
      behandelplan_id: behandelplannen[0].id,
      titel: 'Mock-up en diagnostiek',
      fase: 'kort',
      volgorde: 1,
      status: 'afgerond',
      is_test: true,
    },
    {
      behandelplan_id: behandelplannen[0].id,
      titel: 'Beetverhoging met composiet',
      fase: 'acuut',
      volgorde: 2,
      status: 'actief',
      is_test: true,
    },
    {
      behandelplan_id: behandelplannen[0].id,
      titel: 'Definitieve restauraties composiet',
      fase: 'lang',
      volgorde: 3,
      status: 'concept',
      is_test: true,
    },
    {
      behandelplan_id: behandelplannen[1].id,
      titel: 'Preparatie + tijdelijke voorziening',
      fase: 'kort',
      volgorde: 1,
      status: 'concept',
      is_test: true,
    },
    {
      behandelplan_id: behandelplannen[1].id,
      titel: 'Definitieve kronen plaatsen',
      fase: 'lang',
      volgorde: 2,
      status: 'concept',
      is_test: true,
    },
    {
      behandelplan_id: behandelplannen[2].id,
      titel: 'Pulpaextirpatie element 11',
      fase: 'acuut',
      volgorde: 1,
      status: 'afgerond',
      is_test: true,
    },
    {
      behandelplan_id: behandelplannen[2].id,
      titel: 'Tijdelijk afsluiten',
      fase: 'acuut',
      volgorde: 2,
      status: 'afgerond',
      is_test: true,
    },
    {
      behandelplan_id: behandelplannen[3].id,
      titel: 'Wortelkanaalbehandeling element 11',
      fase: 'lang',
      volgorde: 1,
      status: 'concept',
      is_test: true,
    },
    {
      behandelplan_id: behandelplannen[3].id,
      titel: 'Opbouw + kroon element 11',
      fase: 'lang',
      volgorde: 2,
      status: 'concept',
      is_test: true,
    },
    {
      behandelplan_id: behandelplannen[4].id,
      titel: 'Incisie en drainage abces',
      fase: 'acuut',
      volgorde: 1,
      status: 'afgerond',
      is_test: true,
    },
    {
      behandelplan_id: behandelplannen[5].id,
      titel: 'Extractie element 36',
      fase: 'acuut',
      volgorde: 1,
      status: 'actief',
      is_test: true,
    },
    {
      behandelplan_id: behandelplannen[6].id,
      titel: 'Periodieke controle',
      fase: 'normaal',
      volgorde: 1,
      status: 'actief',
      is_test: true,
    },
  ];

  const { data: insertedInterventies, error } = await supabase
    .from('interventies')
    .insert(interventies)
    .select();

  if (error) {
    console.error('Error creating interventies:', error);
    throw error;
  }

  console.log(`✅ Created ${insertedInterventies.length} demo interventies`);

  const interventieUptCodes = [
    { interventie_id: insertedInterventies[0].id, upt_code: 'X11', aantal: 1, is_test: true },
    { interventie_id: insertedInterventies[0].id, upt_code: 'C002', aantal: 1, is_test: true },
    { interventie_id: insertedInterventies[1].id, upt_code: 'V93', aantal: 4, is_test: true },
    { interventie_id: insertedInterventies[1].id, upt_code: 'V94', aantal: 2, is_test: true },
    { interventie_id: insertedInterventies[2].id, upt_code: 'V93', aantal: 8, is_test: true },
    { interventie_id: insertedInterventies[2].id, upt_code: 'V94', aantal: 6, is_test: true },
    { interventie_id: insertedInterventies[5].id, upt_code: 'E13', aantal: 1, element: '11', is_test: true },
    { interventie_id: insertedInterventies[6].id, upt_code: 'E19', aantal: 1, element: '11', is_test: true },
    { interventie_id: insertedInterventies[7].id, upt_code: 'E13', aantal: 1, element: '11', is_test: true },
    { interventie_id: insertedInterventies[7].id, upt_code: 'E63', aantal: 1, element: '11', is_test: true },
    { interventie_id: insertedInterventies[11].id, upt_code: 'C002', aantal: 1, is_test: true },
  ];

  const { error: uptError } = await supabase
    .from('interventie_upt_codes')
    .insert(interventieUptCodes);

  if (uptError) {
    console.error('Error creating interventie UPT codes:', uptError);
    throw uptError;
  }

  console.log(`✅ Created ${interventieUptCodes.length} UPT code mappings`);
}

async function createDemoBegrotingen(behandelplannen: DemoBehandelplan[], patients: DemoPatient[]) {
  console.log('💰 Creating demo begrotingen...');

  const patient0 = patients.find(p => p.id === behandelplannen[0].patient_id);
  const patient2 = patients.find(p => p.id === behandelplannen[2].patient_id);
  const patient3 = patients.find(p => p.id === behandelplannen[3].patient_id);

  const begrotingen = [
    {
      scope_type: 'plan',
      scope_ids: [behandelplannen[0].id],
      patient_id: behandelplannen[0].patient_id,
      patient_naam: `${patient0!.voornaam} ${patient0!.achternaam}`,
      titel: 'TEST - Begroting conserverend herstel',
      status: 'concept',
      totaal_honorarium: 850.0,
      totaal_techniek: 0,
      totaal_materiaal: 120.0,
      totaal_bedrag: 970.0,
      is_test: true,
    },
    {
      scope_type: 'plan',
      scope_ids: [behandelplannen[2].id],
      patient_id: behandelplannen[2].patient_id,
      patient_naam: `${patient2!.voornaam} ${patient2!.achternaam}`,
      titel: 'TEST - Begroting acuut endo',
      status: 'akkoord',
      totaal_honorarium: 180.0,
      totaal_techniek: 0,
      totaal_materiaal: 25.0,
      totaal_bedrag: 205.0,
      is_test: true,
    },
    {
      scope_type: 'plan',
      scope_ids: [behandelplannen[3].id],
      patient_id: behandelplannen[3].patient_id,
      patient_naam: `${patient3!.voornaam} ${patient3!.achternaam}`,
      titel: 'TEST - Begroting definitief endo + kroon',
      status: 'concept',
      totaal_honorarium: 650.0,
      totaal_techniek: 180.0,
      totaal_materiaal: 45.0,
      totaal_bedrag: 875.0,
      is_test: true,
    },
  ];

  const { data: insertedBegrotingen, error } = await supabase
    .from('begrotingen_v2')
    .insert(begrotingen)
    .select();

  if (error) {
    console.error('Error creating begrotingen:', error);
    throw error;
  }

  console.log(`✅ Created ${insertedBegrotingen.length} demo begrotingen`);

  const regels = [
    {
      begroting_id: insertedBegrotingen[0].id,
      source_type: 'upt',
      upt_code: 'V93',
      omschrijving: 'Drievlaksvulling composiet',
      hoeveelheid: 4,
      honorarium_bedrag: 94.83,
      is_techniek: false,
      techniek_bedrag: 0,
      is_materiaal: true,
      materiaal_bedrag: 15.0,
      totaal_bedrag: 439.32,
      actief: true,
      is_test: true,
    },
    {
      begroting_id: insertedBegrotingen[0].id,
      source_type: 'upt',
      upt_code: 'V94',
      omschrijving: 'Meervlaksvulling composiet',
      hoeveelheid: 2,
      honorarium_bedrag: 121.38,
      is_techniek: false,
      techniek_bedrag: 0,
      is_materiaal: true,
      materiaal_bedrag: 20.0,
      totaal_bedrag: 282.76,
      actief: true,
      is_test: true,
    },
    {
      begroting_id: insertedBegrotingen[1].id,
      source_type: 'upt',
      upt_code: 'E13',
      omschrijving: 'Wortelkanaalbehandeling 1 kanaal',
      hoeveelheid: 1,
      element: '11',
      honorarium_bedrag: 136.56,
      is_techniek: false,
      techniek_bedrag: 0,
      is_materiaal: true,
      materiaal_bedrag: 15.0,
      totaal_bedrag: 151.56,
      actief: true,
      is_test: true,
    },
    {
      begroting_id: insertedBegrotingen[1].id,
      source_type: 'upt',
      upt_code: 'E19',
      omschrijving: 'Tijdelijk afsluiten',
      hoeveelheid: 1,
      element: '11',
      honorarium_bedrag: 22.76,
      is_techniek: false,
      techniek_bedrag: 0,
      is_materiaal: true,
      materiaal_bedrag: 5.0,
      totaal_bedrag: 27.76,
      actief: true,
      is_test: true,
    },
    {
      begroting_id: insertedBegrotingen[2].id,
      source_type: 'upt',
      upt_code: 'E13',
      omschrijving: 'Wortelkanaalbehandeling 1 kanaal',
      hoeveelheid: 1,
      element: '11',
      honorarium_bedrag: 136.56,
      is_techniek: false,
      techniek_bedrag: 0,
      is_materiaal: true,
      materiaal_bedrag: 15.0,
      totaal_bedrag: 151.56,
      actief: true,
      is_test: true,
    },
    {
      begroting_id: insertedBegrotingen[2].id,
      source_type: 'upt',
      upt_code: 'E63',
      omschrijving: 'Toeslag calciumsilicaatcement',
      hoeveelheid: 1,
      element: '11',
      honorarium_bedrag: 56.9,
      is_techniek: false,
      techniek_bedrag: 0,
      is_materiaal: true,
      materiaal_bedrag: 10.0,
      totaal_bedrag: 66.9,
      actief: true,
      is_test: true,
    },
  ];

  const { error: regelsError } = await supabase.from('begrotingen_v2_regels').insert(regels);

  if (regelsError) {
    console.error('Error creating begroting regels:', regelsError);
    throw regelsError;
  }

  console.log(`✅ Created ${regels.length} demo begroting regels`);
}

async function seedDemoData() {
  console.log('\n🚀 Starting ICE Demo Data Generator...\n');

  try {
    await clearOldDemoData();

    const patients = await createDemoPatients();
    const zorgplannen = await createDemoZorgplannen(patients);
    const behandelplannen = await createDemoBehandelplannen(zorgplannen);
    await createDemoInterventies(behandelplannen);
    await createDemoBegrotingen(behandelplannen, patients);

    console.log('\n✨ Demo data seeded successfully! 🎉\n');
    console.log('📊 Summary:');
    console.log(`   • ${patients.length} test patients`);
    console.log(`   • ${zorgplannen.length} zorgplannen`);
    console.log(`   • ${behandelplannen.length} behandelplannen`);
    console.log(`   • Multiple interventies with UPT codes`);
    console.log(`   • 3 sample begrotingen with regels`);
    console.log('\n💡 You can now test:');
    console.log('   • ICE+ HUB → See demo patients with stats');
    console.log('   • Care Hub → View zorgplannen and behandelplannen');
    console.log('   • Clinical Reasoning → Analyze treatment plans');
    console.log('   • Begrotingen 3.0 → View and edit budgets\n');
  } catch (error) {
    console.error('\n❌ Error seeding demo data:', error);
    process.exit(1);
  }
}

seedDemoData();
