import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { CallHandler, ExecutionContext, ForbiddenException, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { Throttle } from '../decorator/throttle.decorator';

// Cache로 Throttling 구현
@Injectable()
export class ThrottleInterceptor implements NestInterceptor {
    constructor(
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
        private readonly reflector: Reflector,
    ) {}

    async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();

        // key -> URL_USERID_MINUTE
        // value -> 요청 count

        const userId = request?.user?.sub;
        if (!userId) {
            // 로그인하지 않은 유저에 대해서는 throttling 적용 X
            // 로그인하지 않은 대상에게도 throttling을 적용하고 싶다 -> IP 사용
            return next.handle();
        }

        const throttleOptions = this.reflector.get<{ count: number; unit: 'minute' }>(Throttle, context.getHandler());
        if (!throttleOptions) {
            // @Throttle 데코레이터 적용하지 않은 end-point에 대해서는 throttling 적용 X
            return next.handle();
        }

        const date = new Date();
        const minute = date.getMinutes();
        const key = `${request.method}_${request.path}_${userId}_${minute}`;
        const count = await this.cacheManager.get<number>(key);

        if (count && count >= throttleOptions.count) {
            throw new ForbiddenException('요청 가능 횟수를 초과했습니다!');
        }

        return next.handle().pipe(
            tap(async () => {
                const count = (await this.cacheManager.get<number>(key)) ?? 0;
                await this.cacheManager.set(key, count + 1, 60 * 1000); // ttl 60s
            }),
        );
    }
}
