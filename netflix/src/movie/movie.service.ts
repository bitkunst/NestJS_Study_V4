import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';

@Injectable()
export class MovieService {
    constructor(
        @InjectRepository(Movie)
        private readonly movieRepository: Repository<Movie>,
        @InjectRepository(MovieDetail)
        private readonly movieDetailRepository: Repository<MovieDetail>,
        @InjectRepository(Director)
        private readonly directorRepository: Repository<Director>,
        @InjectRepository(Genre)
        private readonly genreRepository: Repository<Genre>,
    ) {}

    async findAll(title?: string) {
        if (!title) {
            return [
                await this.movieRepository.find({ relations: ['director', 'genres'] }),
                await this.movieRepository.count(),
            ];
        }

        return await this.movieRepository.findAndCount({
            where: { title: Like(`%${title}%`) },
            relations: ['director', 'genres'],
        });
    }

    async findOne(id: number) {
        const movie = await this.movieRepository.findOne({
            where: { id },
            relations: ['detail', 'director', 'genres'],
        });
        if (!movie) throw new NotFoundException('존재하지 않는 ID의 영화입니다!');

        return movie;
    }

    async create(createMovieDto: CreateMovieDto) {
        // 관계가 존재할 경우 -> 관계 존재 여부 파악 후 서비스 로직 수행
        const director = await this.directorRepository.findOne({ where: { id: createMovieDto.directorId } });
        if (!director) throw new NotFoundException('존재하지 않는 ID의 감독입니다!');

        const genres = await this.genreRepository.find({ where: { id: In(createMovieDto.genreIds) } });
        if (genres.length !== createMovieDto.genreIds.length) {
            throw new NotFoundException(
                `존재하지 않는 장르가 있습니다! 존재하는 Ids -> ${genres.map((genre) => genre.id).join(',')}`,
            );
        }

        // const movieDetail = await this.movieDetailRepository.save({ detail: createMovieDto.detail });
        const movie = await this.movieRepository.save({
            title: createMovieDto.title,
            detail: {
                detail: createMovieDto.detail, // cascade: true 옵션 설정 필요
            },
            director, // cascade: true 옵션 설정 필요
            genres,
        });
        return movie;
    }

    async update(id: number, updateMovieDto: UpdateMovieDto) {
        const movie = await this.movieRepository.findOne({ where: { id }, relations: ['detail'] });
        if (!movie) throw new NotFoundException('존재하지 않는 ID의 영화입니다!');

        const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

        let newDirector: Director;
        if (directorId) {
            const director = await this.directorRepository.findOne({ where: { id: directorId } });
            if (!director) throw new NotFoundException('존재하지 않는 ID의 감독입니다!');
            newDirector = director;
        }

        let newGenres: Genre[];
        if (genreIds) {
            const genres = await this.genreRepository.find({ where: { id: In(genreIds) } });
            if (genres.length !== updateMovieDto.genreIds.length) {
                throw new NotFoundException(
                    `존재하지 않는 장르가 있습니다! 존재하는 Ids -> ${genres.map((genre) => genre.id).join(',')}`,
                );
            }
            newGenres = genres;
        }

        const movieUpdateFields = {
            ...movieRest,
            ...(newDirector && { director: newDirector }),
        };

        await this.movieRepository.update({ id }, movieUpdateFields);
        if (detail) await this.movieDetailRepository.update({ id: movie.detail.id }, { detail });

        const newMovie = await this.movieRepository.findOne({ where: { id }, relations: ['detail', 'director'] });
        // 장르 업데이트 -> ManyToMany 관계에서는 update 메소드를 사용해서 처리 불가 -> save 메소드 사용
        newMovie.genres = newGenres;
        await this.movieRepository.save(newMovie);

        return await this.movieRepository.findOne({ where: { id }, relations: ['detail', 'director', 'genres'] });
    }

    async remove(id: number) {
        const movie = await this.movieRepository.findOne({ where: { id }, relations: ['detail'] });
        if (!movie) throw new NotFoundException('존재하지 않는 ID의 영화입니다!');

        await this.movieRepository.delete(id);
        await this.movieDetailRepository.delete(movie.detail.id);
        return id;
    }
}
