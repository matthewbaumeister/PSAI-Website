/**
 * SBIR File Extraction API
 * Extracts text from uploaded documents (PDF, DOCX, images, etc.)
 * Returns keywords for smart search
 * 
 * EPHEMERAL MODE: No data stored, processed in memory only
 */

import { NextRequest, NextResponse } from 'next/server';

// Multi-library document extraction
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
const mammoth = require('mammoth'); // DOCX
const htmlToText = require('html-to-text');
const xml2js = require('xml2js');
const JSZip = require('jszip'); // For PPTX

export const config = {
  maxDuration: 30, // 30 seconds for Vercel Pro
};

interface ExtractionResult {
  success: boolean;
  text?: string;
  keywords?: string[];
  filename?: string;
  fileType?: string;
  stats?: {
    characterCount: number;
    wordCount: number;
    pageCount?: number;
  };
  error?: string;
}

/**
 * Extract text from various file types
 */
async function extractTextFromFile(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{ text: string; pageCount?: number }> {
  
  // PDF Extraction
  if (mimeType === 'application/pdf' || filename.endsWith('.pdf')) {
    try {
      const loadingTask = pdfjsLib.getDocument({
        data: buffer,
        useSystemFonts: true,
        standardFontDataUrl: undefined
      });
      
      const pdf = await loadingTask.promise;
      const pageCount = pdf.numPages;
      
      let text = '';
      for (let i = 1; i <= pageCount; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        text += pageText + '\n';
      }
      
      return {
        text: text || '',
        pageCount: pageCount || 1
      };
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('PDF extraction failed. File may be encrypted or image-based.');
    }
  }

  // DOCX Extraction (Microsoft Word)
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    filename.endsWith('.docx')
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return { text: result.value || '' };
    } catch (error) {
      console.error('DOCX extraction error:', error);
      throw new Error('DOCX extraction failed.');
    }
  }

  // PPTX Extraction (PowerPoint)
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    filename.endsWith('.pptx')
  ) {
    try {
      const zip = await JSZip.loadAsync(buffer);
      let allText = '';
      let slideCount = 0;

      // Extract text from all slides
      for (const filename of Object.keys(zip.files)) {
        if (filename.startsWith('ppt/slides/slide') && filename.endsWith('.xml')) {
          slideCount++;
          const content = await zip.files[filename].async('string');
          
          // Parse XML and extract text
          const parser = new xml2js.Parser();
          const result = await parser.parseStringPromise(content);
          const texts = extractTextFromXML(result);
          allText += texts.join(' ') + '\n\n';
        }
      }

      return { text: allText, pageCount: slideCount };
    } catch (error) {
      console.error('PPTX extraction error:', error);
      throw new Error('PPTX extraction failed.');
    }
  }

  // TXT Extraction (Plain Text)
  if (mimeType === 'text/plain' || filename.endsWith('.txt')) {
    return { text: buffer.toString('utf-8') };
  }

  // HTML Extraction
  if (mimeType === 'text/html' || filename.endsWith('.html') || filename.endsWith('.htm')) {
    const htmlText = buffer.toString('utf-8');
    const text = htmlToText.convert(htmlText, {
      wordwrap: 130,
      preserveNewlines: true
    });
    return { text };
  }

  // Image Extraction (OCR using OCR.space API)
  if (
    mimeType.startsWith('image/') ||
    /\.(png|jpg|jpeg|gif|bmp|tiff|webp)$/i.test(filename)
  ) {
    try {
      const text = await extractTextFromImage(buffer, mimeType);
      return { text };
    } catch (error) {
      console.error('Image OCR error:', error);
      throw new Error('Image OCR failed. Try converting to PDF first.');
    }
  }

  // Unsupported format
  throw new Error(
    `Unsupported file type: ${mimeType}. Supported: PDF, DOCX, PPTX, TXT, HTML, Images (PNG/JPG)`
  );
}

/**
 * Extract text from image using OCR.space API (free tier)
 */
