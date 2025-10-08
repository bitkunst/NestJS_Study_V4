## Versioning

-   `URI Versioning`
    -   URI에 버전이 전달된다
    -   /v1/movie
-   `Header Versioning`
    -   Header에 버전이 전달된다
    -   version: 1
-   `Media Type Versioning`
    -   Header의 Accept 키에 버전이 전달된다
    -   Accept: application/json;v=2

### URI Versioning

```ts
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['verbose'],
    });

    app.enableVersioning({
        type: VersioningType.URI,
    });
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

```ts
// /v2/movie
@Controller({
    path: 'movie',
    version: '2',
})
export class MovieControllerV2 {
    @Get()
    getMovies() {
        return [];
    }
}

// /v1/movie
@Controller({
    path: 'movie',
    version: '1',
})
export class MovieController {
    constructor(private readonly movieService: MovieService) {}

    @Get()
    getMovies(@Query() dto: GetMoviesDto, @UserId() userId?: number) {
        return this.movieService.findAll(dto, userId);
    }
}
```

### Header Versioning

```ts
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['verbose'],
    });

    app.enableVersioning({
        type: VersioningType.HEADER,
        header: 'version', // 헤더에 사용할 키값
    });
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

### Media Type Versioning

```ts
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VersioningType } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['verbose'],
    });

    app.enableVersioning({
        type: VersioningType.MEDIA_TYPE,
        key: 'v=', // Accept: application/json;v=1
    });
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```
