import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommonService } from 'src/common/services/common.service';
import { CommentsModel } from '../entities/comments.entity';
import { QueryRunner, Repository } from 'typeorm';
import { PaginateCommentsDto } from '../dto/paginate-comments.dto';
import { CreateCommentsDto } from '../dto/create-comments.dto';
import { UsersModel } from 'src/users/entities/users.entity';
import { DEFAULT_COMMENTS_FIND_OPTIONS } from '../consts/default-comments-find-options.const';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentsModel)
    private readonly commentsRepository: Repository<CommentsModel>,
    private readonly commonService: CommonService
  ) {}

  getRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<CommentsModel>(CommentsModel)
      : this.commentsRepository;
  }

  paginateComments(dto: PaginateCommentsDto, postId: number) {
    return this.commonService.paginate(
      dto,
      this.commentsRepository,
      {
        ...DEFAULT_COMMENTS_FIND_OPTIONS,
        where: {
          post: {
            id: postId
          }
        }
      },
      `posts/${postId}/comments`
    );
  }

  async getCommentById(commentId: number) {
    const comment = await this.commentsRepository.findOne({
      where: {
        id: commentId
      },
      ...DEFAULT_COMMENTS_FIND_OPTIONS
    });

    if (!comment) {
      throw new BadRequestException(
        `댓글 ${commentId} 에 해당하는 댓글이 없습니다.`
      );
    }

    return comment;
  }

  async createComment(
    dto: CreateCommentsDto,
    postId: number,
    author: UsersModel,
    qr?: QueryRunner
  ) {
    const repository = this.getRepository(qr);

    const newComment = repository.save({
      ...dto,
      post: { id: postId },
      author
    });

    return newComment;
  }

  async updateComment(commentId: number, dto: CreateCommentsDto) {
    const prevComment = await this.commentsRepository.preload({
      id: commentId,
      ...dto
    });

    if (!prevComment) {
      throw new BadRequestException(
        `댓글 ${commentId} 에 해당하는 댓글이 없습니다.`
      );
    }

    const newComment = await this.commentsRepository.save(prevComment);

    return newComment;
  }

  async deleteComment(commentId: number, qr?: QueryRunner) {
    const repository = this.getRepository(qr);

    const comment = await repository.findOne({
      where: {
        id: commentId
      }
    });

    if (!comment) {
      throw new BadRequestException(
        `댓글 ${commentId} 에 해당하는 댓글이 없습니다.`
      );
    }

    await repository.delete(commentId);

    return {
      message: `댓글 ${commentId} 삭제 성공`
    };
  }

  async isCommentMine(userId: number, commentId: number) {
    return await this.commentsRepository.exist({
      where: {
        id: commentId,
        author: {
          id: userId
        }
      }
    });
  }
}
