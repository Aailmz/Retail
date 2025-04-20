import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateTransactionDto extends PartialType(CreateUserDto) {}