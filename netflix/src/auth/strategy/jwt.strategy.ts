import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly configService: ConfigService) {
        super({
            // Bearer $token
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('ACCESS_TOKEN_SECRET'),
        });
    }

    /**
     * JwtStrategy는 validate 메소드에 jwt의 payload를 넣어준다
     * @param payload
     * @return 반환값을 Request 객체에 user 프로퍼티로 넣어준다 (request.user)
     */
    validate(payload: any) {
        return payload;
    }
}

export class JwtAuthGuard extends AuthGuard('jwt') {}