async function extractTextFromImage(buffer: Buffer, mimeType: string): Promise<string> {
  const OCR_API_KEY = process.env.OCR_SPACE_API_KEY || 'K87899142388957'; // Free public key
  const OCR_API_URL = 'https://api.ocr.space/parse/image';

  // Convert buffer to base64
  const base64Image = `data:${mimeType};base64,${buffer.toString('base64')}`;

  const formData = new FormData();
  formData.append('base64Image', base64Image);
  formData.append('apikey', OCR_API_KEY);
  formData.append('language', 'eng');
  formData.append('isOverlayRequired', 'false');
  formData.append('detectOrientation', 'true');

  const response = await fetch(OCR_API_URL, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();

  if (data.ParsedResults && data.ParsedResults.length > 0) {
    return data.ParsedResults[0].ParsedText || '';
  }

  throw new Error(data.ErrorMessage || 'OCR failed');
}

/**
 * Recursively extract text from XML (for PPTX)
 */
function extractTextFromXML(obj: any): string[] {
  const texts: string[] = [];

  if (typeof obj === 'string') {
    texts.push(obj);
  } else if (Array.isArray(obj)) {
    obj.forEach(item => texts.push(...extractTextFromXML(item)));
  } else if (typeof obj === 'object' && obj !== null) {
    // Look for text nodes (common in PPTX XML: a:t)
    if (obj['a:t'] && typeof obj['a:t'] === 'string') {
      texts.push(obj['a:t']);
    }
    
    // Recursively search all properties
    for (const key of Object.keys(obj)) {
      texts.push(...extractTextFromXML(obj[key]));
    }
  }

  return texts;
}

/**
 * Extract keywords from text using frequency analysis + domain terms
 */
function extractKeywords(text: string): string[] {
  // Defense/tech domain keywords (boosted)
  const domainKeywords = new Set([
    'ai', 'artificial intelligence', 'machine learning', 'neural network',
    'cybersecurity', 'autonomous', 'robotics', 'drone', 'uav', 'unmanned',
    'radar', 'sonar', 'lidar', 'sensor', 'surveillance', 'reconnaissance',
    'missile', 'weapon', 'combat', 'defense', 'military', 'tactical',
    'satellite', 'space', 'orbit', 'aerospace', 'aviation',
    'encryption', 'cryptography', 'secure', 'classified', 'itar',
    'simulation', 'modeling', 'analysis', 'optimization', 'algorithm',
    'communication', 'networking', 'rf', 'electromagnetic', 'spectrum',
    'logistics', 'supply chain', 'maintenance', 'sustainment',
    'hypersonic', 'stealth', 'electronic warfare', 'cyber', 'quantum'
  ]);

  // Common stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
    'these', 'those', 'we', 'our', 'us', 'you', 'your', 'they', 'their',
    'them', 'it', 'its', 'which', 'who', 'what', 'when', 'where', 'how', 'why'
  ]);

  // Tokenize and clean
  const tokens = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  // Count frequencies
  const freq: Record<string, number> = {};
  tokens.forEach(word => {
    freq[word] = (freq[word] || 0) + 1;
  });

  // Boost domain terms
  for (const term of domainKeywords) {
    if (text.toLowerCase().includes(term)) {
      freq[term] = (freq[term] || 0) + 10; // Heavy boost
    }
  }

  // Sort by frequency and return top 15
  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word);

  return sorted;
}

/**
 * Parse multipart form data manually
 */
async function parseFormData(request: NextRequest): Promise<{ file: Buffer; filename: string; mimeType: string }> {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    throw new Error('Invalid content type. Expected multipart/form-data');
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    throw new Error('No file uploaded');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  
  return {
    file: buffer,
    filename: file.name,
    mimeType: file.type
  };
}

/**
 * POST: Extract text from uploaded file
 */
export async function POST(request: NextRequest): Promise<NextResponse<ExtractionResult>> {
  try {
    // Parse uploaded file
    const { file: buffer, filename, mimeType } = await parseFormData(request);

    console.log(`[Extract] Processing file: ${filename} (${mimeType}, ${(buffer.length / 1024).toFixed(0)}KB)`);

    // Extract text
    const { text, pageCount } = await extractTextFromFile(buffer, filename, mimeType);

    if (!text || text.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No text found in file. File may be empty or image-based without OCR.'
      }, { status: 400 });
    }

    // Extract keywords
    const keywords = extractKeywords(text);

    // Calculate stats
    const stats = {
      characterCount: text.length,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      pageCount
    };

    console.log(`[Extract] Success: ${stats.characterCount} chars, ${stats.wordCount} words, ${keywords.length} keywords`);

    return NextResponse.json({
      success: true,
      text: text.substring(0, 10000), // Return first 10k chars for preview
      keywords,
      filename,
      fileType: mimeType,
      stats
    });

  } catch (error) {
    console.error('[Extract] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'File extraction failed'
    }, { status: 500 });
  }
}

/**
 * GET: Not supported
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: false,
    error: 'GET not supported. Use POST to upload a file.'
  }, { status: 405 });
}
