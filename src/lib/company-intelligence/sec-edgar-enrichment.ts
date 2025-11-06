/**
 * SEC EDGAR Enrichment
 * Enriches PUBLIC companies with financial data from SEC filings
 * 
 * FREE - No API key needed, just rate limiting (10 requests/second)
 * Data Source: https://data.sec.gov/
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Required User-Agent for SEC API
const SEC_USER_AGENT = 'PropShop AI info@propshop.ai';
const SEC_BASE_URL = 'https://data.sec.gov';

interface SECCompanyInfo {
  cik: string;
  entityType: string;
  sic: string;
  sicDescription: string;
  name: string;
  tickers: string[];
  exchanges: string[];
  ein: string;
  description: string;
  website: string;
  category: string;
  fiscalYearEnd: string;
  stateOfIncorporation: string;
  phone: string;
  addresses: {
    mailing: {
      street1: string;
      city: string;
      stateOrCountry: string;
      zipCode: string;
    };
    business: {
      street1: string;
      city: string;
      stateOrCountry: string;
      zipCode: string;
    };
  };
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      reportDate: string[];
      acceptanceDateTime: string[];
      act: string[];
      form: string[];
      fileNumber: string[];
      filmNumber: string[];
      items: string[];
      size: number[];
      isXBRL: number[];
      isInlineXBRL: number[];
      primaryDocument: string[];
      primaryDocDescription: string[];
    };
  };
}

/**
 * Search for a company's CIK by name
 */
