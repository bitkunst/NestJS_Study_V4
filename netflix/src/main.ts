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
            transform: true, // 요청으로 들어온 plain object -> Dto 인스턴스로 변환
            transformOptions: {
                enableImplicitConversion: true, // TS reflected type 기반으로 class-transformer가 입력된 값 변경 (class-transformer가 TS 파일 조회 후 해당 타입으로 변환)
                // 원시타입 필드의 경우 @Type() 없이도 선언된 속성 타입에 맞춰 내부 값을 자동 변환 (원시 타입의 암묵적 변환)
                // 배열 요소 타입(ex: number[])이나 중첩 객체는 리플렉션 정보만으로는 충분하지 않으므로 반드시 @Type() 데코레이터 사용 필요
            },
        }),
    );
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
