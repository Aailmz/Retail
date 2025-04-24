import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection, EntityManager, Between } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionItem } from './entities/transaction-item.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ProductService } from '../product/product.service';
import { PromotionService } from '../promotion/promotion.service';
import { Product } from '../product/entities/product.entity';
import { generateTransactionCode } from './utils/code-generator';
import { MidtransService } from '@ruraim/nestjs-midtrans';

// Define PaymentStatus enum - you may move this to a separate file if desired
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed'
}

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(TransactionItem)
    private transactionItemRepository: Repository<TransactionItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private productService: ProductService,
    private promotionService: PromotionService,
    private midtransService: MidtransService,
    private connection: Connection
  ) {}

  async findAll(): Promise<Transaction[]> {
    return this.transactionRepository.find({
      relations: ['items', 'member'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'member']
    });
    
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    
    return transaction;
  }

  async findAllWithFilters(filterOptions: any = {}): Promise<Transaction[]> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.items', 'items')
      .leftJoinAndSelect('transaction.member', 'member')
      .orderBy('transaction.createdAt', 'DESC');
    
    // Apply search filter
    if (filterOptions.search) {
      queryBuilder.andWhere(
        '(transaction.transactionCode LIKE :search OR ' +
        'transaction.customerName LIKE :search OR ' +
        'transaction.customerPhone LIKE :search OR ' +
        'transaction.customerEmail LIKE :search)',
        { search: `%${filterOptions.search}%` }
      );
    }
    
    // Apply date range filter
    if (filterOptions.dateRange) {
      queryBuilder.andWhere(
        'transaction.createdAt BETWEEN :startDate AND :endDate',
        { 
          startDate: filterOptions.dateRange.start,
          endDate: filterOptions.dateRange.end
        }
      );
    }
    
    return queryBuilder.getMany();
  }

  async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    // Use transaction to ensure data consistency
    return this.connection.transaction(async (manager: EntityManager) => {
      // Existing code to create transaction...
      const productIds = createTransactionDto.items.map(item => item.productId);
      const products = await manager.findByIds(Product, productIds);
      
      if (products.length !== productIds.length) {
        throw new BadRequestException('Some products do not exist');
      }
      
      const productMap = new Map<number, Product>();
      products.forEach(product => productMap.set(product.id, product));

      let subtotal = 0;
      const transactionItems: Partial<TransactionItem>[] = [];
      
      for (const item of createTransactionDto.items) {
        const product = productMap.get(item.productId);
        
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for product: ${product.name}`);
        }

        const unitPrice = item.discountedPrice !== undefined ? item.discountedPrice : 
                 (item.markedUpPrice !== undefined ? item.markedUpPrice : product.sellingPrice);
        const itemTotal = parseFloat((unitPrice * item.quantity).toFixed(2));
        
        subtotal += itemTotal;
        
        transactionItems.push({
          productId: product.id,
          productName: product.name,
          productPrice: product.sellingPrice,
          originalPrice: item.originalPrice !== undefined ? item.originalPrice : product.sellingPrice,
          markedUpPrice: item.markedUpPrice !== undefined ? item.markedUpPrice : product.sellingPrice,
          discountedPrice: item.discountedPrice !== undefined ? item.discountedPrice : 
                          (item.markedUpPrice !== undefined ? item.markedUpPrice : product.sellingPrice),
          unitPrice: unitPrice,
          quantity: item.quantity,
          subtotal: itemTotal,
          discountAmount: item.discountAmount || 0,
          markupPercentage: item.markupPercentage || 0,
          promotionId: item.promotionId || null,
          total: itemTotal
        });
      }
      
      const taxRate = 0.1; 
      const taxAmount = parseFloat((subtotal * taxRate).toFixed(2));
      const transactionDiscount = createTransactionDto.discountAmount || 0;
      const grandTotal = parseFloat((subtotal + taxAmount - transactionDiscount).toFixed(2));

      // Set initial payment status
      let paymentStatus = PaymentStatus.PAID; // Default for cash and most methods
      
      // For QRIS, set as pending
      if (createTransactionDto.paymentMethod === 'qris') {
        paymentStatus = PaymentStatus.PENDING;
      }

      const transaction = manager.create(Transaction, {
        transactionCode: generateTransactionCode(),
        memberId: createTransactionDto.userId,
        customerName: createTransactionDto.customerName,
        customerPhone: createTransactionDto.customerPhone,
        customerEmail: createTransactionDto.customerEmail,
        subtotal,
        discountAmount: transactionDiscount,
        taxAmount,
        grandTotal,
        paymentMethod: createTransactionDto.paymentMethod,
        paymentReference: createTransactionDto.paymentReference,
        paymentStatus: paymentStatus,
        promotionId: createTransactionDto.promotionId,
        note: createTransactionDto.note,
      });
      
      const savedTransaction = await manager.save(transaction);
      
      const items = transactionItems.map(item => manager.create(TransactionItem, {
        ...item,
        transactionId: savedTransaction.id
      }));
      
      await manager.save(items);
      
      // Process QRIS payment if selected
      if (createTransactionDto.paymentMethod === 'qris') {
        try {
          // Hitung total item untuk memastikan presisi yang tepat
          let itemTotal = 0;
          
          // Format item details dari transaction items
          const itemDetails = createTransactionDto.items.map(item => {
            const product = productMap.get(item.productId);
            const itemPrice = item.discountedPrice || item.markedUpPrice || product.sellingPrice;
            const quantity = item.quantity;
            const price = parseFloat(itemPrice.toFixed(2));
            
            // Akumulasi total
            itemTotal += price * quantity;
            
            return {
              id: product.id.toString(),
              price: price,
              quantity: quantity,
              name: product.name.substring(0, 50) // Midtrans membatasi panjang nama item
            };
          });
          
          // Tambahkan item untuk pajak jika ada
          if (taxAmount > 0) {
            itemDetails.push({
              id: 'tax',
              price: parseFloat(taxAmount.toFixed(2)),
              quantity: 1,
              name: 'Tax'
            });
            itemTotal += taxAmount;
          }
          
          // Tambahkan item untuk diskon jika ada (sebagai nilai negatif)
          if (transactionDiscount > 0) {
            itemDetails.push({
              id: 'discount',
              price: -parseFloat(transactionDiscount.toFixed(2)),
              quantity: 1,
              name: 'Discount'
            });
            itemTotal -= transactionDiscount;
          }
          
          // Pastikan nilai total tepat sama dengan jumlah item
          const finalTotal = parseFloat(itemTotal.toFixed(2));
          
          // Menggunakan MidtransService dari @ruraim/nestjs-midtrans
          const paymentParams = {
            payment_type: 'qris' as const,
            transaction_details: {
              order_id: savedTransaction.transactionCode,
              gross_amount: finalTotal // Gunakan nilai yang dihitung dari item details
            },
            item_details: itemDetails,
            customer_details: {
              first_name: savedTransaction.customerName,
              email: savedTransaction.customerEmail || 'noemail@example.com',
              phone: savedTransaction.customerPhone || '08123456789',
            },
            qris: {
              acquirer: 'gopay'
            }
          };
          
          const qrisResponse = await this.midtransService.charge(paymentParams);
          
          await manager.update(Transaction, savedTransaction.id, {
            midtransOrderId: qrisResponse.order_id,
            qrisImageUrl: qrisResponse.actions?.find(action => action.name === 'generate-qr-code')?.url || 
                          qrisResponse.qr_image_url
          });

          console.log('Item Details Total:', itemTotal);
          console.log('Final Total to Midtrans:', finalTotal);
          console.log('Transaction Grand Total:', savedTransaction.grandTotal);
          console.log('Payment Params:', JSON.stringify(paymentParams));
          console.log('QRIS Response:', JSON.stringify(qrisResponse));
          
          savedTransaction.midtransOrderId = qrisResponse.order_id;
          savedTransaction.qrisImageUrl = qrisResponse.actions?.find(action => action.name === 'generate-qr-code')?.url || 
                                        qrisResponse.qr_image_url;
        } catch (error) {
          throw new BadRequestException(`Failed to generate QRIS: ${error.message}`);
        }
      }

      return {
        ...savedTransaction,
        items: items as TransactionItem[]
      };
    });
  }

  async updatePaymentStatus(transactionId: number, status: PaymentStatus): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['items']
    });
    
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${transactionId} not found`);
    }
    
    transaction.paymentStatus = status;
    
    // If payment is successful, reduce inventory
    if (status === PaymentStatus.PAID && transaction.paymentStatus !== PaymentStatus.PAID) {
      await this.connection.transaction(async (manager: EntityManager) => {
        for (const item of transaction.items) {
          await manager.decrement(
            Product,
            { id: item.productId },
            'stock',
            item.quantity
          );
        }
        
        await manager.save(transaction);
      });
    }
    
    return this.transactionRepository.save(transaction);
  }

  async handleMidtransNotification(notification: any): Promise<Transaction> {
    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;
    
    // Extract transaction ID from order ID (QRIS-TXCODE format)
    const transactionCode = orderId.replace('QRIS-', '');
    
    const transaction = await this.transactionRepository.findOne({
      where: { transactionCode },
      relations: ['items']
    });
    
    if (!transaction) {
      throw new NotFoundException(`Transaction with code ${transactionCode} not found`);
    }
    
    // Map Midtrans status to our status
    let paymentStatus = PaymentStatus.PENDING;
    
    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      if (fraudStatus === 'accept') {
        paymentStatus = PaymentStatus.PAID;
      }
    } else if (transactionStatus === 'cancel' || 
               transactionStatus === 'deny' || 
               transactionStatus === 'expire') {
      paymentStatus = PaymentStatus.FAILED;
    }
    
    return this.updatePaymentStatus(transaction.id, paymentStatus);
  }

  async voidTransaction(id: number, reason: string): Promise<Transaction> {
    return this.connection.transaction(async (manager: EntityManager) => {
      const transaction = await manager.findOne(Transaction, {
        where: { id },
        relations: ['items']
      });
      
      if (!transaction) {
        throw new NotFoundException(`Transaction with ID ${id} not found`);
      }
      
      if (transaction.isVoided) {
        throw new BadRequestException('Transaction already voided');
      }
      
      // Mark as voided
      transaction.isVoided = true;
      transaction.voidReason = reason;
      
      // Return stock to inventory
      for (const item of transaction.items) {
        await manager.increment(
          Product,
          { id: item.productId },
          'stock',
          item.quantity
        );
      }
      
      return manager.save(transaction);
    });
  }

  async getTransactionsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
        isVoided: false
      },
      relations: ['items']
    });
  }

  async getTransactionStats() {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));
    
    const todayStats = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('COUNT(transaction.id)', 'count')
      .addSelect('SUM(transaction.grandTotal)', 'total')
      .where('transaction.createdAt BETWEEN :start AND :end', {
        start: startOfToday,
        end: endOfToday
      })
      .andWhere('transaction.isVoided = :isVoided', { isVoided: false })
      .getRawOne();
    
    // Get weekly stats, monthly stats, etc.
    
    return {
      today: {
        count: parseInt(todayStats.count) || 0,
        total: parseFloat(todayStats.total) || 0
      }
      // Add other stats as needed
    };
  }

  async findRecent(limit: number = 5): Promise<Transaction[]> {
    return this.transactionRepository.find({
      relations: ['items', 'member'],
      order: { createdAt: 'DESC' },
      take: limit
    });
  }
  
  async getTodaySales(): Promise<number> {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(new Date().setHours(23, 59, 59, 999));
    
    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.grandTotal)', 'total')
      .where('transaction.createdAt BETWEEN :start AND :end', {
        start: startOfToday,
        end: endOfToday
      })
      .andWhere('transaction.isVoided = :isVoided', { isVoided: false })
      .getRawOne();
    
    return parseFloat(result.total) || 0;
  }
  
  async getTransactionCount(): Promise<number> {
    const count = await this.transactionRepository.count({
      where: { isVoided: false }
    });
    
    return count;
  }
  
  async getPaymentMethodStats(): Promise<Record<string, number>> {
    const transactions = await this.transactionRepository.find({
      where: { isVoided: false }
    });
    
    const stats = {
      cash: 0,
      credit_card: 0,
      debit_card: 0,
      bank_transfer: 0,
      digital_wallet: 0
    };
    
    transactions.forEach(transaction => {
      stats[transaction.paymentMethod]++;
    });
    
    return stats;
  }
  
  // Get sales data for chart (past 7 days)
  async getWeeklySalesData(): Promise<{ date: string; amount: number }[]> {
    const result = [];
    const today = new Date();
    
    // Get data for the past 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const dayData = await this.transactionRepository
        .createQueryBuilder('transaction')
        .select('SUM(transaction.grandTotal)', 'total')
        .where('transaction.createdAt BETWEEN :start AND :end', {
          start: startOfDay,
          end: endOfDay
        })
        .andWhere('transaction.isVoided = :isVoided', { isVoided: false })
        .getRawOne();
      
      result.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: parseFloat(dayData.total) || 0
      });
    }
    
    return result;
  }

  async generateReportPdf(transactions: Transaction[], startDate: string, endDate: string): Promise<Buffer> {
    const PDFDocument = require('pdfkit');
    
    return new Promise((resolve, reject) => {
      try {
        // Create a document
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        
        doc.on('data', buffer => buffers.push(buffer));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', err => reject(err));
        
        // Add content to the PDF
        
        // Company info and title
        doc.fontSize(20).text('RETAIL Sales Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Date Range: ${startDate} to ${endDate}`, { align: 'center' });
        doc.moveDown(2);
        
        // Calculate summary data
        let totalSales = 0;
        let totalItems = 0;
        let voidedTransactions = 0;
        
        transactions.forEach(transaction => {
          if (transaction.isVoided) {
            voidedTransactions++;
          } else {
            totalSales += transaction.grandTotal;
            transaction.items.forEach(item => {
              totalItems += item.quantity;
            });
          }
        });
        
        // Summary section
        doc.fontSize(14).text('Summary', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text(`Total Transactions: ${transactions.length}`);
        doc.text(`Completed Transactions: ${transactions.length - voidedTransactions}`);
        doc.text(`Total Items Sold: ${totalItems}`);
        doc.moveDown(2);
        
        // Transactions table
        doc.fontSize(14).text('Transaction Details', { underline: true });
        doc.moveDown(0.5);
        
        // Table headers
        const tableTop = doc.y + 10;
        let currentY = tableTop;
        
        // Define column widths
        const colWidths = {
          code: 100,
          date: 80,
          customer: 120,
          total: 80,
          payment: 80,
          status: 60
        };
        
        // Draw table headers
        doc.fontSize(10).font('Helvetica-Bold');
        
        doc.text('Code', 50, currentY);
        doc.text('Date', 50 + colWidths.code, currentY);
        doc.text('Customer', 50 + colWidths.code + colWidths.date, currentY);
        doc.text('Total (Rp)', 50 + colWidths.code + colWidths.date + colWidths.customer, currentY);
        doc.text('Payment', 50 + colWidths.code + colWidths.date + colWidths.customer + colWidths.total, currentY);
        doc.text('Status', 50 + colWidths.code + colWidths.date + colWidths.customer + colWidths.total + colWidths.payment, currentY);
        
        currentY += 20;
        doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
        currentY += 10;
        
        // Draw table rows
        doc.font('Helvetica');
        
        // Page setup
        const itemsPerPage = 20;
        let itemCount = 0;
        
        transactions.forEach((transaction, index) => {
          // Check if we need a new page
          if (itemCount === itemsPerPage) {
            doc.addPage();
            currentY = 50;
            itemCount = 0;
          }
          
          const date = new Date(transaction.createdAt);
          const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
          
          doc.text(transaction.transactionCode, 50, currentY);
          doc.text(dateStr, 50 + colWidths.code, currentY);
          doc.text(transaction.customerName || 'N/A', 50 + colWidths.code + colWidths.date, currentY);
          doc.text(transaction.grandTotal.toLocaleString(), 50 + colWidths.code + colWidths.date + colWidths.customer, currentY);
          doc.text(transaction.paymentMethod.replace('_', ' '), 50 + colWidths.code + colWidths.date + colWidths.customer + colWidths.total, currentY);
          doc.text(transaction.isVoided ? 'Voided' : 'Completed', 50 + colWidths.code + colWidths.date + colWidths.customer + colWidths.total + colWidths.payment, currentY);
          
          currentY += 20;
          itemCount++;
          
          // Add a separator line except for the last item
          if (index < transactions.length - 1) {
            doc.moveTo(50, currentY - 10).lineTo(550, currentY - 10).stroke({ opacity: 0.2 });
          }
        });
        
        // Footer
        doc.fontSize(8).text(`Report Generated On: ${new Date().toLocaleString()}`, 50, doc.page.height - 50, { align: 'center' });
        
        // Finalize the PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}