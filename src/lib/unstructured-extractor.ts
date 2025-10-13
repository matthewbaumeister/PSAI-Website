/**
 * Universal Document Extractor using Unstructured.io API
 * Supports: PDF, DOCX, PPTX, Images (OCR), ODT, RTF, HTML, and more
 */

const UNSTRUCTURED_API_KEY = process.env.UNSTRUCTURED_API_KEY;
const UNSTRUCTURED_API_URL = process.env.UNSTRUCTURED_API_URL || 'https://api.unstructured.io/general/v0/general';

/**
 * All supported file types by Unstructured.io
 */
export const SUPPORTED_FILE_TYPES = {
  // Documents
  pdf: ['pdf'],
  word: ['doc', 'docx'],
  powerpoint: ['ppt', 'pptx'],
  text: ['txt', 'text', 'md', 'markdown'],
  openoffice: ['odt', 'odp', 'ods'],
  rtf: ['rtf'],
  
  // Images (OCR)
  images: ['png', 'jpg', 'jpeg', 'gif', 'tiff', 'tif', 'bmp', 'webp'],
  
  // Spreadsheets
  excel: ['xls', 'xlsx', 'csv'],
  
  // Web
  html: ['html', 'htm'],
  
  // Other
  epub: ['epub'],
  msg: ['msg', 'eml']
};

/**
 * Get flattened list of all supported extensions
 */
export function getAllSupportedExtensions(): string[] {
  return Object.values(SUPPORTED_FILE_TYPES).flat();
}

/**
 * Check if file type is supported
 */
export function isFileTypeSupported(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return getAllSupportedExtensions().includes(ext);
}

/**
 * Get file type description
 */
export function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  for (const [type, extensions] of Object.entries(SUPPORTED_FILE_TYPES)) {
    if (extensions.includes(ext)) {
      return type;
    }
  }
  
  return 'unknown';
}

/**
 * Extract text from any file using Unstructured.io API
 */
export async function extractTextUniversal(
  fileBuffer: Buffer,
  filename: string
): Promise<{
  text: string;
  metadata: {
    fileType: string;
    pages?: number;
    elements?: number;
  };
}> {
  // Check API key
  if (!UNSTRUCTURED_API_KEY) {
    throw new Error('UNSTRUCTURED_API_KEY not configured. Please add it to environment variables.');
  }

  const fileType = getFileType(filename);
  console.log(`  Processing ${fileType} file: ${filename}`);

  try {
    // Create form data for API request
    const formData = new FormData();
    const blob = new Blob([fileBuffer]);
    formData.append('files', blob, filename);
    
    // Strategy: hi_res for better accuracy (OCR for images/scanned PDFs)
    // coordinates: false (we don't need layout info)
    formData.append('strategy', 'hi_res');
    formData.append('coordinates', 'false');
    
    // Make API request
    const response = await fetch(UNSTRUCTURED_API_URL, {
      method: 'POST',
      headers: {
        'unstructured-api-key': UNSTRUCTURED_API_KEY
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Unstructured.io API error (${response.status}): ${errorText}`);
    }

    const elements = await response.json();

    // Extract text from all elements
    const textParts: string[] = [];
    let pageCount = 0;
    
    for (const element of elements) {
      if (element.text) {
        textParts.push(element.text);
      }
      
      // Track page numbers
      if (element.metadata?.page_number) {
        pageCount = Math.max(pageCount, element.metadata.page_number);
      }
    }

    const extractedText = textParts.join('\n\n').trim();

    if (!extractedText || extractedText.length < 10) {
      throw new Error('No text could be extracted from the file. File may be empty or image-only.');
    }

    console.log(`  Extracted ${extractedText.length} characters from ${elements.length} elements`);

    return {
      text: extractedText,
      metadata: {
        fileType,
        pages: pageCount > 0 ? pageCount : undefined,
        elements: elements.length
      }
    };

  } catch (error) {
    console.error('  Unstructured.io extraction error:', error);
    
    if (error instanceof Error) {
      throw new Error(`Failed to extract text: ${error.message}`);
    }
    
    throw new Error('Failed to extract text from file');
  }
}

/**
 * Fallback: Simple text extraction for TXT files (no API needed)
 */
export function extractTextFromPlainText(buffer: Buffer): string {
  return buffer.toString('utf-8').trim();
}

/**
 * Main extraction function with fallback
 */
export async function extractText(
  fileBuffer: Buffer,
  filename: string
): Promise<{
  text: string;
  metadata: {
    fileType: string;
    pages?: number;
    elements?: number;
    method: 'unstructured' | 'fallback';
  };
}> {
  // Check if supported
  if (!isFileTypeSupported(filename)) {
    const ext = filename.split('.').pop();
    throw new Error(`File type .${ext} is not supported`);
  }

  // For plain text files, use direct extraction (no API call needed)
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'txt' || ext === 'text' || ext === 'md') {
    console.log('  Using fallback text extraction');
    const text = extractTextFromPlainText(fileBuffer);
    
    return {
      text,
      metadata: {
        fileType: 'text',
        method: 'fallback'
      }
    };
  }

  // Use Unstructured.io for all other formats
  const result = await extractTextUniversal(fileBuffer, filename);
  
  return {
    ...result,
    metadata: {
      ...result.metadata,
      method: 'unstructured'
    }
  };
}

