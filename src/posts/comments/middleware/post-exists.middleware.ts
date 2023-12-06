import {
  BadRequestException,
  Injectable,
  NestMiddleware
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { PostsService } from 'src/posts/services/posts.service';

@Injectable()
export class PostExistsMiddleware implements NestMiddleware {
  constructor(private readonly postsService: PostsService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const postId = req.params.postId;

    if (!postId || postId === ':postId') {
      throw new BadRequestException('Post ID가 없습니다.');
    }

    const exists = await this.postsService.checkPostExists(parseInt(postId));

    if (!exists) {
      throw new BadRequestException('해당하는 포스트가 없습니다.');
    }

    next();
  }
}
