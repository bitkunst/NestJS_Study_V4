import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entity/movie.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path from 'path';
import { v4 } from 'uuid';

// TypeOrmModule.forFeature([])
// TypeOrm에서 엔티티에 해당하는 레포지토리를 만들어서 IoC 컨테이너가 inject 해줄 수 있게 등록
@Module({
    imports: [
        TypeOrmModule.forFeature([Movie, MovieDetail, Director, Genre]),
        MulterModule.register({
            // diskStorage -> 서버의 파일시스템에 저장
            // process.cwd() -> 프로젝트의 루트 경로
            storage: diskStorage({
                destination: path.join(process.cwd(), 'public', 'movie'),
                filename: (req, file, callback) => {
                    const split = file.originalname.split('.');
                    let extension = 'mp4';
                    if (split.length > 1) extension = split[split.length - 1];
                    callback(null, `${v4()}_${Date.now()}.${extension}`); // callback 파라미터로 '파일이름' 전달
                },
            }),
        }),
    ],
    controllers: [MovieController],
    providers: [MovieService],
})
export class MovieModule {}
