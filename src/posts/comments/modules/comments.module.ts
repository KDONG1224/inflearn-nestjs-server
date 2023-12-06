import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CommentsService } from '../services/comments.service';
import { CommentsController } from '../controllers/comments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsModel } from '../entities/comments.entity';
import { CommonModule } from 'src/common/modules/common.module';
import { AuthModule } from 'src/auth/modules/auth.module';
import { UsersModule } from 'src/users/modules/users.module';
import { PostExistsMiddleware } from '../middleware/post-exists.middleware';
import { PostsModule } from 'src/posts/modules/posts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommentsModel]),
    CommonModule,
    AuthModule,
    UsersModule,
    PostsModule
  ],
  controllers: [CommentsController],
  providers: [CommentsService]
})
export class CommentsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(PostExistsMiddleware).forRoutes(CommentsController);
  }
}
