import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from 'src/common/common.service';
import path from 'path';
import { rename } from 'fs/promises';
import { User } from 'src/user/entity/user.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class MovieService extends CommonService {
    constructor(
        @InjectRepository(Movie)
        private readonly movieRepository: Repository<Movie>,
        @InjectRepository(MovieDetail)
        private readonly movieDetailRepository: Repository<MovieDetail>,
        @InjectRepository(Director)
        private readonly directorRepository: Repository<Director>,
        @InjectRepository(Genre)
        private readonly genreRepository: Repository<Genre>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(MovieUserLike)
        private readonly movieUserLikeRepository: Repository<MovieUserLike>,
        private readonly dataSource: DataSource,
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
    ) {
        super();
    }

    async findRecent() {
        // 캐싱된 데이터 가져오기
        const cacheData = await this.cacheManager.get('MOVIE_RECENT');
        if (cacheData) {
            console.log('Cache hit!');
            return cacheData;
        }

        const data = await this.movieRepository.find({
            order: {
                createdAt: 'DESC',
            },
            take: 10,
        });
        // 데이터 캐싱
        await this.cacheManager.set('MOVIE_RECENT', data);
        return data;
    }

    async findAll(dto: GetMoviesDto, userId?: number) {
        // Page pagination 적용시
        // const { title, take, page } = dto;

        // Cursor pagination 적용시
        const { title } = dto;

        const qb = this.movieRepository
            .createQueryBuilder('movie')
            .leftJoinAndSelect('movie.director', 'director')
            .leftJoinAndSelect('movie.genres', 'genres');

        if (title) {
            qb.where('movie.title LIKE :title', { title: `%${title}%` });
        }

        // Page pagination 적용시
        // if (take && page) {
        //     this.applyPagePaginationParamsToQb(qb, dto);
        // }

        // Cursor pagination 적용시
        const { nextCursor } = await this.applyCursorPaginationParamsToQb(qb, dto);
        let [data, count] = await qb.getManyAndCount();

        if (userId) {
            const movieIds = data.map((movie) => movie.id);
            const likedMovies =
                movieIds.length < 1
                    ? []
                    : await this.movieUserLikeRepository
                          .createQueryBuilder('mul')
                          .leftJoinAndSelect('mul.user', 'user')
                          .leftJoinAndSelect('mul.movie', 'movie')
                          .where('movie.id IN (:...movieIds)', { movieIds })
                          .andWhere('user.id = :userId', { userId })
                          .getMany();

            // Map 형태로 Like/Dislike 데이터 반환
            // { movieId: boolean }
            const likedMovieMap = likedMovies.reduce(
                (acc, next) => ({
                    ...acc,
                    [next.movie.id]: next.isLike,
                }),
                {},
            );

            data = data.map((v) => {
                (v as any).likeStatus = v.id in likedMovieMap ? likedMovieMap[v.id] : null;
                return v;
            });
        }

        return { data, nextCursor, count };
    }

    async findOne(id: number) {
        const movie = await this.movieRepository.findOne({
            where: { id },
            relations: ['detail', 'director', 'genres', 'creator'],
        });
        if (!movie) throw new NotFoundException('존재하지 않는 ID의 영화입니다!');

        return movie;
    }

    async create(createMovieDto: CreateMovieDto, userId: number, qr: QueryRunner) {
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

        const tempFolder = path.join('public', 'temp');
        const movieFolder = path.join('public', 'movie');

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
                movieFilePath: path.join(movieFolder, createMovieDto.movieFileName),
                creator: {
                    id: userId,
                },
            })
            .execute();

        const movieId = movie.identifiers[0].id;

        await qr.manager
            .createQueryBuilder()
            .relation(Movie, 'genres')
            .of(movieId)
            .add(genres.map((genre) => genre.id));

        await rename(
            path.join(process.cwd(), tempFolder, createMovieDto.movieFileName),
            path.join(process.cwd(), movieFolder, createMovieDto.movieFileName),
        );

        // TransactionInterceptor를 사용해서 처리 -> post-request Interceptor에서 트랜잭션 커밋 진행
        // 아직 DB에 반영 전이기 때문에 repository 사용 불가 -> qr.manager 사용 (같은 트랜잭션 안에서 데이터 조회)
        return await qr.manager.findOne(Movie, {
            where: { id: movieId },
            relations: ['detail', 'director', 'genres'],
        });
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
                    .update(MovieDetail)
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

    async toggleMovieLike(movieId: number, userId: number, isLike: boolean) {
        const movie = await this.movieRepository.findOne({
            where: {
                id: movieId,
            },
        });
        if (!movie) throw new BadRequestException('존재하지 않는 영화입니다!');

        const user = await this.userRepository.findOne({
            where: {
                id: userId,
            },
        });
        if (!user) throw new UnauthorizedException('사용자 정보가 없습니다!');

        const likeRecord = await this.movieUserLikeRepository
            .createQueryBuilder('mul')
            .leftJoinAndSelect('mul.movie', 'movie')
            .leftJoinAndSelect('mul.user', 'user')
            .where('movie.id = :movieId', { movieId })
            .andWhere('user.id = :userId', { userId })
            .getOne();
        if (likeRecord) {
            if (isLike === likeRecord.isLike) {
                // Like/Dislike 버튼 누른 상태에서 다시 Like/Dislike 버튼 누른 경우 -> row 삭제
                await this.movieUserLikeRepository.delete({ movie, user });
            } else {
                // Like/Dislike 버튼 누른 상태에서 Dislike/Like 버튼 누른 경우 -> toggle
                await this.movieUserLikeRepository.update(
                    {
                        movie,
                        user,
                    },
                    { isLike },
                );
            }
        } else {
            await this.movieUserLikeRepository.save({ movie, user, isLike });
        }

        const result = await this.movieUserLikeRepository
            .createQueryBuilder('mul')
            .leftJoinAndSelect('mul.movie', 'movie')
            .leftJoinAndSelect('mul.user', 'user')
            .where('movie.id = :movieId', { movieId })
            .andWhere('user.id = :userId', { userId })
            .getOne();

        return { isLike: result && result.isLike };
    }
}
