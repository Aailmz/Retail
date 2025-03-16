import { Controller, Get, UseGuards, Request, Render, Post, Body, Res, Req } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AuthService } from './auth/auth.service';
import { ProductService } from './product/product.service';

@Controller()
export class AppController {
  constructor(
    private authService: AuthService,
    private productService: ProductService
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
        return res.redirect('/product');
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
  @Render('dashboard')
  getDashboard() {
    return { 
      title: 'Dashboard',
      user: { username: 'Admin' },
      isActivePage: {
        dashboard: true
      }
    };
  }

  @Get('product')
  @Render('products')
  async getProducts() {
    const products = await this.productService.findAll();
    
    return { 
      title: 'Products',
      user: { username: 'Admin' },
      isActivePage: {
        products: true
      },
      products: products
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @Render('profile')
  getProfile(@Request() req) {
    return { user: req.user };
  }
}