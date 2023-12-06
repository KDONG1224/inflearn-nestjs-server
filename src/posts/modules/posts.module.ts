// base
import { Module } from '@nestjs/common';

// libraries
import { TypeOrmModule } from '@nestjs/typeorm';

// modules
import { AuthModule } from 'src/auth/modules/auth.module';
import { UsersModule } from 'src/users/modules/users.module';
import { CommonModule } from 'src/common/modules/common.module';

// controllers
import { PostsController } from '../controllers/posts.controller';

// services
import { PostsService } from '../services/posts.service';
import { PostsImagesService } from '../image/service/images.service';

// entities
import { PostsModel } from '../entities/posts.entity';
import { ImageModel } from 'src/common/entities/image.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostsModel, ImageModel]),
    AuthModule,
    UsersModule,
    CommonModule
  ],
  controllers: [PostsController],
  providers: [PostsService, PostsImagesService],
  exports: [PostsService]
})
export class PostsModule {}
