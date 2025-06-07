## Exception Filter

### Exception Filter란?

-   NestJS에서는 자체적으로 예외 레이어를 관리한다
-   서버에서 발생한 예외가 따로 핸들링 되지 않으면 NestJS는 예외 레이어에서 에러를 사용자 친화적으로 변환해서 응답할 수 있다
-   Exception Filter를 사용해 에러가 발생했을 때 해당 에러를 잡아서 추가적인 액션을 하거나 에러에 대한 반환값을 변경하는 등의 작업을 수행

### Exception Filter 구현

```ts
import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        // ArgumentsHost는 execution context의 부모
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();

        const status = exception.getStatus();

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
}
```
