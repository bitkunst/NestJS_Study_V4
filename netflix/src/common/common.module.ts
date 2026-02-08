import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path from 'path';
import { v4 } from 'uuid';
import { TasksService } from './tasks.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from 'src/movie/entity/movie.entity';
import { DefaultLogger } from './logger/default.logger';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { envVariableKeys } from './constant/env.constant';

@Module({
    imports: [
        MulterModule.register({
            // diskStorage -> 서버의 파일시스템에 저장
            // process.cwd() -> 프로젝트의 루트 경로
            storage: diskStorage({
                destination: path.join(process.cwd(), 'public', 'temp'),
                filename: (req, file, callback) => {
                    const split = file.originalname.split('.');
                    let extension = 'mp4';
                    if (split.length > 1) extension = split[split.length - 1];
                    callback(null, `${v4()}_${Date.now()}.${extension}`); // callback 파라미터로 '파일이름' 전달
                },
            }),
        }),
        TypeOrmModule.forFeature([Movie]),
        BullModule.forRootAsync({
            useFactory: (configService: ConfigService) => ({
                connection: {
                    host: configService.get<string>(envVariableKeys.redisHost),
                    port: Number(configService.get<number>(envVariableKeys.redisPort)),
                    username: configService.get<string>(envVariableKeys.redisUsername),
                    password: configService.get<string>(envVariableKeys.redisPassword),
                },
            }),
            inject: [ConfigService],
        }),
        BullModule.registerQueue({
            name: 'thumbnail-generation', // Queue 이름 (실제 작업에 대한 이름)
        }),
    ],
    controllers: [CommonController],
    providers: [CommonService, TasksService, DefaultLogger],
    exports: [CommonService, DefaultLogger],
})
export class CommonModule {}
