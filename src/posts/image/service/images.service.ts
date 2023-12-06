import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { promises } from 'fs';
import { join, basename } from 'path';
import {
  TEMP_FOLDER_PATH,
  POST_IMAGE_PATH
} from 'src/common/consts/path.const';
import { ImageModel } from 'src/common/entities/image.entity';
import { Repository, QueryRunner } from 'typeorm';
import { CreatePostImageDto } from '../dto/create-image.dto';

@Injectable()
export class PostsImagesService {
  constructor(
    @InjectRepository(ImageModel)
    private readonly imagesRepository: Repository<ImageModel>
  ) {}

  getRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<ImageModel>(ImageModel)
      : this.imagesRepository;
  }

  async createPostImage(createImageDto: CreatePostImageDto, qr?: QueryRunner) {
    const repository = this.getRepository(qr);

    /**
     * dto의 이미지 이름을 기반으로
     * 파일의 경로를 생성한다.
     */
    const tempFilePath = join(TEMP_FOLDER_PATH, createImageDto.path);

    try {
      /**
       * 파일이 존재하는지 확인한다.
       */
      await promises.access(tempFilePath);
    } catch (error) {
      throw new BadRequestException('파일이 존재하지 않습니다.');
    }

    /**
     * 파일의 이름만 가져오기
     */
    const fileName = basename(tempFilePath);

    /**
     * 파일의 이름을 기반으로
     * 실제 저장할 경로를 생성한다.
     */
    const newPath = join(POST_IMAGE_PATH, fileName);

    /**
     * 파일을 저장한다.
     */
    const result = await repository.save({
      ...createImageDto
    });

    /**
     * 파일을 이동시킨다.
     */
    await promises.rename(tempFilePath, newPath);

    return result;
  }
}
