import { PickType } from '@nestjs/mapped-types';
import { PostsModel } from '../entities/posts.entity';
import { IsOptional, IsString } from 'class-validator';

/**
 * DTO - Data Transfer Object
 *
 * class-validator : 검증
 * class-transformer : 타입 변환
 *
 * Pick, Omit, Partial -> Type 반환
 * PickType, OmitType, ParitalType -> 값을 반환
 */
export class CreatePostDto extends PickType(PostsModel, ['title', 'content']) {
  @IsString({
    each: true
  })
  @IsOptional()
  images: string[] = [];
}
