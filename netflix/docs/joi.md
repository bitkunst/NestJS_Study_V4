## Joi

-   Validation을 진행할 때 class-validator 이외에 사용하는 라이브러리

### Joi 특성

-   스키마(Schema) 기반의 검증 라이브러리
-   타입세이프(Type Safe)하게 객체를 검증해서 데이터 무결성을 유지
-   풍부한 에러 메시지 커스터마이제이션 가능
-   Extension을 통해 얼마든지 새로운 검증 로직 추가 가능
-   NestJS에서는 `환경변수 검증`할 때 많이 사용

### Joi 사용법

-   검증하고 싶은 객체 스키마를 구현하고 각 프로퍼티별로 Joi에서 제공해주는 검증 메소드를 입력해주면 된다
-   타입 메소드를 먼저 입력하고 룰 메소드를 체이닝(chaining)한다
-   생성한 스키마의 validate 함수에 검증할 객체를 입력해주면 결과를 받아볼 수 있다

```ts
const schema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    age: Joi.number().optional(),
});

const data = {
    name: 'John',
    email: 'john@example.com',
};
const { error, value } = schema.validate(data);

if (error) {
    // 검증 실패. error 객체에 정보 있음
} else {
    // 검증 성공.
}
```

**커스텀 에러 메시지**

-   messages() 메소드를 사용해서 에러 메시지 변경이 가능하다
-   key값에 에러 코드를 입력하고 value값에 에러 메시지를 입력한다

```ts
const schema = Joi.object({
    name: Joi.string().required().messages({
        'string.empty': 'Name cannot be empty',
    }),
    email: Joi.string().email().required().messages({
        'string.email': 'Invalid email address',
    }),
});
```
