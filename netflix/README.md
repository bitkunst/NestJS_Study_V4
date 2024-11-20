## NestJS Concept

### Dependency Injection & Inversion of Control

**의존성 주입을 하지 않았을 때**

```ts
class B {
    doSomething() {}
}

class A {
    private b: B;

    constructor() {
        this.b = new B(); // B 클래스의 인스턴스를 직접 생성
    }

    execute() {
        this.b.doSomething();
    }
}
```

1. 강한 결합
    - A 클래스는 B 클래스에 강하게 결합되어 있다.
    - B 클래스의 변경이나 교체가 필요할 때 A 클래스를 수정해야 한다.
        - A 클래스가 B 클래스의 구체적인 구현에 강하게 결합되어 있다는 뜻
        - B 클래스가 완전히 다른 구현으로 교체되어야 하거나, 인터페이스나 추상 클래스에 따라 B의 여러 구현을 사용할 필요가 있을 때 A 클래스를 수정해야 하는 문제가 생긴다.
2. 테스트 어려움
    - A 클래스의 동작을 테스트하기 위해 B 클래스의 실제 인스턴스를 사용해야 한다.
    - 만약 B 클래스가 복잡하거나 외부 리소스(ex. 데이터베이스, 네트워크 등)에 의존하는 경우, 단위 테스트가 어려워지고 속도가 느려질 수 있다.
3. 확장성 부족
    - B 클래스의 구현을 바꾸기 어렵다. 예를 들어, B 클래스의 대체 구현이 필요할 때 유연하게 대처하기 힘들다.

### IoC Container

-   직접 특정 클래스를 인스턴스화 해서 주입하는 방식이 아닌, `제어의 주체를 역전`시키는 방식
-   NestJS 자체 IoC Container에서 클래스를 인스턴스화 하고 의존성 주입을 실행
    -   IoC Container에서 인스턴스의 생성과 주입을 자동으로 해준다
-   Module에서 providers로 등록된 클래스들은 IoC Container에서 알아서 관리 (Dependency Injection 수행)

<br>

## Module, Controller, Service

-   Controller에서는 들어오는 요청에 대한 processing만 수행
-   Service에서는 비즈니스 로직 수행
