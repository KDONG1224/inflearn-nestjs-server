// base
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class PasswordPipe implements PipeTransform {
  /**
   * transform
   * @param value 실제 입력 받은 값
   * @param metadata ArgumentMetadata
   * ArgumentMetadata
   * - type: 'body' | 'query' | 'param' | 'custom'
   * - metatype: any - 내가 직접 정의한 타입
   * - data: string - 내가 직접 정의한 데이터
   * @returns
   */
  transform(value: any) {
    if (value.toString().length > 8) {
      throw new BadRequestException('비밀번호는 8자리 이하로 입력해주세요.');
    }

    return value.toString();
  }
}

@Injectable()
export class MaxLengthPipe implements PipeTransform {
  constructor(
    private readonly length: number,
    private readonly subject: string
  ) {}

  transform(value: any) {
    if (value.toString().length > this.length) {
      throw new BadRequestException(
        `${this.subject} 최대 길이는 ${this.length}입니다.`
      );
    }

    return value.toString();
  }
}

@Injectable()
export class MinLengthPipe implements PipeTransform {
  constructor(private readonly length: number) {}

  transform(value: any) {
    if (value.toString().length < this.length) {
      throw new BadRequestException(
        `비밀번호 최소 길이는 ${this.length}입니다.`
      );
    }

    return value.toString();
  }
}
