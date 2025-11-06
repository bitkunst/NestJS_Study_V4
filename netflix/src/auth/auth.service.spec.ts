import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { Repository } from 'typeorm';
import { Role, User } from 'src/user/entity/user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserService } from 'src/user/user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { envVariableKeys } from 'src/common/constant/env.constant';

const mockUserRepository = {
    findOne: jest.fn(),
};
const mockConfigService = {
    get: jest.fn(),
};
const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
    decode: jest.fn(),
};
const mockCacheManager = {
    set: jest.fn(),
};
const mockUserService = {
    create: jest.fn(),
};

describe('AuthService', () => {
    let authService: AuthService;
    let userRepository: Repository<User>;
    let configService: ConfigService;
    let jwtService: JwtService;
    let cacheManager: Cache;
    let userService: UserService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepository,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: CACHE_MANAGER, // @Inject() 파라미터 값이 provider
                    useValue: mockCacheManager,
                },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        userRepository = module.get<Repository<User>>(getRepositoryToken(User));
        configService = module.get<ConfigService>(ConfigService);
        jwtService = module.get<JwtService>(JwtService);
        cacheManager = module.get<Cache>(CACHE_MANAGER);
        userService = module.get<UserService>(UserService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(authService).toBeDefined();
    });

    describe('tokenBlock', () => {
        it('should block a token', async () => {
            const token = 'token';
            const payload = {
                exp: Math.floor(Date.now() / 1000) + 60,
            };
            jest.spyOn(mockJwtService, 'decode').mockReturnValue(payload);
            await authService.tokenBlock(token);

            expect(jwtService.decode).toHaveBeenCalledWith(token);
            expect(cacheManager.set).toHaveBeenCalledWith(`BLOCK_TOKEN_${token}`, payload, expect.any(Number));
        });
    });

    describe('parseBasicToken', () => {
        it('should parse a valid Basic Token', () => {
            const rawToken = 'Basic dGVzdEBnbWFpbC5jb206MTIzMTIz';
            const result = authService.parseBasicToken(rawToken);
            const decode = { email: 'test@gmail.com', password: '123123' };

            expect(result).toEqual(decode);
        });

        it('should throw an error for invalid token format', () => {
            const rawToken = 'InvalidTokenFormat';
            // Promise가 아닌 경우 expect()의 파라미터로 콜백함수를 넣어줘야 한다
            expect(() => authService.parseBasicToken(rawToken)).toThrow(BadRequestException);
        });

        it('should throw an error for invalid Basic token format', () => {
            const rawToken = 'Bearer InvalidTokenFormat';
            // Promise가 아닌 경우 expect()의 파라미터로 콜백함수를 넣어줘야 한다
            expect(() => authService.parseBasicToken(rawToken)).toThrow(BadRequestException);
        });

        it('should throw an error for invalid Basic token format', () => {
            const rawToken = 'Basic a';
            // Promise가 아닌 경우 expect()의 파라미터로 콜백함수를 넣어줘야 한다
            expect(() => authService.parseBasicToken(rawToken)).toThrow(BadRequestException);
        });
    });

    describe('parseBearerToken', () => {
        it('should parse a valid Bearer Token', async () => {
            const rawToken = 'Bearer token';
            const payload = { type: 'access' };
            jest.spyOn(mockJwtService, 'decode').mockReturnValue(payload);
            jest.spyOn(mockJwtService, 'verifyAsync').mockResolvedValue(payload);
            jest.spyOn(mockConfigService, 'get').mockReturnValue('secret');

            const result = await authService.parseBearerToken(rawToken, false);

            expect(jwtService.verifyAsync).toHaveBeenCalledWith('token', {
                secret: 'secret',
            });
            expect(result).toEqual(payload);
        });

        it('should use ACCESS_TOKEN_SECRET when isRefreshToken parameter is false', async () => {
            const rawToken = 'Bearer token';
            const payload = { type: 'access' };
            jest.spyOn(mockJwtService, 'decode').mockReturnValue(payload);
            jest.spyOn(mockJwtService, 'verifyAsync').mockResolvedValue(payload);
            jest.spyOn(mockConfigService, 'get').mockReturnValue('secret'); // 반환값은 고정

            await authService.parseBearerToken(rawToken, false);

            expect(configService.get).toHaveBeenCalledWith(envVariableKeys.accessTokenSecret);
            expect(jwtService.verifyAsync).toHaveBeenCalledWith('token', { secret: 'secret' });
        });

        it('should use REFRESH_TOKEN_SECRET when isRefreshToken parameter is true', async () => {
            const rawToken = 'Bearer token';
            const payload = { type: 'refresh' };
            jest.spyOn(mockJwtService, 'decode').mockReturnValue(payload);
            jest.spyOn(mockJwtService, 'verifyAsync').mockResolvedValue(payload);
            jest.spyOn(mockConfigService, 'get').mockReturnValue('secret'); // 반환값은 고정

            await authService.parseBearerToken(rawToken, true);

            expect(mockConfigService.get).toHaveBeenCalledWith(envVariableKeys.refreshTokenSecret);
            expect(jwtService.verifyAsync).toHaveBeenCalledWith('token', { secret: 'secret' });
        });

        it('should throw a BadRequestException for invalid Bearer token format', () => {
            const rawToken = 'a';
            expect(authService.parseBearerToken(rawToken, false)).rejects.toThrow(BadRequestException);
        });

        it('should throw a BadRequestException for token not starting with Bearer', () => {
            const rawToken = 'Basic a';
            expect(authService.parseBearerToken(rawToken, false)).rejects.toThrow(BadRequestException);
        });

        it('should throw a UnauthorizedException if payload.type is refresh but isRefreshToken parameter is false', () => {
            const rawToken = 'Bearer a';
            jest.spyOn(mockJwtService, 'decode').mockResolvedValue({ type: 'refresh' });
            expect(authService.parseBearerToken(rawToken, false)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw a UnauthorizedException if payload.type is not refresh but isRefreshToken parameter is true', () => {
            const rawToken = 'Bearer a';
            jest.spyOn(mockJwtService, 'decode').mockResolvedValue({ type: 'access' });
            expect(authService.parseBearerToken(rawToken, true)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('register', () => {
        it('should register a new user', async () => {
            const rawToken = 'Basic abcd';
            const user = { email: 'test@gmail.com', password: '123123' };
            jest.spyOn(authService, 'parseBasicToken').mockReturnValue(user);
            jest.spyOn(mockUserService, 'create').mockResolvedValue(user);

            const result = await authService.register(rawToken);

            expect(authService.parseBasicToken).toHaveBeenCalledWith(rawToken);
            expect(userService.create).toHaveBeenCalledWith(user);
            expect(result).toEqual(user);
        });
    });

    describe('authenticate', () => {
        it('should authenticate a user with correct credentials', async () => {
            const email = 'test@gmail.com';
            const password = '123123';
            const user = { email, password: 'hashedPassword' };
            jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(user);
            jest.spyOn(bcrypt, 'compare').mockImplementation((a, b) => true);
            // mockReturnValue(v): 동기 반환을 간단히 지정(구현체 없이 값만)
            // mockResolvedValue(v): 비동기 함수(Promise)용으로, Promise.resolve(v)를 반환
            // mockImplementation(fn): 단순 값이 아니라, 로직이 있는 구현을 직접 넣고 싶을 때 사용

            const result = await authService.authenticate(email, password);

            expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email } });
            expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password);
            expect(result).toEqual(user);
        });

        it('should throw an error for not existing user', async () => {
            jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

            expect(authService.authenticate('test@gmail.com', '123123')).rejects.toThrow(BadRequestException);
        });

        it('should throw an error for incorrect password', async () => {
            const user = { email: 'test@gmail.com', password: 'hashedPassword' };
            jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(user);
            jest.spyOn(bcrypt, 'compare').mockImplementation((a, b) => false);

            expect(authService.authenticate('test@gmail.com', '123123')).rejects.toThrow(BadRequestException);
        });
    });

    describe('issueToken', () => {
        const user = { id: 1, role: Role.USER };
        const token = 'token';

        // describe 코드블록 안에서 it() 실행 전에 호출
        beforeEach(() => {
            jest.spyOn(mockConfigService, 'get').mockReturnValue('secret');
            jest.spyOn(jwtService, 'signAsync').mockResolvedValue(token);
        });

        it('should issue an access token', async () => {
            const result = await authService.issueToken(user as User, false);

            expect(jwtService.signAsync).toHaveBeenCalledWith(
                { sub: user.id, type: 'access', role: user.role },
                { secret: 'secret', expiresIn: 3600 },
            );
            expect(result).toBe(token);
        });

        it('should issue an refresh token', async () => {
            const result = await authService.issueToken(user as User, true);

            expect(jwtService.signAsync).toHaveBeenCalledWith(
                { sub: user.id, type: 'refresh', role: user.role },
                { secret: 'secret', expiresIn: '24h' },
            );
            expect(result).toBe(token);
        });
    });

    describe('login', () => {
        it('should login a user and return tokens', async () => {
            const rawToken = 'Basic asdf';
            const email = 'test@gmail.com';
            const password = '123123';
            const user = { id: 1, role: Role.USER };
            jest.spyOn(authService, 'parseBasicToken').mockReturnValue({ email, password });
            jest.spyOn(authService, 'authenticate').mockResolvedValue(user as User);
            jest.spyOn(authService, 'issueToken').mockResolvedValue('mockedToken');

            const result = await authService.login(rawToken);

            expect(authService.parseBasicToken).toHaveBeenCalledWith(rawToken);
            expect(authService.authenticate).toHaveBeenCalledWith(email, password);
            expect(authService.issueToken).toHaveBeenCalledTimes(2);
            expect(result).toEqual({
                refreshToken: 'mockedToken',
                accessToken: 'mockedToken',
            });
        });
    });
});
