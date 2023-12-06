import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    /**
     * Roles annotation에 대한 metadata를 가져와야한다.
     *
     * Reflector
     * getAllAndOverride()
     *
     * roles에 대한 메타데이터를 가져오는 방법
     * decorator는 controller와 method에 모두 적용이 가능하다
     * method의 적용은 getAllAndOverride를 했을때 class에서
     */
    const requiredRoles = this.reflector.getAllAndOverride(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    /**
     * Rolew annotation이 없다면 true를 반환한다.
     */
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }

    if (user.role !== requiredRoles) {
      throw new ForbiddenException(
        `권한이 없습니다. ${requiredRoles}이어야 합니다.`
      );
    }

    return true;
  }
}
