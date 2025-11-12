## Testing

### Mock / Stub / Fake

-   테스트할 때 의존성(Dependency)을 해결하는 방법이 다양하게 존재한다
-   모든 의존성(데이터베이스 등)을 그대로 사용하는 테스트도 존재하지만 그런 테스트는 너무 무겁고 오래 걸린다
-   일반적으로 Dependency를 각자 객체로 스왑 후 사용한다

### Mock

-   Mock은 상호작용을 검증하는 객체이다
-   행위(실행됐는지, 반환을 했는지, 에러를 던졌는지 등)를 검증

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';

describe('UserService with Mock', () => {
    let userService: UserService;
    // Mock 타입 정의: findById 메소드를 jest.Mock으로 지정
    let userRepositoryMock: { findById: jest.Mock };

    beforeEach(async () => {
        // Mock 생성하기
        userRepositoryMock = { findById: jest.fn() };

        // Nest 테스트 모듈 구성: UserRepository 토큰에 Mock 주입
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService, // 실제 서비스
                { provide: UserRepository, useValue: userRepositoryMock }, // Repository Mock
            ],
        }).compile();

        userService = module.get<UserService>(UserService);
    });

    it('should call findById on UserRepository', () => {
        const userId = '1';
        // 서비스 메소드 호출 (서비스 내부에서 UserRepository.findById 사용 가정)
        userService.findUserById(userId);

        // 실행된 것 확인: 특정 파라미터로 호출되었는지
        expect(userRepositoryMock.findById).toHaveBeenCalledWith(userId);

        // 한번만 호출된 것 확인
        expect(userRepositoryMock.findById).toHaveBeenCalledTimes(1);
    });
});
```

### Stub

-   Stub은 함수나 객체의 간소화된 버전으로 미리 정의된 값을 반환한다
-   반환값 검증

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';

describe('UserService with Stub', () => {
    let userService: UserService;

    beforeEach(async () => {
        // Stub 생성하기: 항상 고정된 값을 반환(간단·정적)
        const userRepositoryStub = {
            findById: (id: string) => ({ id, name: 'Stubbed User' }),
        };

        // Nest 테스트 모듈 구성: UserRepository 토큰에 Stub 주입
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService, // 실제 서비스
                { provide: UserRepository, useValue: userRepositoryStub }, // Repository Stub
            ],
        }).compile();

        userService = module.get<UserService>(UserService);
    });

    it('should return the stubbed user', () => {
        const userId = '1';
        // 서비스 메소드 호출(서비스 내부에서 UserRepository.findById 사용 가정)
        const result = userService.findUserById(userId);

        // 반환값 검증: Stub에서 정해둔 고정 응답이 나오는지 확인
        expect(result).toEqual({ id: userId, name: 'Stubbed User' });
    });
});
```

### Fake

-   Fake는 실제 객체를 간소하게 구현한 형태이다
-   복잡한 실제 객체의 작동 방식을 최소화하여 구현한 형태이다
-   실제 객체는 너무 헤비하지만 Stub 보다는 현실적인 작동이 필요할 때 많이 사용된다

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';

// Fake 생성: 실제 UserRepository와 비슷하게 클래스 생성
// 실제 어떤 기능을 갖고 있는 클래스/함수를 간단하지만 비슷하게 구현
class FakeUserRepository {
    private users = [{ id: '1', name: 'Fake User' }];

    findById(id: string) {
        return this.users.find((user) => user.id === id) || null;
    }
}

