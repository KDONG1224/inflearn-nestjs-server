import { SetMetadata } from '@nestjs/common';
import { RolesEnum } from '../consts/roles.const';

export const ROLES_KEY = 'user_roles';

/**
 * @Roles(RplesEnum.ADMIN)
 */
export const Roles = (role: RolesEnum) => SetMetadata(ROLES_KEY, role);
