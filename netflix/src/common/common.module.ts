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
    ],
    controllers: [CommonController],
    providers: [CommonService, TasksService, DefaultLogger],
    exports: [CommonService, DefaultLogger],
})
export class CommonModule {}
