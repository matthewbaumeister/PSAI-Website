/**
 * INSTRUCTION PDF PARSER
 * 
 * Fetches and parses BAA and Component instruction PDFs from DSIP
 * Extracts volume requirements, checklists, and submission guidelines
 * Uses pdfjs-dist for serverless compatibility
 */

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

// Completely disable worker for Node.js/serverless
pdfjsLib.GlobalWorkerOptions.workerSrc = false as any;

export interface VolumeRequirement {
  volumeNumber: number;
  volumeName: string;
  description: string;
  requirements: string[];
  pageNumbers?: string;
}

export interface InstructionDocument {
  sourceUrl: string;
  documentType: 'component' | 'solicitation' | 'baa';
  plainText: string;
  volumes: VolumeRequirement[];
  checklist: string[];
  keyDates: { [key: string]: string };
  submissionGuidelines: string[];
  contacts: string[];
  pageCount: number;
  extractedAt: Date;
}

export class InstructionPdfParser {
  /**
   * Parse a PDF from URL and extract structured instruction data
   */
  async parseInstructionPdf(url: string, documentType: 'component' | 'solicitation' | 'baa'): Promise<InstructionDocument> {
    try {
      console.log(`Fetching PDF from: ${url}`);
      
      // Fetch the PDF
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        useSystemFonts: true,
        standardFontDataUrl: undefined
      });
      
      const pdf = await loadingTask.promise;
      const pageCount = pdf.numPages;
      
      console.log(`Loaded PDF: ${pageCount} pages`);
      
      // Extract text from all pages
      let plainText = '';
      for (let i = 1; i <= pageCount; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        plainText += pageText + '\n\n';
      }
      
      console.log(`Extracted ${plainText.length} characters of text`);
      
      // Extract structured information
      const volumes = this.extractVolumes(plainText);
      const checklist = this.extractChecklist(plainText);
      const keyDates = this.extractKeyDates(plainText);
      const submissionGuidelines = this.extractSubmissionGuidelines(plainText);
      const contacts = this.extractContacts(plainText);
      
