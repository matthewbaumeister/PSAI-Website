/**
 * INSTRUCTION PDF GENERATOR
 * 
 * Generates consolidated instruction PDFs for SBIR/STTR opportunities
 * Includes all volumes, checklists, and submission requirements
 */

import PDFDocument from 'pdfkit';
import { VolumeRequirement } from './instruction-pdf-parser';

export interface OpportunityInfo {
  topicNumber: string;
  title: string;
  component: string;
  program: string;
  openDate?: string;
  closeDate?: string;
  phase: string;
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
   * Generate consolidated instruction PDF
   * Returns a Buffer that can be uploaded to storage
   */
  async generateConsolidatedPdf(data: ConsolidatedInstructionData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
          },
          autoFirstPage: true,
          bufferPages: true
        });

        const chunks: Buffer[] = [];
        
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Generate content
        this.addCoverPage(doc, data);
        this.addTableOfContents(doc, data);
        this.addQuickReference(doc, data);
        this.addVolumeRequirements(doc, data);
        this.addChecklist(doc, data);
        this.addSourceDocuments(doc, data);
        this.addFooter(doc, data);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add cover page
   */
  private addCoverPage(doc: PDFKit.PDFDocument, data: ConsolidatedInstructionData) {
    const { opportunity } = data;

    // Title (using default fonts to avoid .afm file issues in serverless)
    doc.fontSize(24)
       .text('SBIR/STTR Submission Instructions', { align: 'center' });

    doc.moveDown(2);

    // Opportunity info
    doc.fontSize(16)
       .text(opportunity.title, { align: 'center' });

    doc.moveDown(1);

    doc.fontSize(12)
       .text(`Topic Number: ${opportunity.topicNumber}`, { align: 'center' });

    doc.moveDown(0.5);

    doc.text(`Component: ${opportunity.component}`, { align: 'center' });
    doc.text(`Program: ${opportunity.program}`, { align: 'center' });
    doc.text(`Phase: ${opportunity.phase}`, { align: 'center' });

    if (opportunity.openDate || opportunity.closeDate) {
      doc.moveDown(1);
      if (opportunity.openDate) {
        doc.text(`Open Date: ${opportunity.openDate}`, { align: 'center' });
      }
      if (opportunity.closeDate) {
        doc.text(`Close Date: ${opportunity.closeDate}`, { align: 'center' });
      }
    }

    doc.moveDown(3);

    // Warning box
    doc.rect(doc.x - 10, doc.y, doc.page.width - 100, 120)
       .fillAndStroke('#FEF3C7', '#F59E0B');

    doc.fillColor('#92400E')
       .fontSize(10)
       .text('IMPORTANT NOTICE', doc.x, doc.y + 20, { align: 'center' });

    doc.moveDown(0.5);

    doc.fontSize(9)
       .text(
         'This document is a consolidated reference guide extracted from official BAA and Component instructions. ' +
         'Always verify requirements against the original source documents listed at the end of this guide. ' +
         'Instructions may be updated after this document was generated.',
         { align: 'center', width: doc.page.width - 120 }
       );

    doc.fillColor('#000000');

    doc.moveDown(3);

    doc.fontSize(8)
       .text(`Generated: ${data.generatedAt.toLocaleString()}`, { align: 'center' });

    doc.addPage();
  }

  /**
   * Add table of contents
   */
  private addTableOfContents(doc: PDFKit.PDFDocument, data: ConsolidatedInstructionData) {
    doc.fontSize(18)
       .text('Table of Contents');

    doc.moveDown(1);

    doc.fontSize(11);

    const toc = [
      '1. Quick Reference Guide',
      '2. Volume Requirements',
    ];

    // Add each volume
    data.volumes.forEach((vol) => {
      toc.push(`   ${vol.volumeNumber}. ${vol.volumeName}`);
    });

    toc.push('3. Submission Checklist');
    toc.push('4. Source Documents');

    toc.forEach((item) => {
      doc.text(item);
      doc.moveDown(0.3);
    });

    doc.addPage();
  }

  /**
   * Add quick reference section
   */
  private addQuickReference(doc: PDFKit.PDFDocument, data: ConsolidatedInstructionData) {
    doc.fontSize(18)
       .text('Quick Reference Guide');

    doc.moveDown(1);

    // Key dates
    if (Object.keys(data.keyDates).length > 0) {
      doc.fontSize(14)
         .text('Key Dates');

      doc.moveDown(0.5);

      doc.fontSize(10);

      Object.entries(data.keyDates).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`);
        doc.moveDown(0.3);
      });

      doc.moveDown(1);
    }

    // Contacts
    if (data.contacts.length > 0) {
      doc.fontSize(14)
         .text('Contact Information');

      doc.moveDown(0.5);

      doc.fontSize(10);

      data.contacts.forEach((contact) => {
        doc.text(contact);
        doc.moveDown(0.3);
      });

      doc.moveDown(1);
    }

    // Volume summary
    doc.fontSize(14)
       .text('Volume Summary');

    doc.moveDown(0.5);

    doc.fontSize(10);

    data.volumes.forEach((vol) => {
      doc.text(`Volume ${vol.volumeNumber}: ${vol.volumeName}`);
      doc.moveDown(0.2);
    });

    doc.addPage();
  }

  /**
   * Add volume requirements section
   */
  private addVolumeRequirements(doc: PDFKit.PDFDocument, data: ConsolidatedInstructionData) {
    doc.fontSize(18)
       .text('Volume Requirements');

    doc.moveDown(1);

    data.volumes.forEach((volume, index) => {
      // Volume header
      doc.fontSize(14)
         .fillColor('#1E40AF')
         .text(`Volume ${volume.volumeNumber}: ${volume.volumeName}`);

      doc.fillColor('#000000');
      doc.moveDown(0.5);

      // Description
      if (volume.description) {
        doc.fontSize(10)
           .text(volume.description);
        doc.moveDown(0.5);
      }

      // Requirements
      if (volume.requirements.length > 0) {
        doc.fontSize(11)
           .text('Requirements:');

        doc.moveDown(0.3);

        doc.fontSize(9);

        volume.requirements.forEach((req, idx) => {
          const bullet = String.fromCharCode(8226);
          doc.text(`${bullet} ${req}`, {
            indent: 10,
            width: doc.page.width - 120
          });
          doc.moveDown(0.3);
        });
      }

      doc.moveDown(1);

      // Add page break between volumes (except last)
      if (index < data.volumes.length - 1) {
        doc.addPage();
      }
    });

    doc.addPage();
  }

  /**
   * Add submission checklist
   */
  private addChecklist(doc: PDFKit.PDFDocument, data: ConsolidatedInstructionData) {
    doc.fontSize(18)
       .text('Submission Checklist');

    doc.moveDown(1);

    doc.fontSize(10)
       .text(
         'Use this checklist to ensure your proposal includes all required elements. ' +
         'Check the source documents for the most up-to-date requirements.'
       );

    doc.moveDown(1);

    if (data.checklist.length === 0) {
      doc.fontSize(10)
         .text('No specific checklist items were extracted. Please refer to the source documents.');
    } else {
      doc.fontSize(10);

      data.checklist.forEach((item, idx) => {
        // Checkbox
        doc.rect(doc.x, doc.y + 2, 10, 10).stroke();
        
        // Item text
        doc.text(`${idx + 1}. ${item}`, doc.x + 20, doc.y, {
          width: doc.page.width - 140,
          indent: -20
        });

        doc.moveDown(0.5);

        // Add page break if needed
        if (doc.y > doc.page.height - 100) {
          doc.addPage();
        }
      });
    }

    doc.addPage();
  }

  /**
   * Add source documents section
   */
  private addSourceDocuments(doc: PDFKit.PDFDocument, data: ConsolidatedInstructionData) {
    doc.fontSize(18)
       .text('Source Documents');

    doc.moveDown(1);

    doc.fontSize(10)
       .text(
         'This consolidated guide was generated from the following official documents. ' +
         'Always verify requirements against the original sources:'
       );

    doc.moveDown(1);

    if (data.componentInstructionsUrl) {
      doc.fontSize(11)
         .text('Component Instructions:');

      doc.fontSize(9)
         .fillColor('#1E40AF')
         .text(data.componentInstructionsUrl, { link: data.componentInstructionsUrl });

      doc.fillColor('#000000');
      doc.moveDown(1);
    }

    if (data.solicitationInstructionsUrl) {
      doc.fontSize(11)
         .text('BAA/Solicitation Instructions:');

      doc.fontSize(9)
         .fillColor('#1E40AF')
         .text(data.solicitationInstructionsUrl, { link: data.solicitationInstructionsUrl });

      doc.fillColor('#000000');
      doc.moveDown(1);
    }

    doc.moveDown(2);

    // Disclaimer
    doc.fontSize(8)
       .text(
         'Note: Source document URLs may become inactive after the solicitation closes. ' +
         'PropShop AI archives instruction content for historical reference.'
       );
  }

  /**
   * Add footer to all pages
   */
  private addFooter(doc: PDFKit.PDFDocument, data: ConsolidatedInstructionData) {
    const pages = doc.bufferedPageRange();
    
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);

      doc.fontSize(8)
         .fillColor('#666666')
         .text(
           `PropShop AI - ${data.opportunity.topicNumber} - Page ${i + 1} of ${pages.count}`,
           50,
           doc.page.height - 30,
           { align: 'center' }
         );

      doc.fillColor('#000000');
    }
  }
}

