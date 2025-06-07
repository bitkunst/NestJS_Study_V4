## Interceptor

### Interceptor란?

-   Interceptor는 NestJS에서 유일하게 요청이 들어올 때 그리고 응답이 나갈 때 모두 로직을 실행할 수 있는 미들웨어다
-   Interceptor는 아래 기능들을 수행할 수 있다
    -   함수 실행 전/후에 추가 로직을 바인딩한다
    -   함수에서 반환된 값을 변환한다
    -   함수에서 던진 에러를 변환한다
    -   함수의 기본 기능에 추가 기능을 연장한다
    -   조건에 따라 함수의 기능을 override 한다
-   Interceptor Response 핸들링은 기본적으로 RxJS를 사용한다

### Interceptor 구현

```ts
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
            tap(() => {
                const resTime = Date.now();
                const diff = resTime - reqTime;

                console.log(`[${req.method} ${req.path}] ${diff}ms`);
            }),
        );
    }
}
```
