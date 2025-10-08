## Swagger

```sh
$ npm i @nestjs/swagger
```

```ts
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['verbose'],
    });

    // Swagger
    const config = new DocumentBuilder()
        .setTitle('Netflix')
        .setDescription('넷플릭스 클론 API')
        .setVersion('1.0')
        .addBasicAuth()
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

```json
// nest-cli.json
{
    "$schema": "https://json.schemastore.org/nest-cli",
    "collection": "@nestjs/schematics",
    "sourceRoot": "src",
    "compilerOptions": {
        "deleteOutDir": true,
        "plugins": ["@nestjs/swagger"] // swagger plugin 추가
    }
}
```
