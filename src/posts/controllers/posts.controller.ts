import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { QueryRunner as QR } from 'typeorm';

import { AccessTokenGuard } from 'src/auth/guard/bearer-token.guard';

// services
import { PostsService } from '../services/posts.service';
import { PostsImagesService } from '../image/service/images.service';

import { UsersModel } from 'src/users/entities/users.entity';

// dtos
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { PaginatePostDto } from '../dto/paginate-post.dto';

// consts
import { ImageModelType } from 'src/common/consts/image-type.const';

// interceptors
import { LogInterceptor } from 'src/common/interceptor/log.interceptor';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';

// decorators
import { User } from 'src/users/decorator/user.decorator';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
import { Roles } from 'src/users/decorator/roles.decorator';
import { RolesEnum } from 'src/users/consts/roles.const';
import { IsPublic } from 'src/common/decorator/is-public.decorator';
import { IsPostMineOrAdminGuard } from '../guard/is-post-mine-or-admin.guard';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly postsImagesService: PostsImagesService
  ) {}

  /**
   * 1. GET /posts
   *    모든 post를 가져온다.
   */
  @Get()
  @UseInterceptors(LogInterceptor)
  @IsPublic()
  getPosts(@Query() query: PaginatePostDto) {
    if (!query.order__createdAt) {
      query.order__createdAt = 'ASC';
    }

    if (!query.take) {
      query.take = 20;
    }

    return this.postsService.paginatePosts(query);
  }

  @Post('dummy')
  async postPostsDummy(@User() user: UsersModel) {
    await this.postsService.generatePosts(user.id);

    return true;
  }

  /**
   * 2. GET /posts/:id
   *    id에 해당하는 post를 가져온다.
   *    예를 들어, GET /posts/1 이면 id가 1인 post를 가져온다.
   */
  @Get(':id')
  @IsPublic()
  getPost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.getPostById(id);
  }

  /**
   * 3. POST /posts
   *    POST를 생성한다.
   */
  @Post()
  @UseInterceptors(TransactionInterceptor)
  async postPosts(
    @User('id') userId: number,
    @Body() body: CreatePostDto,
    @QueryRunner() qr: QR
  ) {
    const post = await this.postsService.createPost(userId, body, qr);

    for (let i = 0; i < body.images.length; i++) {
      await this.postsImagesService.createPostImage(
        {
          post,
          order: i + 1,
          path: body.images[i],
          type: ImageModelType.POST_IMAGE
        },
        qr
      );
    }

    return this.postsService.getPostById(post.id, qr);
  }

  /**
   * 4. PATCH /posts
   *    id에 해당하는 POST를 수정한다.
   */
  @Patch(':postId')
  @UseGuards(IsPostMineOrAdminGuard)
  patchPost(
    @Param('postId', ParseIntPipe) id: number,
    @Body() body: UpdatePostDto
  ) {
    return this.postsService.updatePost(id, body);
  }

  /**
   * 5. DELETE /posts/:id
   *    id에 해당하는 POST를 삭제한다.
   */
  @Delete(':id')
  @Roles(RolesEnum.ADMIN)
  deletePost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.deletePost(id);
  }

  /**
   * RBAC -> Role Based Access Control
   */
}
