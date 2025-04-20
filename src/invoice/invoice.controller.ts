import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Define DTOs
class InvoiceItemDto {
  id: number;
  name: string;
  quantity: number;
  price: number;
  originalPrice: number;
  discountAmount: number;
  promotionName?: string;
}

class InvoiceDataDto {
  transactionId: string | number;
  items: InvoiceItemDto[];
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

@Controller('transactions')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @UseGuards(JwtAuthGuard)
  @Post('invoice/pdf')
  async generateInvoicePDF(
    @Body() invoiceData: InvoiceDataDto,
    @Res() res: Response,
  ) {
    return this.invoiceService.generatePDF(invoiceData, res);
  }
}