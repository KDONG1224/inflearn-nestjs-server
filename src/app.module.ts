// base
import {
  ClassSerializerInterceptor,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod
} from '@nestjs/common';

// libraries
import { TypeOrmModule } from '@nestjs/typeorm';

// controllers
import { AppController } from './app.controller';

// services
import { AppService } from './app.service';

// modules
import { PostsModule } from './posts/modules/posts.module';

// entities
import { PostsModel } from './posts/entities/posts.entity';
import { UsersModule } from './users/modules/users.module';
import { UsersModel } from './users/entities/users.entity';
import { AuthModule } from './auth/modules/auth.module';
import { CommonModule } from './common/modules/common.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import {
  ENV_DB_DATABASE_KEY,
  ENV_DB_HOST_KEY,
  ENV_DB_PASSWORD_KEY,
  ENV_DB_PORT_KEY,
  ENV_DB_USERNAME_KEY
} from './common/consts/env-keys.const';
import { ServeStaticModule } from '@nestjs/serve-static';
import { PUBLIC_FOLDER_PATH } from './common/consts/path.const';
import { ImageModel } from './common/entities/image.entity';
import { LogMiddleware } from './common/middleware/log.middleware';
import { ChatsModule } from './chats/modules/chats.module';
import { ChatsModel } from './chats/entities/chats.entity';
import { ChatsMessagesModel } from './chats/messages/entities/messages.entity';
import { CommentsModule } from './posts/comments/modules/comments.module';
import { CommentsModel } from './posts/comments/entities/comments.entity';
import { RolesGuard } from './users/guard/roles.guard';
import { AccessTokenGuard } from './auth/guard/bearer-token.guard';
import { UserFollowersModel } from './users/entities/user-followers.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env[ENV_DB_HOST_KEY],
      port: parseInt(process.env[ENV_DB_PORT_KEY]) || 34743,
      username: process.env[ENV_DB_USERNAME_KEY],
      password: process.env[ENV_DB_PASSWORD_KEY],
      database: process.env[ENV_DB_DATABASE_KEY],
      entities: [
        PostsModel,
        UsersModel,
        ImageModel,
        ChatsModel,
        ChatsMessagesModel,
        CommentsModel,
        UserFollowersModel
      ],
      synchronize: true
    }),
    ServeStaticModule.forRoot({
      rootPath: PUBLIC_FOLDER_PATH,
      serveRoot: '/public'
    }),
    UsersModule,
    AuthModule,
    PostsModule,
    CommonModule,
    ChatsModule,
    CommentsModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor
    },
    {
      provide: APP_GUARD,
      useClass: AccessTokenGuard
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    }
  ]
  /**
   * ClassSerializerInterceptor
   *
   * serialization -> 직렬화
   * -> 현재 시스템(NestJS) 사용되는 데이터의 구조를 다른 시스템에서도 쉽게 사용 할 수 있도록 변환하는 과정
   * -> class 의 Object 를 JSON 형태로 변환
   *
   * deserialization -> 역직렬화
   * -> JSON 형태의 데이터를 class 의 Object 로 변환
   * -> JSON.parse() 와 같은 역할
   */
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LogMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL
    });
  }
}
