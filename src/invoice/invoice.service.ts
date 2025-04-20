import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { Response } from 'express';

interface InvoiceItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  originalPrice: number;
  discountAmount: number;
  promotionName?: string;
}

interface InvoiceData {
  transactionId: string | number;
  items: InvoiceItem[];
  customerName: string;
  customerPhone: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  paymentMethod: string;
  paymentReference?: string;
  note?: string;
  date: string;
}

@Injectable()
export class InvoiceService {
  async generatePDF(invoiceData: InvoiceData, res: Response): Promise<void> {
    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="invoice-${invoiceData.transactionId}.pdf"`,
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Add company logo and header
    doc.fontSize(20).text('YOUR COMPANY NAME', { align: 'center' });
    doc
      .fontSize(10)
      .text('Address: 123 Business St, City, Country', { align: 'center' });
    doc.text('Phone: +1-234-567-8901 | Email: info@yourcompany.com', {
      align: 'center',
    });
    doc.moveDown(1);

    // Add line separator
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    // Add invoice details
    doc.fontSize(16).text('INVOICE', { align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(10).text(`Invoice Number: ${invoiceData.transactionId}`);
    doc.text(`Date: ${invoiceData.date}`);
    doc.moveDown(0.5);

    doc.text(`Customer: ${invoiceData.customerName}`);
    doc.text(`Phone: ${invoiceData.customerPhone}`);
    if (invoiceData.note) {
      doc.text(`Note: ${invoiceData.note}`);
    }
    doc.moveDown(1);

    // Add item table header
    const tableTop = doc.y;
    doc.font('Helvetica-Bold');
    doc.text('Item', 50, tableTop);
    doc.text('Qty', 250, tableTop, { width: 50, align: 'center' });
    doc.text('Unit Price', 300, tableTop, { width: 100, align: 'right' });
    doc.text('Total', 400, tableTop, { width: 100, align: 'right' });
    doc.moveDown(0.5);

    // Add line under header
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Add items
    doc.font('Helvetica');
    let itemY = doc.y;
    let detailY = doc.y;

    invoiceData.items.forEach((item) => {
      const itemName = item.name;
      const itemDetails = [];

      if (item.promotionName) {
        itemDetails.push(`Promotion: ${item.promotionName}`);
      }

      if (item.originalPrice !== item.price) {
        itemDetails.push(`Original: Rp${item.originalPrice.toFixed(2)}`);
      }

      // Print item name and details
      doc.fontSize(10).text(itemName, 50, itemY);

      // Print promotion and price details in smaller text
      if (itemDetails.length > 0) {
        detailY = doc.y;
        doc.fontSize(8);
        itemDetails.forEach((detail) => {
          doc.text(detail, 60, detailY);
          detailY += 10;
        });
      }

      // Print quantity, price and total
      doc.fontSize(10);
      doc.text(item.quantity.toString(), 250, itemY, {
        width: 50,
        align: 'center',
      });
      doc.text(`Rp${item.price.toFixed(2)}`, 300, itemY, {
        width: 100,
        align: 'right',
      });
      doc.text(`Rp${(item.price * item.quantity).toFixed(2)}`, 400, itemY, {
        width: 100,
        align: 'right',
      });

      // Move to position for next item
      itemY = Math.max(doc.y, detailY || doc.y) + 10;
      doc.y = itemY;
    });

    // Add line after items
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Add totals
    doc.text('Subtotal', 350, doc.y);
    doc.text(`Rp${invoiceData.subtotal.toFixed(2)}`, 400, doc.y, {
      width: 100,
      align: 'right',
    });
    doc.moveDown(0.5);

    doc.text('Tax (10%)', 350, doc.y);
    doc.text(`Rp${invoiceData.taxAmount.toFixed(2)}`, 400, doc.y, {
      width: 100,
      align: 'right',
    });
    doc.moveDown(0.5);

    if (invoiceData.discountAmount > 0) {
      doc.text('Discount', 350, doc.y);
      doc.text(`Rp${invoiceData.discountAmount.toFixed(2)}`, 400, doc.y, {
        width: 100,
        align: 'right',
      });
      doc.moveDown(0.5);
    }

    // Add line before grand total
    doc.moveTo(350, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Add grand total
    doc.font('Helvetica-Bold');
    doc.text('GRAND TOTAL', 350, doc.y);
    doc.text(`Rp${invoiceData.grandTotal.toFixed(2)}`, 400, doc.y, {
      width: 100,
      align: 'right',
    });
    doc.moveDown(1);

    // Add payment info
    doc.font('Helvetica');
    doc.text(`Payment Method: ${invoiceData.paymentMethod.toUpperCase()}`);
    if (invoiceData.paymentReference) {
      doc.text(`Reference: ${invoiceData.paymentReference}`);
    }
    doc.moveDown(1);

    // Add footer
    doc.fontSize(8).text('Thank you for your business!', { align: 'center' });

    // Finalize PDF
    doc.end();
  }
}