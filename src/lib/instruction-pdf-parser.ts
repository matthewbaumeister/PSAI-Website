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
  sourceDocument?: 'component' | 'solicitation' | 'both'; // Track which doc this came from
  sourceCitation?: string; // Exact citation
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
      
      // Extract structured information with source tracking
      const volumes = this.extractVolumes(plainText, documentType);
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
  private extractVolumes(text: string, documentType?: 'component' | 'solicitation' | 'baa'): VolumeRequirement[] {
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
        requirements,
        sourceDocument: documentType, // Track source
        sourceCitation: `From ${documentType === 'component' ? 'Component-Specific' : 'BAA/Solicitation'} Instructions`
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
   * Extract context around a match (for better understanding)
   */
  private extractContext(text: string, matchIndex: number, contextLength: number = 150): string {
    const start = Math.max(0, matchIndex - contextLength / 2);
    const end = Math.min(text.length, matchIndex + contextLength);
    let context = text.substring(start, end).trim();
    
    // Clean up
    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';
    
    return context;
  }

  /**
   * Detect cross-references and superseding language between documents
   * Enhanced with comprehensive pattern matching and context extraction
   */
  private analyzeCrossReferences(componentText: string, solicitationText: string): {
    componentSupersedes: boolean;
    solicitationSupersedes: boolean;
    crossReferences: string[];
  } {
    const crossReferences: string[] = [];
    const foundPatterns = new Set<string>();
    
    // COMPREHENSIVE superseding patterns (component takes precedence)
    const componentSupersedePatterns = [
      // Direct precedence
      /component[- ]?specific\s+instructions?\s+(?:shall|will|must)?\s*(?:take precedence|supersede|override|govern|prevail|control)/gi,
      /these\s+(?:component\s+)?instructions?\s+(?:shall|will|must)?\s*(?:take precedence|supersede|override|govern)/gi,
      /component\s+requirements?\s+(?:shall|will)?\s*(?:supersede|override|take precedence)/gi,
      
      // Conflict resolution
      /(?:in\s+(?:the\s+)?(?:case|event)\s+of|when(?:ever)?|where|if)\s+(?:there\s+(?:is|are)\s+)?(?:a\s+|any\s+)?(?:conflict|discrepancy|difference|inconsistency)(?:,|\s+between|\s+exists).*?component/gi,
      /(?:conflict|discrepancy|difference).*?(?:defer\s+to|follow|use|apply)\s+(?:the\s+)?component/gi,
      
      // Deferral language
      /(?:see|refer to|consult|defer to)\s+(?:the\s+)?component[- ]?specific\s+instructions?\s+(?:for|regarding)/gi,
      /component[- ]?specific\s+(?:requirements?|instructions?|guidance)\s+(?:shall\s+)?apply/gi,
      
      // Explicit override
      /where\s+(?:the\s+)?component\s+instructions?\s+(?:differ|vary|deviate)/gi,
      /unless\s+(?:otherwise\s+)?(?:specified|stated|noted)\s+(?:in|by)\s+(?:the\s+)?component/gi,
    ];
    
    // COMPREHENSIVE solicitation/BAA patterns
    const solicitationSupersedePatterns = [
      // Direct precedence
      /(?:baa|solicitation|general)\s+instructions?\s+(?:shall|will|must)?\s*(?:take precedence|supersede|override|govern|prevail|control)/gi,
      /(?:baa|solicitation)\s+requirements?\s+(?:shall|will)?\s*(?:supersede|override|take precedence)/gi,
      
      // Conflict resolution
      /(?:in\s+(?:the\s+)?(?:case|event)\s+of|when(?:ever)?|where|if)\s+(?:there\s+(?:is|are)\s+)?(?:a\s+|any\s+)?(?:conflict|discrepancy|difference|inconsistency)(?:,|\s+between|\s+exists).*?(?:baa|solicitation)/gi,
      /(?:conflict|discrepancy|difference).*?(?:defer\s+to|follow|use|apply)\s+(?:the\s+)?(?:baa|solicitation)/gi,
      
      // Deferral language
      /(?:see|refer to|consult|defer to)\s+(?:the\s+)?(?:baa|solicitation)\s+(?:for|regarding)/gi,
      /unless\s+(?:otherwise\s+)?(?:specified|stated|noted)\s+(?:in|by)\s+(?:the\s+)?(?:baa|solicitation)/gi,
    ];
    
    // COMPREHENSIVE cross-reference patterns
    const referencePatterns = [
      // Direct references
      /(?:see|refer to|reference|consult|review|check)\s+(?:the\s+)?(?:component[- ]?specific|baa|solicitation)\s+(?:instructions?|requirements?|guidance|document)/gi,
      
      // Specification references
      /as\s+(?:specified|detailed|described|outlined|defined|stated|noted)\s+(?:in|by)\s+(?:the\s+)?(?:component|baa|solicitation)/gi,
      /in\s+accordance\s+with\s+(?:the\s+)?(?:component|baa|solicitation)/gi,
      /(?:per|following|pursuant\s+to)\s+(?:the\s+)?(?:component|baa|solicitation)/gi,
      
      // Requirement references
      /(?:must|shall|should)\s+(?:comply|conform|adhere)\s+(?:with|to)\s+(?:the\s+)?(?:component|baa|solicitation)/gi,
      /subject\s+to\s+(?:the\s+)?(?:component|baa|solicitation)/gi,
      
      // Procedural references
      /(?:follow|use|apply)\s+(?:the\s+)?(?:procedures?|instructions?|guidance)\s+(?:in|from)\s+(?:the\s+)?(?:component|baa|solicitation)/gi,
    ];
    
    let componentSupersedes = false;
    let solicitationSupersedes = false;
    
    const combinedText = componentText + ' ' + solicitationText;
    
    // Check component supersede patterns
    for (const pattern of componentSupersedePatterns) {
      pattern.lastIndex = 0; // Reset regex
      let match;
      while ((match = pattern.exec(combinedText)) !== null) {
        const matchText = match[0].toLowerCase();
        if (!foundPatterns.has(matchText)) {
          componentSupersedes = true;
          const context = this.extractContext(combinedText, match.index, 200);
          crossReferences.push(`✓ Component precedence: "${context}"`);
          foundPatterns.add(matchText);
          break; // One example per pattern type
        }
      }
    }
    
    // Check solicitation supersede patterns
    for (const pattern of solicitationSupersedePatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(combinedText)) !== null) {
        const matchText = match[0].toLowerCase();
        if (!foundPatterns.has(matchText)) {
          solicitationSupersedes = true;
          const context = this.extractContext(combinedText, match.index, 200);
          crossReferences.push(`✓ BAA precedence: "${context}"`);
          foundPatterns.add(matchText);
          break;
        }
      }
    }
    
    // Find cross-references (limit to avoid spam)
    let refCount = 0;
    for (const pattern of referencePatterns) {
      if (refCount >= 3) break; // Limit cross-refs
      
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(combinedText)) !== null && refCount < 3) {
        const matchText = match[0].toLowerCase();
        if (!foundPatterns.has(matchText)) {
          const context = this.extractContext(combinedText, match.index, 150);
          crossReferences.push(`→ Reference: "${context}"`);
          foundPatterns.add(matchText);
          refCount++;
          break;
        }
      }
    }
    
    return {
      componentSupersedes,
      solicitationSupersedes,
      crossReferences: crossReferences.slice(0, 8) // Limit total references
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
      
      if (analysis.crossReferences.length > 0 || analysis.componentSupersedes || analysis.solicitationSupersedes) {
        crossRefInfo = `\n\n=== DOCUMENT RELATIONSHIP & PRECEDENCE ===\n\n`;
        
        // Precedence determination
        if (analysis.componentSupersedes && analysis.solicitationSupersedes) {
          crossRefInfo += `⚠️  PRECEDENCE CONFLICT DETECTED\n`;
          crossRefInfo += `Both documents contain language claiming precedence.\n`;
          crossRefInfo += `RECOMMENDATION: Review both documents carefully and contact the program office for clarification.\n\n`;
        } else if (analysis.componentSupersedes) {
          crossRefInfo += `✓ PRECEDENCE: Component-Specific Instructions\n`;
          crossRefInfo += `The component-specific instructions take precedence over general BAA requirements where they differ.\n\n`;
        } else if (analysis.solicitationSupersedes) {
          crossRefInfo += `✓ PRECEDENCE: BAA/Solicitation Instructions\n`;
          crossRefInfo += `The BAA/Solicitation instructions take precedence over component requirements where they differ.\n\n`;
        } else {
          crossRefInfo += `ℹ️  No explicit precedence language detected.\n`;
          crossRefInfo += `Both documents should be followed. Contact program office if conflicts arise.\n\n`;
        }
        
        // List cross-references with context
        if (analysis.crossReferences.length > 0) {
          crossRefInfo += `IMPORTANT CROSS-REFERENCES:\n\n`;
          analysis.crossReferences.forEach((ref, idx) => {
            crossRefInfo += `${idx + 1}. ${ref}\n\n`;
          });
        }
        
        crossRefInfo += `⚠️  CRITICAL REMINDER:\n`;
        crossRefInfo += `- Always read BOTH documents in full\n`;
        crossRefInfo += `- When in doubt, the more restrictive requirement typically applies\n`;
        crossRefInfo += `- Contact the program office for any ambiguities\n`;
        crossRefInfo += `- Source documents supersede this consolidated guide\n`;
      }
    }
    
    // Add relationship notes first
    if (crossRefInfo) {
      plainText += crossRefInfo;
    }
    
    // Merge volumes with source tracking and conflict detection
    if (componentDoc) {
      // Add component volumes with clear source attribution
      componentDoc.volumes.forEach(vol => {
        volumes.push({
          ...vol,
          sourceDocument: 'component',
          sourceCitation: `Source: Component-Specific Instructions`
        });
      });
      
      // Add checklist with source tags
      componentDoc.checklist.forEach(item => {
        checklist.push(`[Component] ${item}`);
      });
      
      Object.assign(keyDates, componentDoc.keyDates);
      plainText += `\n\n=== COMPONENT-SPECIFIC INSTRUCTIONS ===\n\n${componentDoc.plainText}`;
    }
    
    if (solicitationDoc) {
      // Add BAA volumes - track conflicts and merge intelligently
      for (const solVol of solicitationDoc.volumes) {
        const existingVol = volumes.find(v => v.volumeNumber === solVol.volumeNumber);
        
        if (!existingVol) {
          // No conflict - add BAA volume
          volumes.push({
            ...solVol,
            sourceDocument: 'solicitation',
            sourceCitation: `Source: BAA/Solicitation Instructions`
          });
        } else {
          // CONFLICT DETECTED - merge requirements with citations
          console.log(`Volume ${solVol.volumeNumber} defined in BOTH documents - merging with source citations`);
          
          // Mark this volume as coming from both sources
          existingVol.sourceDocument = 'both';
          existingVol.sourceCitation = `Sources: Component-Specific AND BAA/Solicitation Instructions (see individual requirements for specific sources)`;
          
          // Add BAA requirements with explicit [BAA] tag to distinguish from component reqs
          solVol.requirements.forEach(req => {
            // Check if similar requirement already exists from component
            const similar = existingVol.requirements.find(r => 
              r.toLowerCase().includes(req.substring(0, 30).toLowerCase())
            );
            
            if (!similar) {
              existingVol.requirements.push(`[BAA] ${req}`);
            } else {
              // Similar requirement exists - note the conflict
              existingVol.requirements.push(`[BAA - may differ from Component] ${req}`);
            }
          });
        }
      }
      
      // Add BAA checklist with source tags
      solicitationDoc.checklist.forEach(item => {
        const componentHasSimilar = checklist.some(c => 
          c.toLowerCase().includes(item.substring(0, 30).toLowerCase())
        );
        
        if (!componentHasSimilar) {
          checklist.push(`[BAA] ${item}`);
        } else {
          checklist.push(`[BAA - verify against Component] ${item}`);
        }
      });
      
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
