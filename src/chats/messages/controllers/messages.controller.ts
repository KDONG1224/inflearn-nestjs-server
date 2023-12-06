import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ChatsMessagesService } from '../services/messages.service';
import { BasePaginationDto } from 'src/common/dto/base-pagination-dto';

@Controller('chats/:cid/messages')
export class ChatsMessagesController {
  constructor(private readonly chatsMessagesService: ChatsMessagesService) {}

  @Get()
  paginateMessages(
    @Param('cid', ParseIntPipe) id: number,
    @Query() dto: BasePaginationDto
  ) {
    return this.chatsMessagesService.paginateMessages(dto, {
      where: { chat: { id } },
      relations: {
        chat: true,
        author: true
      }
    });
  }
}
