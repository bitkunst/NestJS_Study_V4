## Caching

### 캐싱의 사용처

-   랭킹 시스템
    -   최신 영화, 인기 영화 등
-   사용자 세션 데이터
    -   세션 정보 저장, 토큰 검증 프로세스 스킵, 토큰 벤
-   변화가 적은 데이터 캐싱
    -   영화 상세내용
-   외부 API 캐싱
    -   외부 API 결과를 캐싱해서 외부 리소스 사용 비용 절감
-   Rate Limiting, Throttling
    -   사용자의 요청 횟수를 캐싱한 후 특정 횟수를 넘으면 에러를 반환할 수 있다

### 캐싱의 장점

-   퍼포먼스 향상
    -   데이터를 빠르게 가져오고 백엔드 서비스 과부하를 최소화 할 수 있다
-   Scalability
    -   캐싱을 사용하지 않을 때보다 훨씬 높은 트래픽을 감당 할 수 있다
-   비용 절감
    -   비싼 리소스를 캐싱 해두어서 비용 절감 효과를 누릴 수 있다
-   UX 개선
    -   퍼포먼스가 좋아지며 자연스럽게 UX 개선이 된다

### 캐싱의 단점

-   스테일(Stale) 데이터
    -   데이터 신선도(?)가 부족하다. 즉, 최신 데이터가 아니다
-   메모리 사용 증가
    -   캐시는 빠른 접근이 목적이기 때문에 메모리에 저장된다. 메모리 사용량이 늘어난다
-   디자인 복잡성
    -   소프트웨어 아키텍처에 캐시가 포함되면서 디자인 복잡도가 높아진다
-   보안 리스크
    -   적합한 데이터를 캐싱하지 않으면 보안 리스크가 생길 수 있다

### Cache Manager

```sh
$ npm i @nestjs/cache-manager cache-manager
```

```ts
// app.module.ts
import { CacheModule } from '@nestjs/cache-manager';

@Module({
    imports: [
        CacheModule.register({
            ttl: 10 * 1000, // milliseconds
            isGlobal: true,
        }),
    ],
    providers: [],
})
export class AppModule {}
```

```ts
// CacheInterceptor 적용
// CacheInterceptor가 자동으로 해당 end-point의 결과를 캐싱
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';

@Controller('movie')
export class MovieController {
    constructor(private readonly movieService: MovieService) {}

    /* /movie/recent */
    @UseInterceptors(CacheInterceptor) // @UseInterceptors(CacheInterceptor)를 사용해서 캐싱을 할 경우 url을 기반으로 캐싱
    @CacheKey('getMoviesRecent') // url 기반 캐싱 X -> 일괄적으로 사용할 cache-key 설정
    @CacheTTL(1000)
    @Get('recent')
    getMoviesRecent() {
        return this.movieService.findRecent();
    }
}
```

```ts
// 서비스 로직에서 캐싱 적용
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class MovieService extends CommonService {
    constructor(
        @InjectRepository(Movie)
        private readonly movieRepository: Repository<Movie>,
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
    ) {
        super();
    }

    async findRecent() {
        // 캐싱된 데이터 가져오기
        const cacheData = await this.cacheManager.get('MOVIE_RECENT');
        if (cacheData) {
            console.log('Cache hit!');
            return cacheData;
        }

        const data = await this.movieRepository.find({
            order: {
                createdAt: 'DESC',
            },
            take: 10,
        });
        // 데이터 캐싱
        await this.cacheManager.set('MOVIE_RECENT', data);
        return data;
    }
}
```

### Redis Store

```ts
// app.module.ts
import type { RedisClientOptions } from 'redis';
import * as redisStore from 'cache-manager-redis-store';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
    imports: [
        CacheModule.register<RedisClientOptions>({
            store: redisStore,
            host: 'localhost',
            port: 6379,
        }),
    ],
    providers: [],
})
export class AppModule {}
```
