import { Controller, Get, UseGuards, Request, Render, Post, Body, Res, Req, Redirect, NotFoundException   } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AuthService } from './auth/auth.service';
import { ProductService } from './product/product.service';
import { UsersService } from "./users/users.service";
import { CategoryService } from './category/category.service';
import { MemberService } from './member/member.service';
import { PromotionService } from './promotion/promotion.service';
import { TransactionService } from './transaction/transaction.service';

@Controller()
export class AppController {
  constructor(
    private authService: AuthService,
    private productService: ProductService,
    private categoryService: CategoryService,
    private usersService: UsersService,
    private memberService: MemberService,
    private promotionService: PromotionService,
    private transactionService: TransactionService
  ) {}

  // Halaman home (root endpoint /)
  @Get()
  @Render('home')
  getHome() {
    return { title: 'Welcome to Our App' };
  }

  // Halaman login
  @Get('login')
  @Render('login')
  getLogin() {
    return { title: 'Login Page', message: '' };
  }

  // Handle login submission
  @Post('login')
  async postLogin(@Body() body, @Res() res) {
    try {
      const { username, password } = body;
      const result = await this.authService.validateUser(username, password);
      
      if (result) {
        const token = await this.authService.login(result);
        // Simpan token di cookie atau session
        res.cookie('jwt', token.access_token, { httpOnly: true });
        return res.redirect('/dashboard');
      } else {
        return res.render('login', { 
          title: 'Login Page', 
          message: 'Username or password incorrect' 
        });
      }
    } catch (error) {
      return res.render('login', { 
        title: 'Login Page', 
        message: 'An error occurred' 
      });
    }
  }

  @Get('/dashboard')
  @UseGuards(JwtAuthGuard)
  @Render('dashboard')
  async getDashboard(@Request() req) {
    try {
      // Get transaction statistics
      const stats = await this.transactionService.getTransactionStats();
      
      // Get recent transactions (limit to 5)
      const recentTransactions = await this.transactionService.findAll();
      const latestTransactions = recentTransactions.slice(0, 5);
      
      // Get today's date
      const today = new Date();
      const startOfToday = new Date(today.setHours(0, 0, 0, 0));
      const endOfToday = new Date(new Date().setHours(23, 59, 59, 999));
      
      // Get products with low stock (assuming a method exists or create one)
      const lowStockCount = await this.productService.getLowStockCount();
      
      // Get active members count
      const activeMembers = await this.memberService.countActiveMembers();
      
      // Get flash messages
      const successMessage = req.flash ? req.flash('success') : null;
      const errorMessage = req.flash ? req.flash('error') : null;
      
      // Create notification object if there are messages
      let notification = null;
      if (successMessage && successMessage.length > 0) {
        notification = { type: 'success', message: successMessage[0] };
      } else if (errorMessage && errorMessage.length > 0) {
        notification = { type: 'danger', message: errorMessage[0] };
      }
      
      // Get payment method breakdown
      const paymentMethodData = await this.getPaymentMethodBreakdown();
      
      return { 
        title: 'Dashboard',
        user: req.user,
        isActivePage: { dashboard: true },
        // Stats
        todaySales: stats.today.total.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
        totalTransactions: stats.today.count,
        lowStockItems: lowStockCount || 0,
        activeMembers: activeMembers || 0,
        // Trends (this could be calculated from historical data)
        salesPercentChange: 8.5,
        transactionPercentChange: 12.3,
        lowStockPercentChange: 2.7,
        memberPercentChange: 3.8,
        // Recent transactions for display
        recentTransactions: latestTransactions,
        // Payment method data for chart
        paymentMethodData: paymentMethodData.join(','),
        // Notification if any
        notification
      };
    } catch (error) {
      console.error('Dashboard data error:', error);
      return { 
        title: 'Dashboard',
        user: req.user,
        isActivePage: { dashboard: true },
        error: 'Unable to load dashboard data'
      };
    }
  }

  // Helper method to get payment method breakdown
  private async getPaymentMethodBreakdown(): Promise<number[]> {
    try {
      // In a real app, you'd query this from your database
      // For now, we'll return mock data
      const transactions = await this.transactionService.findAll();
      
      // Initialize counts for each payment method
      let cashCount = 0;
      let creditCardCount = 0;
      let debitCardCount = 0;
      let bankTransferCount = 0;
      let digitalWalletCount = 0;
      
      // Count transactions by payment method
      transactions.forEach(transaction => {
        if (transaction.isVoided) return;
        
        switch (transaction.paymentMethod) {
          case 'cash':
            cashCount++;
            break;
          case 'credit_card':
            creditCardCount++;
            break;
          case 'debit_card':
            debitCardCount++;
            break;
          case 'bank_transfer':
            bankTransferCount++;
            break;
          case 'digital_wallet':
            digitalWalletCount++;
            break;
        }
      });
      
      return [cashCount, creditCardCount, debitCardCount, bankTransferCount, digitalWalletCount];
    } catch (error) {
      console.error('Error fetching payment method breakdown:', error);
      return [40, 25, 15, 10, 10]; // Fallback data
    }
  }

  @Get('product')
  @UseGuards(JwtAuthGuard)
  @Redirect('/products')
  redirectToProducts() {
    return;
  }

  @Get('member')
  @UseGuards(JwtAuthGuard)
  @Redirect('/members')
  redirectToMembers() {
    return;
  }

  @Get('user')
  @UseGuards(JwtAuthGuard)
  @Redirect('/users')
  redirectToUsers() {
    return;
  }

  @Get('promotion')
  @UseGuards(JwtAuthGuard)
  @Redirect('/promotions')
  redirectToPromotion() {
    return;
  }

  @Get('transaction')
  @UseGuards(JwtAuthGuard)
  @Redirect('/transactions')
  redirectToTransactions() {
    return;
  }

  @Get('category')
  @Render('categories')
  async getCategory(@Request() req) {
    const category = await this.categoryService.findAll();
    
    return { 
      title: 'Categories',
      user: req.user,
      isActivePage: {
        products: true
      },
      category: category
    };
  }

  @Get('pos')
  @UseGuards(JwtAuthGuard)
  @Render('transactions/point-of-sale')
  async showPOS(@Request() req) {
    const products = await this.productService.findAll();
    
    return { 
      title: 'Point of Sale',
      products: products,
      isActivePage: { pos: true },
      user: req.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @Render('profile')
  getProfile(@Request() req) {
    return { user: req.user };
  }
}