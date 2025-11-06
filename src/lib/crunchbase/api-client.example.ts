/**
 * Crunchbase API Client - Example Implementation
 * 
 * This is a reference implementation showing how to integrate with Crunchbase API.
 * Rename to api-client.ts and add your API key to use in production.
 * 
 * Usage:
 *   const client = new CrunchbaseClient(process.env.CRUNCHBASE_API_KEY!);
 *   const results = await client.searchOrganizations('Anduril Industries');
 *   const company = await client.getOrganization(results[0].uuid);
 */

import type {
  CrunchbaseAPIConfig,
  CrunchbaseOrganizationSearchResult,
  CrunchbaseOrganizationDetail,
  CrunchbaseAPIResponse,
  SearchOrganizationsParams,
  GetOrganizationParams,
  CrunchbaseAPIError,
} from '@/types/crunchbase';

export class CrunchbaseClient {
  private apiKey: string;
  private baseURL: string;
  private rateLimitPerMinute: number;
  private timeout: number;
  private requestQueue: Array<() => Promise<any>> = [];
  private requestsInLastMinute: number[] = [];

  constructor(config: string | CrunchbaseAPIConfig) {
    if (typeof config === 'string') {
      this.apiKey = config;
      this.baseURL = 'https://api.crunchbase.com/api/v4';
      this.rateLimitPerMinute = 200;
      this.timeout = 30000;
    } else {
      this.apiKey = config.apiKey;
      this.baseURL = config.baseURL || 'https://api.crunchbase.com/api/v4';
      this.rateLimitPerMinute = config.rateLimitPerMinute || 200;
      this.timeout = config.timeout || 30000;
    }
  }

  /**
   * Search for organizations by name
   */
  async searchOrganizations(
    query: string,
    params?: Omit<SearchOrganizationsParams, 'query'>
  ): Promise<CrunchbaseOrganizationSearchResult[]> {
    const fieldIds = params?.fieldIds || [
      'identifier',
      'name',
      'legal_name',
      'website',
      'short_description',
      'categories',
      'category_groups',
      'location_identifiers',
      'num_employees_enum',
      'operating_status',
    ];

    const body = {
      field_ids: fieldIds,
      limit: params?.limit || 25,
      order: [
        {
          field_id: 'name',
          sort: params?.order || 'asc',
        },
      ],
      query: [
        {
          type: 'predicate',
          field_id: 'name',
          operator_id: 'contains',
          values: [query],
        },
      ],
    };

    const response = await this.request<CrunchbaseAPIResponse<CrunchbaseOrganizationSearchResult>>(
      '/searches/organizations',
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );

    return response.entities || [];
  }

  /**
   * Get detailed organization information
   */
  async getOrganization(
    uuid: string,
    params?: Omit<GetOrganizationParams, 'uuid'>
  ): Promise<CrunchbaseOrganizationDetail> {
    const cardIds = params?.cardIds || [
      'fields',
      'funding_rounds',
      'investors',
      'people',
      'acquisitions',
      'headquarters_address',
    ];

    const queryParams = new URLSearchParams({
      card_ids: cardIds.join(','),
    });

    const response = await this.request<{ properties: CrunchbaseOrganizationDetail }>(
      `/entities/organizations/${uuid}?${queryParams.toString()}`,
      {
        method: 'GET',
      }
    );

    return response.properties;
  }

  /**
   * Search for organizations with advanced filters
   */
  async searchOrganizationsAdvanced(params: {
    name?: string;
    location?: string;
    categories?: string[];
    fundingRangeMin?: number;
    fundingRangeMax?: number;
    employeeRange?: string;
  }): Promise<CrunchbaseOrganizationSearchResult[]> {
    const queries: any[] = [];

    if (params.name) {
      queries.push({
        type: 'predicate',
        field_id: 'name',
        operator_id: 'contains',
        values: [params.name],
      });
    }

    if (params.location) {
      queries.push({
        type: 'predicate',
        field_id: 'location_identifiers',
        operator_id: 'includes',
        values: [params.location],
      });
    }

    if (params.categories && params.categories.length > 0) {
      queries.push({
        type: 'predicate',
        field_id: 'categories',
        operator_id: 'includes',
        values: params.categories,
      });
    }

    if (params.fundingRangeMin !== undefined || params.fundingRangeMax !== undefined) {
      queries.push({
        type: 'predicate',
        field_id: 'funding_total',
        operator_id: 'between',
        values: [
          { value: params.fundingRangeMin || 0, currency: 'usd' },
          { value: params.fundingRangeMax || 1000000000, currency: 'usd' },
        ],
      });
    }

    if (params.employeeRange) {
      queries.push({
        type: 'predicate',
        field_id: 'num_employees_enum',
        operator_id: 'eq',
        values: [params.employeeRange],
      });
    }

    const body = {
      field_ids: [
        'identifier',
        'name',
        'legal_name',
        'website',
        'short_description',
        'categories',
        'location_identifiers',
        'funding_total',
        'num_employees_enum',
      ],
      limit: 100,
      query: queries,
    };

    const response = await this.request<CrunchbaseAPIResponse<CrunchbaseOrganizationSearchResult>>(
      '/searches/organizations',
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );

    return response.entities || [];
  }

