import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Render, Res } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Render('categories/index')
  async findAll() {
    const categories = await this.categoryService.findAll();
    return { 
      title: 'Category List',
      categories: categories,
      user: { username: 'Admin' },
      isActivePage: { categories: true }
    };
  }

  @Get('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Render('categories/create')
  showCreateForm() {
    return { 
      title: 'Create Category',
      user: { username: 'Admin' },
      isActivePage: { categories: true }
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() createCategoryDto: CreateCategoryDto, @Res() res) {
    await this.categoryService.create(createCategoryDto);
    return res.redirect('/categories');
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
  async showEditForm(@Param('id') id: string) {
    const category = await this.categoryService.findOne(+id);
    return { 
      title: 'Edit Category',
      category: category,
      user: { username: 'Admin' },
      isActivePage: { categories: true }
    };
  }

  @Post(':id/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto, @Res() res) {
    await this.categoryService.update(+id, updateCategoryDto);
    return res.redirect('/categories');
  }

  @Post(':id/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string, @Res() res) {
    await this.categoryService.remove(+id);
    return res.redirect('/categories');
  }
}