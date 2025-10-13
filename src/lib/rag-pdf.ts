/**
 * RAG PDF Processing
 * Extract text from PDFs page by page
 */

import pdf from 'pdf-parse';

export interface PDFExtraction {
  text: string;
  pages: string[];
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creationDate?: Date;
    modDate?: Date;
    pageCount: number;
  };
}

/**
 * Extract text and metadata from PDF buffer
 * @param buffer - PDF file as Buffer
 * @returns Extracted text by page + metadata
 */
export async function extractPDFText(buffer: Buffer): Promise<PDFExtraction> {
  try {
    const data = await pdf(buffer, {
      // Options for better text extraction
      max: 0, // Extract all pages
      version: 'default'
    });

    // Extract text by page
    const pages: string[] = [];
    
    // Parse page-by-page if available
    if (data.numpages && data.numpages > 0) {
      // Try to extract pages individually
      for (let i = 1; i <= data.numpages; i++) {
        try {
          const pageData = await pdf(buffer, {
            max: 1,
            pagerender: (pageData: any) => {
              return pageData.getTextContent()
                .then((textContent: any) => {
                  let lastY, text = '';
                  for (let item of textContent.items) {
                    if (lastY && lastY !== item.transform[5]) {
                      text += '\n';
                    }
                    text += item.str;
                    lastY = item.transform[5];
                  }
                  return text;
                });
            }
          });
          
          pages.push(pageData.text || '');
        } catch (error) {
          console.warn(`Error extracting page ${i}:`, error);
          // Continue with other pages
        }
      }
    }

    // If page-by-page extraction failed, split the full text
    if (pages.length === 0) {
      // Fallback: split full text by form feed or estimate
      const fullText = data.text || '';
      const estimatedPages = data.numpages || 1;
      const charsPerPage = Math.ceil(fullText.length / estimatedPages);
      
      for (let i = 0; i < estimatedPages; i++) {
        const start = i * charsPerPage;
        const end = Math.min((i + 1) * charsPerPage, fullText.length);
        pages.push(fullText.substring(start, end));
      }
    }

    return {
      text: data.text || '',
      pages,
      metadata: {
        title: data.info?.Title,
        author: data.info?.Author,
        subject: data.info?.Subject,
        keywords: data.info?.Keywords,
        creationDate: data.info?.CreationDate,
        modDate: data.info?.ModDate,
        pageCount: data.numpages || 1
      }
    };

  } catch (error) {
    console.error('Error extracting PDF:', error);
    throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate PDF file
 * @param buffer - File buffer to check
 * @returns True if valid PDF
 */
export function isValidPDF(buffer: Buffer): boolean {
  // Check PDF magic number (starts with %PDF-)
  const header = buffer.toString('utf8', 0, 5);
  return header === '%PDF-';
}

/**
 * Clean extracted PDF text
 * Removes excessive whitespace, weird characters, etc.
 */
export function cleanPDFText(text: string): string {
  return text
    // Remove multiple spaces
    .replace(/  +/g, ' ')
    // Remove multiple newlines (keep max 2)
    .replace(/\n{3,}/g, '\n\n')
    // Remove weird unicode characters (keep common ones)
    .replace(/[^\x00-\x7F\u00A0-\u00FF\u0100-\u017F\u0180-\u024F]/g, '')
    // Trim each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Final trim
    .trim();
}

/**
 * Extract metadata from PDF for better categorization
 */
export function extractPDFMetadata(extraction: PDFExtraction): {
  possibleCustomer?: string;
  possibleProject?: string;
  keywords: string[];
} {
  const text = extraction.text.toLowerCase();
  const metadata = extraction.metadata;
  
  // Extract keywords from title, subject, keywords
  const keywords: Set<string> = new Set();
  
  if (metadata.title) {
    metadata.title.split(/[\s,]+/).forEach(word => {
      if (word.length > 3) keywords.add(word.toLowerCase());
    });
  }
  
  if (metadata.keywords) {
    metadata.keywords.split(/[,;]+/).forEach(word => {
      const cleaned = word.trim();
      if (cleaned.length > 2) keywords.add(cleaned.toLowerCase());
    });
  }
  
  // Look for company names in first page
  const firstPage = extraction.pages[0]?.substring(0, 1000) || '';
  const possibleCustomer = extractCompanyName(firstPage);
  const possibleProject = extractProjectName(firstPage);
  
  return {
    possibleCustomer,
    possibleProject,
    keywords: Array.from(keywords)
  };
}

/**
 * Heuristics to extract company name from text
 */
function extractCompanyName(text: string): string | undefined {
  // Look for common patterns: "Company Inc.", "Corp.", "LLC", etc.
  const companyPatterns = [
    /([A-Z][a-zA-Z\s]+(?:Inc\.|LLC|Corp\.|Corporation|Technologies|Systems|Solutions|Dynamics|Aerospace|Defense))/g,
  ];
  
  for (const pattern of companyPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      return matches[0].trim();
    }
  }
  
  return undefined;
}

/**
 * Heuristics to extract project name from text
 */
function extractProjectName(text: string): string | undefined {
  // Look for "Project:", "Program:", etc.
  const projectPatterns = [
    /(?:Project|Program):\s*([A-Z][a-zA-Z0-9\s-]+)/,
    /(?:Proposal for|Response to):\s*([A-Z][a-zA-Z0-9\s-]+)/
  ];
  
  for (const pattern of projectPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return undefined;
}

