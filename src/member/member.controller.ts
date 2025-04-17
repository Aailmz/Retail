import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Render, Res, Req } from '@nestjs/common';
import { MemberService } from './member.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Request, Response } from 'express';

@Controller('members')
export class MemberController {
  constructor(
    private readonly memberService: MemberService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Render('members/index')
  async findAll(@Req() req: Request) {
    const members = await this.memberService.findAll();
    
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
      title: 'Member List',
      members: members,
      user: req.user,
      isActivePage: { members: true },
      notification: notification
    };
  }

  @Get('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Render('members/create')
  showCreateForm(@Req() req: Request) {
    // Get error messages if redirected from failed creation
    const errorMessage = req.flash('error');
    let notification = null;
    if (errorMessage && errorMessage.length > 0) {
      notification = { type: 'danger', message: errorMessage[0] };
    }
    
    return { 
      title: 'Create Member',
      user: req.user,
      isActivePage: { members: true },
      notification: notification
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() createMemberDto: CreateMemberDto, @Res() res: Response, @Req() req: Request) {
    try {
      await this.memberService.create(createMemberDto);
      req.flash('success', 'Member created successfully!');
      return res.redirect('/members');
    } catch (error) {
      req.flash('error', 'Failed to create member: ' + error.message);
      return res.redirect('/members/create');
    }
  }

  @Get(':id')
  @Render('members/show')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const member = await this.memberService.findOne(+id);
    return { 
      title: 'Member Details',
      member: member,
      user: req.user,
      isActivePage: { members: true }
    };
  }

  @Get(':id/edit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Render('members/edit')
  async showEditForm(@Param('id') id: string, @Req() req: Request) {
    const member = await this.memberService.findOne(+id);
    
    // Get error messages if redirected from failed update
    const errorMessage = req.flash('error');
    let notification = null;
    if (errorMessage && errorMessage.length > 0) {
      notification = { type: 'danger', message: errorMessage[0] };
    }
    
    return { 
      title: 'Edit Member',
      member: member,
      user: req.user,
      isActivePage: { members: true },
      notification: notification
    };
  }

  @Post(':id/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() updateMemberDto: UpdateMemberDto, @Res() res: Response, @Req() req: Request) {
    try {
      await this.memberService.update(+id, updateMemberDto);
      req.flash('success', 'Member updated successfully!');
      return res.redirect('/members');
    } catch (error) {
      req.flash('error', 'Failed to update member: ' + error.message);
      return res.redirect(`/members/${id}/edit`);
    }
  }

  @Post(':id/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string, @Res() res: Response, @Req() req: Request) {
    try {
      await this.memberService.remove(+id);
      req.flash('success', 'Member deleted successfully!');
      return res.redirect('/members');
    } catch (error) {
      req.flash('error', 'Failed to delete member: ' + error.message);
      return res.redirect('/members');
    }
  }
}