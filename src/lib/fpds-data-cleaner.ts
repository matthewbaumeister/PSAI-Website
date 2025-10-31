// ============================================
// FPDS Data Cleaner & Validator
// ============================================
// Smart data cleaning to prevent garbage data
// while maximizing data collection

export interface DataQuality {
  score: number; // 0-100
  issues: string[];
  warnings: string[];
  isSuspicious: boolean;
}

// ============================================
// Company Name Normalization
// ============================================

export function normalizeCompanyName(name: string | null | undefined): string {
  if (!name) return 'Unknown';

  let cleaned = name.trim();

  // Remove common suffixes for deduplication (but keep in record)
  const suffixes = [
    ' INC', ' INCORPORATED', ' CORP', ' CORPORATION', ' CO', ' COMPANY',
    ' LLC', ' LTD', ' LIMITED', ' LP', ' LLP', ' PLLC',
    ' THE', ' L L C', ' L.L.C.', ' INC.', ' CORP.'
  ];

  // Standardize common patterns
  cleaned = cleaned
    .toUpperCase()
    .replace(/\s+/g, ' ') // Multiple spaces -> single space
    .replace(/[^\w\s&-]/g, '') // Remove special chars except &, -
    .trim();

  return cleaned || 'Unknown';
}

export function generateCompanyKey(name: string | null | undefined): string {
  // Generate a fuzzy-match key for deduplication
  if (!name) return 'unknown';

  let key = name.trim().toUpperCase();

  // Remove all common suffixes
  const suffixes = [
    'INCORPORATED', 'CORPORATION', 'COMPANY', 'LIMITED',
    'INC', 'CORP', 'CO', 'LLC', 'LTD', 'LP', 'LLP', 'PLLC', 'THE'
  ];

  suffixes.forEach(suffix => {
    key = key.replace(new RegExp(`\\b${suffix}\\b\\.?`, 'g'), '');
  });

  // Remove all punctuation and extra spaces
  key = key
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return key || 'unknown';
}

// ============================================
// Amount Validation & Cleaning
// ============================================

export function validateAmount(amount: number | null | undefined): number | null {
  if (amount === null || amount === undefined) return null;
  
  // Check for invalid values
  if (isNaN(amount) || !isFinite(amount)) return null;
  
  // Negative amounts are invalid for federal contracts
  if (amount < 0) return null;
  
  // Suspiciously large (> $10 billion is extremely rare)
  if (amount > 10_000_000_000) {
    console.warn(`[Data Cleaner] Suspicious amount: $${amount.toLocaleString()}`);
  }
  
  // Round to 2 decimal places
  return Math.round(amount * 100) / 100;
}

export function getAmountCategory(amount: number | null): string {
  if (!amount || amount <= 0) return 'unknown';
  
  if (amount < 25_000) return 'micro'; // < $25K
  if (amount < 100_000) return 'small'; // $25K - $100K
  if (amount < 1_000_000) return 'medium'; // $100K - $1M
  if (amount < 10_000_000) return 'large'; // $1M - $10M
  if (amount < 100_000_000) return 'major'; // $10M - $100M
  return 'mega'; // > $100M
}

// ============================================
// Date Validation & Cleaning
// ============================================

export function validateDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;

  try {
    const date = new Date(dateStr);
    
    // Check if valid date
    if (isNaN(date.getTime())) return null;
    
    // Federal contracts shouldn't be before 1990
    if (date.getFullYear() < 1990) {
      console.warn(`[Data Cleaner] Suspicious date: ${dateStr} (before 1990)`);
      return null;
    }
    
    // Shouldn't be more than 20 years in the future
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 20);
    
    if (date > maxFutureDate) {
      console.warn(`[Data Cleaner] Suspicious date: ${dateStr} (too far in future)`);
      return null;
    }
    
    return dateStr;
  } catch (error) {
    return null;
  }
}

export function validateDateRange(startDate: string | null, endDate: string | null): {
  start: string | null;
  end: string | null;
  isValid: boolean;
} {
  const start = validateDate(startDate);
  const end = validateDate(endDate);
  
  // If both dates exist, end must be after start
  if (start && end) {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    
    if (endTime < startTime) {
      console.warn(`[Data Cleaner] Invalid date range: ${start} to ${end}`);
      return { start, end: null, isValid: false };
    }
    
    // Warn if contract is longer than 10 years (unusual)
    const yearsDiff = (endTime - startTime) / (1000 * 60 * 60 * 24 * 365);
    if (yearsDiff > 10) {
      console.warn(`[Data Cleaner] Unusually long contract: ${yearsDiff.toFixed(1)} years`);
    }
  }
  
  return { start, end, isValid: true };
}

