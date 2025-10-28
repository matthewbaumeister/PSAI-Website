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
      const uint8Array = new Uint8Array(arrayBuffer);
      
      console.log(`Downloaded PDF: ${uint8Array.length} bytes`);
      
      // Extract text using unpdf
      const extracted = await extractText(uint8Array, { mergePages: true });
      
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
   * Detect cross-references and superseding language between documents
   */
  private analyzeCrossReferences(componentText: string, solicitationText: string): {
    componentSupersedes: boolean;
    solicitationSupersedes: boolean;
    crossReferences: string[];
  } {
    const crossReferences: string[] = [];
    
    // Patterns for superseding language
    const supersedePatterns = [
      /component[- ]specific instructions?\s+(?:shall\s+)?(?:take precedence|supersede|override|govern)/gi,
      /these instructions?\s+(?:shall\s+)?(?:take precedence|supersede|override)/gi,
      /(?:in case of|when there is)\s+(?:a\s+)?(?:conflict|discrepancy),?\s+(?:the\s+)?component/gi,
      /(?:where|if)\s+component instructions?\s+differ/gi,
    ];
    
    const solicitationSupersedePatterns = [
      /(?:baa|solicitation)\s+instructions?\s+(?:shall\s+)?(?:take precedence|supersede|override|govern)/gi,
      /(?:in case of|when there is)\s+(?:a\s+)?(?:conflict|discrepancy),?\s+(?:the\s+)?(?:baa|solicitation)/gi,
    ];
    
    // Cross-reference patterns
    const referencePatterns = [
      /(?:see|refer to|consult)\s+(?:the\s+)?(?:component[- ]specific|baa|solicitation)\s+instructions?/gi,
      /as (?:specified|detailed|described|outlined) in (?:the\s+)?(?:component|baa|solicitation)/gi,
      /in accordance with (?:the\s+)?(?:component|baa|solicitation)/gi,
    ];
    
    let componentSupersedes = false;
    let solicitationSupersedes = false;
    
    // Check both documents for superseding language
    const combinedText = componentText + ' ' + solicitationText;
    
    for (const pattern of supersedePatterns) {
      const matches = combinedText.match(pattern);
      if (matches && matches.length > 0) {
        componentSupersedes = true;
        crossReferences.push(`Component-specific instructions take precedence (found: "${matches[0]}")`);
      }
    }
    
    for (const pattern of solicitationSupersedePatterns) {
      const matches = combinedText.match(pattern);
      if (matches && matches.length > 0) {
        solicitationSupersedes = true;
        crossReferences.push(`BAA/Solicitation instructions take precedence (found: "${matches[0]}")`);
      }
    }
    
    // Find cross-references
    for (const pattern of referencePatterns) {
      const matches = combinedText.match(pattern);
      if (matches && matches.length > 0) {
        // Only add unique references
        const uniqueMatches = [...new Set(matches)];
        crossReferences.push(...uniqueMatches.slice(0, 3).map(m => `Cross-reference: "${m}"`));
      }
    }
    
    return {
      componentSupersedes,
      solicitationSupersedes,
      crossReferences: [...new Set(crossReferences)].slice(0, 5) // Limit to 5 unique references
    };
  }

  /**
   * Merge instructions from component and solicitation documents
   * Now with intelligent conflict detection
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
    
    // Analyze cross-references if we have both documents
    let crossRefInfo = '';
    if (componentDoc && solicitationDoc) {
      const analysis = this.analyzeCrossReferences(componentDoc.plainText, solicitationDoc.plainText);
      
      if (analysis.crossReferences.length > 0) {
        crossRefInfo = `\n\n=== DOCUMENT RELATIONSHIP NOTES ===\n\n`;
        
        if (analysis.componentSupersedes && analysis.solicitationSupersedes) {
          crossRefInfo += `⚠️ CONFLICT DETECTED: Both documents claim precedence. Carefully review both.\n\n`;
        } else if (analysis.componentSupersedes) {
          crossRefInfo += `✓ Component-specific instructions take precedence over general BAA requirements.\n\n`;
        } else if (analysis.solicitationSupersedes) {
          crossRefInfo += `✓ BAA/Solicitation instructions take precedence over component requirements.\n\n`;
        }
        
        crossRefInfo += `Cross-References Found:\n`;
        analysis.crossReferences.forEach(ref => {
          crossRefInfo += `• ${ref}\n`;
        });
        crossRefInfo += `\n⚠️ When in conflict, consult BOTH documents and/or contact the program office.\n`;
      }
    }
    
    // Add relationship notes first
    if (crossRefInfo) {
      plainText += crossRefInfo;
    }
    
    // Merge volumes (prioritize component-specific over general BAA)
    if (componentDoc) {
      volumes.push(...componentDoc.volumes);
      checklist.push(...componentDoc.checklist);
      Object.assign(keyDates, componentDoc.keyDates);
      plainText += `\n\n=== COMPONENT-SPECIFIC INSTRUCTIONS ===\n\n${componentDoc.plainText}`;
    }
    
    if (solicitationDoc) {
      // Add volumes that don't exist yet (component takes priority)
      for (const vol of solicitationDoc.volumes) {
        if (!volumes.find(v => v.volumeNumber === vol.volumeNumber)) {
          volumes.push(vol);
        } else {
          // Volume exists in component doc - add note
          console.log(`Volume ${vol.volumeNumber} defined in both docs - using component version`);
        }
      }
      
      checklist.push(...solicitationDoc.checklist);
      Object.assign(keyDates, solicitationDoc.keyDates);
      plainText += `\n\n=== BAA/SOLICITATION INSTRUCTIONS ===\n\n${solicitationDoc.plainText}`;
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
