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
  getDashboard(@Request() req) {
    return { 
      title: 'Dashboard',
      user: req.user,
      isActivePage: {
        dashboard: true
      }
    };
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