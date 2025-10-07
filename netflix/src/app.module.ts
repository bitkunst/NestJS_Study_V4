import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { MovieModule } from './movie/movie.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DirectorModule } from './director/director.module';
import { GenreModule } from './genre/genre.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import Joi from 'joi';
import path from 'path';
import { envVariableKeys } from './common/constant/env.constant';
import { BearerTokenMiddleware } from './auth/middleware/bearer-token.middleware';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthGuard } from './auth/guard/auth.guard';
import { RBACGuard } from './auth/guard/rbac.guard';
import { ResponseTimeInterceptor } from './common/interceptor/response-time.interceptor';
import { ForbiddenExceptionFilter } from './common/filter/forbidden.filter';
import { QueryFailedExceptionFilter } from './common/filter/query-failed.filter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { CommonModule } from './common/common.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottleInterceptor } from './common/interceptor/throttle.interceptor';
import { ScheduleModule } from '@nestjs/schedule';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

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
                HASH_ROUNDS: Joi.number().required(),
                ACCESS_TOKEN_SECRET: Joi.string().required(),
                REFRESH_TOKEN_SECRET: Joi.string().required(),
            }),
        }),
        TypeOrmModule.forRootAsync({
            useFactory: (configService: ConfigService) => ({
                type: configService.get<string>(envVariableKeys.dbType) as 'postgres',
                host: configService.get<string>(envVariableKeys.dbHost),
                port: configService.get<number>(envVariableKeys.dbPort),
                username: configService.get<string>(envVariableKeys.dbUsername),
                password: configService.get<string>(envVariableKeys.dbPassword),
                database: configService.get<string>(envVariableKeys.dbDatabase),
                entities: [path.join(__dirname, '**/*.entity{.ts,.js}')],
                synchronize: true,
                // logging: true,
            }),
            inject: [ConfigService], // IoC 컨테이너에서 ConfigService를 inject
        }),
        ServeStaticModule.forRoot({
            rootPath: path.join(process.cwd(), 'public'), // 어떤 디렉토리로부터 파일들을 서빙할지 설정
            serveRoot: '/public/', // rootPath에서 서빙해주는 경로에 serveRoot를 붙였을 때 해당되는 파일들을 가져올 수 있다
            // 서버에서 파일을 찾을 때는 rootPath에서 찾는다 -> rootPath 경로에 있는 파일을 가져오기 위해서는 serveRoot를 앞에 붙여서 요청해야 한다
        }),
        CacheModule.register({
            ttl: 10 * 1000, // millisecond
            isGlobal: true,
        }),
        ScheduleModule.forRoot(),
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
        CommonModule,
        MovieModule,
        DirectorModule,
        GenreModule,
        AuthModule,
        UserModule,
    ],
    providers: [
        // providers 배열에 나열된 순서대로 해당 가드들을 차례대로 실행
        {
            // Global하게 Guard 적용
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: RBACGuard,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ResponseTimeInterceptor,
        },
        // {
        //     provide: APP_FILTER,
        //     useClass: ForbiddenExceptionFilter,
        // },
        {
            provide: APP_FILTER,
            useClass: QueryFailedExceptionFilter,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ThrottleInterceptor,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        // consumer를 사용해 Middleware 적용
        consumer
            .apply(BearerTokenMiddleware)
            .exclude(
                {
                    path: 'auth/login',
                    method: RequestMethod.POST,
                },
                {
                    path: 'auth/login/passport',
                    method: RequestMethod.POST,
                },
                {
                    path: 'auth/register',
                    method: RequestMethod.POST,
                },
            )
            .forRoutes('*');
    }
}
