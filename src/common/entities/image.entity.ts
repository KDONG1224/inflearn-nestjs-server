import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseModel } from './base.entity';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { ImageModelType } from '../consts/image-type.const';
import { Transform } from 'class-transformer';
import { join } from 'path';
import { POST_PUBLIC_IMAGE_PATH } from '../consts/path.const';
import { PostsModel } from 'src/posts/entities/posts.entity';

@Entity()
export class ImageModel extends BaseModel {
  @Column({ default: 0 })
  @IsInt()
  @IsOptional()
  order: number;

  @Column({
    enum: ImageModelType
  })
  @IsEnum(ImageModelType)
  @IsString()
  type: ImageModelType;

  @Column()
  @IsString()
  @Transform(({ value, obj }) => {
    if (obj.type === ImageModelType.POST_IMAGE) {
      return `/${join(POST_PUBLIC_IMAGE_PATH, value)}`;
    } else {
      return value;
    }
  })
  path: string;

  @ManyToOne(() => PostsModel, (post) => post.images)
  post?: PostsModel;
}
