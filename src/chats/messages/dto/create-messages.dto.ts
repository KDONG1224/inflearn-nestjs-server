import { PickType } from '@nestjs/mapped-types';
import { ChatsMessagesModel } from '../entities/messages.entity';
import { IsNumber } from 'class-validator';

export class CreateChatsMessagesDto extends PickType(ChatsMessagesModel, [
  'message'
]) {
  @IsNumber()
  chatId: number;
}
