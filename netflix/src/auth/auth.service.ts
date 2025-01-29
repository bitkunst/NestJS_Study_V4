import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role, User } from 'src/user/entity/user.entity';
import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { envVariableKeys } from 'src/common/constant/env.constant';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
    ) {}

    async login(rawToken: string) {
        // raw token -> "Basic $token"
        const { email, password } = this.parseBasicToken(rawToken);
        const user = await this.authenticate(email, password);

        return {
            refreshToken: await this.issueToken(user, true),
            accessToken: await this.issueToken(user, false),
        };
    }

    async register(rawToken: string) {
        // raw token -> "Basic $token"
        const { email, password } = this.parseBasicToken(rawToken);

        // email 중복 체크
        const user = await this.userRepository.findOne({ where: { email } });
        if (user) throw new BadRequestException('이미 가입한 이메일입니다!');

        // password 암호화
        const hash = await bcrypt.hash(password, this.configService.get<number>(envVariableKeys.hashRounds));

        // 사용자 등록
        await this.userRepository.save({ email, password: hash });

        return this.userRepository.findOne({ where: { email } });
    }

    async issueToken(user: { id: number; role: Role }, isRefreshToken: boolean) {
        const refreshTokenSecret = this.configService.get<string>(envVariableKeys.refreshTokenSecret);
        const accessTokenSecret = this.configService.get<string>(envVariableKeys.accessTokenSecret);

        return await this.jwtService.signAsync(
            {
                sub: user.id,
                role: user.role,
                type: isRefreshToken ? 'refresh' : 'access',
            },
            {
                secret: isRefreshToken ? refreshTokenSecret : accessTokenSecret,
                expiresIn: isRefreshToken ? '24h' : 300,
            },
        );
    }

    async authenticate(email: string, password: string) {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) throw new BadRequestException('잘못된 로그인 정보입니다!');

        const passOk = await bcrypt.compare(password, user.password);
        if (!passOk) throw new BadRequestException('잘못된 로그인 정보입니다!');

        return user;
    }

    parseBasicToken(rawToken: string) {
        // 1) 토큰값 추출
        // ['Basic', $token]
        const basicSplit = rawToken.split(' ');
        if (basicSplit.length !== 2) throw new BadRequestException('토큰 포맷이 잘못됐습니다!');

        const [basic, token] = basicSplit;
        if (basic.toLowerCase() !== 'basic') throw new BadRequestException('토큰 포맷이 잘못됐습니다!');

        // 2) 추출한 토큰을 base64 디코딩해서 이메일과 비밀번호로 나눈다
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        // "email:password"

        // [$email, $password]
        const tokenSplit = decoded.split(':');
        if (tokenSplit.length !== 2) throw new BadRequestException('토큰 포맷이 잘못됐습니다!');

        const [email, password] = tokenSplit;

        return { email, password };
    }

    async parseBearerToken(rawToken: string, isRefreshToken: boolean) {
        const bearerSplit = rawToken.split(' ');
        if (bearerSplit.length !== 2) throw new BadRequestException('토큰 포맷이 잘못됐습니다!');

        const [bearer, token] = bearerSplit;
        if (bearer.toLowerCase() !== 'bearer') throw new BadRequestException('토큰 포맷이 잘못됐습니다!');

        try {
            const refreshTokenSecret = this.configService.get<string>(envVariableKeys.refreshTokenSecret);
            const accessTokenSecret = this.configService.get<string>(envVariableKeys.accessTokenSecret);

            const payload = await this.jwtService.verifyAsync(token, {
                secret: isRefreshToken ? refreshTokenSecret : accessTokenSecret,
            });

            if (isRefreshToken) {
                if (payload.type !== 'refresh') throw new BadRequestException('Refresh 토큰을 입력해주세요!');
            } else {
                if (payload.type !== 'access') throw new BadRequestException('Access 토큰을 입력해주세요!');
            }

            return payload;
        } catch (error) {
            throw new UnauthorizedException(error.message);
        }
    }
}
