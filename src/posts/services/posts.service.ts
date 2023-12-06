import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsWhere,
  LessThan,
  MoreThan,
  QueryRunner,
  Repository
} from 'typeorm';
import { PostsModel } from '../entities/posts.entity';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { PaginatePostDto } from '../dto/paginate-post.dto';
import { dummyPosts } from '../consts/dummy';
import { CommonService } from 'src/common/services/common.service';
import { ConfigService } from '@nestjs/config';
import {
  ENV_PROTOCOL_KEY,
  ENV_HOST_KEY
} from 'src/common/consts/env-keys.const';
import { DEFAULT_POST_FIND_OPTIONS } from '../consts/default-post-find-options.const';

export interface PostModel {
  id: number;
  author: string;
  title: string;
  content: string;
  likeCount: number;
  commentCount: number;
}

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostsModel)
    private readonly postRepository: Repository<PostsModel>,
    private readonly commonService: CommonService,
    private readonly configService: ConfigService
  ) {}

  async getAllPosts() {
    const result = await this.postRepository.find({
      ...DEFAULT_POST_FIND_OPTIONS
    });

    return result;
  }

  async generatePosts(userId: number) {
    for (let i = 0; i < 100; i++) {
      const dummyPost = dummyPosts[Math.floor(Math.random() * 20)];

      await this.createPost(userId, {
        title: dummyPost.title + ` - 테스트 제목 ${i + 1}`,
        content: dummyPost.content + ` - 테스트 내용 ${i + 1}`,
        images: []
      });
    }
  }

  /**
   * 1) 오름차순으로 정렬하는 pagination만 구현한다.
   */
  async paginatePosts(dto: PaginatePostDto) {
    if (dto.page) {
      return this.pagePaginatePosts(dto);
    } else {
      return this.cursorPaginatePosts(dto);
    }
  }

  async pagePaginatePosts(dto: PaginatePostDto) {
    return await this.commonService.paginate(
      dto,
      this.postRepository,
      { ...DEFAULT_POST_FIND_OPTIONS },
      'posts'
    );
  }

  async cursorPaginatePosts(dto: PaginatePostDto) {
    const where: FindOptionsWhere<PostsModel> = {};

    if (dto.where__id__less_than) {
      where.id = LessThan(dto.where__id__less_than);
    } else if (dto.where__id__more_than) {
      where.id = MoreThan(dto.where__id__more_than);
    }

    const post = await this.postRepository.find({
      ...DEFAULT_POST_FIND_OPTIONS,
      where: {
        id: MoreThan(dto.where__id__more_than ?? 0)
      },
      order: {
        createdAt: dto.order__createdAt
      },
      take: dto.take ?? 20
    });

    /**
     * Response
     *
     * data: Data[],
     * cursor: {
     *   after: 마지막 Data의 ID,
     * },
     * count: 응답한 데이터의 갯수
     * next: 다음 요청을 할때 사용할 URL
     */
    const lastItem =
      post.length > 0 && post.length === dto.take
        ? post[post.length - 1]
        : null;

    const protocol = this.configService.get<string>(ENV_PROTOCOL_KEY);
    const host = this.configService.get<string>(ENV_HOST_KEY);

    const nextUrl = lastItem && new URL(`${protocol}://${host}/posts`);

    if (nextUrl) {
      /**
       * dto의 키값들을 루프를 돌면서
       * 키값에 해당되는 밸류가 존재하면,
       * nextUrl의 params에 추가한다.
       *
       * 단, where__id__more_than 값만 lastItem의 마지막 값으로 넣어준다.
       */
      for (const key of Object.keys(dto)) {
        if (dto[key]) {
          if (
            key !== 'where__id__more_than' &&
            key !== 'where__id__less_than'
          ) {
            nextUrl.searchParams.append(key, dto[key]);
          }
        }
      }

      let key = null;

      if (dto.order__createdAt === 'ASC') {
        key = 'where__id__more_than';
      } else {
        key = 'where__id__less_than';
      }

      nextUrl.searchParams.append(key, lastItem.id.toString());
    }

    const result = {
      data: post,
      count: post.length,
      cursor: {
        after: lastItem?.id ?? null
      },
      next: nextUrl?.toString() ?? null
    };

    return result;
  }

  async getPostById(id: number, qr?: QueryRunner) {
    const repository = this.getRepository(qr);

    const result = await repository.findOne({
      ...DEFAULT_POST_FIND_OPTIONS,
      where: {
        id
      }
    });

    if (!result) {
      throw new NotFoundException('해당하는 포스트가 없습니다.');
    }

    return result;
  }

  getRepository(qr?: QueryRunner) {
    return qr
      ? qr.manager.getRepository<PostsModel>(PostsModel)
      : this.postRepository;
  }

  async createPost(authorId: number, postDto: CreatePostDto, qr?: QueryRunner) {
    const repository = this.getRepository(qr);

    const post = repository.create({
      author: {
        id: authorId
      },
      ...postDto,
      images: [],
      likeCount: 0,
      commentCount: 0
    });

    const newPost = await repository.save(post);

    return newPost;
  }

  async updatePost(id: number, postDto: UpdatePostDto) {
    const post = await this.postRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException('해당하는 포스트가 없습니다.');
    }

    const data = {
      ...post,
      ...postDto,
      images: []
    };

    const result = await this.postRepository.save(data);

    return result;
  }

  async deletePost(id: number) {
    const post = await this.postRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException('해당하는 포스트가 없습니다.');
    }

    const result = await this.postRepository.delete({ id });

    return result;
  }

  async checkPostExists(id: number) {
    return await this.postRepository.exist({ where: { id } });
  }

  async isPostMine(userId: number, postId: number) {
    const result = await this.postRepository.exist({
      where: {
        id: postId,
        author: {
          id: userId
        }
      },
      relations: {
        author: true
      }
    });

    return result;
  }

  async incrementCommentCount(postId: number, qr?: QueryRunner) {
    const repository = this.getRepository(qr);

    await repository.increment({ id: postId }, 'commentCount', 1);
  }

  async decrementCommentCount(postId: number, qr?: QueryRunner) {
    const repository = this.getRepository(qr);

    await repository.decrement({ id: postId }, 'commentCount', 1);
  }
}
