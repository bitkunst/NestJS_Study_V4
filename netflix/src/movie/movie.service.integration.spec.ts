import { Cache, CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entity/movie.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { User } from 'src/user/entity/user.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { MovieService } from './movie.service';
import { DataSource } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { NotFoundException } from '@nestjs/common';

// 테스트 목적: TypeORM 모듈 API가 우리가 작성한 로직과 정상적으로 실행이 되는가
// 검증하고 싶은 것은 TypeORM과 우리 로직 간의 Integration (Unit과 Unit의 조합)
// Unit 테스트에서 모킹했던 것들을 없애고 실제 Repository가 존재하는 형태로 테스트 진행
// Integration Test -> 모킹 없이 실질적인 로직 테스트
describe('MovieService - Integration Test', () => {
    let movieService: MovieService;
    let cacheManager: Cache;
    let dataSource: DataSource;

    let movies: Movie[];
    let directors: Director[];
    let genres: Genre[];
    let users: User[];

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            // AppModule에서 글로벌하게 import 하고 있는 모듈들도 포함
            imports: [
                CacheModule.register(),
                TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:', // 메모리 안에 DB 구축
                    dropSchema: true,
                    entities: [Movie, MovieDetail, Director, Genre, User, MovieUserLike],
                    synchronize: true,
                    logging: false,
                }), // 실제 데이터베이스 연동은 e2e 테스트에서 진행
                TypeOrmModule.forFeature([Movie, MovieDetail, Director, Genre, User, MovieUserLike]),
            ],
            providers: [MovieService],
        }).compile();

        movieService = module.get<MovieService>(MovieService);
        cacheManager = module.get<Cache>(CACHE_MANAGER);
        dataSource = module.get<DataSource>(DataSource);
    });

    it('should be defined', () => {
        expect(movieService).toBeDefined();
    });

    afterAll(async () => {
        await dataSource.destroy();
    });

    // SQLite DB에 실제 데이터 seeding (모킹 X)
    beforeEach(async () => {
        await cacheManager.clear();

        const movieRepository = dataSource.getRepository(Movie);
        const movieDetailRepository = dataSource.getRepository(MovieDetail);
        const directorRepository = dataSource.getRepository(Director);
        const genreRepository = dataSource.getRepository(Genre);
        const userRepository = dataSource.getRepository(User);
        // const movieUserLikeRepository = dataSource.getRepository(MovieUserLike);

        // Seed 데이터 생성
        users = [1, 2].map((v) =>
            userRepository.create({
                id: v,
                email: `${v}@test.com`,
                password: `123123`,
            }),
        );
        await userRepository.save(users);

        directors = [1, 2].map((v) =>
            directorRepository.create({
                id: v,
                dob: new Date('2025-11-08'),
                nationality: 'South Korea',
                name: `Director Name ${v}`,
            }),
        );
        await directorRepository.save(directors);

        genres = [1, 2].map((v) =>
            genreRepository.create({
                id: v,
                name: `Genre ${v}`,
            }),
        );
        await genreRepository.save(genres);

        movies = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((v) =>
            movieRepository.create({
                id: v,
                title: `Movie ${v}`,
                creator: users[0],
                genres,
                likeCount: 0,
                dislikeCount: 0,
                detail: movieDetailRepository.create({
                    detail: `Movie Detail ${v}`,
                }),
                movieFilePath: 'movies/movie1.mp4',
                director: directors[0],
                createdAt: new Date(`2024-11-08`),
            }),
        );
        await movieRepository.save(movies);
    });

    describe('findRecent', () => {
        it('should return recent movies', async () => {
            const result = (await movieService.findRecent()) as Movie[];
            const sortedResult = [...movies];
            sortedResult.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            const sortedResultIds = sortedResult.slice(0, 10).map((v) => v.id);

            expect(result).toHaveLength(10);
            expect(result.map((v) => v.id)).toEqual(sortedResultIds);
        });

        it('should cache recent movies', async () => {
            const result = (await movieService.findRecent()) as Movie[];
            const cachedData = await cacheManager.get('MOVIE_RECENT');

            expect(cachedData).toEqual(result);
        });
    });

    describe('findAll', () => {
        it('should return movies with correct titles', async () => {
            const dto = {
                title: 'Movie 15',
                order: ['createdAt_DESC'],
                take: 10,
            };

            const result = await movieService.findAll(dto);

            expect(result.data).toHaveLength(1);
            expect(result.data[0].title).toBe(dto.title);
            expect(result.data[0]).not.toHaveProperty('likeStatus');
        });

        it('should return likeStatus if userId is provided', async () => {
            const dto = {
                order: ['createdAt_ASC'],
                take: 10,
            };

            const result = await movieService.findAll(dto, users[0].id);

            expect(result.data).toHaveLength(10);
            expect(result.data[0]).toHaveProperty('likeStatus');
        });
    });

    describe('findOne', () => {
        it('should return movie correctly', async () => {
            const movieId = movies[0].id;

            const result = await movieService.findOne(movieId);

            expect(result.id).toBe(movieId);
        });

        it('should throw NotFoundException if movie does not exist', async () => {
            await expect(movieService.findOne(99999)).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        beforeEach(() => {
            jest.spyOn(movieService, 'renameMovieFile').mockResolvedValue();
        });
        it('should create movie correctly', async () => {
            const createMovieDto: CreateMovieDto = {
                title: 'Test Movie',
                detail: 'A Test Movie Detail',
                directorId: directors[0].id,
                genreIds: genres.map((v) => v.id),
                movieFileName: 'test.mp4',
            };

            const result = await movieService.create(createMovieDto, users[0].id, dataSource.createQueryRunner());
            console.log('result', result);

            expect(result.title).toBe(createMovieDto.title);
            expect(result.director.id).toBe(createMovieDto.directorId);
            expect(result.genres.map((v) => v.id)).toEqual(genres.map((v) => v.id));
            expect(result.detail.detail).toBe(createMovieDto.detail);
        });
    });

    describe('update', () => {
        it('should update movie correctly', async () => {
            const movieId = movies[0].id;
            const updateMovieDto: UpdateMovieDto = {
                title: 'Updated Title',
                detail: 'Updated Detail',
                directorId: directors[1].id,
                genreIds: [genres[0].id],
            };

            const result = await movieService.update(movieId, updateMovieDto);

            expect(result.title).toBe(updateMovieDto.title);
            expect(result.detail.detail).toBe(updateMovieDto.detail);
            expect(result.director.id).toBe(updateMovieDto.directorId);
            expect(result.genres.map((v) => v.id)).toEqual(updateMovieDto.genreIds);
        });

        it('should throw error if movie does not exist', async () => {
            const updateMovieDto: UpdateMovieDto = {
                title: 'Updated',
            };

            await expect(movieService.update(99999, updateMovieDto)).rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => {
        it('should remove movie correctly', async () => {
            const removeId = movies[0].id;

            const result = await movieService.remove(removeId);

            expect(result).toBe(removeId);
        });

        it('should throw error if movie does not exist', async () => {
            await expect(movieService.remove(99999)).rejects.toThrow(NotFoundException);
        });
    });

    describe('toggleMovieLike', () => {
        it('should create like correctly', async () => {
            const movieId = movies[0].id;
            const userId = users[0].id;

            const result = await movieService.toggleMovieLike(movieId, userId, true);

            expect(result).toEqual({ isLike: true });
        });

        it('should create dislike correctly', async () => {
            const movieId = movies[0].id;
            const userId = users[0].id;

            const result = await movieService.toggleMovieLike(movieId, userId, false);

            expect(result).toEqual({ isLike: false });
        });

        it('should toggle like correctly', async () => {
            const movieId = movies[0].id;
            const userId = users[0].id;

            await movieService.toggleMovieLike(movieId, userId, true);
            const result = await movieService.toggleMovieLike(movieId, userId, true);

            expect(result.isLike).toBeNull();
        });

        it('should toggle dislike correctly', async () => {
            const movieId = movies[0].id;
            const userId = users[0].id;

            await movieService.toggleMovieLike(movieId, userId, false);
            const result = await movieService.toggleMovieLike(movieId, userId, false);

            expect(result.isLike).toBeNull();
        });
    });
});
