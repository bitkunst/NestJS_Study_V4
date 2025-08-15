## Guard

### Guard란?

-   Guard는 권한 등 조건을 확인한 후 요청이 라우트 핸들러로 전달될지 말지를 결정한다
-   이 과정을 우린 흔히 인가(Authorization)라고 부르며 요청을 보낸 사용자가 요청을 수행할 자격이 있는지 확인하게 된다
-   Middleware에서도 Guard와 같은 기능을 수행할 수 있지만 Middleware는 실행 문맥이 부족하다
-   어느 한 Middleware가 실행된 다음에 어떤 기능이 실행될지 알 수가 없다.
-   반면에 Guard는 ExecutionContext 객체에 어떤 기능이 다음으로 실행될지 정확히 알 수 있다

### ExecutionContext

-   ExecutionContext가 “대상”에 접근할 수 있도록 참조를 제공
    -   context.getHandler() -> 현재 요청이 매칭된 라우트 핸들러 함수 객체
    -   context.getClass() -> 해당 핸들러가 속한 컨트롤러 클래스
-   Guard가 실행되는 시점에는 컨트롤러/핸들러에 부착된 데코레이터의 메타데이터가 이미 “정적”으로 객체에 저장되어 있기 때문에, ExecutionContext가 제공하는 **핸들러 참조(context.getHandler())와 클래스 참조(context.getClass())** 를 통해 실행 순서와 무관하게 메타데이터를 읽어올 수 있다
-   실행 순서(Guard → Interceptor → Pipe → Handler)는 “요청 처리 흐름”이고, 데코레이터 메타데이터는 “코드 로딩 시점(애플리케이션 부트스트랩/컴파일)”에 **Reflect.defineMetadata**로 이미 해당 함수/클래스 객체에 붙어 있기 때문이다

### 401(Unauthorized) / 403(Forbidden)

-   Guard의 역할은 “현재 요청에 접근할 자격이 있는가”를 결정하는 것 -> Guard의 canActivate()가 false를 반환하면 NestJS는 기본적으로 403 Forbidden을 응답
-   false를 반환하면 “접근이 금지됨“을 의미하므로, **권한 부족(authorization failure)** 에 해당하는 403
-   인증 실패(토큰 없음/무효) -> 401 직접 throw
-   인가 실패(권한 없음) -> false 반환(자동 403)

### 인증 vs 인가

-   Authentication = 인증
    -   사용자가 누구인지 확인하는 절차
    -   e.g. 토큰이나 세션이 없거나, 토큰이 만료/위변조된 경우 → 인증 실패(미인증) → 401 Unauthorized
-   Authorization = 인가(권한 부여)
    -   무엇을 할 수 있는지(리소스 접근 권한/역할/스코프) 판단하는 절차
    -   e.g. 로그인은 되어 있으나 admin 권한이 없는 사용자가 관리자 기능 접근 시 → 인가 실패(권한 부족) → 403 Forbidden

| 상황                        | 의미                 | 예시                                      | 권장 상태                 |
| --------------------------- | -------------------- | ----------------------------------------- | ------------------------- |
| 인증 정보 없음/무효         | 인증 실패            | 토큰 없음/만료/서명 불일치                | 401 Unauthorized          |
| 인증은 OK, 권한 부족        | 인가 실패(권한 부족) | 역할/스코프 부족                          | 403 Forbidden             |
| 리소스 존재 숨김(보안 정책) | 보안상 은닉          | 관리자 전용 리소스를 일반 사용자에게 숨김 | 404 또는 403(정책에 따름) |

### Guard 선언법

-   TRUE를 반환할 경우 Guard 통과
-   FALSE를 반환할 경우 Guard 통과 X

```ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class RolesGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        return true;
    }
}
```

### Guard 적용법1

-   `UseGuard` 데코레이터를 사용해서 사용할 Guard를 지정할 수 있다
-   엔드포인트에 사용하고 싶으면 메소드 위에, 클래스 전체에 사용하고 싶으면 클래스 위에 적용하면 된다

```ts
@Controller('cats')
@UseGuards(RolesGuard)
export class CatsController {}
```

### Guard 적용법2

-   Global하게 적용할 수 있는 방법은 2가지가 존재
-   `useGlobalGuards`를 사용하는 방법이 가장 간단
-   Dependency Injection이 필요하다면 `AppModule의 providers로 제공`

```ts
// main.ts
const app = await NestFactory.create(AppModule);
app.useGlobalGuards(new RolesGuard());

// app.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

@Module({
    providers: [
        // providers 배열에 나열된 순서대로 해당 가드들을 차례대로 실행
        {
            // Global하게 Guard 적용
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
    ],
})
export class AppModule {}
```
