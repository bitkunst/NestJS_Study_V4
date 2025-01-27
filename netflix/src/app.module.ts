import { Module } from '@nestjs/common';
import { MovieModule } from './movie/movie.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Joi from 'joi';
import path from 'path';

/**
 * @dev
 * TypeOrmModule.forRoot(): 앱 전체에서 사용할 TypeORM 설정을 전역(Global)으로 등록하는 메소드
 * TypeOrmModule.forFeature(): 특정 모듈에서 사용할 엔티티(리포지토리)를 등록하는 메소드
 */

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object({
                ENV: Joi.string().valid('dev', 'prod').required(),
                DB_TYPE: Joi.string().valid('postgres').required(),
                DB_HOST: Joi.string().required(),
                DB_PORT: Joi.number().required(),
                DB_USERNAME: Joi.string().required(),
                DB_PASSWORD: Joi.string().required(),
                DB_DATABASE: Joi.string().required(),
            }),
        }),
        TypeOrmModule.forRootAsync({
            useFactory: (configService: ConfigService) => ({
                type: configService.get<string>('DB_TYPE') as 'postgres',
                host: configService.get<string>('DB_HOST'),
                port: configService.get<number>('DB_PORT'),
                username: configService.get<string>('DB_USERNAME'),
                password: configService.get<string>('DB_PASSWORD'),
                database: configService.get<string>('DB_DATABASE'),
                entities: [path.join(__dirname, '**/*.entity{.ts,.js}')],
                synchronize: true,
            }),
            inject: [ConfigService],
        }),
        MovieModule,
    ],
})
export class AppModule {}
