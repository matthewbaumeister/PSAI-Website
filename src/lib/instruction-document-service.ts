/**
 * INSTRUCTION DOCUMENT SERVICE
 * 
 * Main orchestration service for generating consolidated instruction documents
 * Handles PDF parsing, generation, storage, and database updates
 */

import { createClient } from '@supabase/supabase-js';
import { InstructionPdfParser, InstructionDocument } from './instruction-pdf-parser';
import { InstructionPdfGenerator, ConsolidatedInstructionData, OpportunityInfo } from './instruction-pdf-generator';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface OpportunityData {
  id: number;
  topic_number: string;
  topic_id: string;
  title: string;
  component: string;
  program: string;
  phase: string;
  status: string;
  open_date?: string;
  close_date?: string;
  component_instructions_download?: string;  // Actual column name in sbir_final
  solicitation_instructions_download?: string;  // Actual column name in sbir_final
}

export interface GenerationResult {
  success: boolean;
  opportunityId: number;
  topicNumber: string;
  pdfUrl?: string;
  error?: string;
  debug?: {
    componentUrl?: string;
    solicitationUrl?: string;
    componentParsed: boolean;
    solicitationParsed: boolean;
    volumesExtracted: number;
    checklistItemsExtracted: number;
    plainTextLength: number;
    componentPages: number;
    solicitationPages: number;
  };
}

export class InstructionDocumentService {
  private parser: InstructionPdfParser;
  private generator: InstructionPdfGenerator;
  private storageBucket = 'instruction-documents';

  constructor() {
    this.parser = new InstructionPdfParser();
    this.generator = new InstructionPdfGenerator();
  }

