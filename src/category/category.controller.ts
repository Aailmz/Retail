import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Render, Res, Req } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Request, Response } from 'express';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Render('categories/index')
  async findAll(@Req() req: Request) {
    const categories = await this.categoryService.findAll();
    
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
      title: 'Category List',
      categories: categories,
      user: { username: 'Admin' },
      isActivePage: { categories: true },
      notification: notification
    };
  }

  @Get('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Render('categories/create')
  showCreateForm(@Req() req: Request) {
    // Get error messages if redirected from failed creation
    const errorMessage = req.flash('error');
    let notification = null;
    if (errorMessage && errorMessage.length > 0) {
      notification = { type: 'danger', message: errorMessage[0] };
    }
    
    return { 
      title: 'Create Category',
      user: { username: 'Admin' },
      isActivePage: { categories: true },
      notification: notification
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() createCategoryDto: CreateCategoryDto, @Res() res: Response, @Req() req: Request) {
    try {
      await this.categoryService.create(createCategoryDto);
      req.flash('success', 'Category created successfully!');
      return res.redirect('/categories');
    } catch (error) {
      req.flash('error', 'Failed to create category: ' + error.message);
      return res.redirect('/categories/create');
    }
  }

  @Get(':id')
  @Render('categories/show')
  async findOne(@Param('id') id: string) {
    const category = await this.categoryService.findOne(+id);
    return { 
      title: 'Category Details',
      category: category,
      user: { username: 'Admin' },
      isActivePage: { categories: true }
    };
  }

  @Get(':id/edit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Render('categories/edit')
  async showEditForm(@Param('id') id: string, @Req() req: Request) {
    const category = await this.categoryService.findOne(+id);
    
    // Get error messages if redirected from failed update
    const errorMessage = req.flash('error');
    let notification = null;
    if (errorMessage && errorMessage.length > 0) {
      notification = { type: 'danger', message: errorMessage[0] };
    }
    
    return { 
      title: 'Edit Category',
      category: category,
      user: req.user,
      isActivePage: { categories: true },
      notification: notification
    };
  }

  @Post(':id/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto, @Res() res: Response, @Req() req: Request) {
    try {
      await this.categoryService.update(+id, updateCategoryDto);
      req.flash('success', 'Category updated successfully!');
      return res.redirect('/categories');
    } catch (error) {
      req.flash('error', 'Failed to update category: ' + error.message);
      return res.redirect(`/categories/${id}/edit`);
    }
  }

  @Post(':id/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string, @Res() res: Response, @Req() req: Request) {
    try {
      await this.categoryService.remove(+id);
      req.flash('success', 'Category deleted successfully!');
      return res.redirect('/categories');
    } catch (error) {
      req.flash('error', 'Failed to delete category: ' + error.message);
      return res.redirect('/categories');
    }
  }
}