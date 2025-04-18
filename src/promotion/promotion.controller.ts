import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Render, Res, Req, NotFoundException } from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Request, Response } from 'express';
import { ProductService } from '../product/product.service';

@Controller('promotions')
export class PromotionController {
  constructor(
    private readonly promotionService: PromotionService,
    private readonly productService: ProductService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Render('promotions/index')
  async findAll(@Req() req: Request) {
    const promotions = await this.promotionService.findAll();
    
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
      title: 'Promotion List',
      promotions: promotions,
      user: req.user,
      isActivePage: { promotions: true },
      notification: notification
    };
  }

  @Get('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Render('promotions/create')
  async showCreateForm(@Req() req: Request) {
    // Get all products for the product selection
    const products = await this.productService.findAll();
    
    // Get error messages if redirected from failed creation
    const errorMessage = req.flash('error');
    let notification = null;
    if (errorMessage && errorMessage.length > 0) {
      notification = { type: 'danger', message: errorMessage[0] };
    }
    
    return { 
      title: 'Create Promotion',
      user: req.user,
      isActivePage: { promotions: true },
      notification: notification,
      promotionTypes: ['buy_x_get_y', 'discount_percentage', 'bundle'],
      statusOptions: ['active', 'inactive', 'scheduled', 'expired'],
      products: products
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() createPromotionDto: CreatePromotionDto, @Res() res: Response, @Req() req: Request) {
    try {
      // Parse JSON strings if they're submitted as strings
      if (typeof createPromotionDto.rules === 'string') {
        createPromotionDto.rules = JSON.parse(createPromotionDto.rules);
      }
      if (typeof createPromotionDto.configuration === 'string') {
        createPromotionDto.configuration = JSON.parse(createPromotionDto.configuration);
      }
      
      await this.promotionService.create(createPromotionDto);
      req.flash('success', 'Promotion created successfully!');
      return res.redirect('/promotions');
    } catch (error) {
      req.flash('error', 'Failed to create promotion: ' + error.message);
      return res.redirect('/promotions/create');
    }
  }

  @Get('active')
  async findActive(@Res() res: Response) {
    try {
      const activePromotions = await this.promotionService.findAll();
      return res.status(200).json({
        success: true,
        data: activePromotions
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Render('promotions/show')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    if (isNaN(+id)) {
      throw new NotFoundException('Invalid promotion ID');
    }
    const promotion = await this.promotionService.findOne(+id);
    
    return { 
      title: 'Promotion Details',
      promotion: promotion,
      user: req.user,
      isActivePage: { promotions: true }
    };
  }

  @Get(':id/edit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Render('promotions/edit')
  async showEditForm(@Param('id') id: string, @Req() req: Request) {
    const promotion = await this.promotionService.findOne(+id);
    const products = await this.productService.findAll();
    
    // Get error messages if redirected from failed update
    const errorMessage = req.flash('error');
    let notification = null;
    if (errorMessage && errorMessage.length > 0) {
      notification = { type: 'danger', message: errorMessage[0] };
    }
    
    return { 
      title: 'Edit Promotion',
      promotion: promotion,
      products: products,
      user: req.user,
      isActivePage: { promotions: true },
      notification: notification,
      promotionTypes: ['buy_x_get_y', 'discount_percentage', 'bundle'],
      statusOptions: ['active', 'inactive', 'scheduled', 'expired']
    };
  }

  @Post(':id/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() updatePromotionDto: UpdatePromotionDto, @Res() res: Response, @Req() req: Request) {
    try {
      // Parse JSON strings if they're submitted as strings
      if (typeof updatePromotionDto.rules === 'string') {
        updatePromotionDto.rules = JSON.parse(updatePromotionDto.rules);
      }
      if (typeof updatePromotionDto.configuration === 'string') {
        updatePromotionDto.configuration = JSON.parse(updatePromotionDto.configuration);
      }
      
      await this.promotionService.update(+id, updatePromotionDto);
      req.flash('success', 'Promotion updated successfully!');
      return res.redirect('/promotions');
    } catch (error) {
      req.flash('error', 'Failed to update promotion: ' + error.message);
      return res.redirect(`/promotions/${id}/edit`);
    }
  }

  @Post(':id/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string, @Res() res: Response, @Req() req: Request) {
    try {
      await this.promotionService.remove(+id);
      req.flash('success', 'Promotion deleted successfully!');
      return res.redirect('/promotions');
    } catch (error) {
      req.flash('error', 'Failed to delete promotion: ' + error.message);
      return res.redirect('/promotions');
    }
  }
  
  @Post('calculate-markup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async calculateMarkup(@Body() data: { discountRate: number }, @Res() res: Response) {
    try {
      const markup = await this.promotionService.calculateMarkup(data.discountRate);
      return res.json({ success: true, markup: markup });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }
}