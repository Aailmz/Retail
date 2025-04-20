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

  async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    // Use transaction to ensure data consistency
    return this.connection.transaction(async (manager: EntityManager) => {
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
        promotionId: createTransactionDto.promotionId,
        note: createTransactionDto.note,
      });
      
      const savedTransaction = await manager.save(transaction);
      
      const items = transactionItems.map(item => manager.create(TransactionItem, {
        ...item,
        transactionId: savedTransaction.id
      }));
      
      await manager.save(items);
      
      for (const item of createTransactionDto.items) {
        const product = productMap.get(item.productId);
        await manager.update(Product, product.id, {
          stock: product.stock - item.quantity
        });
      }

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