      return {
        sourceUrl: url,
        documentType,
        plainText,
        volumes,
        checklist,
        keyDates,
        submissionGuidelines,
        contacts,
        pageCount,
        extractedAt: new Date()
      };
    } catch (error) {
      console.error(`Error parsing PDF from ${url}:`, error);
      throw error;
    }
  }

  /**
   * Extract volume requirements (Volume 1, 2, 3, etc.)
   */
  private extractVolumes(text: string): VolumeRequirement[] {
    const volumes: VolumeRequirement[] = [];
    
    // Common SBIR volume patterns
    const volumePatterns = [
      /Volume\s+(\d+)[:\s-]+([^\n]+)/gi,
      /Vol\.\s*(\d+)[:\s-]+([^\n]+)/gi,
      /VOLUME\s+([IVX]+)[:\s-]+([^\n]+)/gi,
    ];
    
    const volumeMatches: Map<number, { name: string; sections: string[] }> = new Map();
    
    for (const pattern of volumePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const volumeNum = this.parseVolumeNumber(match[1]);
        const volumeName = match[2].trim();
        
        if (!volumeMatches.has(volumeNum)) {
          volumeMatches.set(volumeNum, { name: volumeName, sections: [] });
        }
      }
    }
    
    // Extract requirements for each volume
    for (const [volumeNum, data] of volumeMatches.entries()) {
      const requirements = this.extractVolumeRequirements(text, volumeNum);
      
      volumes.push({
        volumeNumber: volumeNum,
        volumeName: data.name,
        description: this.extractVolumeDescription(text, volumeNum),
        requirements
      });
    }
    
    // Sort by volume number
    volumes.sort((a, b) => a.volumeNumber - b.volumeNumber);
    
    return volumes;
  }

  /**
   * Extract checklist items from instruction document
   */
  private extractChecklist(text: string): string[] {
    const checklist: string[] = [];
    
    // Extract bullet points and numbered lists
    const lines = text.split('\n');
    let inChecklistSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detect checklist section headers
      if (/checklist|required\s+documents|submission\s+requirements/i.test(line)) {
        inChecklistSection = true;
        continue;
      }
      
      // Stop at next major section
      if (inChecklistSection && /^[A-Z\d]+\.\s+[A-Z]/.test(line)) {
        inChecklistSection = false;
      }
      
      // Extract list items
      if (inChecklistSection) {
        const bulletMatch = line.match(/^[•●○▪▫-]\s*(.+)$/);
        const numberMatch = line.match(/^\d+[\.)]\s*(.+)$/);
        const letterMatch = line.match(/^[a-z][\.)]\s*(.+)$/i);
        
        if (bulletMatch || numberMatch || letterMatch) {
          const item = (bulletMatch || numberMatch || letterMatch)?.[1]?.trim();
          if (item && item.length > 10) {
            checklist.push(item);
          }
        }
      }
    }
    
    // Also extract "must" and "shall" requirements
    const requirementPattern = /(must|shall)\s+([^.]+\.)(?!\s*\d)/gi;
    let match;
    while ((match = requirementPattern.exec(text)) !== null) {
      const requirement = match[2].trim();
      if (requirement.length > 20 && requirement.length < 200) {
        checklist.push(requirement);
      }
    }
    
    // Deduplicate and limit
    return [...new Set(checklist)].slice(0, 50);
  }

  /**
   * Extract key dates from document
   */
  private extractKeyDates(text: string): { [key: string]: string } {
    const dates: { [key: string]: string } = {};
    
    const datePatterns = [
      /submission\s+(?:deadline|due date)[:\s]+([^\n]+)/gi,
      /close\s+date[:\s]+([^\n]+)/gi,
      /open\s+date[:\s]+([^\n]+)/gi,
      /proposal\s+due[:\s]+([^\n]+)/gi,
      /questions?\s+due[:\s]+([^\n]+)/gi,
    ];
    
    for (const pattern of datePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const dateStr = match[1].trim();
        dates[match[0].split(':')[0].trim()] = dateStr;
      }
    }
    
    return dates;
  }

  /**
   * Extract submission guidelines
   */
  private extractSubmissionGuidelines(text: string): string[] {
    const guidelines: string[] = [];
    
    // Look for submission section
    const submissionSectionMatch = text.match(
      /submission\s+(?:process|procedure|guidelines)[:\s]+([^]*?)(?:\n\n[A-Z]|\n\d+\.)/i
    );
    
    if (submissionSectionMatch) {
      const section = submissionSectionMatch[1];
      const lines = section.split('\n').filter(l => l.trim().length > 20);
      guidelines.push(...lines.slice(0, 10));
    }
    
    return guidelines;
  }

  /**
   * Extract contact information
   */
  private extractContacts(text: string): string[] {
    const contacts: string[] = [];
    
    // Email pattern
    const emailPattern = /[\w.-]+@[\w.-]+\.\w+/g;
    const emails = text.match(emailPattern);
    if (emails) {
      contacts.push(...[...new Set(emails)].slice(0, 5));
    }
    
    // Phone pattern
    const phonePattern = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = text.match(phonePattern);
    if (phones) {
      contacts.push(...[...new Set(phones)].slice(0, 5));
    }
    
    return contacts;
  }

  /**
   * Extract requirements specific to a volume
   */
  private extractVolumeRequirements(text: string, volumeNum: number): string[] {
    const requirements: string[] = [];
    
    // Find the volume section
    const volumePattern = new RegExp(
      `Volume\\s+${volumeNum}[^]*?(?=Volume\\s+\\d+|$)`,
      'i'
    );
    
    const volumeMatch = text.match(volumePattern);
    if (!volumeMatch) return requirements;
    
    const volumeText = volumeMatch[0];
    
    // Extract requirements from volume section
    const reqPatterns = [
      /(?:shall|must|should|required to)\s+([^.]+\.)/gi,
      /requirement[:\s]+([^.]+\.)/gi,
    ];
    
    for (const pattern of reqPatterns) {
      let match;
      while ((match = pattern.exec(volumeText)) !== null) {
        const req = match[1].trim();
        if (req.length > 20 && req.length < 300) {
          requirements.push(req);
        }
      }
    }
    
    return [...new Set(requirements)].slice(0, 20);
  }

  /**
   * Extract volume description
   */
  private extractVolumeDescription(text: string, volumeNum: number): string {
    const volumePattern = new RegExp(
      `Volume\\s+${volumeNum}[:\\s-]+([^]*?)(?=Volume\\s+\\d+|\\n\\n[A-Z]|$)`,
      'i'
    );
    
    const match = text.match(volumePattern);
    if (!match) return '';
    
    // Get first paragraph
    const firstPara = match[1].split('\n\n')[0];
    return firstPara.trim().substring(0, 500);
  }

  /**
   * Parse volume number (handles roman numerals and digits)
   */
  private parseVolumeNumber(vol: string): number {
    const romanMap: { [key: string]: number } = {
      'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
      'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10
    };
    
    return romanMap[vol.toUpperCase()] || parseInt(vol) || 0;
  }

  /**
   * Merge component and solicitation instructions
   */
  async mergeInstructions(
    componentDoc: InstructionDocument | null,
    solicitationDoc: InstructionDocument | null
  ): Promise<{
    volumes: VolumeRequirement[];
    checklist: string[];
    plainText: string;
    keyDates: { [key: string]: string };
  }> {
    const volumes: VolumeRequirement[] = [];
    const checklist: string[] = [];
    const keyDates: { [key: string]: string } = {};
    let plainText = '';
    
    // Merge volumes (prioritize more specific document)
    if (componentDoc) {
      volumes.push(...componentDoc.volumes);
      checklist.push(...componentDoc.checklist);
      Object.assign(keyDates, componentDoc.keyDates);
      plainText += `\n\n=== COMPONENT INSTRUCTIONS ===\n\n${componentDoc.plainText}`;
    }
    
    if (solicitationDoc) {
      // Merge volumes (avoid duplicates)
      for (const vol of solicitationDoc.volumes) {
        const existing = volumes.find(v => v.volumeNumber === vol.volumeNumber);
        if (existing) {
          // Merge requirements
          existing.requirements.push(...vol.requirements);
          existing.requirements = [...new Set(existing.requirements)];
        } else {
          volumes.push(vol);
        }
      }
      
      checklist.push(...solicitationDoc.checklist);
      Object.assign(keyDates, solicitationDoc.keyDates);
      plainText += `\n\n=== BAA/SOLICITATION INSTRUCTIONS ===\n\n${solicitationDoc.plainText}`;
    }
    
    // Deduplicate checklist
    const uniqueChecklist = [...new Set(checklist)];
    
    // Sort volumes
    volumes.sort((a, b) => a.volumeNumber - b.volumeNumber);
    
    return {
      volumes,
      checklist: uniqueChecklist,
      plainText,
      keyDates
    };
  }
}
