import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CreateChatDto } from '../dto/create-chat.dto';
import { ChatsService } from '../services/chats.service';
import { EnterChatDto } from '../dto/enter-chat.dto';
import { CreateChatsMessagesDto } from '../messages/dto/create-messages.dto';
import { ChatsMessagesService } from '../messages/services/messages.service';
import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { SocketCatchHttpExceptionFilter } from 'src/common/exception-filter/socket-catch-http.exception-filter';
import { UsersModel } from 'src/users/entities/users.entity';
import { UsersService } from 'src/users/services/users.service';
import { AuthService } from 'src/auth/services/auth.service';

@WebSocketGateway({
  /**
   * ws://localhost:3000/chats
   */
  namespace: 'chats'
})
export class ChatsGateway
  implements OnGatewayConnection, OnGatewayInit, OnGatewayDisconnect
{
  constructor(
    private readonly chatsService: ChatsService,
    private readonly chatsMessagesService: ChatsMessagesService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService
  ) {}

  @WebSocketServer()
  server: Server;

  /**
   * OnGatewayInit
   */
  afterInit(server: any) {
    console.log('after gateway init');
  }

  /**
   * OnGatewayDisconnect
   */
  handleDisconnect(socket: Socket) {
    console.log(`on disconnect called : ${socket.id}`);
  }

  /**
   * OnGatewayConnection
   */
  async handleConnection(socket: Socket & { user: UsersModel }) {
    console.log(`on connect called : ${socket.id}`);

    const headers = socket.handshake.headers;
    const rawToken = headers['authorization'];

    if (!rawToken) {
      throw new WsException('토큰이 없습니다!');
    }

    try {
      const token = this.authService.extractTokenFromHeader(rawToken, true);
      const payload = this.authService.verifyToken(token);

      const user = await this.usersService.getUserByEmail(payload.email);

      socket.user = user;

      return true;
    } catch (error) {
      throw new WsException('토큰이 유효하지 않습니다!');
    }
  }

  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true
      },
      whitelist: true,
      forbidNonWhitelisted: true
    })
  )
  @UseFilters(SocketCatchHttpExceptionFilter)
  @SubscribeMessage('create_chat')
  async createChat(
    @MessageBody() data: CreateChatDto,
    @ConnectedSocket() socket: Socket & { user: UsersModel }
  ) {
    console.log('== socket == : ', socket);

    const chat = await this.chatsService.createChat(data);

    return chat;
  }

  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true
      },
      whitelist: true,
      forbidNonWhitelisted: true
    })
  )
  @UseFilters(SocketCatchHttpExceptionFilter)
  @SubscribeMessage('enter_chat')
  async enterChat(
    // 방의 chat ID들을 리스트로 받는다.
    @MessageBody() data: EnterChatDto,
    @ConnectedSocket() socket: Socket & { user: UsersModel }
  ) {
    for (const chatId of data.chatIds) {
      const exists = await this.chatsService.checkIfChatExists(chatId);

      if (!exists) {
        throw new WsException({
          statusCode: 100,
          message: `존재하지 않는 채팅방입니다. chatId: ${chatId}`
        });
      }
    }

    socket.join(data.chatIds.map((id) => id.toString()));
  }

  /**
   * socket.on('send_message', (message) => console.log(message));
   */
  @UsePipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true
      },
      whitelist: true,
      forbidNonWhitelisted: true
    })
  )
  @UseFilters(SocketCatchHttpExceptionFilter)
  @SubscribeMessage('send_message')
  async sendMessage(
    @MessageBody() dto: CreateChatsMessagesDto,
    @ConnectedSocket() socket: Socket & { user: UsersModel }
  ) {
    const exists = await this.chatsService.checkIfChatExists(dto.chatId);

    if (!exists) {
      throw new WsException(
        `존재하지 않는 채팅방입니다. chatId: ${dto.chatId}`
      );
    }

    const message = await this.chatsMessagesService.createMessage(
      dto,
      socket.user.id
    );

    socket
      .to(message.chat.id.toString())
      .emit('receive_message', message.message);

    console.log(`on send_message called : ${JSON.stringify(message)}`);
  }
}
