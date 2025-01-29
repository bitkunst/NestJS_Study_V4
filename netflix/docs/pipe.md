## Pipe

-   Pipe는 Controller에서 제공되는 argument들에 적용된다
-   이 argument에는 @Body, @Param 등 이미 우리가 사용하고 있는 입력받는 Annotation들이 모두 포함된다
-   Pipe는 argument 데이터를 가공한 후 Controller 메소드로 값들을 넘겨준다

**transformation**
<br />

-   데이터를 원하는 형태로 변형한다 (예: String에서 Integer로 변환)

**validation**
<br />

-   입력된 값이 정상적인 값인지 확인한다. 아니라면 에러를 던진다

### Global Pipe

```ts
// main.ts 파일
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    // ValidationPipe uses the class-validator and class-transformer libraries
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    );
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

### Controller Pipe

```ts
@Controller('movie')
@UsePipes(new ValidationPipe())
export class MovieController {
    constructor(private readonly movieService: MovieService) {}

    @Get()
    getMovies(@Query('title') title?: string) {
        return this.movieService.findAll();
    }
}
```

### Route Pipe

```ts
@Controller('movie')
export class MovieController {
    constructor(private readonly movieService: MovieService) {}

    @Patch(':id')
    @UsePipes(new ValidationPipe())
    patchMovie(@Param('id') id: string, @Body() body: UpdateMovieDto) {
        return this.movieService.update(+id, body);
    }
}
```

### Route Parameter Pipe

```ts
@Controller('movie')
export class MovieController {
    constructor(private readonly movieService: MovieService) {}

    @Patch(':id')
    patchMovie(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateMovieDto) {
        return this.movieService.update(id, body);
    }
}
```

<br />

## Pipe 종류

### ValidationPipe

-   모든 Validation Annotation이 적용되도록 해준다

### DefaultValuePipe

-   기본값을 설정한다

### [그 외 Built-in Pipes](https://docs.nestjs.com/pipes#built-in-pipes)

### Custom Pipe

-   공통적으로 사용해야할 transformation 기능과 validation 기능이 있다면 Custom Pipe 만들어서 사용

```ts
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
    transform(value: string, metadata: ArgumentMetadata): number {
        const val = parseInt(value, 10);
        if (isNaN(val)) {
            throw new BadRequestException(`Validation failed. "${value}" is not a valid number.`);
        }
        return val;
    }
}
```
