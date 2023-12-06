import {
  ExecutionContext,
  InternalServerErrorException,
  createParamDecorator
} from '@nestjs/common';

export const QueryRunner = createParamDecorator(
  (data, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();

    if (!req.queryRunner) {
      throw new InternalServerErrorException(
        'QueryRunner 데코레이터는 TransactionInterceptor와 함께 사용해야합니다. Request에 queryRunner 프로퍼티가 존재하지 않습니다!'
      );
    }

    return req.queryRunner;
  }
);
