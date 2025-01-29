## Mapped Types

-   Partial
-   Pick
-   Omit
-   Intersection
-   Composition

```ts
export class CreateUserDto {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    password: string;
}
```

### Partial

-   클래스의 프로퍼티 정의를 모두 optional로 만든다

```ts
export class UpdateUserDto extends PartialType(CreateUserDto) {}
/*
{
    name?: string
    email?: string
    password?: string
}
*/
```

### Pick

-   특정 프로퍼티만 골라 사용할 수 있다 (Omit의 반대)

```ts
export class LoginUserDto extends PickType(CreateUserDto, ['email', 'password'] as const) {}
/*
{
    email: string
    password: string
}
*/
```

### Omit

-   특정 프로퍼티만 생략할 수 있다 (Pick의 반대)

```ts
export class PublicUserDto extends OmitType(CreateUserDto, ['password'] as const) {}
/*
{
    name: string
    email: string
}
*/
```

### Intersection

-   두 타입의 프로퍼티를 모두 모아서 사용할 수 있다

```ts
export class UserDetailDto {
    @IsString()
    name: string;

    @IsEmail()
    email: string;
}

export class AddressDto {
    @IsString()
    street: string;

    @IsString()
    city: string;

    @IsString()
    country: string;
}

export class UserWithAddressDto extends IntersectionType(UserDetailDto, AddressDto) {}
/*
{
    name: string
    email: string
    street: string
    city: string
    country: string
}
*/
```

### Composition

-   Mapped Types를 다양하게 조합해서 중첩 적용 가능하다

```ts
export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['name'] as const)) {}
```
