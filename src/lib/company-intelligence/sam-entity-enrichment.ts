/**
 * SAM.gov Entity Management API Enrichment
 * Enriches company data with SAM.gov entity registration details
 * 
 * FREE - No cost, already have API access
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SAMEntityResponse {
  entityData: Array<{
    entityRegistration: {
      samRegistered: string;
      ueiSAM: string;
      entityEFTIndicator: string;
      cageCode: string;
      dodaac: string;
      legalBusinessName: string;
      dbaName: string;
      purposeOfRegistrationCode: string;
      registrationStatus: string;
      registrationDate: string;
      lastUpdateDate: string;
      registrationExpirationDate: string;
      activationDate: string;
      ueiStatus: string;
      ueiExpirationDate: string;
      ueiCreationDate: string;
      publicDisplayFlag: string;
      exclusionStatusFlag: string;
      exclusionURL: string;
      dnbOpenData: string;
    };
    coreData: {
      entityHierarchyInformation: {
        immediateParentEntity: {
          ueiSAM: string;
          legalBusinessName: string;
          physicalAddress: {
            addressLine1: string;
            city: string;
            stateOrProvinceCode: string;
            zipCode: string;
            countryCode: string;
          };
          phoneNumber: string;
        };
        ultimateParentEntity: {
          ueiSAM: string;
          legalBusinessName: string;
        };
      };
      entityInformation: {
        entityURL: string;
        entityDivisionName: string;
        entityDivisionNumber: string;
        entityStartDate: string;
        fiscalYearEndCloseDate: string;
        submissionDate: string;
      };
      physicalAddress: {
        addressLine1: string;
        addressLine2: string;
        city: string;
        stateOrProvinceCode: string;
        zipCode: string;
        zipCodePlus4: string;
        countryCode: string;
      };
      mailingAddress: {
        addressLine1: string;
        addressLine2: string;
        city: string;
        stateOrProvinceCode: string;
        zipCode: string;
        zipCodePlus4: string;
        countryCode: string;
      };
      congressionalDistrict: string;
      generalInformation: {
        agencyBusinessPurposeCode: string;
        agencyBusinessPurposeDesc: string;
        entityStructureCode: string;
        entityStructureDesc: string;
        entityTypeCode: string;
        entityTypeDesc: string;
        profitStructureCode: string;
        profitStructureDesc: string;
        organizationStructureCode: string;
        organizationStructureDesc: string;
        stateOfIncorporationCode: string;
        stateOfIncorporationDesc: string;
        countryOfIncorporationCode: string;
        countryOfIncorporationDesc: string;
      };
      businessTypes: {
        businessTypeList: Array<{
          businessTypeCode: string;
          businessTypeDesc: string;
        }>;
        sbaBusinessTypeList: Array<{
          sbaBusinessTypeCode: string;
          sbaBusinessTypeDesc: string;
          certificationEntryDate: string;
          certificationExitDate: string;
        }>;
      };
      financialInformation: {
        creditCardUsage: string;
        debtSubjectToOffset: string;
      };
    };
    pointsOfContact: Array<{
      firstName: string;
      middleInitial: string;
      lastName: string;
      title: string;
      emailAddress: string;
      usPhone: string;
      usPhoneExtension: string;
      nonUSPhone: string;
      fax: string;
      addressLine1: string;
      addressLine2: string;
      city: string;
      stateOrProvinceCode: string;
      zipCode: string;
      zipCodePlus4: string;
      countryCode: string;
    }>;
    repsAndCerts: {
      certifications: {
        fARResponses: {
          provisionId: string;
          listOfAnswers: Array<{
            section: string;
            questionText: string;
            answerId: string;
            answerText: string;
            country: string;
            companyName: string;
            highestEmployeeCompensation: string;
            grossRevenuesBusinessPrevious3Years: string;
          }>;
        };
      };
    };
  }>;
}

/**
 * Enrich a company with SAM.gov Entity Management data
 */
