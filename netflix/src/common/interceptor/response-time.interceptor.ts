import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
        // pre-controller interceptor
        // next.handle()이 반환되기 전까지의 코드는 end-point 로직이 실행되기 전에 실행 (요청이 실행되기 직전)
        const req = context.switchToHttp().getRequest();

        const reqTime = Date.now();

        return next.handle().pipe(
            // post-request interceptor
            // next.handle()을 실행하는 순간에 이미 end-point 로직은 실행이 된 상태 (응답이 완성된 직후)
            // pipe()에 전달된 Operator Function들은 순서대로 실행된다
            tap(() => {
                // tap() -> 전달된 콜백함수를 비파괴적으로 실행
                const resTime = Date.now();
                const diff = resTime - reqTime;

                console.log(`[${req.method} ${req.path}] ${diff}ms`);
            }),
        );
    }
}