// ============================================
// NAICS Code Validation
// ============================================

export function validateNAICS(naics: string | null | undefined): string | null {
  if (!naics) return null;
  
  // NAICS codes are 2-6 digits
  const cleaned = naics.trim().replace(/[^\d]/g, '');
  
  if (cleaned.length < 2 || cleaned.length > 6) {
    console.warn(`[Data Cleaner] Invalid NAICS code: ${naics}`);
    return null;
  }
  
  return cleaned;
}

// ============================================
// UEI/DUNS Validation
// ============================================

export function validateUEI(uei: string | null | undefined): string | null {
  if (!uei) return null;
  
  // UEI is 12 characters (alphanumeric)
  const cleaned = uei.trim().toUpperCase();
  
  if (cleaned.length !== 12) {
    return null; // Invalid UEI length
  }
  
  return cleaned;
}

export function validateDUNS(duns: string | null | undefined): string | null {
  if (!duns) return null;
  
  // DUNS is 9 digits
  const cleaned = duns.trim().replace(/[^\d]/g, '');
  
  if (cleaned.length !== 9) {
    return null; // Invalid DUNS
  }
  
  return cleaned;
}

// ============================================
// Text Cleaning
// ============================================

export function cleanText(text: string | null | undefined, maxLength?: number): string | null {
  if (!text) return null;
  
  let cleaned = text
    .trim()
    .replace(/\s+/g, ' ') // Multiple spaces -> single space
    .replace(/[\r\n\t]+/g, ' '); // Newlines/tabs -> space
  
  // Truncate if too long
  if (maxLength && cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }
  
  return cleaned || null;
}

// ============================================
// Comprehensive Contract Validation
// ============================================

export function validateContract(contract: any): {
  cleaned: any;
  quality: DataQuality;
} {
  const issues: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  // Create cleaned version
  const cleaned = { ...contract };

  // 1. Validate and clean vendor name (CRITICAL)
  if (!contract.vendor_name || contract.vendor_name === 'Unknown') {
    issues.push('Missing vendor name');
    score -= 30;
  } else {
    cleaned.vendor_name = normalizeCompanyName(contract.vendor_name);
    cleaned.vendor_name_key = generateCompanyKey(contract.vendor_name);
  }

  // 2. Validate contract ID (CRITICAL)
  if (!contract.piid && !contract.transaction_number) {
    issues.push('Missing contract ID');
    score -= 30;
  }

  // 3. Validate amounts
  cleaned.base_and_exercised_options_value = validateAmount(contract.base_and_exercised_options_value);
  cleaned.base_and_all_options_value = validateAmount(contract.base_and_all_options_value);
  cleaned.dollars_obligated = validateAmount(contract.dollars_obligated);
  cleaned.current_total_value_of_award = validateAmount(contract.current_total_value_of_award);

  if (!cleaned.current_total_value_of_award && !cleaned.dollars_obligated) {
    warnings.push('Missing contract value');
    score -= 10;
  }

  // Add amount category
  cleaned.amount_category = getAmountCategory(
    cleaned.current_total_value_of_award || cleaned.dollars_obligated
  );

  // 4. Validate dates
  const dateRange = validateDateRange(
    contract.period_of_performance_start,
    contract.period_of_performance_end
  );
  
  cleaned.period_of_performance_start = dateRange.start;
  cleaned.period_of_performance_end = dateRange.end;
  
  cleaned.date_signed = validateDate(contract.date_signed);
  cleaned.effective_date = validateDate(contract.effective_date);
  cleaned.current_completion_date = validateDate(contract.current_completion_date);

  if (!cleaned.date_signed && !cleaned.effective_date) {
    warnings.push('Missing contract date');
    score -= 5;
  }

  // 5. Validate NAICS
  cleaned.naics_code = validateNAICS(contract.naics_code);
  if (!cleaned.naics_code) {
    warnings.push('Missing NAICS code');
    score -= 5;
  }

  // 6. Validate identifiers
  cleaned.vendor_uei = validateUEI(contract.vendor_uei);
  cleaned.vendor_duns = validateDUNS(contract.vendor_duns);
  
  if (!cleaned.vendor_uei && !cleaned.vendor_duns) {
    warnings.push('Missing vendor identifiers (UEI/DUNS)');
    score -= 5;
  }

  // 7. Clean text fields
  cleaned.description_of_requirement = cleanText(contract.description_of_requirement, 5000);
  cleaned.naics_description = cleanText(contract.naics_description, 500);
  cleaned.psc_description = cleanText(contract.psc_description, 500);

  // 8. Validate agency
  if (!contract.contracting_agency_name) {
    warnings.push('Missing agency name');
    score -= 5;
  }

  // 9. Clean location data
  if (contract.vendor_city) {
    cleaned.vendor_city = cleanText(contract.vendor_city, 100);
  }
  if (contract.vendor_state) {
    cleaned.vendor_state = contract.vendor_state.trim().toUpperCase().substring(0, 2);
  }

  // 10. Validate fiscal year
  const currentYear = new Date().getFullYear();
  if (contract.fiscal_year) {
    if (contract.fiscal_year < 1990 || contract.fiscal_year > currentYear + 2) {
      warnings.push(`Invalid fiscal year: ${contract.fiscal_year}`);
      cleaned.fiscal_year = null;
    }
  }

  // 11. Check for suspicious patterns
  let isSuspicious = false;

  // Suspiciously small vendor name
  if (cleaned.vendor_name && cleaned.vendor_name.length < 3) {
    warnings.push('Suspiciously short vendor name');
    isSuspicious = true;
  }

  // Suspiciously large amount with no details
  if (cleaned.current_total_value_of_award > 100_000_000 && !cleaned.description_of_requirement) {
    warnings.push('Large contract with no description');
    isSuspicious = true;
  }

  // Calculate final quality score
  score = Math.max(0, Math.min(100, score));

  return {
    cleaned,
    quality: {
      score,
      issues,
      warnings,
      isSuspicious
    }
  };
}

