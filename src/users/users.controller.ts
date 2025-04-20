import { Controller, Get, Post, Body, Param, Delete, UseGuards, Render, Res, Req, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Request, Response } from 'express';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Render('users/index')
  async findAll(@Req() req: Request) {
    // Get all users but exclude passwords
    const users = await this.usersService.findAllUsers();
    
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
      title: 'User List',
      users: users,
      user: req.user,
      isActivePage: { users: true },
      notification: notification
    };
  }

  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async searchUsers(@Query('q') query: string, @Req() req: Request) {
    if (!query) {
      return [];
    }
    const users = await this.usersService.searchUsers(query);
    return users;
  }

  @Get('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Render('users/create')
  showCreateForm(@Req() req: Request) {
    // Get error messages if redirected from failed creation
    const errorMessage = req.flash('error');
    let notification = null;
    if (errorMessage && errorMessage.length > 0) {
      notification = { type: 'danger', message: errorMessage[0] };
    }
    
    return { 
      title: 'Create User',
      user: req.user,
      isActivePage: { users: true },
      notification: notification
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() createUserDto: CreateUserDto, @Res() res: Response, @Req() req: Request) {
    try {
      await this.usersService.createUser(createUserDto);
      req.flash('success', 'User created successfully!');
      return res.redirect('/users');
    } catch (error) {
      req.flash('error', 'Failed to create user: ' + error.message);
      return res.redirect('/users/create');
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Render('users/show')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const user = await this.usersService.findById(+id);
    return { 
      title: 'User Details',
      userDetails: user,
      user: req.user,
      isActivePage: { users: true }
    };
  }

  @Get(':id/edit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Render('users/edit')
  async showEditForm(@Param('id') id: string, @Req() req: Request) {
    const user = await this.usersService.findById(+id);
    
    // Get error messages if redirected from failed update
    const errorMessage = req.flash('error');
    let notification = null;
    if (errorMessage && errorMessage.length > 0) {
      notification = { type: 'danger', message: errorMessage[0] };
    }
    
    return { 
      title: 'Edit User',
      userDetails: user,
      user: req.user,
      isActivePage: { users: true },
      notification: notification
    };
  }

  @Post(':id/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Res() res: Response, @Req() req: Request) {
    try {
      await this.usersService.updateUser(+id, updateUserDto);
      req.flash('success', 'User updated successfully!');
      return res.redirect('/users');
    } catch (error) {
      req.flash('error', 'Failed to update user: ' + error.message);
      return res.redirect(`/users/${id}/edit`);
    }
  }

  @Post(':id/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string, @Res() res: Response, @Req() req: Request) {
    try {
      await this.usersService.deleteUser(+id);
      req.flash('success', 'User deleted successfully!');
      return res.redirect('/users');
    } catch (error) {
      req.flash('error', 'Failed to delete user: ' + error.message);
      return res.redirect('/users');
    }
  }
}