#!/usr/bin/env tsx
/**
 * Check ManTech Scraper Status
 * 
 * Usage:
 *   npm run check:mantech
 *   tsx check-mantech-status.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatus() {
  console.log('='.repeat(70));
  console.log('DOD MANTECH SCRAPER STATUS');
  console.log('='.repeat(70));
  console.log('');
  
  try {
    // Check scraper logs
    const { data: logs, error: logsError } = await supabase
      .from('mantech_scraper_log')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(5);
    
    if (logsError) {
      console.error('Error fetching logs:', logsError);
      return;
    }
    
    console.log('RECENT SCRAPER RUNS:');
    console.log('-'.repeat(70));
    
    if (!logs || logs.length === 0) {
      console.log('No scraper runs found.');
    } else {
      for (const log of logs) {
        const date = new Date(log.started_at).toLocaleString();
        const duration = log.duration_seconds ? `${log.duration_seconds}s` : 'N/A';
        const status = log.status === 'completed' ? '✓' : log.status === 'failed' ? '✗' : '⋯';
        
        console.log(`${status} ${date} | ${log.scrape_type} | ${log.component || 'All'}`);
        console.log(`  Status: ${log.status} | Duration: ${duration}`);
        console.log(`  Articles: ${log.articles_found || 0} found, ${log.articles_scraped || 0} scraped`);
        console.log(`  Projects: ${log.projects_created || 0} created, ${log.projects_updated || 0} updated`);
        console.log(`  Companies: ${log.companies_extracted || 0} extracted`);
        if (log.error_message) {
          console.log(`  Error: ${log.error_message}`);
        }
        console.log('');
      }
    }
    
    // Check database statistics
    const { count: totalProjects } = await supabase
      .from('mantech_projects')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalCompanies } = await supabase
      .from('mantech_company_mentions')
      .select('*', { count: 'exact', head: true });
    
    const { count: sbirLinked } = await supabase
      .from('mantech_projects')
      .select('*', { count: 'exact', head: true })
      .eq('sbir_linked', true);
    
    const { count: contractLinked } = await supabase
      .from('mantech_projects')
      .select('*', { count: 'exact', head: true })
      .eq('contract_linked', true);
    
    console.log('-'.repeat(70));
    console.log('DATABASE STATISTICS:');
    console.log('-'.repeat(70));
    console.log(`Total Projects: ${totalProjects || 0}`);
    console.log(`Total Company Mentions: ${totalCompanies || 0}`);
    console.log(`SBIR Linked: ${sbirLinked || 0}`);
    console.log(`Contract Linked: ${contractLinked || 0}`);
    console.log('');
    
    // Check by component
    const { data: byComponent } = await supabase
      .from('mantech_projects')
      .select('mantech_component')
      .order('mantech_component');
    
    if (byComponent && byComponent.length > 0) {
      const componentCounts: Record<string, number> = {};
      for (const item of byComponent) {
        componentCounts[item.mantech_component] = (componentCounts[item.mantech_component] || 0) + 1;
      }
      
      console.log('PROJECTS BY COMPONENT:');
      console.log('-'.repeat(70));
      for (const [component, count] of Object.entries(componentCounts)) {
        console.log(`${component}: ${count}`);
      }
      console.log('');
    }
    
    // Check most recent projects
    const { data: recentProjects } = await supabase
      .from('mantech_projects')
      .select('article_title, mantech_component, published_date, scraped_at')
      .order('scraped_at', { ascending: false })
      .limit(5);
    
    if (recentProjects && recentProjects.length > 0) {
      console.log('MOST RECENT PROJECTS:');
      console.log('-'.repeat(70));
      for (const project of recentProjects) {
        const date = project.published_date || new Date(project.scraped_at).toISOString().split('T')[0];
        console.log(`[${project.mantech_component}] ${project.article_title}`);
        console.log(`  Date: ${date}`);
        console.log('');
      }
    }
    
    // Check top companies
    const { data: topCompanies } = await supabase
      .from('mantech_company_mentions')
      .select('company_name')
      .limit(1000);
    
    if (topCompanies && topCompanies.length > 0) {
      const companyCounts: Record<string, number> = {};
      for (const item of topCompanies) {
        companyCounts[item.company_name] = (companyCounts[item.company_name] || 0) + 1;
      }
      
      const sorted = Object.entries(companyCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      console.log('TOP 10 COMPANIES IN MANTECH:');
      console.log('-'.repeat(70));
      for (const [company, count] of sorted) {
        console.log(`${company}: ${count} mentions`);
      }
      console.log('');
    }
    
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('Error checking status:', error);
    process.exit(1);
  }
}

checkStatus();

