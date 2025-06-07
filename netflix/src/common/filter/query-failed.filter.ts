import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class QueryFailedExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();

        const status = 400;
        let message = 'Database 에러 발생!';

        if (exception.message.includes('duplicate key')) {
            message = '중복 키 에러 발생!';
        }

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message,
        });
    }
}
