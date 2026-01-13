// Direct test script - no external imports
import 'dotenv/config';

const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ VITE_OPENAI_API_KEY not found in environment');
  process.exit(1);
}

async function callOpenAI(messages) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 1500
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function buildSystemPrompt() {
  return `Je bent een professionele tandartscommunicatie-assistent voor DNMZ, gespecialiseerd in het vertalen van klinische informatie naar begrijpelijke patiëntcommunicatie.

BELANGRIJKE RICHTLIJNEN:
1. Gebruik altijd een respectvolle, empathische en professionele toon
2. Vermijd jargon; leg medische termen uit in begrijpelijk Nederlands
3. Wees duidelijk en concreet, zonder onnodige angst te creëren
4. Focus op wat de patiënt kan doen en wat wij gaan doen
5. Geef realistische verwachtingen over tijdlijn en resultaat
6. Voor verwijzersrapportages: formeel en medisch precies

RISICO NIVEAU UITLEG:
- Laag: Geen bijzondere aandacht nodig, normale controle voldoende
- Verlaagd: Licht aandachtspunt, preventief monitoren
- Verhoogd: Actief monitoren en mogelijk behandelen
- Hoog: Direct actie vereist om verdere schade te voorkomen

ZORGRICHTINGEN:
- Behoud: Huidige situatie is goed, focus op behouden
- Veiligstellen: Stabiliseren om achteruitgang te voorkomen
- Tijdelijke Afbouw: Tijdelijke oplossing als tussenstap
- Afbouw: Structurele reconstructie nodig

KAAK-SCOPE:
- BK: Bovenkaak
- OK: Onderkaak
- BKOK: Beide kaken

ZORGTYPE STIJL:
- Spoed: Kort, direct, actiegericht
- Passant inloop: Informatief, adviserend, verwijzend naar huisarts indien nodig
- Passant verwezen: Respectvol naar verwijzer, volledig, professioneel
- Integraal: Uitgebreid, educatief, partnerschap-gericht`;
}

// TEST CASE 1
const testCase1 = {
  name: 'Integraal Zorgplan — Parodontitis + Cariësrisico',
  input: {
    diagnose: 'Parodontitis stadium III',
    bijkomeneDiagnoses: ['Actief cariësrisico hoog', 'Meerdere restauraties falen'],
    zorgrichtingGekozen: 'veiligstellen',
    zorgtype: 'integraal',
    hoogRisicoCount: 2,
    verhoogdRisicoCount: 2,
    behandelopties: [
      'Parodontale behandeling (scaling & root planing)',
      'Cariësbehandeling + restauraties',
      'Mondhygiëne instructie en preventief programma'
    ],
    geschatTotaal: 2450.00
  }
};

async function generateDiagnoseUitleg(input) {
  const prompt = `Genereer een patiëntvriendelijke uitleg van de diagnose.

DIAGNOSE: ${input.diagnose}
${input.bijkomeneDiagnoses?.length ? `BIJKOMENDE DIAGNOSES: ${input.bijkomeneDiagnoses.join(', ')}` : ''}

Schrijf een korte uitleg (2-3 alinea's) die:
1. Uitlegt wat er is vastgesteld
2. Waarom dit aandacht behoeft
3. Wat dit betekent voor de patiënt

Begin met: "Uit uw onderzoek blijkt dat..."

Gebruik begrijpelijk Nederlands zonder jargon.`;

  return await callOpenAI([
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: prompt }
  ]);
}

async function generatePatientUitleg(input) {
  const prompt = `Schrijf een complete patiëntuitleg die ALLE elementen samenbrengt.

ZORGTYPE: ${input.zorgtype}
DIAGNOSE: ${input.diagnose}
ZORGRICHTING: ${input.zorgrichtingGekozen}
HOOG RISICO: ${input.hoogRisicoCount} gebieden
VERHOOGD RISICO: ${input.verhoogdRisicoCount} gebieden
BEHANDELOPTIES: ${input.behandelopties.length}

Schrijf een samenhangend verhaal (3-5 alinea's) dat:
1. De diagnose introduceert
2. De risico's uitlegt
3. Het plan presenteert
4. Verwachtingen schept over tijdlijn en resultaat
5. Afsluit met een uitnodiging voor vragen

Gebruik GEEN kopjes, schrijf vloeiende tekst.
Stijl: Uitgebreid en educatief (integraal zorgplan).`;

  return await callOpenAI([
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: prompt }
  ]);
}

function printSection(title, content) {
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`📄 ${title}`);
  console.log('─'.repeat(80));
  console.log(content);
  console.log('─'.repeat(80));
}

async function runTest() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 ICE v1.0 AI COMMUNICATION GENERATOR — QUICK TEST');
  console.log('='.repeat(80));
  console.log(`\nTest Case: ${testCase1.name}\n`);

  console.log('📋 INPUT:');
  console.log(`   Diagnose: ${testCase1.input.diagnose}`);
  console.log(`   Bijkomend: ${testCase1.input.bijkomeneDiagnoses.join(', ')}`);
  console.log(`   Zorgrichting: ${testCase1.input.zorgrichtingGekozen}`);
  console.log(`   Zorgtype: ${testCase1.input.zorgtype}`);
  console.log(`   Risico: ${testCase1.input.hoogRisicoCount} hoog, ${testCase1.input.verhoogdRisicoCount} verhoogd`);
  console.log(`   Geschat: €${testCase1.input.geschatTotaal.toFixed(2)}\n`);

  console.log('🤖 Genereren diagnose uitleg...');
  const diagnoseUitleg = await generateDiagnoseUitleg(testCase1.input);
  printSection('1. DIAGNOSE UITLEG (Patiënt)', diagnoseUitleg);

  console.log('\n🤖 Genereren patiënt uitleg...');
  const patientUitleg = await generatePatientUitleg(testCase1.input);
  printSection('2. PATIËNT UITLEG (Volledig Narratief)', patientUitleg);

  console.log('\n' + '='.repeat(80));
  console.log('✅ TEST VOLTOOID');
  console.log('='.repeat(80));
  console.log('\nEvalueer de teksten hierboven op:');
  console.log('  ✓ Begrijpelijk Nederlands (geen jargon)');
  console.log('  ✓ Empathische en professionele toon');
  console.log('  ✓ Correcte medische informatie');
  console.log('  ✓ Complete coverage van input data');
  console.log('  ✓ Passende lengte (niet te kort, niet te lang)\n');
}

runTest().catch(error => {
  console.error('\n❌ TEST FAILED:', error.message);
  process.exit(1);
});
