// base
import { Module } from '@nestjs/common';

// controllers
import { ChatsController } from '../controllers/chats.controller';

// services
import { ChatsService } from '../services/chats.service';
import { ChatsGateway } from '../gateways/chats.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatsModel } from '../entities/chats.entity';
import { CommonModule } from 'src/common/modules/common.module';
import { ChatsMessagesService } from '../messages/services/messages.service';
import { ChatsMessagesModel } from '../messages/entities/messages.entity';
import { ChatsMessagesController } from '../messages/controllers/messages.controller';
import { AuthModule } from 'src/auth/modules/auth.module';
import { UsersModule } from 'src/users/modules/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatsModel, ChatsMessagesModel]),
    CommonModule,
    AuthModule,
    UsersModule
  ],
  controllers: [ChatsController, ChatsMessagesController],
  providers: [ChatsGateway, ChatsService, ChatsMessagesService]
})
export class ChatsModule {}
