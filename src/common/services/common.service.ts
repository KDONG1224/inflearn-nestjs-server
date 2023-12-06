import { BadRequestException, Injectable } from '@nestjs/common';
import { BasePaginationDto } from '../dto/base-pagination-dto';
import {
  FindManyOptions,
  FindOptionsOrder,
  FindOptionsWhere,
  Repository
} from 'typeorm';
import { BaseModel } from '../entities/base.entity';
import { FILTER_MAPPER } from '../consts/filter-mapper.const';
import { ConfigService } from '@nestjs/config';
import { ENV_HOST_KEY, ENV_PROTOCOL_KEY } from '../consts/env-keys.const';

@Injectable()
export class CommonService {
  constructor(private readonly configService: ConfigService) {}

  async paginate<T extends BaseModel>(
    dto: BasePaginationDto,
    repository: Repository<T>,
    // find option 중 강제로 덮어쓰고 싶은 데이터 넣는 곳
    overrideFindOptions: FindManyOptions<T> = {},
    path: string
  ) {
    if (dto.page) {
      return this.pagePaginate(dto, repository, overrideFindOptions);
    } else {
      return this.cursorPaginate(dto, repository, overrideFindOptions, path);
    }
  }

  private async pagePaginate<T extends BaseModel>(
    dto: BasePaginationDto,
    repository: Repository<T>,
    overrideFindOptions: FindManyOptions<T> = {}
  ) {
    const findOptions = this.composeFindOptions<T>(dto);

    const [data, count] = await repository.findAndCount({
      ...findOptions,
      ...overrideFindOptions
    });

    return {
      data,
      total: count
    };
  }

  private async cursorPaginate<T extends BaseModel>(
    dto: BasePaginationDto,
    repository: Repository<T>,
    overrideFindOptions: FindManyOptions<T> = {},
    path: string
  ) {
    /**
     * where__likeCount__more_than
     * or
     * where__title__like
     */
    const findOptions = this.composeFindOptions<T>(dto);

    const results = await repository.find({
      ...findOptions,
      ...overrideFindOptions
    });

    const lastItem =
      results.length > 0 && results.length === dto.take
        ? results[results.length - 1]
        : null;

    const protocol = this.configService.get<string>(ENV_PROTOCOL_KEY);
    const host = this.configService.get<string>(ENV_HOST_KEY);

    const nextUrl = lastItem && new URL(`${protocol}://${host}/${path}`);

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

    return {
      data: results,
      cursor: {
        after: lastItem?.id ?? null
      },
      count: results.length,
      next: nextUrl?.toString() ?? null
    };
  }

  private composeFindOptions<T extends BaseModel>(
    dto: BasePaginationDto
  ): FindManyOptions<T> {
    /**
     * DTO의 현재 생긴 구조는 아래와 같다
     *
     * {
     *   where__id__more_than: 1
     *   order__createdAt: 'DESC'
     * }
     *
     * 현재는 where__id_more_than / where__id_less_than에 해당되는 where 필터만 사용중이지만
     * 나중에 where__likeCount_more_than 이나 where__title_ilike 등 추가 필터를 넣고싶어졌을때
     * 모든 where 필터들을 자동으로 파싱 할 수 있을만한 기능을 제작한다.
     *
     * 1) where로 시작한다면 필터 로직을 적용한다.
     * 2) order로 시작한다면 정렬 로직을 적용한다.
     * 3) 필터 로직을 적용한다면 '__' 기준으로 split 했을때 3개의 값으로 나뉘는지
     *    2개의 값으로 나뉘는지 확인한다.
     *    1) 3개의 값으로 나뉜다면 FILTER_MAPPER에서 해당되는 operator 함수를
     *       찾아서 적용한다.
     *    2) 만약에 2개의 값으로 나뉜다면 정확한 값을 필터하는 것이기 때문에
     *       operator 없이 적용한다.
     * 4) order의 경우 3-2와 같이 적용한다.
     */

    let where: FindOptionsWhere<T> = {};
    let order: FindOptionsOrder<T> = {};

    for (const [key, value] of Object.entries(dto)) {
      // where__로 시작하면 where 필터를 파싱한다.
      if (key.startsWith('where__')) {
        where = {
          ...where,
          ...this.parseWhereFilter(key, value)
        };
      } else if (key.startsWith('order__')) {
        // order__로 시작하면 order 필터를 파싱한다.
        order = {
          ...order,
          ...this.parseWhereFilter(key, value)
        };
      }
    }

    return {
      where,
      order,
      take: dto.take,
      skip: dto.page ? (dto.page - 1) * dto.take : 0
    };
  }

  private parseOrderFilter<T extends BaseModel>(
    key: string,
    value: string
  ): FindOptionsOrder<T> {
    const order: FindOptionsOrder<T> = {};

    /**
     * order는 무조건 두개로 스플릿된다.
     *
     * order__createdAt -> ['order', 'createdAt']
     */
    const split = key.split('__');

    if (split.length !== 2) {
      throw new BadRequestException(
        `order 필터는 '__'로 split 했을때 길이가 2여야합니다. - 문제되는 키값 : ${key}`
      );
    }

    const [_, field] = split;

    order[field] = value;

    return order;
  }

  private parseWhereFilter<T extends BaseModel>(
    key: string,
    value: string
  ): FindOptionsWhere<T> {
    const where: FindOptionsWhere<T> = {};

    /**
     * 예를들어 where__id__more_than
     * __를 기준으로 나눴을때
     * ['where', 'id', 'more_than'] 으로 나눌 수 있다.
     * 만약에 하나의 값만
     */
    const split = key.split('__');

    if (split.length !== 2 && split.length !== 3) {
      throw new BadRequestException(
        `where 필터는 '__'로 split 했을때 길이가 2 또는 3이어야합니다 - 문제되는 키값 : ${key}`
      );
    }

    /**
     * 길이가 2일경우는
     * where__id = 3
     * 이런 형태가 나온 경우다.
     *
     * FindOptionsWhere로 풀어보면
     * 아래와 같다.
     * {
     *  where:{
     *      id: 3
     *  }
     * }
     */
    if (split.length === 2) {
      const [_, field] = split;

      where[field] = value;
    } else {
      /**
       * 길이가 3일 경우에는 Typeorm 유틸리티가 적용 필요한 경우다.
       *
       * where__id__more_than의 경우
       * where는 버려도 되고 두번째 값은 필터할 키값이 되고
       * 세번째 값은 오퍼레이터 유틸리티가 된다.
       *
       * FILTER_MAPPER에 미리 정의해둔 값들로
       * field 값에 FILTER_MAPPER에서 해당되는 utility를 가져온 후
       *
       */
      const [_, field, operator] = split;

      const values = value.toString().split(',');

      where[field] = FILTER_MAPPER[operator](
        values.length > 1 ? values : value
      );
    }

    return where;
  }
}
