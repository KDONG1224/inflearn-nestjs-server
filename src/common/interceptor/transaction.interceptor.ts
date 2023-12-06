import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  InternalServerErrorException,
  Injectable
} from '@nestjs/common';
import { Observable, tap, catchError } from 'rxjs';
import { DataSource } from 'typeorm';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    /**
     * 1) 트랜잭션과 관련되 모든 쿼리를 담당할 쿼리 러너를 생성한다.
     * 2) 쿼리 러너를 통해 쿼리를 실행한다.
     * 3) 쿼리 러너에서 트랜젝션을 시작한다.
     *    이 시점부터 같은 쿼리러너를 사용하면
     *    트랜잭션 안에서 데이터베이스 액션을 실행 할 수 있다.
     * 4) 실행할 로직을 작성한다.
     */

    // 1
    const qr = this.dataSource.createQueryRunner();

    // 2
    await qr.connect();

    // 3
    await qr.startTransaction();

    req.queryRunner = qr;

    return next.handle().pipe(
      catchError(async (error) => {
        /**
         * 어떤 에러든 에러가 발생하면
         * 트랜잭션을 종료하고 원래 상태로 되돌린다.
         */

        await qr.rollbackTransaction();
        await qr.release();

        throw new InternalServerErrorException(error.response.message);
      }),
      tap(async () => {
        await qr.commitTransaction();
        await qr.release();
      })
    );
  }
}
