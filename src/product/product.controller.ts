import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Render, Res, Req } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CategoryService } from '../category/category.service';
import { Request, Response } from 'express';

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly categoryService: CategoryService
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'gudang')
  @Render('products/index')
  async findAll(@Req() req: Request) {
    const products = await this.productService.findAll();
    
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
      title: 'Product List',
      products: products,
      user: req.user,
      isActivePage: { products: true },
      notification: notification
    };
  }

  @Get('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'gudang')
  @Render('products/create')
  async showCreateForm(@Req() req: Request) {
    const categories = await this.categoryService.findAll();
    
    // Get error messages if redirected from failed creation
    const errorMessage = req.flash('error');
    let notification = null;
    if (errorMessage && errorMessage.length > 0) {
      notification = { type: 'danger', message: errorMessage[0] };
    }
    
    return { 
      title: 'Create Product',
      categories: categories,
      user: req.user,
      isActivePage: { products: true },
      notification: notification
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'gudang')
  async create(@Body() createProductDto: CreateProductDto, @Res() res: Response, @Req() req: Request) {
    try {
      await this.productService.create(createProductDto);
      req.flash('success', 'Product created successfully!');
      return res.redirect('/products');
    } catch (error) {
      req.flash('error', 'Failed to create product: ' + error.message);
      return res.redirect('/products/create');
    }
  }

  @Get(':id')
  @Render('products/show')
  @Roles('admin', 'gudang')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const product = await this.productService.findOne(+id);
    return { 
      title: 'Product Details',
      product: product,
      user: req.user,
      isActivePage: { products: true }
    };
  }

  @Get(':id/edit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'gudang')
  @Render('products/edit')
  async showEditForm(@Param('id') id: string, @Req() req: Request) {
    const product = await this.productService.findOne(+id);
    const categories = await this.categoryService.findAll();
    
    // Get error messages if redirected from failed update
    const errorMessage = req.flash('error');
    let notification = null;
    if (errorMessage && errorMessage.length > 0) {
      notification = { type: 'danger', message: errorMessage[0] };
    }
    
    return { 
      title: 'Edit Product',
      product: product,
      categories: categories,
      user: req.user,
      isActivePage: { products: true },
      notification: notification
    };
  }

  @Post(':id/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'gudang')
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @Res() res: Response, @Req() req: Request) {
    try {
      await this.productService.update(+id, updateProductDto);
      req.flash('success', 'Product updated successfully!');
      return res.redirect('/products');
    } catch (error) {
      req.flash('error', 'Failed to update product: ' + error.message);
      return res.redirect(`/products/${id}/edit`);
    }
  }

  @Post(':id/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'gudang')
  async remove(@Param('id') id: string, @Res() res: Response, @Req() req: Request) {
    try {
      await this.productService.remove(+id);
      req.flash('success', 'Product deleted successfully!');
      return res.redirect('/products');
    } catch (error) {
      req.flash('error', 'Failed to delete product: ' + error.message);
      return res.redirect('/products');
    }
  }
}