  /**
   * Generate instruction document for a single opportunity
   */
  async generateForOpportunity(opportunityId: number): Promise<GenerationResult> {
    try {
      console.log(`\nGenerating instruction document for opportunity ${opportunityId}...`);

      // Fetch opportunity data
      const { data: opportunity, error: fetchError } = await supabase
        .from('sbir_final')
        .select('*')
        .eq('id', opportunityId)
        .single();

      if (fetchError || !opportunity) {
        throw new Error(`Failed to fetch opportunity: ${fetchError?.message}`);
      }

      // Check if instructions are available
      if (!opportunity.component_instructions_download && !opportunity.solicitation_instructions_download) {
        console.log(`No instruction URLs available for ${opportunity.topic_number}`);
        return {
          success: false,
          opportunityId,
          topicNumber: opportunity.topic_number,
          error: 'No instruction URLs available'
        };
      }

      // Parse instruction documents from PDFs
      const parsedDocs = await this.parseInstructionDocuments(opportunity);

      // Merge instructions from both documents
      const mergedData = await this.parser.mergeInstructions(
        parsedDocs.componentDoc,
        parsedDocs.solicitationDoc
      );

      // Generate consolidated PDF
      const pdfBuffer = await this.generatePdf(opportunity, mergedData, parsedDocs);

      // Upload to Supabase Storage
      const pdfUrl = await this.uploadToStorage(opportunity.topic_number, pdfBuffer);

      // Update database
      await this.updateDatabase(opportunity.id, {
        pdfUrl,
        plainText: mergedData.plainText,
        volumes: mergedData.volumes,
        checklist: mergedData.checklist
      });

      console.log(`Successfully generated instruction document for ${opportunity.topic_number}`);

      return {
        success: true,
        opportunityId,
        topicNumber: opportunity.topic_number,
        pdfUrl,
        debug: {
          componentUrl: opportunity.component_instructions_download,
          solicitationUrl: opportunity.solicitation_instructions_download,
          componentParsed: !!parsedDocs.componentDoc,
          solicitationParsed: !!parsedDocs.solicitationDoc,
          volumesExtracted: mergedData.volumes.length,
          checklistItemsExtracted: mergedData.checklist.length,
          plainTextLength: mergedData.plainText.length,
          componentPages: parsedDocs.componentDoc?.pageCount || 0,
          solicitationPages: parsedDocs.solicitationDoc?.pageCount || 0
        }
      };
    } catch (error) {
      console.error(`Error generating instruction document for opportunity ${opportunityId}:`, error);
      return {
        success: false,
        opportunityId,
        topicNumber: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate instruction documents for multiple opportunities
   */
  async generateForOpportunities(opportunityIds: number[]): Promise<GenerationResult[]> {
    const results: GenerationResult[] = [];

    for (const id of opportunityIds) {
      const result = await this.generateForOpportunity(id);
      results.push(result);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return results;
  }

  /**
   * Generate instruction documents for all active opportunities
   */
  async generateForActiveOpportunities(): Promise<{
    total: number;
    successful: number;
    failed: number;
    results: GenerationResult[];
  }> {
    console.log('\nFetching active opportunities...');

    // Fetch active opportunities without instruction documents
    const { data: opportunities, error } = await supabase
      .from('sbir_final')
      .select('id, topic_number, status')
      .in('status', ['Open', 'Prerelease', 'Active'])
      .is('consolidated_instructions_url', null)
      .or('component_instructions_download.not.is.null,solicitation_instructions_download.not.is.null');

    if (error) {
      throw new Error(`Failed to fetch opportunities: ${error.message}`);
    }

    if (!opportunities || opportunities.length === 0) {
      console.log('No opportunities found that need instruction documents');
      return { total: 0, successful: 0, failed: 0, results: [] };
    }

    console.log(`Found ${opportunities.length} opportunities to process`);

    const results = await this.generateForOpportunities(opportunities.map(o => o.id));

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      total: opportunities.length,
      successful,
      failed,
      results
    };
  }


  /**
   * Create default volumes structure from database
   */
  private createDefaultVolumes() {
    return [
      {
        volumeNumber: 1,
        volumeName: 'Cost Proposal',
        description: 'Detailed cost breakdown and budget information',
        requirements: [
          'Provide detailed cost breakdown by task',
          'Include labor rates and hours',
          'List all materials and equipment costs',
          'Specify any subcontractor costs'
        ]
      },
      {
        volumeNumber: 2,
        volumeName: 'Technical Proposal',
        description: 'Technical approach and innovation description',
        requirements: [
          'Describe technical approach and innovation',
          'Provide work plan and timeline',
          'List key personnel and qualifications',
          'Describe facilities and equipment',
          'Include related work and references'
        ]
      },
      {
        volumeNumber: 3,
        volumeName: 'Company Information',
        description: 'Company qualifications and certifications',
        requirements: [
          'Provide company overview and history',
          'List relevant past performance',
          'Include small business certifications',
          'Provide corporate information'
        ]
      }
    ];
  }

  /**
   * Create default checklist from database info
   */
  private createDefaultChecklist(opportunity: OpportunityData) {
    return [
      'Complete SF 1449 form (Solicitation/Contract/Order)',
      'Volume 1: Cost Proposal with detailed breakdown',
      'Volume 2: Technical Proposal (page limits apply)',
      'Volume 3: Company Commercialization Report',
      'Small Business Administration (SBA) certifications',
      'Past Performance references',
      'Key Personnel resumes and qualifications',
      'Facilities and equipment descriptions',
      'Data rights assertions (if applicable)',
      'Submit through official submission portal before deadline',
      `Deadline: ${opportunity.close_date || 'See solicitation'}`,
      'Follow formatting requirements (font, margins, page limits)',
      'Include all required signatures and certifications'
    ];
  }

  /**
   * Create plain text archive from database
   */
  private createPlainTextFromDatabase(opportunity: OpportunityData): string {
    return `
SBIR/STTR SUBMISSION INSTRUCTIONS
Topic: ${opportunity.topic_number}
Title: ${opportunity.title}
Component: ${opportunity.component}
Program: ${opportunity.program}
Phase: ${opportunity.phase}
Status: ${opportunity.status}

IMPORTANT DATES:
Open Date: ${opportunity.open_date || 'N/A'}
Close Date: ${opportunity.close_date || 'N/A'}

INSTRUCTION SOURCES:
Component Instructions: ${opportunity.component_instructions_download || 'Not available'}
Solicitation Instructions: ${opportunity.solicitation_instructions_download || 'Not available'}

SUBMISSION REQUIREMENTS:
Please refer to the official BAA and component-specific instructions linked above for complete details.

VOLUME 1: COST PROPOSAL
- Detailed cost breakdown by task
- Labor rates and hours
- Materials and equipment costs
- Subcontractor costs

VOLUME 2: TECHNICAL PROPOSAL (PRIMARY EVALUATION VOLUME)
- Technical approach and innovation
- Work plan and timeline
- Key personnel qualifications
- Facilities and equipment
- Related work and references

VOLUME 3: COMPANY INFORMATION
- Company overview and history
- Past performance
- Small business certifications
- Corporate information

For complete and authoritative instructions, always refer to the official documents linked above.

Document generated: ${new Date().toISOString()}
    `.trim();
  }

  /**
   * Parse instruction documents from URLs
   */
  private async parseInstructionDocuments(opportunity: OpportunityData): Promise<{
    componentDoc: InstructionDocument | null;
    solicitationDoc: InstructionDocument | null;
  }> {
    let componentDoc: InstructionDocument | null = null;
    let solicitationDoc: InstructionDocument | null = null;

    // Parse component instructions
    if (opportunity.component_instructions_download) {
      try {
        console.log(`Parsing component instructions from: ${opportunity.component_instructions_download}`);
        componentDoc = await this.parser.parseInstructionPdf(
          opportunity.component_instructions_download,
          'component'
        );
        console.log(`Parsed component doc: ${componentDoc.pageCount} pages, ${componentDoc.volumes.length} volumes`);
      } catch (error) {
        console.error('Error parsing component instructions:', error);
      }
    }

    // Parse solicitation instructions
    if (opportunity.solicitation_instructions_download) {
      try {
        console.log(`Parsing solicitation instructions from: ${opportunity.solicitation_instructions_download}`);
        solicitationDoc = await this.parser.parseInstructionPdf(
          opportunity.solicitation_instructions_download,
          'solicitation'
        );
        console.log(`Parsed solicitation doc: ${solicitationDoc.pageCount} pages, ${solicitationDoc.volumes.length} volumes`);
      } catch (error) {
        console.error('Error parsing solicitation instructions:', error);
      }
    }

    return { componentDoc, solicitationDoc };
  }

  /**
   * Generate consolidated PDF
   */
  private async generatePdf(
    opportunity: OpportunityData,
    mergedData: any,
    parsedDocs: { componentDoc: InstructionDocument | null; solicitationDoc: InstructionDocument | null }
  ): Promise<Buffer> {
    const opportunityInfo: OpportunityInfo = {
      topicNumber: opportunity.topic_number,
      title: opportunity.title,
      component: opportunity.component,
      program: opportunity.program,
      phase: opportunity.phase,
      status: opportunity.status,
      openDate: opportunity.open_date,
      closeDate: opportunity.close_date
    };

    const consolidatedData: ConsolidatedInstructionData = {
      opportunity: opportunityInfo,
      volumes: mergedData.volumes,
      checklist: mergedData.checklist,
      keyDates: mergedData.keyDates,
      submissionGuidelines: [],
      contacts: [
        ...(parsedDocs.componentDoc?.contacts || []),
        ...(parsedDocs.solicitationDoc?.contacts || [])
      ],
      componentInstructionsUrl: opportunity.component_instructions_download,
      solicitationInstructionsUrl: opportunity.solicitation_instructions_download,
      generatedAt: new Date()
    };

    console.log('Generating PDF...');
    return await this.generator.generateConsolidatedPdf(consolidatedData);
  }

  /**
   * Upload PDF to Supabase Storage
   */
  private async uploadToStorage(topicNumber: string, pdfBuffer: Buffer): Promise<string> {
    const fileName = `${topicNumber.replace(/[^a-zA-Z0-9-]/g, '_')}_instructions_${Date.now()}.pdf`;
    const filePath = `${fileName}`;

    console.log(`Uploading PDF to storage: ${filePath}`);

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === this.storageBucket);

    if (!bucketExists) {
      console.log(`Creating storage bucket: ${this.storageBucket}`);
      await supabase.storage.createBucket(this.storageBucket, {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['application/pdf']
      });
    }

    // Upload file
    const { data, error } = await supabase.storage
      .from(this.storageBucket)
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (error) {
      throw new Error(`Failed to upload PDF: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(this.storageBucket)
      .getPublicUrl(filePath);

    console.log(`PDF uploaded successfully: ${urlData.publicUrl}`);

    return urlData.publicUrl;
  }

  /**
   * Update database with generated document info
   */
  private async updateDatabase(
    opportunityId: number,
    data: {
      pdfUrl: string;
      plainText: string;
      volumes: any[];
      checklist: string[];
    }
  ): Promise<void> {
    console.log('Updating database...');

    const { error } = await supabase
      .from('sbir_final')
      .update({
        consolidated_instructions_url: data.pdfUrl,
        instructions_plain_text: data.plainText,
        instructions_volume_structure: data.volumes,
        instructions_checklist: data.checklist,
        instructions_generated_at: new Date().toISOString()
      })
      .eq('id', opportunityId);

    if (error) {
      throw new Error(`Failed to update database: ${error.message}`);
    }

    console.log('Database updated successfully');
  }

  /**
   * Check if instruction document needs regeneration
   */
  async needsRegeneration(opportunityId: number): Promise<boolean> {
    const { data: opportunity } = await supabase
      .from('sbir_final')
      .select('consolidated_instructions_url, instructions_generated_at, status')
      .eq('id', opportunityId)
      .single();

    if (!opportunity) return false;

    // Needs generation if no document exists
    if (!opportunity.consolidated_instructions_url) return true;

    // Don't regenerate for closed opportunities
    if (!['Open', 'Prerelease', 'Active'].includes(opportunity.status)) return false;

    // Regenerate if older than 7 days
    if (opportunity.instructions_generated_at) {
      const generatedDate = new Date(opportunity.instructions_generated_at);
      const daysSince = (Date.now() - generatedDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > 7;
    }

    return false;
  }
}