// ============================================
// Batch Validation
// ============================================

export function validateContractBatch(contracts: any[]): {
  cleaned: any[];
  stats: {
    total: number;
    highQuality: number; // score >= 80
    mediumQuality: number; // score 60-79
    lowQuality: number; // score < 60
    suspicious: number;
    averageScore: number;
  };
} {
  const results = contracts.map(c => validateContract(c));
  
  const cleaned = results.map(r => ({
    ...r.cleaned,
    data_quality_score: r.quality.score,
    data_quality_issues: r.quality.issues.length > 0 ? r.quality.issues : null,
    data_quality_warnings: r.quality.warnings.length > 0 ? r.quality.warnings : null,
    is_suspicious: r.quality.isSuspicious
  }));

  const stats = {
    total: results.length,
    highQuality: results.filter(r => r.quality.score >= 80).length,
    mediumQuality: results.filter(r => r.quality.score >= 60 && r.quality.score < 80).length,
    lowQuality: results.filter(r => r.quality.score < 60).length,
    suspicious: results.filter(r => r.quality.isSuspicious).length,
    averageScore: results.reduce((sum, r) => sum + r.quality.score, 0) / results.length
  };

  return { cleaned, stats };
}

// ============================================
// Deduplication Detection
// ============================================

export interface DuplicateCandidate {
  contract1: string;
  contract2: string;
  similarity: number;
  reason: string;
}

export function detectDuplicates(contracts: any[]): DuplicateCandidate[] {
  const duplicates: DuplicateCandidate[] = [];
  
  // Group by vendor name key for efficiency
  const byVendor = new Map<string, any[]>();
  
  contracts.forEach(c => {
    const key = c.vendor_name_key || generateCompanyKey(c.vendor_name);
    if (!byVendor.has(key)) {
      byVendor.set(key, []);
    }
    byVendor.get(key)!.push(c);
  });

  // Check for duplicates within each vendor group
  byVendor.forEach(vendorContracts => {
    for (let i = 0; i < vendorContracts.length; i++) {
      for (let j = i + 1; j < vendorContracts.length; j++) {
        const c1 = vendorContracts[i];
        const c2 = vendorContracts[j];
        
        // Same PIID = likely duplicate
        if (c1.piid && c2.piid && c1.piid === c2.piid) {
          duplicates.push({
            contract1: c1.transaction_number,
            contract2: c2.transaction_number,
            similarity: 100,
            reason: 'Same PIID'
          });
          continue;
        }

        // Same amount, same date, same vendor = likely duplicate
        if (
          c1.current_total_value_of_award &&
          c2.current_total_value_of_award &&
          Math.abs(c1.current_total_value_of_award - c2.current_total_value_of_award) < 0.01 &&
          c1.date_signed === c2.date_signed
        ) {
          duplicates.push({
            contract1: c1.transaction_number,
            contract2: c2.transaction_number,
            similarity: 95,
            reason: 'Same amount and date'
          });
        }
      }
    }
  });

  return duplicates;
}

