## Logger

### Winston

```sh
$ npm i winston nest-winston
$ npm i -D @types/winston
```

```ts
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['verbose'],
    });

    // Winston 사용
    app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

```ts
// app.module.ts
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

@Module({
    imports: [
        WinstonModule.forRoot({
            level: 'debug',
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize({ all: true }),
                        winston.format.timestamp(),
                        winston.format.printf(
                            (info) => `${info.timestamp} [${info.context}] ${info.level} ${info.message}`,
                        ),
                    ),
                }),
                new winston.transports.File({
                    dirname: path.join(process.cwd(), 'logs'),
                    filename: 'logs.log',
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.printf(
                            (info) => `${info.timestamp} [${info.context}] ${info.level} ${info.message}`,
                        ),
                    ),
                }),
            ],
        }),
    ],
    providers: [],
})
export class AppModule {}
```
