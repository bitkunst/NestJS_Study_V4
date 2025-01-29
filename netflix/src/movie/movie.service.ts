import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Like, Repository } from 'typeorm';
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
        private readonly dataSource: DataSource,
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
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            // 관계가 존재할 경우 -> 관계 존재 여부 파악 후 서비스 로직 수행
            const director = await qr.manager.findOne(Director, { where: { id: createMovieDto.directorId } });
            if (!director) throw new NotFoundException('존재하지 않는 ID의 감독입니다!');

            const genres = await qr.manager.find(Genre, { where: { id: In(createMovieDto.genreIds) } });
            if (genres.length !== createMovieDto.genreIds.length) {
                throw new NotFoundException(
                    `존재하지 않는 장르가 있습니다! 존재하는 Ids -> ${genres.map((genre) => genre.id).join(',')}`,
                );
            }

            const movieDetail = await qr.manager
                .createQueryBuilder()
                .insert()
                .into(MovieDetail)
                .values({
                    detail: createMovieDto.detail,
                })
                .execute();

            const movieDetailId = movieDetail.identifiers[0].id;

            const movie = await qr.manager
                .createQueryBuilder()
                .insert()
                .into(Movie)
                .values({
                    title: createMovieDto.title,
                    detail: {
                        id: movieDetailId,
                    },
                    director,
                })
                .execute();

            const movieId = movie.identifiers[0].id;

            await qr.manager
                .createQueryBuilder()
                .relation(Movie, 'genres')
                .of(movieId)
                .add(genres.map((genre) => genre.id));

            await qr.commitTransaction();

            return await this.movieRepository.findOne({
                where: { id: movieId },
                relations: ['detail', 'director', 'genres'],
            });
        } catch (error) {
            await qr.rollbackTransaction();
            throw error;
        } finally {
            await qr.release();
        }
    }

    async update(id: number, updateMovieDto: UpdateMovieDto) {
        const qr = this.dataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();
        try {
            const movie = await qr.manager.findOne(Movie, { where: { id }, relations: ['detail', 'genres'] });
            if (!movie) throw new NotFoundException('존재하지 않는 ID의 영화입니다!');

            const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

            let newDirector: Director;
            if (directorId) {
                const director = await qr.manager.findOne(Director, { where: { id: directorId } });
                if (!director) throw new NotFoundException('존재하지 않는 ID의 감독입니다!');
                newDirector = director;
            }

            let newGenres: Genre[];
            if (genreIds) {
                const genres = await qr.manager.find(Genre, { where: { id: In(genreIds) } });
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

            await qr.manager
                .createQueryBuilder()
                .update(Movie)
                .set(movieUpdateFields)
                .where('id = :id', { id })
                .execute();

            if (detail) {
                await qr.manager
                    .createQueryBuilder()
                    .update()
                    .set({ detail })
                    .where('id = :id', { id: movie.detail.id })
                    .execute();
            }

            if (newGenres) {
                await qr.manager
                    .createQueryBuilder()
                    .relation(Movie, 'genres')
                    .of(id)
                    .addAndRemove(
                        newGenres.map((genre) => genre.id),
                        movie.genres.map((genre) => genre.id),
                    );
            }

            await qr.commitTransaction();

            return await this.movieRepository.findOne({ where: { id }, relations: ['detail', 'director', 'genres'] });
        } catch (error) {
            await qr.rollbackTransaction();
            throw error;
        } finally {
            await qr.release();
        }
    }

    async remove(id: number) {
        const movie = await this.movieRepository.findOne({ where: { id }, relations: ['detail'] });
        if (!movie) throw new NotFoundException('존재하지 않는 ID의 영화입니다!');

        await this.movieRepository.delete(id);
        await this.movieDetailRepository.delete(movie.detail.id);
        return id;
    }
}
