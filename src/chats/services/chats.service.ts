import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatsModel } from '../entities/chats.entity';
import { Repository } from 'typeorm';
import { CreateChatDto } from '../dto/create-chat.dto';
import { CommonService } from 'src/common/services/common.service';
import { PaginateChatDto } from '../dto/paginate-chat.dto';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(ChatsModel)
    private readonly chatsRepository: Repository<ChatsModel>,
    private readonly commonService: CommonService
  ) {}

  async createChat(dto: CreateChatDto) {
    const chat = await this.chatsRepository.save({
      users: dto.userIds.map((id) => ({ id }))
    });

    const findChat = await this.chatsRepository.findOne({
      where: { id: chat.id }
    });

    return findChat;
  }

  paginateChats(dto: PaginateChatDto) {
    const paginate = this.commonService.paginate(
      dto,
      this.chatsRepository,
      {
        relations: {
          users: true
        }
      },
      'chats'
    );

    return paginate;
  }

  async checkIfChatExists(chatId: number) {
    const exists = await this.chatsRepository.exist({
      where: { id: chatId }
    });

    return exists;
  }
}
