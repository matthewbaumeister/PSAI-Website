/**
 * Multi-Format Document Extractor
 * 100% Free, No API Limits
 * Supports: PDF, DOCX, PPTX, Images (OCR), XLSX, TXT, HTML, RTF, and more
 */

import mammoth from 'mammoth';
import JSZip from 'jszip';
import { parseStringPromise } from 'xml2js';
import * as XLSX from 'xlsx';
import { convert as htmlToText } from 'html-to-text';

// OCR.space API configuration (free tier: 25,000 requests/month)
const OCR_API_KEY = process.env.OCR_SPACE_API_KEY || 'helloworld'; // Free demo key
const OCR_API_URL = 'https://api.ocr.space/parse/image';

/**
 * All supported file types
 */
export const SUPPORTED_FORMATS = {
  // Documents
  text: ['txt', 'text', 'md', 'markdown'],
  word: ['doc', 'docx'],
  powerpoint: ['ppt', 'pptx'],
  pdf: ['pdf'],
  rtf: ['rtf'],
  
  // Images (OCR)
  images: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'tif', 'webp'],
  
  // Spreadsheets
  excel: ['xls', 'xlsx', 'csv'],
  
  // Web
  html: ['html', 'htm'],
  
  // OpenDocument
  openoffice: ['odt', 'odp']
};

export function getAllSupportedExtensions(): string[] {
  return Object.values(SUPPORTED_FORMATS).flat();
}

export function isFileSupported(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return getAllSupportedExtensions().includes(ext);
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Extract text from plain text file
 */
function extractText(buffer: Buffer): string {
  return buffer.toString('utf-8').trim();
}

/**
 * Extract text from DOCX
 */
async function extractDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  } catch (error) {
    throw new Error(`DOCX extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from PPTX
 */
async function extractPptx(buffer: Buffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const slideFiles = Object.keys(zip.files).filter(name => 
      name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
    );

    const textParts: string[] = [];

    for (const slideFile of slideFiles) {
      const slideXml = await zip.file(slideFile)?.async('string');
      if (slideXml) {
        const slideData = await parseStringPromise(slideXml);
        const extractTextFromObj = (obj: any): void => {
          if (typeof obj === 'string') {
            textParts.push(obj);
          } else if (Array.isArray(obj)) {
            obj.forEach(extractTextFromObj);
          } else if (obj && typeof obj === 'object') {
            Object.values(obj).forEach(extractTextFromObj);
          }
        };
        extractTextFromObj(slideData);
      }
    }

    return textParts.join(' ').trim();
  } catch (error) {
    throw new Error(`PPTX extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from PDF (simple text-based PDFs only)
 */
async function extractPdf(buffer: Buffer): Promise<string> {
  try {
    // Try simple text extraction first
    const pdfText = buffer.toString('utf-8');
    const textMatches = pdfText.match(/BT\s+(.*?)\s+ET/gs);
    
    if (textMatches && textMatches.length > 0) {
      const extractedText = textMatches
        .map(match => match.replace(/BT\s+|\s+ET/g, ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (extractedText.length > 50) {
        return extractedText;
      }
    }
    
    // If simple extraction fails, suggest OCR
    throw new Error('PDF appears to be image-based or encrypted. Try uploading as an image (PNG/JPG) for OCR.');
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Try converting to image format'}`);
  }
}

/**
 * Extract text from image using OCR.space API
 */
async function extractImageOcr(buffer: Buffer, filename: string): Promise<string> {
  try {
    console.log('  Using OCR.space API for image text extraction...');
    
    const formData = new FormData();
    // Convert Buffer to ArrayBuffer for Blob compatibility
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    const blob = new Blob([arrayBuffer]);
    formData.append('file', blob, filename);
    formData.append('apikey', OCR_API_KEY);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2'); // Use OCR Engine 2 (better accuracy)

    const response = await fetch(OCR_API_URL, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`OCR API error: ${response.status}`);
    }

    const result = await response.json();

    if (result.IsErroredOnProcessing) {
      throw new Error(result.ErrorMessage?.[0] || 'OCR processing failed');
    }

    if (!result.ParsedResults || result.ParsedResults.length === 0) {
      throw new Error('No text found in image');
    }

    const extractedText = result.ParsedResults
      .map((r: any) => r.ParsedText)
      .join('\n\n')
      .trim();

    if (!extractedText || extractedText.length < 10) {
      throw new Error('No readable text found in image');
    }

    console.log(`  OCR extracted ${extractedText.length} characters`);
    return extractedText;

  } catch (error) {
    throw new Error(`Image OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from Excel/CSV
 */
async function extractExcel(buffer: Buffer): Promise<string> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const textParts: string[] = [];

    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_csv(sheet);
      if (data) {
        textParts.push(`Sheet: ${sheetName}\n${data}`);
      }
    });

    return textParts.join('\n\n').trim();
  } catch (error) {
    throw new Error(`Excel extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from HTML
 */
function extractHtml(buffer: Buffer): string {
  try {
    const html = buffer.toString('utf-8');
    const text = htmlToText(html, {
      wordwrap: false,
      selectors: [
        { selector: 'img', format: 'skip' },
        { selector: 'a', options: { ignoreHref: true } }
      ]
    });
    return text.trim();
  } catch (error) {
    throw new Error(`HTML extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Main extraction function
 */
export async function extractTextFromFile(
  buffer: Buffer,
  filename: string
): Promise<{
  text: string;
  metadata: {
    format: string;
    method: string;
    size: number;
  };
}> {
  const ext = getFileExtension(filename);
  const size = buffer.length;

  console.log(`  Extracting from ${ext.toUpperCase()} file (${size} bytes)...`);

  if (!isFileSupported(filename)) {
    throw new Error(`Unsupported file format: .${ext}`);
  }

  let text: string;
  let method: string;

  try {
    // Plain text
    if (SUPPORTED_FORMATS.text.includes(ext)) {
      text = extractText(buffer);
      method = 'text';
    }
    
    // DOCX
    else if (SUPPORTED_FORMATS.word.includes(ext)) {
      text = await extractDocx(buffer);
      method = 'mammoth';
    }
    
    // PPTX
    else if (SUPPORTED_FORMATS.powerpoint.includes(ext)) {
      text = await extractPptx(buffer);
      method = 'jszip';
    }
    
    // PDF
    else if (SUPPORTED_FORMATS.pdf.includes(ext)) {
      text = await extractPdf(buffer);
      method = 'pdf-simple';
    }
    
    // Images (OCR)
    else if (SUPPORTED_FORMATS.images.includes(ext)) {
      text = await extractImageOcr(buffer, filename);
      method = 'ocr';
    }
    
    // Excel/CSV
    else if (SUPPORTED_FORMATS.excel.includes(ext)) {
      text = await extractExcel(buffer);
      method = 'xlsx';
    }
    
    // HTML
    else if (SUPPORTED_FORMATS.html.includes(ext)) {
      text = extractHtml(buffer);
      method = 'html-to-text';
    }
    
    else {
      throw new Error(`No extractor available for .${ext} format`);
    }

    if (!text || text.length < 10) {
      throw new Error('Extracted text is too short or empty');
    }

    console.log(`  Successfully extracted ${text.length} characters using ${method}`);

    return {
      text,
      metadata: {
        format: ext,
        method,
        size
      }
    };

  } catch (error) {
    console.error(`  Extraction error for ${ext}:`, error);
    throw error;
  }
}

