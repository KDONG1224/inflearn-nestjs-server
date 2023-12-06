// baas
import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { IsEmail, IsString, Length } from 'class-validator';
import { Exclude } from 'class-transformer';

// entities
import { PostsModel } from 'src/posts/entities/posts.entity';
import { BaseModel } from 'src/common/entities/base.entity';
import { ChatsModel } from 'src/chats/entities/chats.entity';
import { ChatsMessagesModel } from 'src/chats/messages/entities/messages.entity';
import { CommentsModel } from 'src/posts/comments/entities/comments.entity';

// validations
import { legthValidationMessage } from 'src/common/validation-message/legth-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { emailValidationMessage } from 'src/common/validation-message/email-validator.message';

// consts
import { RolesEnum } from '../consts/roles.const';
import { UserFollowersModel } from './user-followers.entity';

@Entity()
// @Exclude()
export class UsersModel extends BaseModel {
  /**
   * 조건
   * 1) 길이가 20을 넘지 않을 것 -> length: 20
   * 2) 유일무이한 값이 될 것 -> unique: true
   */
  @Column({ length: 20, unique: true })
  @IsString({
    message: stringValidationMessage
  })
  @Length(1, 20, {
    message: legthValidationMessage
  })
  nickname: string;

  /**
   * Exclude 의 반대
   */
  // @Expose()
  // get nicknameAndEmail() {
  //   return `${this.nickname}(${this.email})`;
  // }

  /**
   * 조건
   * 1) 유일무이한 값이 될 것 -> unique: true
   */
  @Column({ unique: true })
  @IsString({
    message: stringValidationMessage
  })
  @IsEmail(
    {},
    {
      message: emailValidationMessage
    }
  )
  email: string;

  @Column()
  @IsString({
    message: stringValidationMessage
  })
  @Length(3, 8, {
    message: legthValidationMessage
  })
  /**
   * Exclude
   *
   * frontend -> backend
   * plain object(JSON) -> class instance(dto)
   *
   * backend -> frontend
   * class instance(dto) -> plain object(JSON)
   *
   * toClassOnly: true -> plain object(JSON) -> class instance(dto) -> class instance로 변환될때만
   * toPlainOnly: true -> class instance(dto) -> plain object(JSON) -> plain object(JSON)로 변환될때만
   */
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({
    enum: Object.values(RolesEnum),
    default: RolesEnum.USER
  })
  role: RolesEnum;

  @OneToMany(() => PostsModel, (post) => post.author)
  posts: PostsModel[];

  @ManyToMany(() => ChatsModel, (chat) => chat.users)
  @JoinTable()
  chats: ChatsModel[];

  @OneToMany(() => ChatsMessagesModel, (message) => message.author)
  messages: ChatsMessagesModel;

  @OneToMany(() => CommentsModel, (comment) => comment.author)
  postComments: CommentsModel[];

  @OneToMany(() => UserFollowersModel, (ufm) => ufm.follower)
  followers: UserFollowersModel[];

  @OneToMany(() => UserFollowersModel, (ufm) => ufm.followee)
  followees: UserFollowersModel[];

  @Column({
    default: 0
  })
  followerCount: number;

  @Column({
    default: 0
  })
  followeeCount: number;
}
