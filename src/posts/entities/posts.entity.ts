import { IsString } from 'class-validator';

import { BaseModel } from 'src/common/entities/base.entity';
import { ImageModel } from 'src/common/entities/image.entity';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

import { UsersModel } from 'src/users/entities/users.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { CommentsModel } from '../comments/entities/comments.entity';

@Entity()
export class PostsModel extends BaseModel {
  /**
   * 1) UsersModel과 연동한다. ForeignKey로 연동한다.
   * 2) null이 될 수 없다.
   */
  @ManyToOne(() => UsersModel, (user) => user.posts, { nullable: false })
  author: UsersModel;

  @Column()
  title: string;

  @Column()
  @IsString({
    message: stringValidationMessage
  })
  content: string;

  @Column()
  @IsString({
    message: stringValidationMessage
  })
  likeCount: number;

  @Column({
    default: 0
  })
  commentCount: number;

  @OneToMany(() => ImageModel, (image) => image.post)
  images: ImageModel[];

  @OneToMany(() => CommentsModel, (comment) => comment.post)
  comments: CommentsModel[];
}
