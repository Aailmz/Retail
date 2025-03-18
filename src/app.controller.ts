import { Controller, Get, UseGuards, Request, Render, Post, Body, Res, Req, Redirect  } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AuthService } from './auth/auth.service';
import { ProductService } from './product/product.service';
import { CategoryService } from './category/category.service';
import { MemberService } from './member/member.service';

@Controller()
export class AppController {
  constructor(
    private authService: AuthService,
    private productService: ProductService,
    private categoryService: CategoryService,
    private memberService: MemberService
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

  @Get('category')
  @Render('categories')
  async getCategory() {
    const category = await this.categoryService.findAll();
    
    return { 
      title: 'Categories',
      user: { username: 'Admin' },
      isActivePage: {
        products: true
      },
      category: category
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @Render('profile')
  getProfile(@Request() req) {
    return { user: req.user };
  }
}