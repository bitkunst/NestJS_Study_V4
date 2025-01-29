import { Injectable } from '@nestjs/common';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly authService: AuthService) {
        super({
            usernameField: 'email', // request body에 들어가는 username 필드명 변경 옵션
        });
    }

    /**
     * LocalStrategy는 validate 메소드에 2개의 파라미터를 넣어준다
     * Request body에서 username과 password 추출 -> validate 메소드 호출
     * @param username
     * @param password
     * @return 반환값을 Request 객체에 user 프로퍼티로 넣어준다 (request.user)
     */
    async validate(email: string, password: string) {
        const user = await this.authService.authenticate(email, password);
        return user;
    }
}

export class LocalAuthGuard extends AuthGuard('local') {}