export async function enrichWithSAMEntity(uei: string): Promise<any> {
  console.log(`Enriching company with UEI: ${uei}`);

  try {
    // Call SAM.gov Entity Management API
    const response = await fetch(
      `https://api.sam.gov/entity-information/v3/entities?ueiSAM=${uei}&includeSections=entityRegistration,coreData,pointsOfContact,repsAndCerts`,
      {
        headers: {
          'X-Api-Key': process.env.SAM_GOV_ENRICHMENT_API_KEY || process.env.SAM_GOV_API_KEY!,
          'Accept': 'application/json',
        },
      }
    );

    // Log API call
    await logAPICall('sam.gov', `/entity-information/v3/entities`, uei, response.status, response.ok);

    if (!response.ok) {
      throw new Error(`SAM.gov API error: ${response.status} ${response.statusText}`);
    }

    const data: SAMEntityResponse = await response.json();

    if (!data.entityData || data.entityData.length === 0) {
      console.log(`No entity data found for UEI: ${uei}`);
      return null;
    }

    const entity = data.entityData[0];

    // Extract and format data
    const enrichmentData = {
      vendor_uei: uei,
      
      // SAM.gov Entity Data
      sam_legal_name: entity.entityRegistration.legalBusinessName,
      sam_dba_name: entity.coreData?.entityInformation?.entityDivisionName,
      sam_business_type: entity.coreData?.generalInformation?.entityStructureDesc,
      sam_incorporation_date: entity.coreData?.entityInformation?.entityStartDate
        ? new Date(entity.coreData.entityInformation.entityStartDate).toISOString().split('T')[0]
        : null,
      sam_fiscal_year_end: entity.coreData?.entityInformation?.fiscalYearEndCloseDate,
      sam_congressional_district: entity.coreData?.congressionalDistrict,
      sam_registration_date: entity.entityRegistration.registrationDate
        ? new Date(entity.entityRegistration.registrationDate).toISOString().split('T')[0]
        : null,
      sam_expiration_date: entity.entityRegistration.registrationExpirationDate
        ? new Date(entity.entityRegistration.registrationExpirationDate).toISOString().split('T')[0]
        : null,
      sam_last_update_date: entity.entityRegistration.lastUpdateDate
        ? new Date(entity.entityRegistration.lastUpdateDate).toISOString().split('T')[0]
        : null,
      sam_registration_status: entity.entityRegistration.registrationStatus,
      
      // Address
      headquarters_address: entity.coreData?.physicalAddress?.addressLine1,
      headquarters_city: entity.coreData?.physicalAddress?.city,
      headquarters_state: entity.coreData?.physicalAddress?.stateOrProvinceCode,
      headquarters_zip: entity.coreData?.physicalAddress?.zipCode,
      headquarters_country: entity.coreData?.physicalAddress?.countryCode || 'USA',
      
      mailing_address: entity.coreData?.mailingAddress?.addressLine1,
      mailing_city: entity.coreData?.mailingAddress?.city,
      mailing_state: entity.coreData?.mailingAddress?.stateOrProvinceCode,
      mailing_zip: entity.coreData?.mailingAddress?.zipCode,
      
      // Contact Info
      primary_email: entity.pointsOfContact?.[0]?.emailAddress,
      primary_phone: entity.pointsOfContact?.[0]?.usPhone,
      primary_contact_name: entity.pointsOfContact?.[0] 
        ? `${entity.pointsOfContact[0].firstName} ${entity.pointsOfContact[0].lastName}`
        : null,
      primary_contact_title: entity.pointsOfContact?.[0]?.title,
      website: entity.coreData?.entityInformation?.entityURL,
      
      // Small Business Classifications
      is_small_business: entity.coreData?.businessTypes?.businessTypeList?.some(
        (bt: any) => bt.businessTypeCode === '2X'
      ) || false,
      is_woman_owned: entity.coreData?.businessTypes?.businessTypeList?.some(
        (bt: any) => bt.businessTypeCode === '2R' || bt.businessTypeCode === '8W'
      ) || false,
      is_veteran_owned: entity.coreData?.businessTypes?.businessTypeList?.some(
        (bt: any) => bt.businessTypeCode === 'QF'
      ) || false,
      is_service_disabled_veteran_owned: entity.coreData?.businessTypes?.businessTypeList?.some(
        (bt: any) => bt.businessTypeCode === 'A2'
      ) || false,
      is_8a_program: entity.coreData?.businessTypes?.sbaBusinessTypeList?.some(
        (sba: any) => sba.sbaBusinessTypeCode === 'A6'
      ) || false,
      is_hubzone: entity.coreData?.businessTypes?.businessTypeList?.some(
        (bt: any) => bt.businessTypeCode === 'XX'
      ) || false,
      
      small_business_types: entity.coreData?.businessTypes?.businessTypeList?.map(
        (bt: any) => bt.businessTypeDesc
      ) || [],
      
      // CAGE Code
      vendor_cage: entity.entityRegistration.cageCode,
      
      // Data tracking
      sam_enriched: true,
      sam_last_checked: new Date().toISOString(),
      data_sources: ['sam.gov'],
      last_enriched: new Date().toISOString(),
    };

    // Extract revenue/employee info from FAR responses if available
    const farResponses = entity.repsAndCerts?.certifications?.fARResponses?.listOfAnswers;
    if (farResponses) {
      // const revenueAnswer = farResponses.find((a: any) => 
      //   a.questionText?.includes('gross revenues') || a.questionText?.includes('annual revenue')
      // );
      // if (revenueAnswer?.grossRevenuesBusinessPrevious3Years) {
      //   enrichmentData.annual_revenue_range = revenueAnswer.grossRevenuesBusinessPrevious3Years;
      // }
    }

    return enrichmentData;
  } catch (error: any) {
    console.error(`Error enriching with SAM.gov Entity for UEI ${uei}:`, error);
    await logAPICall('sam.gov', `/entity-information/v3/entities`, uei, 0, false, error?.message || 'Unknown error');
    throw error;
  }
}

