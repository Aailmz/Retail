import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CategoryService } from '../category/category.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private categoryService: CategoryService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Verify category exists
    await this.categoryService.findOne(createProductDto.categoryId);
    
    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      relations: ['category'],
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    
    // If categoryId is being updated, verify the new category exists
    if (updateProductDto.categoryId && updateProductDto.categoryId !== product.categoryId) {
      await this.categoryService.findOne(updateProductDto.categoryId);
    }
    
    this.productRepository.merge(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }
}