  /**
   * Get funding rounds for an organization
   */
  async getFundingRounds(organizationUuid: string) {
    const body = {
      field_ids: [
        'identifier',
        'announced_on',
        'funding_type',
        'money_raised',
        'pre_money_valuation',
        'post_money_valuation',
        'investor_identifiers',
        'lead_investor_identifiers',
        'num_investors',
      ],
      query: [
        {
          type: 'predicate',
          field_id: 'funded_organization_identifier',
          operator_id: 'eq',
          values: [organizationUuid],
        },
      ],
      limit: 100,
    };

    const response = await this.request<CrunchbaseAPIResponse<any>>(
      '/searches/funding_rounds',
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );

    return response.entities || [];
  }

  /**
   * Get acquisitions involving an organization
   */
  async getAcquisitions(organizationUuid: string, type: 'acquirer' | 'acquiree' = 'acquirer') {
    const fieldId = type === 'acquirer' ? 'acquirer_identifier' : 'acquiree_identifier';

    const body = {
      field_ids: [
        'identifier',
        'acquirer_identifier',
        'acquiree_identifier',
        'announced_on',
        'completed_on',
        'price',
        'acquisition_type',
        'acquisition_status',
      ],
      query: [
        {
          type: 'predicate',
          field_id: fieldId,
          operator_id: 'eq',
          values: [organizationUuid],
        },
      ],
      limit: 100,
    };

    const response = await this.request<CrunchbaseAPIResponse<any>>(
      '/searches/acquisitions',
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );

    return response.entities || [];
  }

  /**
   * Rate-limited HTTP request
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    await this.waitForRateLimit();

    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-cb-user-key': this.apiKey,
      ...options.headers,
    };

    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: AbortSignal.timeout(this.timeout),
      });

      const responseTime = Date.now() - startTime;

      // Track API usage
      await this.logAPICall({
        endpoint,
        method: options.method || 'GET',
        statusCode: response.status,
        success: response.ok,
        responseTimeMs: responseTime,
        rateLimitRemaining: this.getRateLimitRemaining(response),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw this.createError(
          `Crunchbase API error: ${response.statusText}`,
          response.status,
          endpoint,
          error
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createError(`Request timeout after ${this.timeout}ms`, undefined, endpoint);
      }
      throw error;
    }
  }

  /**
   * Wait for rate limit before making request
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove requests older than 1 minute
    this.requestsInLastMinute = this.requestsInLastMinute.filter((time) => time > oneMinuteAgo);

    if (this.requestsInLastMinute.length >= this.rateLimitPerMinute) {
      const oldestRequest = this.requestsInLastMinute[0];
      const waitTime = 60000 - (now - oldestRequest);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.waitForRateLimit();
    }

    this.requestsInLastMinute.push(now);
  }

  /**
   * Get rate limit remaining from response headers
   */
  private getRateLimitRemaining(response: Response): number | undefined {
    const remaining = response.headers.get('X-RateLimit-Remaining');
    return remaining ? parseInt(remaining, 10) : undefined;
  }

  /**
   * Create a structured error
   */
  private createError(
    message: string,
    statusCode?: number,
    endpoint?: string,
    details?: any
  ): CrunchbaseAPIError {
    const error = new Error(message) as CrunchbaseAPIError;
    error.statusCode = statusCode;
    error.endpoint = endpoint;
    error.name = 'CrunchbaseAPIError';
    if (details) {
      error.message += ` - ${JSON.stringify(details)}`;
    }
    return error;
  }

