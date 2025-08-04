## Class Validator

-   TS Decorator를 사용해서 클래스를 검증 (Validate)
-   동기(Synchronous), 비동기(Asynchronous) 방식 모두 지원
-   Class Validator 자체적으로 제공해주는 Validator들 사용 가능
-   커스텀 Validator 제작 가능
-   커스텀 에러 메세지 반환 가능

### Class Validator 적용

```ts
class User {
    @IsNotEmpty()
    name: string;

    @IsEmail()
    email: string;
}
// Class Validator에서 제공해주는 어떤 Validator든 검증하고 싶은 프로퍼티에 Decorator로 제공해주면 된다

const user = new User();
user.name = '';
user.email = 'helloWorld';

validate(user).then((errors) => {
    // 에러 반환
});
// validate() 함수로 객체를 검증했을 때 Class Validator에 부합하지 않은 값이 입력됐다면 해당되는 에러가 반환된다
```

<br />

## Custom Validator

```ts
import {
    registerDecorator,
    Validate,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

// Custom Validator
@ValidatorConstraint({
    async: true, // async: true 옵션 설정시 비동기로 validation 수행 가능
})
class PasswordValidator implements ValidatorConstraintInterface {
    validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> | boolean {
        // 비밀번호 길이는 4~8
        return value.length >= 4 && value.length <= 8;
    }

    defaultMessage?(validationArguments?: ValidationArguments): string {
        // $value를 사용해 실제 입력된 값을 출력 가능
        return '비밀번호의 길이는 4~8자여야 합니다. 입력된 비밀번호: ($value)';
    }
}

function IsValidPassword(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor, // 디폴트값
            propertyName, // 디폴트값
            options: validationOptions, // 디폴트값
            validator: PasswordValidator,
        });
    };
}

export class SomeDto {
    // @Validate(PasswordValidator)
    @IsValidPassword({
        message: '다른 메시지', // ValidationOptions
    })
    password: string;
}
```

<br />

## Class Transformer

-   TS Decorator를 사용해서 클래스를 변환 (Validate)
-   직렬화(Serialization)와 역직렬화(Deserialization) 그리고 인스턴스로 변환을 담당
-   중첩된(Nested) 객체에도 매우 쉽게 적용 가능
-   커스텀 Transformer로 어떤 변환이든 가능
-   Class Validator를 제작한 개발자가 시작한 프로젝트

### Class Transformer 적용

```ts
class User {
    @Exclude()
    name: string;

    // Transform 데코레이터를 사용해 커스터마이즈 가능
    @Transform(({ value }) => value.toUpperCase())
    email: string;
}
// Class Transformer에서 제공해주는 어떤 Transformer든 검증하고 싶은 프로퍼티에 Decorator로 제공해주면 된다

const plainUser = {
    name: 'John',
    email: 'john@example.com',
};
const user = plainToClass(User, plainUser);
console.log(user); // User { email: 'JOHN@EXAMPLE.COM' }

const plain = classToPlain(user);
console.log(plain); // { email: 'JOHN@EXAMPLE.COM' }
```

### 중첩 클래스 변환

-   중첩된 객체 타입을 `Type 데코레이터`에 제공해준다
-   `plainToClass`를 실행하면 중첩된 객체도 Type 데코레이터에 입력된 클래스의 인스턴스로 변환된다

```ts
class Address {
    city: string;
    country: string;
}

class User {
    @Exclude()
    name: string;

    @Type(() => Address)
    address: Address;
}

const plainUser = {
    name: 'John',
    address: {
        city: 'New York',
        country: 'USA',
    },
};
const user = plainToClass(User, plainUser);
console.log(user); // User { name: 'John', address: Address { city: 'New York', country: 'USA' } }
```

### Custom Transformer

-   `Transform 데코레이터`는 적용된 프로퍼티의 값을 인수로 제공해주며 변환 하고싶은 형태로 값을 반환해주면 된다

```ts
class User {
    @Exclude()
    name: string;

    @Transform(({ value }) => value.toLowerCase())
    email: string;
}

const plainUser = {
    name: 'John',
    email: 'JOHN@EXAMPLE.COM',
};
const user = plainToClass(User, plainUser);
console.log(user.email); // john@example.com
```

<br />

---

### Class Validator & Class Transformer 차이

-   Class Validator는 값을 변환해주지 않는다 → 값을 검증만 한다
-   원하는 타입으로 변환해주는 것은 Class Transformer

### Serialization(직렬화) & Deserialization(역직렬화)

-   직렬화: class instance → plain object
-   역직렬화: plain object → class instance

**ValidationPipe({transform: true})**

```ts
// main.ts
app.useGlobalPipes(new ValidationPipe({ transform: true }));

// 컨트롤러 핸들러에 들어오는 @Body()는 자동으로 DTO 인스턴스로 변환됨
@Post()
create(@Body() dto: CreateUserDto) { … }
```

**ClassSerializerInterceptor**

```ts
@Controller('user')
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {

    // 컨트롤러 응답에 클래스 인스턴스를 return 하면 자동 직렬화 (클래스 인스턴스 -> plain object)
    @Get()
    getUser(): User { … }  // Expose/Exclude 규칙에 따라 반환됨 (이미 존재하는 클래스 인스턴스의 프로퍼티에 붙은 메타데이터를 기준으로 작동)
}
```

### NestJS에서의 흐름

1. 요청: JSON → ValidationPipe(transform: true) → DTO 인스턴스
2. 비즈니스 로직: DTO → 서비스 → Entity 인스턴스
3. 응답: Entity 인스턴스 → ClassSerializerInterceptor → plain object → JSON
