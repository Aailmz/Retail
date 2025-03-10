import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOne(username: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findById(id: number): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async createUser(userData: { username: string; password: string; fullName?: string }): Promise<User> {
    // Cek apakah username sudah ada
    const existingUser = await this.findOne(userData.username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Buat user baru
    const newUser = this.usersRepository.create({
      username: userData.username,
      password: hashedPassword,
      fullName: userData.fullName,
    });

    return this.usersRepository.save(newUser);
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Jika ada perubahan password, hash password baru
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    // Update user
    Object.assign(user, userData);
    return this.usersRepository.save(user);
  }
}