describe('UserService with Fake', () => {
    let userService: UserService;

    // Nest 테스트 모듈 구성: UserRepository 토큰에 Fake 클래스 주입
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                { provide: UserRepository, useClass: FakeUserRepository }, // Fake
            ],
        }).compile();

        userService = module.get<UserService>(UserService);
    });

    it('should return the fake user', () => {
        const userId = '1';
        // 서비스 메서드 호출 (서비스 내부에서 UserRepository.findById 사용 가정)
        const result = userService.findUserById(userId);

        // 결과값 검증: Fake에서 정의한 유저가 그대로 반환
        expect(result).toEqual({ id: userId, name: 'Fake User' });
    });

    it('should return null if user is not found', () => {
        const userId = '2';
        const result = userService.findUserById(userId);

        // 결과값 검증
        expect(result).toBeNull();
    });
});
```

### Mock vs Stub vs Fake

| 항목          | Mock                                               | Stub                                                   | Fake                                                     |
| ------------- | -------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------- |
| **목적**      | 객체 간의 상호작용과 동작을 검증한다.              | 특정 로직을 테스트하기 위해 미리 정의된 값을 반환한다. | 최소한의 기능을 갖춘 실제 객체를 시뮬레이션한다.         |
| **동작**      | 메소드 호출, 파라미터 등을 확인한다.               | 정적이고 단순하며 지정된 아웃풋을 반환한다.            | 실제 객체의 동작을 모방한다.                             |
| **복잡도**    | 동적이며 다양한 설정을 통해 복잡하게 만들 수 있다. | 더욱 간단하며 정적인 응답을 제공한다.                  | 스텁보다는 복잡하지만 실제 객체보다는 덜 복잡하다.       |
| **사용 예시** | 메소드가 테스트에서 올바르게 호출됐는지 확인한다.  | 특정 반환 값을 제공하여 단위 테스트를 격리한다.        | 테스트를 위해 실제 종속성 없이 최소한의 구현을 제공한다. |

> 의존성 해결을 해주는 객체가 셋 중 어느 하나에 속한다고 생각할 필요는 없다. <br/>
> Mock이면서 Stub일 수 있다. 명칭은 위와같이 정의하지만 일반적으론 일괄적으로 `Mock`이라고 부른다.

### Testing의 종류

-   `Unit Testing` : 함수나 클래스처럼 가장 작은 단위의 로직을 '독립적으로' 테스트한다
-   `Integration Testing` : 데이터베이스 등 다양한 서비스의 요소들을 함께 실행했을 때 문제가 없는지 확인한다
-   `End to End Testing` : 사용자의 관점에서 서비스를 사용했을 때 프로그램이 정상적으로 작동하는지 확인한다

### Testing 하지 않는 것들

-   **_프레임워크 기능_**
    -   근본적으로 프레임워크 자체적으로 유닛 테스트가 있을거란 가정을 한다. 예를 들어 NestJS의 UseGuard Annotation이 잘 작동하는지 테스트하지 않는다
    -   NestJS 프레임워크에서 테스트가 잘 됐을거라고 가정한다. 그럼에도 정말 하고 싶다면 절대로 하면 안되는건 아니다
-   **_외부 디펜던시_**
    -   낮은 수준의 테스트일수록(Unit Test, Integration Test) TypeORM, Logger 등 외부 디펜던시가 잘 작동하는지 테스트하지 않는다
    -   대신 Mock, Stub, Fake를 사용해서 기능을 모방하고 실제 내 코드상의 중요한 로직을 테스트한다. 근본적으로 내 코드가 아니면 테스트하지 않는다
-   **_퍼포먼스_**
    -   퍼포먼스 테스트는 보통 다른 로드 테스트 툴을 사용해서 진행한다. Unit Test, Integration Test, End to End Test 등은 근본적으로 로직의 정상 작동 여부를 테스트한다
    -   퍼포먼스와 로드 테스트는 따로 진행하도록 한다
-   **_로직이 없는 코드_**
    -   초보자들이 coverage를 올리기 위해서 흔히 하는 실수다. NestJS를 예를들면 Dto나 Entity를 테스트할 필요 없다
    -   그냥 ignore 리스트에 넣어버리자

<br />

---

<br />

### Jest

-   `jest.fn()`
    -   정의: jest.fn()은 독립 모의 함수(mock function)를 생성하는 유틸리티이다. 특정 객체의 메소드를 감싸는 jest.spyOn()과 달리, 어떤 객체에도 속하지 않은 함수 더블을 만들 때 사용한다
    -   기본 동작: 인자 없이 jest.fn()만 호출하면 아무 동작도 하지 않고 undefined를 반환하는 함수가 생성된다
    -   반환값: jest.fn()은 모의 함수 객체(jest.Mock)를 반환한다. 이 객체는 함수로서 호출 가능하며 동시에 모킹 상태(state)와 제어 메서드(API)를 제공한다
-   `jest.spyOn()`
    -   jest.spyOn(obj, 'method')
    -   정의: 객체의 특정 메소드(또는 접근자 getter/setter)를 스파이 가능(mock 가능)한 래퍼로 바꾼다
    -   기본 동작: 스파이 직후에는 원래 구현을 그대로 호출(call-through)한다. 이후 필요할 때 mockImplementation, mockReturnValue, mockResolvedValue 등으로 동작을 교체한다
    -   반환값: jest.SpyInstance<Return, Args> — 호출 기록 검증 및 mock 동작 제어 API를 제공

### Jest 설정

-   `"rootDir": "."`
    -   rootDir은 기준 경로(베이스)를 정하는 옵션
    -   rootDir은 모든 경로 패턴의 기준 디렉토리
        -   `<rootDir>`의 토큰값이 되며 "moduleNameMapper", "collectCoverageFrom", "testRegex" 등의 상대 기준점이 된다
    -   "rootDir": "."은 “프로젝트 루트를 기준으로 삼는다”는 뜻
        -   탐색 범위를 제한하지는 않는다
-   `"roots: ["src"]"`
    -   roots는 Jest가 테스트/모듈을 탐색할 디렉토리 집합을 한정하는 옵션
    -   Jest가 파일을 스캔할 디렉토리 목록
        -   지정한 디렉토리 밖에 있는 테스트/모듈은 탐색하지 않는다
        -   `"roots": ["src"]`이면, src 하위만 스캔
    -   기본값: `["<rootDir>"]`

```json
{
    "jest": {
        "moduleFileExtensions": ["js", "json", "ts"],
        // rootDir은 지정하지 않았으므로 "기본값 = 프로젝트 루트"
        "roots": ["src"], // 테스트의 탐색 범위가 src 디렉토리로 제한
        "testRegex": ".*\\.spec\\.ts$",
        "transform": {
            "^.+\\.(t|j)s$": "ts-jest"
        },
        "collectCoverageFrom": ["**/*.(t|j)s"],
        "coveragePathIgnorePatterns": [
            "module.ts",
            "dto.ts",
            "entity.ts",
            "guard.ts",
            "middleware.ts",
            "strategy.ts",
            "decorator.ts",
            "pipe.ts",
            "common/*",
            "main.ts"
        ],
        "coverageDirectory": "./coverage",
        "testEnvironment": "node",
        "moduleNameMapper": {
            // 여기서 <rootDir>은 "프로젝트 루트"를 의미
            // import 'src/...' -> 실제 경로 /<프로젝트 루트>/src/... 로 매핑
            "src/(.*)": "<rootDir>/src/$1"
        }
    }
}
```

### Jest Automock 라이브러리

```sh
# 모킹함수를 자동으로 만들어주는 라이브러리
# NestJS에서 automock을 사용할 수 있도록 제공해주는 어댑터
$ npm i -D @automock/jest @automock/adapters.nestjs
```

```ts
// 기존 테스트 코드
import { Test, TestingModule } from '@nestjs/testing';
import { MovieService } from './movie.service';
import { Movie } from './entity/movie.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

const mockMovieRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    // 기타 레포지토리 함수 모킹
    // ...
};

describe('MovieService', () => {
    let movieService: MovieService;
    let movieRepository: Repository<Movie>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MovieService,
                {
                    provide: getRepositoryToken(Movie),
                    useValue: mockMovieRepository,
                },
            ],
        }).compile();

        movieService = module.get<MovieService>(MovieService);
        movieRepository = module.get<Repository<Movie>>(getRepositoryToken(Movie));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(movieService).toBeDefined();
    });
});
```

```ts
// automock 사용 테스트 코드
import { DataSource, Repository } from 'typeorm';
import { MovieService } from './movie.service';
import { TestBed } from '@automock/jest';
import { Movie } from './entity/movie.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { User } from 'src/user/entity/user.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('MovieService', () => {
    let movieService: MovieService;
    // jest.Mocked<> 형태로 타입 지정을 할 경우 jest.spyOn() 없이도 mock 값 주입 가능
    let movieRepository: jest.Mocked<Repository<Movie>>;
    let movieDetailRepository: jest.Mocked<Repository<MovieDetail>>;
    let directorRepository: jest.Mocked<Repository<Director>>;
    let genreRepository: jest.Mocked<Repository<Genre>>;
    let userRepository: jest.Mocked<Repository<User>>;
    let movieUserLikeRepository: jest.Mocked<Repository<MovieUserLike>>;
    let dataSource: jest.Mocked<DataSource>;
    let cacheManager: Cache;

    beforeEach(async () => {
        // TestBed.create() 메소드의 파라미터로 실제 테스트 하고 싶은 클래스를 넣어주면 된다
        // @nestjs/testing의 Test 클래스를 사용해서 테스트 값들을 컴파일 하는 것과 동일
        const { unit, unitRef } = TestBed.create(MovieService).compile();
        // unit: TestBed.create() 파라미터로 넣은 클래스의 인스턴스 (여기서는 MovieService)

        // TestBed에서 자동으로 MovieService에 있는 모든 dependency들을 모킹해 놓았기 때문에 unitRef를 통해 값을 가져오면 된다
        // MovieService에 주입되는 모든 클래스의 메소드들은 TestBed에 의해 자동으로 jest.fn()으로 모킹되어 있다
        movieService = unit;
        movieRepository = unitRef.get(getRepositoryToken(Movie) as string);
        movieDetailRepository = unitRef.get(getRepositoryToken(MovieDetail) as string);
        directorRepository = unitRef.get(getRepositoryToken(Director) as string);
        genreRepository = unitRef.get(getRepositoryToken(Genre) as string);
        userRepository = unitRef.get(getRepositoryToken(User) as string);
        movieUserLikeRepository = unitRef.get(getRepositoryToken(MovieUserLike) as string);
        dataSource = unitRef.get(DataSource);
        cacheManager = unitRef.get(CACHE_MANAGER);
    });

    it('should be defined', () => {
        expect(movieService).toBeDefined();
    });

    afterAll(() => {
        jest.clearAllMocks();
    });
});
```

<br />

---

<br />

### Integration Test

-   Integration Test -> 모킹 없이 실질적인 로직을 테스트
-   Unit Test에서는 coverage를 올려야 하고 각각의 함수들이 어떤 파라미터로 실행되고 어떤 값을 반환하는지가 중요
-   Integration Test, End-to-End 테스트로 갈수록 흐름을 체크
    -   가장 작은 단위는 Unit Test
    -   Unit Test들을 합친 것이 Integration Test
    -   끝과 끝을 실행하는 것이 End-to-End Test
-   coverage는 이미 Unit Test에서 올렸기 때문에 기능적인 부분들에 집중
-   Integration Test에서는 Unit들의 상호작용을 테스트

```sh
# Integration Test 진행시 SQLite 주로 사용
$ npm i -D sqlite3
```

```ts
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

// 테스트 목적: TypeORM 모듈 API가 우리가 작성한 로직과 정상적으로 실행이 되는가
// 검증하고 싶은 것은 TypeORM과 우리 로직 간의 Integration (Unit과 Unit의 조합)
// Unit 테스트에서 모킹했던 것들을 없애고 실제 Repository가 존재하는 형태로 테스트 진행
// Integration Test -> 모킹 없이 실질적인 로직을 테스트
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
        const movieUserLikeRepository = dataSource.getRepository(MovieUserLike);

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
});
```
