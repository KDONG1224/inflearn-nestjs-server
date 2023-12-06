import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { RolesEnum } from 'src/users/consts/roles.const';
import { PostsService } from '../services/posts.service';
import { UsersModel } from 'src/users/entities/users.entity';
import { Request } from 'express';

@Injectable()
export class IsPostMineOrAdminGuard implements CanActivate {
  constructor(private readonly postsService: PostsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest() as Request & {
      user: UsersModel;
    };

    const { user } = req;

    if (!user) {
      throw new UnauthorizedException('사용자 정보를 가져올 수 없습니다.');
    }

    /**
     * ADMIN일 경우 통과
     */
    if (user.role === RolesEnum.ADMIN) return true;

    const pId = req.params.postId;

    if (!pId) {
      throw new BadRequestException('postId를 입력해주세요.');
    }

    return this.postsService.isPostMine(user.id, parseInt(pId));
  }
}
