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
            transformOptions: {
                enableImplicitConversion: true, // TS reflected type 기반으로 class-transformer가 입력된 값 변경 (class-transformer가 TS 파일 조회 후 해당 타입으로 변환)
            },
        }),
    );
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
