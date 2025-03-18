import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Render, Res, Req } from '@nestjs/common';
import { MemberService } from './member.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('members')
export class MemberController {
  constructor(
    private readonly memberService: MemberService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Render('members/index')
  async findAll() {
    const members = await this.memberService.findAll();
    return { 
      title: 'Member List',
      members: members,
      user: { username: 'Admin' },
      isActivePage: { members: true }
    };
  }

  @Get('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Render('members/create')
  showCreateForm() {
    return { 
      title: 'Create Member',
      user: { username: 'Admin' },
      isActivePage: { members: true }
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() createMemberDto: CreateMemberDto, @Res() res) {
    await this.memberService.create(createMemberDto);
    return res.redirect('/members');
  }

  @Get(':id')
  @Render('members/show')
  async findOne(@Param('id') id: string) {
    const member = await this.memberService.findOne(+id);
    return { 
      title: 'Member Details',
      member: member,
      user: { username: 'Admin' },
      isActivePage: { members: true }
    };
  }

  @Get(':id/edit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Render('members/edit')
  async showEditForm(@Param('id') id: string) {
    const member = await this.memberService.findOne(+id);
    return { 
      title: 'Edit Member',
      member: member,
      user: { username: 'Admin' },
      isActivePage: { members: true }
    };
  }

  @Post(':id/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() updateMemberDto: UpdateMemberDto, @Res() res) {
    await this.memberService.update(+id, updateMemberDto);
    return res.redirect('/members');
  }

  @Post(':id/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string, @Res() res) {
    await this.memberService.remove(+id);
    return res.redirect('/members');
  }
}