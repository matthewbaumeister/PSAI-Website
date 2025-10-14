/**
 * SBIR File Extraction API
 * POST: Upload file → Extract text → Extract keywords → Return
 * Supports: PDF, DOCX, PPTX, Images (OCR), XLSX, HTML, TXT, and more
 * 100% Free - No API limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromFile, isFileSupported, getAllSupportedExtensions, getFileExtension } from '@/lib/multi-format-extractor';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log(' File extraction request received');

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    const filename = file.name;
    console.log(` Processing file: ${filename} (${file.size} bytes)`);

    // Validate file type
    if (!isFileSupported(filename)) {
      const supportedFormats = getAllSupportedExtensions().slice(0, 20).join(', ') + ', ...';
      return NextResponse.json({
        success: false,
        error: `Unsupported file type. Supported: ${supportedFormats}`
      }, { status: 400 });
    }

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text using multi-format extractor
    console.log(` Extracting text from ${getFileExtension(filename).toUpperCase()} file...`);
    let extractedText: string;
    let extractionMetadata: any;
    
    try {
      const result = await extractTextFromFile(buffer, filename);
      extractedText = result.text;
      extractionMetadata = result.metadata;
      
      console.log(` Extraction successful using ${extractionMetadata.method}`);
    } catch (extractError) {
      console.error(' Extraction error:', extractError);
      return NextResponse.json({
        success: false,
        error: extractError instanceof Error ? extractError.message : 'Text extraction failed'
      }, { status: 500 });
    }

    if (!extractedText || extractedText.trim().length < 10) {
      return NextResponse.json({
        success: false,
        error: 'No text extracted from file. File may be empty or image-based.'
      }, { status: 400 });
    }

    console.log(` Extracted ${extractedText.length} characters`);

    // Extract keywords
    const keywords = extractKeywords(extractedText);
    console.log(` Extracted ${keywords.length} keywords`);

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      filename,
      fileType: extractionMetadata.format || getFileExtension(filename),
      stats: {
        characterCount: extractedText.length,
        wordCount: extractedText.split(/\s+/).length,
        keywordCount: keywords.length,
        processingTimeMs: processingTime,
        extractionMethod: extractionMetadata.method,
        fileSize: extractionMetadata.size
      },
      keywords,
      // Return first 500 chars as preview
      preview: extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : '')
    });

  } catch (error) {
    console.error(' File extraction error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Extract keywords from text (same logic as frontend)
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'we', 'our', 'us', 'you', 'your', 'they', 'their', 'them', 'it', 'its', 'which', 'who', 'what', 'when', 'where', 'how', 'why']);
  
  // Split into words and filter
  const words = text.toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));
  
  // Count frequency
  const freq: Record<string, number> = {};
  words.forEach(word => {
    freq[word] = (freq[word] || 0) + 1;
  });
  
  // Get top keywords by frequency
  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15) // Get top 15 for files (more than text paste)
    .map(([word]) => word);
  
  return sorted;
}

