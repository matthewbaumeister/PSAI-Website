/**
 * INSTRUCTION PDF PARSER
 * 
 * Fetches and parses BAA and Component instruction PDFs from DSIP
 * Extracts volume requirements, checklists, and submission guidelines
 * Uses unpdf for serverless compatibility
 */

import { extractText, getDocumentProxy } from 'unpdf';

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
   * Parse instruction PDF from URL
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
      const buffer = Buffer.from(arrayBuffer);
      
      console.log(`Downloaded PDF: ${buffer.length} bytes`);
      
      // Extract text using unpdf
      const extracted = await extractText(buffer, { mergePages: true });
      
      const plainText = extracted.text;
      const pageCount = extracted.totalPages;
      
      console.log(`Extracted ${plainText.length} characters from ${pageCount} pages`);
      
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
    
    // Look for checklist sections
    const checklistPatterns = [
      /checklist[:\s]+([^]*?)(?:\n\n[A-Z]|\n\d+\.)/i,
      /submission\s+requirements[:\s]+([^]*?)(?:\n\n[A-Z]|\n\d+\.)/i,
      /required\s+documents[:\s]+([^]*?)(?:\n\n[A-Z]|\n\d+\.)/i,
    ];
    
    for (const pattern of checklistPatterns) {
      const match = text.match(pattern);
      if (match) {
        const section = match[1];
        // Extract bullet points or numbered items
        const items = section.match(/[-•●]\s*([^\n]+)|^\d+\.\s*([^\n]+)/gm);
        if (items) {
          checklist.push(...items.map(item => item.replace(/^[-•●\d.]\s*/, '').trim()));
        }
      }
    }
    
    return [...new Set(checklist)]; // Remove duplicates
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
    
    const match = text.match(volumePattern);
    if (!match) return requirements;
    
    const volumeText = match[0];
    
    // Extract requirements (bullets, numbered lists, "must include", "shall", etc.)
    const reqPatterns = [
      /[-•●]\s*([^\n]+)/g,
      /^\d+\.\s*([^\n]+)/gm,
      /(?:must|shall|should)\s+(?:include|contain|provide)[:\s]*([^\n]+)/gi,
      /required[:\s]+([^\n]+)/gi,
    ];
    
    for (const pattern of reqPatterns) {
      let reqMatch;
      while ((reqMatch = pattern.exec(volumeText)) !== null) {
        const req = reqMatch[1].trim();
        if (req.length > 10 && req.length < 200) {
          requirements.push(req);
        }
      }
    }
    
    return [...new Set(requirements)].slice(0, 20); // Dedupe and limit
  }

  /**
   * Extract description for a volume
   */
  private extractVolumeDescription(text: string, volumeNum: number): string {
    const volumePattern = new RegExp(
      `Volume\\s+${volumeNum}[:\s-]+([^\\n]+)\\s+([^]*?)(?=Volume\\s+\\d+|$)`,
      'i'
    );
    
    const match = text.match(volumePattern);
    if (!match) return '';
    
    // Get first paragraph after volume header
    const content = match[2];
    const firstParagraph = content.split('\n\n')[0];
    return firstParagraph.trim().substring(0, 300);
  }

  /**
   * Parse volume number (handles both numeric and Roman numerals)
   */
  private parseVolumeNumber(vol: string): number {
    // Try numeric first
    const num = parseInt(vol);
    if (!isNaN(num)) return num;
    
    // Handle Roman numerals
    const romanMap: { [key: string]: number } = {
      'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
      'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10
    };
    
    return romanMap[vol.toUpperCase()] || 1;
  }

  /**
   * Merge instructions from component and solicitation documents
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
      // Add volumes that don't exist yet
      for (const vol of solicitationDoc.volumes) {
        if (!volumes.find(v => v.volumeNumber === vol.volumeNumber)) {
          volumes.push(vol);
        }
      }
      
      checklist.push(...solicitationDoc.checklist);
      Object.assign(keyDates, solicitationDoc.keyDates);
      plainText += `\n\n=== SOLICITATION INSTRUCTIONS ===\n\n${solicitationDoc.plainText}`;
    }
    
    // Deduplicate checklist
    const uniqueChecklist = [...new Set(checklist)];
    
    return {
      volumes: volumes.sort((a, b) => a.volumeNumber - b.volumeNumber),
      checklist: uniqueChecklist,
      plainText: plainText.trim(),
      keyDates
    };
  }
}
