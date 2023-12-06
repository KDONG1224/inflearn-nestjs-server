// base
import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseInterceptors
} from '@nestjs/common';
import { QueryRunner as QR } from 'typeorm';

// services
import { UsersService } from '../services/users.service';

// entities
import { UsersModel } from '../entities/users.entity';

// decorators
import { User } from '../decorator/user.decorator';
import { Roles } from '../decorator/roles.decorator';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';

// consts
import { RolesEnum } from '../consts/roles.const';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(RolesEnum.ADMIN)
  getUsers() {
    return this.usersService.getAllUsers();
  }

  @Post()
  @Roles(RolesEnum.ADMIN)
  postUser(
    @Body('nickname') nickname: string,
    @Body('email') email: string,
    @Body('password') password: string
  ) {
    return this.usersService.create({ nickname, email, password });
  }

  @Get('follow/me')
  async getFollow(
    @User() user: UsersModel,
    @Query('includeNotConfirmed', new DefaultValuePipe(false), ParseBoolPipe)
    includeNotConfirmed: boolean
  ) {
    return await this.usersService.getFollowers(user.id, includeNotConfirmed);
  }

  @Post('follow/:id')
  async postFollow(
    @User() user: UsersModel,
    @Param('id', ParseIntPipe) follweeId: number
  ) {
    await this.usersService.followUser(user.id, follweeId);

    return true;
  }

  @Patch('follow/:id/confirm')
  @UseInterceptors(TransactionInterceptor)
  async patchFollowConfirm(
    @User() user: UsersModel,
    @Param('id', ParseIntPipe) followerId: number,
    @QueryRunner() qr: QR
  ) {
    await this.usersService.confirmFollow(user.id, followerId, qr);
    await this.usersService.incrementFollowCount(user.id, qr);

    return true;
  }

  @Delete('follow/:id')
  @UseInterceptors(TransactionInterceptor)
  async deleteFollow(
    @User() user: UsersModel,
    @Param('id', ParseIntPipe) follweeId: number,
    @QueryRunner() qr: QR
  ) {
    await this.usersService.deleteFollow(user.id, follweeId, qr);
    await this.usersService.decrementFollowCount(user.id, qr);

    return true;
  }
}
