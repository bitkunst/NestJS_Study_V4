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
