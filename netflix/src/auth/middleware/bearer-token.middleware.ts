import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { envVariableKeys } from 'src/common/constant/env.constant';

//* 토큰이 존재할 경우 Middleware는 토큰에 대한 정보를 request.user에 등록해주기만 할 뿐 -> 나머지 인증 로직은 Guard에서 수행
/**
 * Middleware: 데이터 추출·전처리 -> 토큰 추출
 * Guard: 접근 제어(Authorization) -> 토큰 검증
 */
@Injectable()
export class BearerTokenMiddleware implements NestMiddleware {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
    ) {}

    async use(req: Request, res: Response, next: NextFunction) {
        console.log('BEARER TOKEN MIDDLEWARE');
        // Bearer $token
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            next();
            return;
        }

        const token = this.validateBearerToken(authHeader);

        const blockedToken = await this.cacheManager.get(`BLOCK_TOKEN_${token}`);
        if (blockedToken) throw new UnauthorizedException('차단된 토큰입니다!');

        const tokenKey = `TOKEN_${token}`;

        const cachedPayload = await this.cacheManager.get(tokenKey);
        if (cachedPayload) {
            req.user = cachedPayload;
            return next();
        }

        // 검증 없이 디코딩만 수행
        const decodedPayload = this.jwtService.decode(token);
        if (decodedPayload.type !== 'refresh' && decodedPayload.type !== 'access') {
            throw new UnauthorizedException('잘못된 토큰입니다!');
        }

        try {
            const secretKey =
                decodedPayload.type === 'refresh'
                    ? envVariableKeys.refreshTokenSecret
                    : envVariableKeys.accessTokenSecret;

            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>(secretKey),
            });

            // payload['exp'] -> epoch time seconds
            const expiryDate = +new Date(payload['exp'] * 1000);
            const now = Date.now();
            const differenceInSeconds = (expiryDate - now) / 1000;
            const ttl = Math.max((differenceInSeconds - 30) * 1000, 1);
            await this.cacheManager.set(tokenKey, payload, ttl);

            req.user = payload;
            next();
        } catch (error) {
            // 토큰 만료일 경우에만 401
            if (error.name === 'TokenExpiredError') throw new UnauthorizedException('토큰이 만료됐습니다!');
            next(); // Guard에서 이미 인증을 수행하고 있기 때문에 next() 호출
        }
    }

    validateBearerToken(rawToken: string) {
        const bearerSplit = rawToken.split(' ');
        if (bearerSplit.length !== 2) throw new BadRequestException('토큰 포맷이 잘못됐습니다!');

        const [bearer, token] = bearerSplit;
        if (bearer.toLowerCase() !== 'bearer') throw new BadRequestException('토큰 포맷이 잘못됐습니다!');

        return token;
    }
}