  /**
   * Log API call to database for monitoring
   */
  private async logAPICall(data: {
    endpoint: string;
    method: string;
    statusCode: number;
    success: boolean;
    responseTimeMs: number;
    rateLimitRemaining?: number;
    error?: string;
  }): Promise<void> {
    try {
      // TODO: Implement database logging
      // This should insert into crunchbase_api_usage table
      // For now, just console.log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Crunchbase API]', {
          ...data,
          timestamp: new Date().toISOString(),
        });
      }

      // Example Supabase implementation:
      // const { supabase } = await import('@/lib/supabase');
      // await supabase.from('crunchbase_api_usage').insert({
      //   endpoint: data.endpoint,
      //   request_method: data.method,
      //   status_code: data.statusCode,
      //   success: data.success,
      //   response_time_ms: data.responseTimeMs,
      //   rate_limit_remaining: data.rateLimitRemaining,
      //   error_message: data.error,
      //   called_at: new Date().toISOString(),
      // });
    } catch (error) {
      // Don't throw on logging errors
      console.error('Failed to log API call:', error);
    }
  }

  /**
   * Get current API usage stats
   */
  async getUsageStats(date?: Date): Promise<{
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    avgResponseTime: number;
  }> {
    // TODO: Implement by querying crunchbase_api_usage table
    // This is a placeholder
    return {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      avgResponseTime: 0,
    };
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Normalize company name for matching
 * Removes common suffixes and standardizes format
 */
export function normalizeCompanyName(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\b(INC|LLC|LTD|CORP|CORPORATION|INCORPORATED|LIMITED|COMPANY|CO)\b\.?/gi, '')
    .replace(/[,.']/g, '')
    .trim();
}

/**
 * Extract domain from URL or email
 */
export function extractDomain(urlOrEmail: string): string {
  try {
    if (urlOrEmail.includes('@')) {
      return urlOrEmail.split('@')[1].toLowerCase();
    }
    const url = new URL(urlOrEmail.startsWith('http') ? urlOrEmail : `https://${urlOrEmail}`);
    return url.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return urlOrEmail.toLowerCase();
  }
}

/**
 * Calculate string similarity (simple Levenshtein distance)
 */
export function calculateNameSimilarity(str1: string, str2: string): number {
  const s1 = normalizeCompanyName(str1);
  const s2 = normalizeCompanyName(str2);

  if (s1 === s2) return 1.0;

  const maxLength = Math.max(s1.length, s2.length);
  if (maxLength === 0) return 1.0;

  const distance = levenshteinDistance(s1, s2);
  return 1 - distance / maxLength;
}

/**
 * Levenshtein distance calculation
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// ============================================
// Usage Examples
// ============================================

/**
 * Example 1: Search for a company
 */
export async function example_searchCompany() {
  const client = new CrunchbaseClient(process.env.CRUNCHBASE_API_KEY!);

  const results = await client.searchOrganizations('Anduril Industries');

  console.log('Search Results:', results.length);
  results.forEach((result) => {
    console.log(`- ${result.properties.name} (${result.uuid})`);
    console.log(`  Website: ${result.properties.website?.value || 'N/A'}`);
    console.log(`  Description: ${result.properties.short_description || 'N/A'}`);
  });
}

/**
 * Example 2: Get full company details
 */
export async function example_getCompanyDetails(uuid: string) {
  const client = new CrunchbaseClient(process.env.CRUNCHBASE_API_KEY!);

  const company = await client.getOrganization(uuid);

  console.log('Company Details:');
  console.log(`Name: ${company.properties.name}`);
  console.log(`Founded: ${company.properties.founded_on?.value || 'Unknown'}`);
  console.log(
    `Total Funding: $${company.properties.funding_total?.value_usd?.toLocaleString() || 0}`
  );
  console.log(`Employees: ${company.properties.num_employees_enum || 'Unknown'}`);
  console.log(
    `Headquarters: ${company.properties.headquarters_location?.value || 'Unknown'}`
  );

  if (company.cards?.funding_rounds) {
    console.log('\nFunding Rounds:');
    company.cards.funding_rounds.forEach((round) => {
      console.log(
        `- ${round.properties.name || round.properties.funding_type} (${round.properties.announced_on?.value}): $${round.properties.money_raised?.value_usd?.toLocaleString() || 0}`
      );
    });
  }
}

/**
 * Example 3: Advanced search with filters
 */
export async function example_advancedSearch() {
  const client = new CrunchbaseClient(process.env.CRUNCHBASE_API_KEY!);

  const results = await client.searchOrganizationsAdvanced({
    categories: ['Defense', 'Artificial Intelligence'],
    location: 'California',
    fundingRangeMin: 10_000_000,
    employeeRange: '101-250',
  });

  console.log(`Found ${results.length} companies matching criteria`);
}

/**
 * Example 4: Check API usage
 */
export async function example_checkUsage() {
  const client = new CrunchbaseClient(process.env.CRUNCHBASE_API_KEY!);

  const stats = await client.getUsageStats();

  console.log('API Usage Stats:');
  console.log(`Total Calls: ${stats.totalCalls}`);
  console.log(`Successful: ${stats.successfulCalls}`);
  console.log(`Failed: ${stats.failedCalls}`);
  console.log(`Avg Response Time: ${stats.avgResponseTime}ms`);
}

