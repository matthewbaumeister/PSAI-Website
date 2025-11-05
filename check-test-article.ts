#!/usr/bin/env tsx
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTestArticle() {
  console.log('Checking test article in database...\n');
  
  const { data, error } = await supabase
    .from('mantech_projects')
    .select(`
      article_id,
      article_title,
      published_date,
      mantech_component,
      transition_stage,
      technology_focus,
      manufacturing_processes,
      companies_involved,
      academic_partners,
      prime_contractor,
      weapon_systems,
      platforms,
      locations,
      states,
      fiscal_year,
      funding_amount,
      sbir_linked,
      parsing_confidence
    `)
    .eq('article_id', 4292977)
    .single();
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('ARTICLE DATA:');
  console.log('='.repeat(60));
  console.log(`Article ID: ${data.article_id}`);
  console.log(`Title: ${data.article_title}`);
  console.log(`Published: ${data.published_date || 'NOT EXTRACTED'}`);
  console.log(`Component: ${data.mantech_component || 'NOT EXTRACTED'}`);
  console.log(`Transition Stage: ${data.transition_stage || 'NOT EXTRACTED'}`);
  console.log(`\nTechnology Focus: ${data.technology_focus ? data.technology_focus.join(', ') : 'NONE'}`);
  console.log(`Manufacturing Processes: ${data.manufacturing_processes ? data.manufacturing_processes.join(', ') : 'NONE'}`);
  console.log(`\nCompanies: ${data.companies_involved ? data.companies_involved.join(', ') : 'NONE'}`);
  console.log(`Prime Contractor: ${data.prime_contractor || 'NOT EXTRACTED'}`);
  console.log(`Academic Partners: ${data.academic_partners ? data.academic_partners.join(', ') : 'NONE'}`);
  console.log(`\nWeapon Systems: ${data.weapon_systems ? data.weapon_systems.join(', ') : 'NONE'}`);
  console.log(`Platforms: ${data.platforms ? data.platforms.join(', ') : 'NONE'}`);
  console.log(`\nLocations: ${data.locations ? data.locations.join(', ') : 'NONE'}`);
  console.log(`States: ${data.states ? data.states.join(', ') : 'NONE'}`);
  console.log(`\nFiscal Year: ${data.fiscal_year || 'NOT EXTRACTED'}`);
  console.log(`Funding: ${data.funding_amount ? `$${data.funding_amount.toLocaleString()}` : 'NOT EXTRACTED'}`);
  console.log(`\nSBIR Linked: ${data.sbir_linked ? 'YES' : 'NO'}`);
  console.log(`\nParsing Confidence: ${(data.parsing_confidence * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
}

checkTestArticle().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});

