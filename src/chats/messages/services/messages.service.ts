import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatsMessagesModel } from '../entities/messages.entity';
import { FindManyOptions, Repository } from 'typeorm';
import { CommonService } from 'src/common/services/common.service';
import { BasePaginationDto } from 'src/common/dto/base-pagination-dto';
import { CreateChatsMessagesDto } from '../dto/create-messages.dto';

@Injectable()
export class ChatsMessagesService {
  constructor(
    @InjectRepository(ChatsMessagesModel)
    private readonly chatsMessagesRepository: Repository<ChatsMessagesModel>,
    private readonly commonService: CommonService
  ) {}

  async createMessage(dto: CreateChatsMessagesDto, authorId: number) {
    const message = await this.chatsMessagesRepository.save({
      chat: { id: dto.chatId },
      author: { id: authorId },
      message: dto.message
    });

    const result = this.chatsMessagesRepository.findOne({
      where: { id: message.id },
      relations: {
        chat: true
      }
    });

    return result;
  }

  paginateMessages(
    dto: BasePaginationDto,
    overrideFindOptions: FindManyOptions<ChatsMessagesModel>
  ) {
    return this.commonService.paginate(
      dto,
      this.chatsMessagesRepository,
      overrideFindOptions,
      'messages'
    );
  }
}
