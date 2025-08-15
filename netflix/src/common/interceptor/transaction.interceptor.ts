import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { catchError, Observable, tap } from 'rxjs';
import { DataSource } from 'typeorm';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
    constructor(private readonly dataSource: DataSource) {}

    async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
        const req = context.switchToHttp().getRequest();

        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();

        // req 객체 안에 queryRunner 삽입
        req.queryRunner = qr;

        return next.handle().pipe(
            // 에러 발생시 catchError()의 콜백함수 실행
            catchError(async (e) => {
                console.error(e);
                await qr.rollbackTransaction();
                await qr.release();
                throw e;
            }),
            // 값이 흘러올 때마다 tap()의 콜백함수 실행
            tap(async () => {
                await qr.commitTransaction();
                await qr.release();
            }),
        );
    }
}