export async function searchCompanyCIK(companyName: string): Promise<string | null> {
  try {
    console.log(`Searching SEC for company: ${companyName}`);

    // Get company tickers JSON (contains all companies)
    const response = await fetch(`${SEC_BASE_URL}/files/company_tickers.json`, {
      headers: {
        'User-Agent': SEC_USER_AGENT,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`SEC API error: ${response.status}`);
    }

    const companies: Record<string, { cik_str: number; ticker: string; title: string }> = await response.json();

    // Normalize search name
    const searchName = companyName.toUpperCase()
      .replace(/\b(INC|LLC|LTD|CORP|CORPORATION|INCORPORATED|LIMITED|COMPANY|CO)\b\.?/gi, '')
      .replace(/[,.']/g, '')
      .trim();

    // Search for company
    const match = Object.values(companies).find(company => {
      const title = company.title.toUpperCase()
        .replace(/\b(INC|LLC|LTD|CORP|CORPORATION|INCORPORATED|LIMITED|COMPANY|CO)\b\.?/gi, '')
        .replace(/[,.']/g, '')
        .trim();
      
      return title.includes(searchName) || searchName.includes(title);
    });

    if (match) {
      // Pad CIK to 10 digits
      const cik = match.cik_str.toString().padStart(10, '0');
      console.log(`  Found CIK: ${cik} for ${match.title}`);
      return cik;
    }

    console.log(`  No SEC filing found for: ${companyName}`);
    return null;

  } catch (error) {
    console.error(`Error searching SEC for ${companyName}:`, error);
    return null;
  }
}

/**
 * Get company information and recent filings
 */
export async function getCompanyFilings(cik: string): Promise<SECCompanyInfo | null> {
  try {
    const response = await fetch(`${SEC_BASE_URL}/submissions/CIK${cik}.json`, {
      headers: {
        'User-Agent': SEC_USER_AGENT,
        'Accept': 'application/json',
      },
    });

    await logAPICall('sec.gov', `/submissions/CIK${cik}.json`, cik, response.status, response.ok);

    if (!response.ok) {
      throw new Error(`SEC API error: ${response.status}`);
    }

    const data: SECCompanyInfo = await response.json();
    return data;

  } catch (error) {
    console.error(`Error fetching SEC filings for CIK ${cik}:`, error);
    await logAPICall('sec.gov', `/submissions/CIK${cik}.json`, cik, 0, false, error.message);
    return null;
  }
}

/**
 * Parse 10-K filing for key financial data
 */
export async function parse10K(cik: string, accessionNumber: string): Promise<any> {
  try {
    // Remove dashes from accession number for URL
    const accessionNoHyphens = accessionNumber.replace(/-/g, '');
    
    // Fetch the filing index
    const indexUrl = `${SEC_BASE_URL}/Archives/edgar/data/${parseInt(cik)}/${accessionNoHyphens}/${accessionNumber}-index.json`;
    
    const response = await fetch(indexUrl, {
      headers: {
        'User-Agent': SEC_USER_AGENT,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`SEC filing error: ${response.status}`);
    }

    const index = await response.json();

    // For now, return basic filing info
    // TODO: Implement XBRL parsing for detailed financials
    return {
      accession_number: accessionNumber,
      filing_url: `https://www.sec.gov/cgi-bin/viewer?action=view&cik=${parseInt(cik)}&accession_number=${accessionNumber}&xbrl_type=v`,
      has_xbrl: index.directory?.name?.includes('xbrl') || false,
    };

  } catch (error) {
    console.error(`Error parsing 10-K ${accessionNumber}:`, error);
    return null;
  }
}

/**
 * Extract financial data from company facts (XBRL data)
 */
export async function getCompanyFacts(cik: string): Promise<any> {
  try {
    const response = await fetch(`${SEC_BASE_URL}/api/xbrl/companyfacts/CIK${cik}.json`, {
      headers: {
        'User-Agent': SEC_USER_AGENT,
        'Accept': 'application/json',
      },
    });

    await logAPICall('sec.gov', `/api/xbrl/companyfacts/CIK${cik}.json`, cik, response.status, response.ok);

    if (!response.ok) {
      // Not all companies have XBRL facts
      return null;
    }

    const facts = await response.json();
    
    // Extract key financial metrics
    const usGaap = facts.facts?.['us-gaap'] || {};
    const dei = facts.facts?.['dei'] || {};

    // Get most recent annual data
    const getLatestAnnual = (concept: string) => {
      const data = usGaap[concept]?.units?.USD;
      if (!data) return null;
      
      const annualData = data
        .filter((d: any) => d.form === '10-K')
        .sort((a: any, b: any) => new Date(b.end).getTime() - new Date(a.end).getTime());
      
      return annualData[0]?.val || null;
    };

    return {
      // Revenue
      revenue: getLatestAnnual('Revenues') || getLatestAnnual('RevenueFromContractWithCustomerExcludingAssessedTax'),
      
      // Profitability
      net_income: getLatestAnnual('NetIncomeLoss'),
      operating_income: getLatestAnnual('OperatingIncomeLoss'),
      gross_profit: getLatestAnnual('GrossProfit'),
      
      // Balance Sheet
      total_assets: getLatestAnnual('Assets'),
      current_assets: getLatestAnnual('AssetsCurrent'),
      total_liabilities: getLatestAnnual('Liabilities'),
      stockholders_equity: getLatestAnnual('StockholdersEquity'),
      
      // Employee count (from DEI taxonomy)
      employee_count: dei.EntityNumberOfEmployees?.units?.pure?.[0]?.val || null,
    };

  } catch (error) {
    console.error(`Error fetching company facts for CIK ${cik}:`, error);
    return null;
  }
}

/**
 * Enrich a company with SEC EDGAR data
 */
export async function enrichWithSEC(companyIntelligenceId: number, companyName: string): Promise<boolean> {
  try {
    console.log(`Enriching with SEC EDGAR: ${companyName}`);

    // Step 1: Find CIK
    const cik = await searchCompanyCIK(companyName);
    if (!cik) {
      console.log(`  Not a public company or not found in SEC`);
      return false;
    }

    // Step 2: Get company information and filings
    const companyInfo = await getCompanyFilings(cik);
    if (!companyInfo) {
      console.log(`  Error fetching SEC data`);
      return false;
    }

    // Step 3: Get financial facts (XBRL data)
    const facts = await getCompanyFacts(cik);

    // Step 4: Find most recent 10-K
    const filings = companyInfo.filings.recent;
    const tenKIndex = filings.form.findIndex(form => form === '10-K');
    
    let filing10K = null;
    if (tenKIndex !== -1) {
      filing10K = {
        accession_number: filings.accessionNumber[tenKIndex],
        filing_date: filings.filingDate[tenKIndex],
        report_date: filings.reportDate[tenKIndex],
      };

      // Cache the filing
      await supabase.from('sec_filings_cache').insert({
        company_intelligence_id: companyIntelligenceId,
        sec_cik: cik,
        accession_number: filing10K.accession_number,
        filing_type: '10-K',
        filing_date: filing10K.filing_date,
        report_date: filing10K.report_date,
        revenue: facts?.revenue,
        net_income: facts?.net_income,
        total_assets: facts?.total_assets,
        stockholders_equity: facts?.stockholders_equity,
        employee_count: facts?.employee_count,
        filing_url: `https://www.sec.gov/cgi-bin/viewer?action=view&cik=${parseInt(cik)}&accession_number=${filing10K.accession_number}`,
        processed: true,
      });
    }

    // Step 5: Update company_intelligence
    const updateData: any = {
      is_public_company: true,
      stock_ticker: companyInfo.tickers?.[0] || null,
      stock_exchange: companyInfo.exchanges?.[0] || null,
      sec_cik: cik,
      sec_annual_revenue: facts?.revenue,
      sec_net_income: facts?.net_income,
      sec_total_assets: facts?.total_assets,
      sec_stockholders_equity: facts?.stockholders_equity,
      sec_employee_count: facts?.employee_count,
      sec_fiscal_year_end: companyInfo.fiscalYearEnd,
      sec_business_description: companyInfo.description,
      sec_last_filing_date: filing10K?.filing_date,
      sec_last_filing_type: '10-K',
      sec_last_filing_url: filing10K ? `https://www.sec.gov/cgi-bin/viewer?action=view&cik=${parseInt(cik)}&accession_number=${filing10K.accession_number}` : null,
      sec_enriched: true,
      sec_last_checked: new Date().toISOString(),
    };

    // Update estimated fields if we have data
    if (facts?.employee_count) {
      updateData.estimated_employee_count = facts.employee_count;
    }
    if (facts?.revenue) {
      updateData.estimated_annual_revenue = facts.revenue;
      updateData.estimated_revenue_source = 'SEC 10-K';
    }

    await supabase
      .from('company_intelligence')
      .update(updateData)
      .eq('id', companyIntelligenceId);

    console.log(`  ✓ Successfully enriched with SEC data`);
    return true;

  } catch (error) {
    console.error(`Error enriching with SEC for ${companyName}:`, error);
    return false;
  }
}

/**
 * Batch enrich public companies from company_intelligence
 */
export async function batchEnrichPublicCompanies(limit: number = 50): Promise<void> {
  console.log(`Starting batch SEC enrichment of ${limit} companies...`);

  // Get companies that might be public (have not been checked yet)
  const { data: companies, error } = await supabase
    .from('company_intelligence')
    .select('id, company_name, sam_legal_name')
    .is('sec_enriched', false)
    .order('id')
    .limit(limit);

  if (error) {
    console.error('Error fetching companies:', error);
    return;
  }

  console.log(`Found ${companies?.length || 0} companies to check`);

  for (const company of companies || []) {
    try {
      const name = company.sam_legal_name || company.company_name;
      console.log(`Checking: ${name}`);

      await enrichWithSEC(company.id, name);

      // Rate limiting: Max 10 requests per second per SEC rules
      await new Promise(resolve => setTimeout(resolve, 150));

    } catch (error) {
      console.error(`Error processing ${company.company_name}:`, error);
    }
  }

  console.log('Batch SEC enrichment complete!');
}

/**
 * Log API call
 */
async function logAPICall(
  apiSource: string,
  endpoint: string,
  searchParam: string,
  statusCode: number,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  try {
    await supabase.from('company_intel_api_log').insert({
      api_source: apiSource,
      endpoint,
      search_param: searchParam,
      status_code: statusCode,
      success,
      error_message: errorMessage,
      called_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error logging API call:', error);
  }
}

