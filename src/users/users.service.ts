import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Keep your existing methods
  async findOne(username: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findById(id: number): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async createUser(userData: CreateUserDto): Promise<User> {
    // Check if username already exists
    const existingUser = await this.findOne(userData.username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create new user
    const newUser = this.usersRepository.create({
      username: userData.username,
      password: hashedPassword,
      fullName: userData.fullName,
      role: userData.role || 'user',
      isActive: userData.isActive !== undefined ? userData.isActive : true
    });

    return this.usersRepository.save(newUser);
  }

  // Add methods needed for the CRUD operations
  async findAllUsers(): Promise<User[]> {
    const users = await this.usersRepository.find();
    // Don't return passwords
    return users.map(user => {
      const { password, ...result } = user;
      return result as User;
    });
  }

  async searchUsers(query: string): Promise<User[]> {
    const users = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.username LIKE :query OR user.fullName LIKE :query', { query: `%${query}%` })
      .getMany();
      
    // Don't return passwords
    return users.map(user => {
      const { password, ...result } = user;
      return result as User;
    });
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    
    // Check if username is being changed and if it already exists
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.findOne(updateUserDto.username);
      if (existingUser) {
        throw new ConflictException('Username already exists');
      }
    }

    // If password is being updated, hash it
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Update user
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async deleteUser(id: number): Promise<void> {
    const user = await this.findById(id);
    await this.usersRepository.remove(user);
  }
}