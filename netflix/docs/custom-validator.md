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
    async: true, // 비동기로 validation 수행
})
class PasswordValidator implements ValidatorConstraintInterface {
    validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> | boolean {
        // 비밀번호 길이는 4~8
        return value.length >= 4 && value.length <= 8;
    }

    defaultMessage?(validationArguments?: ValidationArguments): string {
        return '비밀번호의 길이는 4~8자여야 합니다. 입력된 비밀번호: ($value)';
    }
}

function IsValidPassword(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: PasswordValidator,
        });
    };
}

export class SomeDto {
    // @Validate(PasswordValidator)
    @IsValidPassword()
    password: string;
}
```

### Class Validator

-   TS Decorator를 사용해서 클래스를 검증 (validate)
-   동기(Synchronous), 비동기(Asynchronous) 방식 모두 지원
-   Class Validator 자체적으로 제공해주는 Validator들 사용 가능
-   커스텀 Validator 제작 가능
-   커스텀 에러 메세지 반환 가능
