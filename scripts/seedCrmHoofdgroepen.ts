import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedCrmHoofdgroepen() {
  console.log('🌱 Seeding CRM Hoofdgroepen...\n');

  const hoofdgroepen = [
    {
      naam: 'Zorginhoudelijk',
      label: 'Zorginhoudelijk',
      icon_name: 'Stethoscope',
      color_from: 'from-blue-500',
      color_to: 'to-blue-600',
      bg_color: 'bg-blue-500',
      text_color: 'text-white',
      beschrijving: 'Verwijzers, samenwerkende zorgverleners, laboratoria en apotheken',
      volgorde: 1
    },
    {
      naam: 'Leveranciers & Faciliteiten',
      label: 'Leveranciers & Faciliteiten',
      icon_name: 'Package',
      color_from: 'from-teal-500',
      color_to: 'to-green-600',
      bg_color: 'bg-teal-500',
      text_color: 'text-white',
      beschrijving: 'Medische leveranciers, implantaten, merken, apotheek',
      volgorde: 2
    },
    {
      naam: 'Juridisch & Financieel',
      label: 'Juridisch & Financieel',
      icon_name: 'Scale',
      color_from: 'from-purple-500',
      color_to: 'to-purple-600',
      bg_color: 'bg-purple-500',
      text_color: 'text-white',
      beschrijving: 'Accountants, advocaten, verzekeraars en banken',
      volgorde: 3
    },
    {
      naam: 'HR & Opleiding',
      label: 'HR & Opleiding',
      icon_name: 'GraduationCap',
      color_from: 'from-emerald-500',
      color_to: 'to-emerald-600',
      bg_color: 'bg-emerald-500',
      text_color: 'text-white',
      beschrijving: 'Opleidingsinstituten, HR adviseurs en uitzendbureau\'s',
      volgorde: 4
    },
    {
      naam: 'Marketing & Commercieel',
      label: 'Marketing & Commercieel',
      icon_name: 'Megaphone',
      color_from: 'from-orange-500',
      color_to: 'to-orange-600',
      bg_color: 'bg-orange-500',
      text_color: 'text-white',
      beschrijving: 'Marketing bureaus, webdesign en SEO/SEA partners',
      volgorde: 5
    },
    {
      naam: 'Overheid & Toezicht',
      label: 'Overheid & Toezicht',
      icon_name: 'Building',
      color_from: 'from-blue-700',
      color_to: 'to-blue-800',
      bg_color: 'bg-blue-700',
      text_color: 'text-white',
      beschrijving: 'IGJ, KNMT, NZa, Autoriteit Persoonsgegevens en gemeente',
      volgorde: 6
    },
    {
      naam: 'Overig / Calamiteiten',
      label: 'Overig / Calamiteiten',
      icon_name: 'AlertTriangle',
      color_from: 'from-red-600',
      color_to: 'to-red-700',
      bg_color: 'bg-red-600',
      text_color: 'text-white',
      beschrijving: 'BHV-opleiders, AED-leveranciers en spoeddiensten',
      volgorde: 7
    }
  ];

  for (const groep of hoofdgroepen) {
    // Check if exists
    const { data: existing } = await supabase
      .from('crm_hoofdgroepen')
      .select('id')
      .eq('naam', groep.naam)
      .maybeSingle();

    if (existing) {
      // Update
      const { error } = await supabase
        .from('crm_hoofdgroepen')
        .update({
          ...groep,
          actief: true,
          updated_at: new Date().toISOString()
        })
        .eq('naam', groep.naam);

      if (error) {
        console.error(`❌ Error updating ${groep.naam}:`, error);
      } else {
        console.log(`✅ Updated: ${groep.naam}`);
      }
    } else {
      // Insert
      const { error } = await supabase
        .from('crm_hoofdgroepen')
        .insert([{
          ...groep,
          actief: true
        }]);

      if (error) {
        console.error(`❌ Error inserting ${groep.naam}:`, error);
      } else {
        console.log(`✅ Inserted: ${groep.naam}`);
      }
    }
  }

  console.log('\n✅ CRM Hoofdgroepen seeding complete!');
}

seedCrmHoofdgroepen().catch(console.error);
