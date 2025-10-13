/**
 * File Text Extraction Utility
 * Supports: PDF, DOCX, TXT, PPTX
 * Updated: Oct 13, 2025
 */

import mammoth from 'mammoth';
import JSZip from 'jszip';
import { parseStringPromise } from 'xml2js';

/**
 * Extract text from any supported file type
 */
export async function extractTextFromFile(
  file: Buffer,
  filename: string
): Promise<string> {
  const extension = filename.toLowerCase().split('.').pop();

  switch (extension) {
    case 'pdf':
      return await extractTextFromPDF(file);
    case 'docx':
      return await extractTextFromDOCX(file);
    case 'txt':
      return extractTextFromTXT(file);
    case 'pptx':
      return await extractTextFromPPTX(file);
    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
}

/**
 * Extract text from PDF
 * Note: pdf-parse has native dependencies, may fail in serverless
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid build issues
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('PDF extraction failed. File may be image-based or corrupted.');
  }
}

/**
 * Extract text from DOCX using mammoth
 */
async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (error) {
    console.error('DOCX extraction error:', error);
    throw new Error('DOCX extraction failed');
  }
}

/**
 * Extract text from plain text file
 */
function extractTextFromTXT(buffer: Buffer): string {
  try {
    return buffer.toString('utf-8');
  } catch (error) {
    console.error('TXT extraction error:', error);
    throw new Error('Text file extraction failed');
  }
}

/**
 * Extract text from PPTX
 * PPTX is a ZIP containing XML files
 */
async function extractTextFromPPTX(buffer: Buffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const slideFiles: string[] = [];
    
    // Find all slide XML files
    zip.forEach((relativePath) => {
      if (relativePath.match(/ppt\/slides\/slide\d+\.xml/)) {
        slideFiles.push(relativePath);
      }
    });

    // Sort slides by number
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
      const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
      return numA - numB;
    });

    // Extract text from each slide
    const allText: string[] = [];
    
    for (const slideFile of slideFiles) {
      const file = zip.file(slideFile);
      if (!file) continue;

      const content = await file.async('string');
      const parsed = await parseStringPromise(content);
      
      // Extract text from XML structure
      const slideText = extractTextFromXML(parsed);
      if (slideText.trim()) {
        allText.push(slideText);
      }
    }

    return allText.join('\n\n');
  } catch (error) {
    console.error('PPTX extraction error:', error);
    throw new Error('PPTX extraction failed');
  }
}

/**
 * Recursively extract text from XML object
 */
function extractTextFromXML(obj: any): string {
  let text = '';

  if (typeof obj === 'string') {
    return obj;
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      text += extractTextFromXML(item) + ' ';
    }
    return text;
  }

  if (typeof obj === 'object' && obj !== null) {
    // Look for text nodes (commonly in 'a:t' tags in PowerPoint)
    if (obj['a:t']) {
      text += extractTextFromXML(obj['a:t']) + ' ';
    }
    
    // Recursively check all other keys
    for (const key in obj) {
      if (key !== '$' && key !== 'a:t') { // Skip attributes
        text += extractTextFromXML(obj[key]);
      }
    }
  }

  return text;
}

/**
 * Validate file type
 */
export function isSupportedFileType(filename: string): boolean {
  const extension = filename.toLowerCase().split('.').pop();
  return ['pdf', 'docx', 'txt', 'pptx'].includes(extension || '');
}

/**
 * Get file type description
 */
export function getFileTypeDescription(filename: string): string {
  const extension = filename.toLowerCase().split('.').pop();
  
  const descriptions: Record<string, string> = {
    pdf: 'PDF Document',
    docx: 'Word Document',
    txt: 'Text File',
    pptx: 'PowerPoint Presentation'
  };
  
  return descriptions[extension || ''] || 'Unknown';
}