/**
 * Batch enrich companies from fpds_company_stats
 */
export async function batchEnrichFromFPDS(limit: number = 100): Promise<void> {
  console.log(`Starting batch enrichment of ${limit} companies from FPDS...`);

  // Get companies that need enrichment
  const { data: companies, error } = await supabase
    .from('fpds_company_stats')
    .select('id, company_name, vendor_uei, vendor_duns')
    .is('company_intelligence_id', null)
    .not('vendor_uei', 'is', null)
    .order('total_value', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching companies:', error);
    return;
  }

  console.log(`Found ${companies?.length || 0} companies to enrich`);

  for (const company of companies || []) {
    try {
      console.log(`Processing: ${company.company_name} (${company.vendor_uei})`);

      // Check if already enriched
      const { data: existing } = await supabase
        .from('company_intelligence')
        .select('id')
        .eq('vendor_uei', company.vendor_uei)
        .single();

      if (existing) {
        // Link existing record
        await supabase
          .from('fpds_company_stats')
          .update({ 
            company_intelligence_id: existing.id,
            intelligence_enriched: true,
          })
          .eq('id', company.id);
        
        console.log(`  ✓ Already enriched, linked record`);
        continue;
      }

      // Enrich with SAM.gov
      const enrichmentData = await enrichWithSAMEntity(company.vendor_uei);

      if (!enrichmentData) {
        console.log(`  ⚠ No SAM.gov data found`);
        continue;
      }

      // Insert into company_intelligence
      const { data: newCompany, error: insertError } = await supabase
        .from('company_intelligence')
        .insert({
          company_name: company.company_name,
          vendor_duns: company.vendor_duns,
          ...enrichmentData,
        })
        .select()
        .single();

      if (insertError) {
        console.error(`  ✗ Error inserting:`, insertError);
        continue;
      }

      // Link back to fpds_company_stats
      await supabase
        .from('fpds_company_stats')
        .update({ 
          company_intelligence_id: newCompany.id,
          intelligence_enriched: true,
          intelligence_last_updated: new Date().toISOString(),
        })
        .eq('id', company.id);

      console.log(`  ✓ Enriched and linked successfully`);

      // Rate limiting: 10 requests per second
      // Rate limiting: 3 second delay to avoid conflicts with other scrapers using same API key
      await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (error) {
      console.error(`  ✗ Error processing ${company.company_name}:`, error);
    }
  }

  console.log('Batch enrichment complete!');
}

/**
 * Log API call for monitoring
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
    // Don't throw on logging errors
    console.error('Error logging API call:', error);
  }
}

/**
 * Update enrichment status
 */
export async function updateEnrichmentProgress(
  companyId: number,
  updates: {
    sam_enriched?: boolean;
    sec_enriched?: boolean;
    oc_enriched?: boolean;
    yf_enriched?: boolean;
  }
): Promise<void> {
  // Build data_sources array
  const dataSources: string[] = [];
  if (updates.sam_enriched) dataSources.push('sam.gov');
  if (updates.sec_enriched) dataSources.push('sec');
  if (updates.oc_enriched) dataSources.push('opencorporates');
  if (updates.yf_enriched) dataSources.push('yahoo_finance');

  await supabase
    .from('company_intelligence')
    .update({
      ...updates,
      data_sources: dataSources,
      last_enriched: new Date().toISOString(),
    })
    .eq('id', companyId);
}

