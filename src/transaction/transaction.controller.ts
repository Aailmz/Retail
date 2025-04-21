import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Render, Res, Req, Query } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ProductService } from '../product/product.service';
import { Request, Response } from 'express';

@Controller('transactions')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly productService: ProductService
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'kasir')
  @Render('transactions/index')
  async findAll(
    @Req() req: Request,
    @Query('search') search: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    // Build filter options
    const filterOptions: any = {};
    
    if (search) {
      filterOptions.search = search;
    }
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filterOptions.dateRange = { start, end };
    }
    
    const transactions = await this.transactionService.findAllWithFilters(filterOptions);
    
    // Get flash messages
    const successMessage = req.flash('success');
    const errorMessage = req.flash('error');
    
    // Create notification object if there are messages
    let notification = null;
    if (successMessage && successMessage.length > 0) {
      notification = { type: 'success', message: successMessage[0] };
    } else if (errorMessage && errorMessage.length > 0) {
      notification = { type: 'danger', message: errorMessage[0] };
    }
    
    return { 
      title: 'Transaction List',
      transactions: transactions,
      user: req.user,
      isActivePage: { transactions: true },
      notification: notification,
      filters: {
        search: search || '',
        startDate: startDate || '',
        endDate: endDate || ''
      }
    };
  }

  @Get('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'kasir')
  @Render('transactions/create')
  async showCreateForm(@Req() req: Request) {
    const products = await this.productService.findAll();
    
    return { 
      title: 'Create Transaction',
      products: products,
      user: req.user,
      isActivePage: { transactions: true }
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'kasir')
  async create(@Body() createTransactionDto: CreateTransactionDto, @Res() res: Response, @Req() req: Request) {
    try {
      const transaction = await this.transactionService.create(createTransactionDto);
      req.flash('success', `Transaction #${transaction.transactionCode} created successfully!`);
      return res.redirect(`/transactions/${transaction.id}`);
    } catch (error) {
      req.flash('error', 'Failed to create transaction: ' + error.message);
      return res.redirect('/transactions/create');
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'kasir')
  @Render('transactions/show')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const transaction = await this.transactionService.findOne(+id);
    
    return { 
      title: `Transaction #${transaction.transactionCode}`,
      transaction: transaction,
      user: req.user,
      isActivePage: { transactions: true }
    };
  }

  @Post(':id/void')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async voidTransaction(
    @Param('id') id: string, 
    @Body('reason') reason: string, 
    @Res() res: Response, 
    @Req() req: Request
  ) {
    try {
      await this.transactionService.voidTransaction(+id, reason);
      req.flash('success', 'Transaction voided successfully');
      return res.redirect(`/transactions/${id}`);
    } catch (error) {
      req.flash('error', 'Failed to void transaction: ' + error.message);
      return res.redirect(`/transactions/${id}`);
    }
  }

  @Get('receipt/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'kasir')
  @Render('transactions/receipt')
  async generateReceipt(@Param('id') id: string) {
    const transaction = await this.transactionService.findOne(+id);
    
    return {
      title: `Receipt #${transaction.transactionCode}`,
      transaction: transaction,
      layout: 'print' // Use a different layout without menus for printing
    };
  }

  @Get('reports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Render('transactions/reports')
  
  async showReports(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: Request
  ) {
    let transactions = [];
    let reportData = null;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      transactions = await this.transactionService.getTransactionsByDateRange(start, end);
      
      // Calculate report data
      let totalSales = 0;
      let totalItems = 0;
      const productSales = {};
      
      transactions.forEach(transaction => {
        if (!transaction.isVoided) {
          totalSales += transaction.grandTotal;
          
          transaction.items.forEach(item => {
            totalItems += item.quantity;
            
            if (!productSales[item.productId]) {
              productSales[item.productId] = {
                name: item.productName,
                quantity: 0,
                total: 0
              };
            }
            
            productSales[item.productId].quantity += item.quantity;
            productSales[item.productId].total += item.total;
          });
        }
      });
      
      reportData = {
        totalSales,
        totalItems,
      };
    }
    
    return {
      title: 'Sales Reports',
      user: req.user,
      isActivePage: { reports: true },
      transactions,
      reportData,
      startDate,
      endDate
    };
  }
}