import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Render, Res, Req } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CategoryService } from '../category/category.service';

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService
  ) {}

  @Get()
  @Render('products/index')
  async findAll() {
    const products = await this.productService.findAll();
    return { 
      title: 'Product List',
      products: products,
      user: { username: 'Admin' },
      isActivePage: { products: true }
    };
  }

  @Get('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Render('products/create')
  async showCreateForm() {
    const categories = await this.categoryService.findAll();
    return { 
      title: 'Create Product',
      categories: categories,
      user: { username: 'Admin' },
      isActivePage: { products: true }
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() createProductDto: CreateProductDto, @Res() res) {
    await this.productService.create(createProductDto);
    return res.redirect('/products');
  }

  @Get(':id')
  @Render('products/show')
  async findOne(@Param('id') id: string) {
    const product = await this.productService.findOne(+id);
    return { 
      title: 'Product Details',
      product: product,
      user: { username: 'Admin' },
      isActivePage: { products: true }
    };
  }

  @Get(':id/edit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Render('products/edit')
  async showEditForm(@Param('id') id: string) {
    const product = await this.productService.findOne(+id);
    const categories = await this.categoryService.findAll();
    return { 
      title: 'Edit Product',
      product: product,
      categories: categories,
      user: { username: 'Admin' },
      isActivePage: { products: true }
    };
  }

  @Post(':id/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @Res() res) {
    await this.productService.update(+id, updateProductDto);
    return res.redirect('/products');
  }

  @Post(':id/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string, @Res() res) {
    await this.productService.remove(+id);
    return res.redirect('/products');
  }
}