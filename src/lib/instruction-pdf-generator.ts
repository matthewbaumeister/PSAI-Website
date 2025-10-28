/**
 * INSTRUCTION PDF GENERATOR
 * 
 * Generates consolidated instruction PDFs for SBIR/STTR opportunities
 * Uses pdf-lib (serverless-compatible, no font file dependencies)
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { VolumeRequirement } from './instruction-pdf-parser';

export interface OpportunityInfo {
  topicNumber: string;
  title: string;
  component: string;
  program: string;
  openDate?: string;
  closeDate?: string;
  phase: string;
  status: string;
}

export interface ConsolidatedInstructionData {
  opportunity: OpportunityInfo;
  volumes: VolumeRequirement[];
  checklist: string[];
  keyDates: { [key: string]: string };
  submissionGuidelines: string[];
  contacts: string[];
  componentInstructionsUrl?: string;
  solicitationInstructionsUrl?: string;
  generatedAt: Date;
}

export class InstructionPdfGenerator {
  /**
   * Sanitize text to only include WinAnsi-compatible characters
   * Replaces Unicode characters that pdf-lib can't encode
   */
  private sanitizeText(text: string): string {
    return text
      // Replace various Unicode hyphens/dashes with regular hyphen
      .replace(/[\u2010-\u2015]/g, '-')
      // Replace curly quotes with straight quotes
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      // Replace ellipsis
      .replace(/\u2026/g, '...')
      // Replace bullet points
      .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '•')
      // Remove other non-ASCII characters or replace with space
      .replace(/[^\x00-\x7F]/g, (char) => {
        // Keep common printable characters, replace others with space
        return char.charCodeAt(0) > 127 ? ' ' : char;
      })
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Generate consolidated instruction PDF
   * Returns a Buffer that can be uploaded to storage
   */
  async generateConsolidatedPdf(data: ConsolidatedInstructionData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    
    // Embed standard fonts (no external files needed)
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const fonts = {
      normal: helveticaFont,
      bold: helveticaBoldFont,
      title: timesRomanBoldFont,
    };

    // Generate content
    await this.addCoverPage(pdfDoc, data, fonts);
    await this.addTableOfContents(pdfDoc, data, fonts);
    await this.addQuickReference(pdfDoc, data, fonts);
    await this.addVolumeRequirements(pdfDoc, data, fonts);
    await this.addChecklist(pdfDoc, data, fonts);
    await this.addSourceDocuments(pdfDoc, data, fonts);
    await this.addFooters(pdfDoc, data, fonts);

    // Save as buffer
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  /**
   * Add cover page
   */
  private async addCoverPage(
    pdfDoc: PDFDocument,
    data: ConsolidatedInstructionData,
    fonts: any
  ) {
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const { width, height } = page.getSize();
    const { opportunity } = data;

    let y = height - 100;

    // Title
    page.drawText('SBIR/STTR Submission Instructions', {
      x: 50,
      y,
      size: 24,
      font: fonts.bold,
      color: rgb(0, 0, 0),
    });
    y -= 80;

    // Opportunity title
    const titleLines = this.wrapText(opportunity.title, width - 100, fonts.normal, 16);
    for (const line of titleLines) {
      page.drawText(line, {
        x: 50,
        y,
        size: 16,
        font: fonts.normal,
      });
      y -= 25;
    }

    y -= 20;

    // Topic details
    page.drawText(`Topic Number: ${opportunity.topicNumber}`, {
      x: 50,
      y,
      size: 12,
      font: fonts.normal,
    });
    y -= 20;

    page.drawText(`Component: ${opportunity.component}`, {
      x: 50,
      y,
      size: 12,
      font: fonts.normal,
    });
    y -= 20;

    page.drawText(`Program: ${opportunity.program}`, {
      x: 50,
      y,
      size: 12,
      font: fonts.normal,
    });
    y -= 20;

    page.drawText(`Phase: ${opportunity.phase}`, {
      x: 50,
      y,
      size: 12,
      font: fonts.normal,
    });
    y -= 30;

    if (opportunity.openDate || opportunity.closeDate) {
      if (opportunity.openDate) {
        page.drawText(`Open Date: ${opportunity.openDate}`, {
          x: 50,
          y,
          size: 12,
          font: fonts.normal,
        });
        y -= 20;
      }
      if (opportunity.closeDate) {
        page.drawText(`Close Date: ${opportunity.closeDate}`, {
          x: 50,
          y,
          size: 12,
          font: fonts.normal,
        });
        y -= 30;
      }
    }

    // Warning box
    y -= 20;
    page.drawRectangle({
      x: 50,
      y: y - 100,
      width: width - 100,
      height: 120,
      borderColor: rgb(0.96, 0.62, 0.04),
      borderWidth: 2,
      color: rgb(1, 0.95, 0.78),
    });

    page.drawText('IMPORTANT NOTICE', {
      x: width / 2 - 70,
      y: y - 30,
      size: 12,
      font: fonts.bold,
      color: rgb(0.57, 0.25, 0.05),
    });

    const warningText = [
      'This document is a consolidated reference guide extracted from official BAA',
      'and Component instructions. Always verify requirements against the original',
      'source documents listed at the end of this guide. Instructions may be',
      'updated after this document was generated.',
    ];

    let warningY = y - 50;
    for (const line of warningText) {
      page.drawText(line, {
        x: 60,
        y: warningY,
        size: 9,
        font: fonts.normal,
        color: rgb(0.57, 0.25, 0.05),
      });
      warningY -= 12;
    }

    y -= 150;

    page.drawText(`Generated: ${data.generatedAt.toLocaleString()}`, {
      x: 50,
      y,
      size: 8,
      font: fonts.normal,
      color: rgb(0.4, 0.4, 0.4),
    });
  }

  /**
   * Add table of contents
   */
  private async addTableOfContents(
    pdfDoc: PDFDocument,
    data: ConsolidatedInstructionData,
    fonts: any
  ) {
    const page = pdfDoc.addPage([612, 792]);
    const { height } = page.getSize();

    let y = height - 100;

    page.drawText('Table of Contents', {
      x: 50,
      y,
      size: 18,
      font: fonts.bold,
    });
    y -= 40;

    const toc = [
      '1. Quick Reference Guide',
      '2. Volume Requirements',
    ];

    data.volumes.forEach((vol) => {
      toc.push(`   Volume ${vol.volumeNumber}: ${vol.volumeName}`);
    });

    toc.push('3. Submission Checklist');
    toc.push('4. Source Documents');

    for (const item of toc) {
      page.drawText(item, {
        x: 50,
        y,
        size: 11,
        font: fonts.normal,
      });
      y -= 18;
    }
  }

  /**
   * Add quick reference section
   */
  private async addQuickReference(
    pdfDoc: PDFDocument,
    data: ConsolidatedInstructionData,
    fonts: any
  ) {
    const page = pdfDoc.addPage([612, 792]);
    const { height } = page.getSize();

    let y = height - 100;

    page.drawText('Quick Reference Guide', {
      x: 50,
      y,
      size: 18,
      font: fonts.bold,
    });
    y -= 40;

    // Key dates
    if (Object.keys(data.keyDates).length > 0) {
      page.drawText('Key Dates', {
        x: 50,
        y,
        size: 14,
        font: fonts.bold,
      });
      y -= 25;

      for (const [key, value] of Object.entries(data.keyDates)) {
        page.drawText(`${key}: ${value}`, {
          x: 50,
          y,
          size: 10,
          font: fonts.normal,
        });
        y -= 15;
      }
      y -= 20;
    }

    // Contacts
    if (data.contacts.length > 0) {
      page.drawText('Contact Information', {
        x: 50,
        y,
        size: 14,
        font: fonts.bold,
      });
      y -= 25;

      for (const contact of data.contacts) {
        if (y < 100) break;
        page.drawText(contact.substring(0, 80), {
          x: 50,
          y,
          size: 10,
          font: fonts.normal,
        });
        y -= 15;
      }
      y -= 20;
    }

    // Volume summary
    if (y > 150) {
      page.drawText('Volume Summary', {
        x: 50,
        y,
        size: 14,
        font: fonts.bold,
      });
      y -= 25;

      for (const vol of data.volumes) {
        if (y < 100) break;
        page.drawText(`Volume ${vol.volumeNumber}: ${vol.volumeName}`, {
          x: 50,
          y,
          size: 10,
          font: fonts.normal,
        });
        y -= 15;
      }
    }
  }

  /**
   * Add volume requirements section
   */
  private async addVolumeRequirements(
    pdfDoc: PDFDocument,
    data: ConsolidatedInstructionData,
    fonts: any
  ) {
    const pageWidth = 612;
    const pageHeight = 792;

    for (let i = 0; i < data.volumes.length; i++) {
      const volume = data.volumes[i];
      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      let y = pageHeight - 100;

      // Volume header
      page.drawText(`Volume ${volume.volumeNumber}: ${volume.volumeName}`, {
        x: 50,
        y,
        size: 14,
        font: fonts.bold,
        color: rgb(0.12, 0.25, 0.69),
      });
      y -= 30;

      // Description
      if (volume.description) {
        const descLines = this.wrapText(volume.description, pageWidth - 100, fonts.normal, 10);
        for (const line of descLines.slice(0, 3)) {
          page.drawText(line, {
            x: 50,
            y,
            size: 10,
            font: fonts.normal,
          });
          y -= 15;
        }
        y -= 15;
      }

      // Requirements
      if (volume.requirements.length > 0) {
        page.drawText('Requirements:', {
          x: 50,
          y,
          size: 11,
          font: fonts.bold,
        });
        y -= 20;

        for (const req of volume.requirements) {
          if (y < 100) break;
          
          const reqLines = this.wrapText(`• ${req}`, pageWidth - 120, fonts.normal, 9);
          for (const line of reqLines) {
            if (y < 100) break;
            page.drawText(line, {
              x: 60,
              y,
              size: 9,
              font: fonts.normal,
            });
            y -= 13;
          }
          y -= 5;
        }
      }
    }
  }

  /**
   * Add submission checklist
   */
  private async addChecklist(
    pdfDoc: PDFDocument,
    data: ConsolidatedInstructionData,
    fonts: any
  ) {
    const page = pdfDoc.addPage([612, 792]);
    const { height } = page.getSize();

    let y = height - 100;

    page.drawText('Submission Checklist', {
      x: 50,
      y,
      size: 18,
      font: fonts.bold,
    });
    y -= 30;

    page.drawText('Use this checklist to ensure your proposal includes all required elements.', {
      x: 50,
      y,
      size: 10,
      font: fonts.normal,
    });
    y -= 15;
    page.drawText('Check the source documents for the most up-to-date requirements.', {
      x: 50,
      y,
      size: 10,
      font: fonts.normal,
    });
    y -= 30;

    if (data.checklist.length === 0) {
      page.drawText('No specific checklist items were extracted.', {
        x: 50,
        y,
        size: 10,
        font: fonts.normal,
      });
      y -= 15;
      page.drawText('Please refer to the source documents.', {
        x: 50,
        y,
        size: 10,
        font: fonts.normal,
      });
    } else {
      for (let i = 0; i < data.checklist.length && y > 100; i++) {
        const item = data.checklist[i];

        // Checkbox
        page.drawRectangle({
          x: 50,
          y: y - 2,
          width: 10,
          height: 10,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });

        // Item text
        const itemText = `${i + 1}. ${item}`;
        const itemLines = this.wrapText(itemText, 500, fonts.normal, 10);
        
        let itemY = y;
        for (const line of itemLines) {
          if (itemY < 100) break;
          page.drawText(line, {
            x: 70,
            y: itemY,
            size: 10,
            font: fonts.normal,
          });
          itemY -= 15;
        }

        y = itemY - 10;
      }
    }
  }

  /**
   * Add source documents section
   */
  private async addSourceDocuments(
    pdfDoc: PDFDocument,
    data: ConsolidatedInstructionData,
    fonts: any
  ) {
    const page = pdfDoc.addPage([612, 792]);
    const { height, width } = page.getSize();

    let y = height - 100;

    page.drawText('Source Documents', {
      x: 50,
      y,
      size: 18,
      font: fonts.bold,
    });
    y -= 30;

    page.drawText('This consolidated guide was generated from the following official documents.', {
      x: 50,
      y,
      size: 10,
      font: fonts.normal,
    });
    y -= 15;
    page.drawText('Always verify requirements against the original sources:', {
      x: 50,
      y,
      size: 10,
      font: fonts.normal,
    });
    y -= 30;

    if (data.componentInstructionsUrl) {
      page.drawText('Component Instructions:', {
        x: 50,
        y,
        size: 11,
        font: fonts.bold,
      });
      y -= 15;

      const urlLines = this.wrapText(data.componentInstructionsUrl, width - 100, fonts.normal, 9);
      for (const line of urlLines) {
        page.drawText(line, {
          x: 50,
          y,
          size: 9,
          font: fonts.normal,
          color: rgb(0.12, 0.25, 0.69),
        });
        y -= 12;
      }
      y -= 15;
    }

    if (data.solicitationInstructionsUrl) {
      page.drawText('BAA/Solicitation Instructions:', {
        x: 50,
        y,
        size: 11,
        font: fonts.bold,
      });
      y -= 15;

      const urlLines = this.wrapText(data.solicitationInstructionsUrl, width - 100, fonts.normal, 9);
      for (const line of urlLines) {
        page.drawText(line, {
          x: 50,
          y,
          size: 9,
          font: fonts.normal,
          color: rgb(0.12, 0.25, 0.69),
        });
        y -= 12;
      }
      y -= 15;
    }

    y -= 30;

    const disclaimerLines = [
      'Note: Source document URLs may become inactive after the solicitation closes.',
      'PropShop AI archives instruction content for historical reference.',
    ];

    for (const line of disclaimerLines) {
      page.drawText(line, {
        x: 50,
        y,
        size: 8,
        font: fonts.normal,
        color: rgb(0.4, 0.4, 0.4),
      });
      y -= 12;
    }
  }

  /**
   * Add footer to all pages
   */
  private async addFooters(
    pdfDoc: PDFDocument,
    data: ConsolidatedInstructionData,
    fonts: any
  ) {
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    pages.forEach((page, index) => {
      const { width, height } = page.getSize();
      const footerText = `PropShop AI - ${data.opportunity.topicNumber} - Page ${index + 1} of ${totalPages}`;

      page.drawText(footerText, {
        x: width / 2 - 100,
        y: 30,
        size: 8,
        font: fonts.normal,
        color: rgb(0.4, 0.4, 0.4),
      });
    });
  }

  /**
   * Wrap text to fit within specified width
   */
  private wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
    // Sanitize text first
    const sanitized = this.sanitizeText(text);
    const words = sanitized.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) lines.push(currentLine);
    return lines;
  }
}
