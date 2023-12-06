// base
import { PickType } from '@nestjs/mapped-types';

// entities
import { UsersModel } from 'src/users/entities/users.entity';

export class RegisterUserDto extends PickType(UsersModel, [
  'nickname',
  'email',
  'password'
]) {}
