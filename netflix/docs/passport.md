## Passport

-   모듈화된 인증 시스템: 다양한 전략(Strategy)을 쉽게 연결해서 사용 가능하다. 인증 관련 작성할 코드가 많이 줄어든다
-   미들웨어 기반 디자인: 요청, 응답 라이프사이클에 비파괴적 방식으로 통합된다
-   일반화된 가벼운 코어: Passport 코어는 넓은 전략을 수용할 수 있도록 가볍고 일반적으로(Unopinionated) 설계됐다
-   세션 및 토큰 방식 사용: 세션 기반과 토큰 기반의 인증 시스템 모두 사용 가능하다
-   방대한 생태계: 다양한 오픈소스 전략들이 무료로 공개돼있다. 어려운 부분은 직접 코딩할 필요 없을 가능성이 높다

### Passport-local & Passport-jwt Strategy

```sh
## Local Strategy
$ pnpm i @nestjs/passport passport passport-local
$ pnpm i -D @types/passport-local

## Jwt Strategy
$ pnpm i @nestjs/jwt @nestjs/passport passport passport-jwt
$ pnpm i -D @types/passport-jwt
```

### Passport 사용 방식

```ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
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
    async validate(username: string, password: string) {
        const user = await this.authService.validateUser(username, password);
        if (!user) throw new UnauthorizedException();

        return user;
    }
}
```

### Passport 적용 방법

```ts
@Controller('auth')
export class AuthController {
    @UseGuards(AuthGuard('local'))
    @Post('login')
    async login(@Request() req) {
        return req.user;
    }
}
```

### 정리

-   Passport를 사용할 경우 Passport의 코어 로직이 존재하고 코어 로직에는 `validate` 함수를 작성해줘야 한다
-   validate 함수의 반환값은 전부 `request 객체의 user 프로퍼티`에 입력된다 (request.user)
-   validate 함수에 입력되는 파라미터들은 Strategy 별로 다르다
    -   passport-jwt: validate 함수의 파라미터로 payload를 받는다
    -   passport-local: validate 함수의 파라미터로 username, password를 받는다
