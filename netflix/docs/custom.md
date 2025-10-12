## Custom

### Custom Validator

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

### Custom Pipe

```ts
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
    transform(value: string, metadata: ArgumentMetadata): number {
        const val = parseInt(value, 10);
        if (isNaN(val)) {
            throw new BadRequestException(`Validation failed. "${value}" is not a valid number.`);
        }
        return val;
    }
}

// @Injectable Annotation 필수
// implements PipeTransform<입력값, 반환값>
@Injectable()
export class MovieTitleValidationPipe implements PipeTransform<string, string> {
    transform(value: string, metadata: ArgumentMetadata): string {
        if (!value) return value;
        // 만약 글자 길이가 2보다 작거나 같으면 에러
        if (value.length <= 2) {
            throw new BadRequestException('영화 제목은 3자 이상 작성해주세요!');
        }
        return value;
    }
}
```

### Custom Decorator

-   `Reflector.createDecorator()`
-   Creates a decorator that can be used to decorate classes and methods with metadata

```ts
// public.decorator.ts
import { Reflector } from '@nestjs/core';

// Creates a decorator that can be used to decorate classes and methods with metadata.
export const Public = Reflector.createDecorator(); // 데코레이터 생성 (적용했을 때 어떤 로직을 실행할지는 사용하는 곳에서 작업)
// 제너릭으로 타입을 넣어줄 경우 데코레이터에 넣어줄 파라미터 타입을 정해줄 수 있다
```

```ts
// auth.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Public } from '../decorator/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        // 만약 @Public decoration이 되어 있으면 모든 로직을 bypass
        const isPublic = this.reflector.get(Public, context.getHandler()); // context.getHandler()로 가져온 문맥에서 Public 데코레이터를 가져온다
        // isPublic에는 Public 데코레이터에 입력된 객체가 들어온다
        if (isPublic) return true;

        // 요청에서 user 객체가 존재하는지 확인 (user 객체가 존재한다는 것 자체가 middleware에서 검증을 통과했다는 뜻)
        const request = context.switchToHttp().getRequest();
        if (!request.user || request.user.type !== 'access') return false;

        return true;
    }
}
```

### Custom Param Decorator

-   `createParamDecorator()`
-   Defines HTTP route param decorator

```ts
import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

// Defines HTTP route param decorator
export const UserId = createParamDecorator((data: unknown, context: ExecutionContext) => {
    // @UserId() 데코레이터에 전달한 파라미터가 data 변수에 들어간다
    const request = context.switchToHttp().getRequest();
    if (!request || !request.user || !request.user.sub)
        throw new UnauthorizedException('사용자 정보를 찾을 수 없습니다!');

    return request.user.sub;
});
```
