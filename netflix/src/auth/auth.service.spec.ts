import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { Repository } from 'typeorm';
import { User } from 'src/user/entity/user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserService } from 'src/user/user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

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
});
