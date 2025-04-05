import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection, EntityManager } from 'typeorm';
import { Transaction, PaymentStatus } from './entities/transaction.entity';
import { TransactionItem } from './entities/transaction-item.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ProductService } from '../product/product.service';
import { PromotionService } from '../promotion/promotion.service';
import { Product } from '../product/entities/product.entity';
import { generateTransactionCode } from './utils/code-generator';

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
    private connection: Connection
  ) {}

  async findAll(): Promise<Transaction[]> {
    return this.transactionRepository.find({
      relations: ['items', 'user'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'user']
    });
    
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    
    return transaction;
  }

  async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    // Use transaction to ensure data consistency
    return this.connection.transaction(async (manager: EntityManager) => {
      // 1. Verify all products exist and have sufficient stock
      const productIds = createTransactionDto.items.map(item => item.productId);
      const products = await manager.findByIds(Product, productIds);
      
      if (products.length !== productIds.length) {
        throw new BadRequestException('Some products do not exist');
      }
      
      const productMap = new Map<number, Product>();
      products.forEach(product => productMap.set(product.id, product));
      
      // 2. Check stock and calculate initial totals
      let subtotal = 0;
      const transactionItems: Partial<TransactionItem>[] = [];
      
      for (const item of createTransactionDto.items) {
        const product = productMap.get(item.productId);
        
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for product: ${product.name}`);
        }
        
        const itemSubtotal = parseFloat((product.sellingPrice * item.quantity).toFixed(2));
        const discountAmount = item.discountAmount || 0;
        
        subtotal += itemSubtotal;
        
        transactionItems.push({
          productId: product.id,
          productName: product.name,
          productPrice: product.sellingPrice,
          quantity: item.quantity,
          subtotal: itemSubtotal,
          discountAmount: discountAmount,
          total: itemSubtotal - discountAmount
        });
      }
      
      // 3. Apply promotion if provided
      let discountAmount = 0;
      if (createTransactionDto.promotionId) {
        try {
          const promotion = await this.promotionService.findOne(createTransactionDto.promotionId);
          
          // Apply promotion rules - this would need to be implemented based on your promotion rules
          // This is a simplified example
          if (promotion.status === 'active' && new Date() >= promotion.startDate && new Date() <= promotion.endDate) {
            if (promotion.type === 'percentage_discount') {
              const percentage = promotion.configuration.percentage || 0;
              discountAmount = subtotal * (percentage / 100);
            } else if (promotion.type === 'fixed_amount') {
              discountAmount = promotion.configuration.amount || 0;
            }
          }
        } catch (error) {
          // If promotion not found or invalid, continue without discount
          console.error('Error applying promotion:', error);
        }
      }
      
      // 4. Calculate tax (example: 10% tax)
      const taxRate = 0.1; // This could be configurable
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = parseFloat((taxableAmount * taxRate).toFixed(2));
      
      // 5. Calculate grand total
      const grandTotal = parseFloat((taxableAmount + taxAmount).toFixed(2));
      
      // 6. Create transaction
      const transaction = manager.create(Transaction, {
        transactionCode: generateTransactionCode(),
        userId: createTransactionDto.userId,
        customerName: createTransactionDto.customerName,
        customerPhone: createTransactionDto.customerPhone,
        customerEmail: createTransactionDto.customerEmail,
        subtotal,
        discountAmount,
        taxAmount,
        grandTotal,
        paymentMethod: createTransactionDto.paymentMethod,
        paymentReference: createTransactionDto.paymentReference,
        promotionId: createTransactionDto.promotionId,
        note: createTransactionDto.note,
      });
      
      const savedTransaction = await manager.save(transaction);
      
      // 7. Create transaction items
      const items = transactionItems.map(item => manager.create(TransactionItem, {
        ...item,
        transactionId: savedTransaction.id
      }));
      
      await manager.save(items);
      
      // 8. Update product stock
      for (const item of createTransactionDto.items) {
        const product = productMap.get(item.productId);
        await manager.update(Product, product.id, {
          stock: product.stock - item.quantity
        });
      }
      
      // 9. Return transaction with items
      return {
        ...savedTransaction,
        items: items as TransactionItem[]
      };
    });
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
}
