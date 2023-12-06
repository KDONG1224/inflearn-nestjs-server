// base
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
  UseInterceptors
} from '@nestjs/common';
import { QueryRunner as QR } from 'typeorm';

// services
import { CommentsService } from '../services/comments.service';

// entities
import { UsersModel } from 'src/users/entities/users.entity';

// dtos
import { PaginateCommentsDto } from '../dto/paginate-comments.dto';
import { CreateCommentsDto } from '../dto/create-comments.dto';

// decorators
import { User } from 'src/users/decorator/user.decorator';
import { IsPublic } from 'src/common/decorator/is-public.decorator';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';

// interceptors
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { PostsService } from 'src/posts/services/posts.service';

@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly postsService: PostsService
  ) {
    /**
     * 1) Entity 생성
     *  - author: 작성자
     *  - post: 포스트
     *  - commnet: 댓글 내용
     *  - likeCount: 좋아요 수
     *
     *  - id: PrimaryGeneratedColumn
     *  - createdAt: CreateDateColumn
     *  - updatedAt: UpdateDateColumn
     *
     * 2) GET() pagination
     * 3) GET(':commentId)  특정 comment만 하나 가져오는 기능
     * 4) POST()  댓글 작성
     * 5) PATCH()  댓글 수정
     * 6) DELETE()  댓글 삭제
     */
  }

  @Get()
  @IsPublic()
  async getComments(
    @Param('postId', ParseIntPipe) postId: number,
    @Query() query: PaginateCommentsDto
  ) {
    return await this.commentsService.paginateComments(query, postId);
  }

  @Get(':commentId')
  @IsPublic()
  async getComment(@Param('commentId', ParseIntPipe) commentId: number) {
    return await this.commentsService.getCommentById(commentId);
  }

  @Post()
  @UseInterceptors(TransactionInterceptor)
  async postComment(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() body: CreateCommentsDto,
    @User() user: UsersModel,
    @QueryRunner() qr: QR
  ) {
    const result = await this.commentsService.createComment(
      body,
      postId,
      user,
      qr
    );
    await this.postsService.incrementCommentCount(postId, qr);

    return result;
  }

  @Patch(':commentId')
  async patchComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() body: CreateCommentsDto
  ) {
    return await this.commentsService.updateComment(commentId, body);
  }

  @Delete(':commentId')
  async deleteComment(
    @Param('postId', ParseIntPipe) postId: number,
    @Param('commentId', ParseIntPipe) commentId: number,
    @QueryRunner() qr: QR
  ) {
    const result = await this.commentsService.deleteComment(commentId, qr);

    await this.postsService.decrementCommentCount(postId, qr);

    return result;
  }
}
