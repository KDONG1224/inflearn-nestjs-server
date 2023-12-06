import { BaseModel } from 'src/common/entities/base.entity';
import { UsersModel } from 'src/users/entities/users.entity';
import { Entity, ManyToMany, OneToMany } from 'typeorm';
import { ChatsMessagesModel } from '../messages/entities/messages.entity';

@Entity()
export class ChatsModel extends BaseModel {
  @ManyToMany(() => UsersModel, (user) => user.chats)
  users: UsersModel[];

  @OneToMany(() => ChatsMessagesModel, (message) => message.chat)
  messages: ChatsMessagesModel;
}
