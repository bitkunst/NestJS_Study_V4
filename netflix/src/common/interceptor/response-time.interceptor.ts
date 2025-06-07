import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
        // pre-controller interceptor
        const req = context.switchToHttp().getRequest();

        const reqTime = Date.now();

        return next.handle().pipe(
            // post-request interceptor
            // pipe()에 전달된 Operator Function들은 순서대로 실행된다
            tap(() => {
                const resTime = Date.now();
                const diff = resTime - reqTime;

                console.log(`[${req.method} ${req.path}] ${diff}ms`);
            }),
        );
    }
}
