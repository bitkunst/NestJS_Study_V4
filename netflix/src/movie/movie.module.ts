import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entity/movie.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';

// TypeOrmModule.forFeature([])
// TypeOrm에서 엔티티에 해당하는 레포지토리를 만들어서 IoC 컨테이너가 inject 해줄 수 있게 등록
@Module({
    imports: [TypeOrmModule.forFeature([Movie, MovieDetail, Director, Genre])],
    controllers: [MovieController],
    providers: [MovieService],
})
export class MovieModule {}
