#!/usr/bin/env tsx
/**
 * Seed GWAC Catalog with initial data
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const gwacs = [
  {
    gwac_name: 'Alliant 2 Small Business',
    gwac_acronym: 'Alliant 2 SB',
    gwac_type: 'IT',
    managing_agency: 'GSA',
    description: 'IT services and solutions for small businesses',
    website_url: 'https://www.gsa.gov/acquisition/purchasing-programs/gsa-contracts/governmentwide-acquisition-contracts-gwacs/alliant-2',
    is_active: true
  },
  {
    gwac_name: 'Alliant 2 Unrestricted',
    gwac_acronym: 'Alliant 2',
    gwac_type: 'IT',
    managing_agency: 'GSA',
    description: 'IT services and solutions for all business sizes',
    website_url: 'https://www.gsa.gov/acquisition/purchasing-programs/gsa-contracts/governmentwide-acquisition-contracts-gwacs/alliant-2',
    is_active: true
  },
  {
    gwac_name: 'OASIS Small Business',
    gwac_acronym: 'OASIS SB',
    gwac_type: 'Professional Services',
    managing_agency: 'GSA',
    description: 'Professional services for small businesses',
    website_url: 'https://www.gsa.gov/acquisition/purchasing-programs/gsa-contracts/governmentwide-acquisition-contracts-gwacs/oasis-and-oasis-small-business',
    is_active: true
  },
  {
    gwac_name: 'OASIS Unrestricted',
    gwac_acronym: 'OASIS',
    gwac_type: 'Professional Services',
    managing_agency: 'GSA',
    description: 'Professional services for all business sizes',
    website_url: 'https://www.gsa.gov/acquisition/purchasing-programs/gsa-contracts/governmentwide-acquisition-contracts-gwacs/oasis-and-oasis-small-business',
    is_active: true
  },
  {
    gwac_name: '8(a) STARS III',
    gwac_acronym: 'STARS III',
    gwac_type: 'IT',
    managing_agency: 'GSA',
    description: 'IT services for 8(a) small businesses',
    website_url: 'https://www.gsa.gov/acquisition/purchasing-programs/gsa-contracts/governmentwide-acquisition-contracts-gwacs/8a-stars-iii',
    is_active: true
  },
  {
    gwac_name: 'Polaris Small Business',
    gwac_acronym: 'Polaris SB',
    gwac_type: 'IT',
    managing_agency: 'GSA',
    description: 'Next generation IT GWAC for small businesses',
    website_url: 'https://www.gsa.gov/acquisition/purchasing-programs/gsa-contracts/governmentwide-acquisition-contracts-gwacs/polaris',
    is_active: true
  },
  {
    gwac_name: 'Polaris Unrestricted',
    gwac_acronym: 'Polaris',
    gwac_type: 'IT',
    managing_agency: 'GSA',
    description: 'Next generation IT GWAC for all business sizes',
    website_url: 'https://www.gsa.gov/acquisition/purchasing-programs/gsa-contracts/governmentwide-acquisition-contracts-gwacs/polaris',
    is_active: true
  },
  {
    gwac_name: 'CIO-SP3 Small Business',
    gwac_acronym: 'CIO-SP3 SB',
    gwac_type: 'IT',
    managing_agency: 'NITAAC',
    description: 'IT services and solutions for small businesses',
    website_url: 'https://nitaac.nih.gov/services/cio-sp3',
    holder_directory_url: 'https://nitaac.nih.gov/resources/frequently-asked-questions/there-way-see-which-contract-holders-are-each-gwac',
    is_active: true
  },
  {
    gwac_name: 'CIO-SP3 Unrestricted',
    gwac_acronym: 'CIO-SP3',
    gwac_type: 'IT',
    managing_agency: 'NITAAC',
    description: 'IT services and solutions for all business sizes',
    website_url: 'https://nitaac.nih.gov/services/cio-sp3',
    holder_directory_url: 'https://nitaac.nih.gov/resources/frequently-asked-questions/there-way-see-which-contract-holders-are-each-gwac',
    is_active: true
  },
  {
    gwac_name: 'CIO-SP4',
    gwac_acronym: 'CIO-SP4',
    gwac_type: 'IT',
    managing_agency: 'NITAAC',
    description: 'Next generation IT services GWAC',
    website_url: 'https://nitaac.nih.gov/services/cio-sp4',
    holder_directory_url: 'https://nitaac.nih.gov/resources/frequently-asked-questions/there-way-see-which-contract-holders-are-each-gwac',
    is_active: true
  },
  {
    gwac_name: 'SEWP VI',
    gwac_acronym: 'SEWP',
    gwac_type: 'IT Products',
    managing_agency: 'NASA',
    description: 'IT products and solutions',
    website_url: 'https://www.sewp.nasa.gov/',
    is_active: true
  }
];

async function main() {
  console.log('============================================================');
  console.log('Seeding GWAC Catalog');
  console.log('============================================================');
  console.log();

  console.log(`Inserting ${gwacs.length} GWACs...`);

  for (const gwac of gwacs) {
    try {
      const { data, error } = await supabase
        .from('gwac_catalog')
        .upsert(gwac, { onConflict: 'gwac_name' });

      if (error) {
        console.log(`✗ Failed: ${gwac.gwac_name} - ${error.message}`);
      } else {
        console.log(`✓ Inserted: ${gwac.gwac_name}`);
      }
    } catch (e: any) {
      console.log(`✗ Error: ${gwac.gwac_name} - ${e.message}`);
    }
  }

  console.log();
  console.log('Verifying...');

  const { data: allGwacs, error } = await supabase
    .from('gwac_catalog')
    .select('gwac_name')
    .order('gwac_name');

  if (error) {
    console.log('✗ Could not verify seed data');
  } else if (allGwacs) {
    console.log(`✓ gwac_catalog now has ${allGwacs.length} records:`);
    allGwacs.forEach(g => console.log(`  - ${g.gwac_name}`));
  }

  console.log();
  console.log('✓ Seed data inserted successfully!');
}

main().catch(console.error);

