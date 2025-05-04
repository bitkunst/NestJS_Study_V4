## TypeORM

### ORM (Object Relational Mapping)

-   ORM은 객체 지향 코드와 관계형 DB 구조 간의 불일치를 해소하기 위해 SQL 대신 클래스 기반으로 데이터를 다룰 수 있게 해주는 기술
-   애플리케이션과 데이터베이스 연결시 SQL언어가 아닌 애플리케이션 개발언어로 데이터베이스를 접근할 수 있게 해주는 기술
-   데이터베이스 레코드(row)를 클래스 인스턴스(instance)로, 테이블(table)을 클래스(class)로 매핑함으로써 SQL을 직접 쓰지 않고도 데이터베이스 조작이 가능

### TypeORM 특성

-   OOP를 사용해서 데이터베이스 테이블을 클래스로 관리할 수 있게 해주는 ORM
-   다양한 데이터베이스를 지원한다. MySQL, PostgreSQL, MariaDB, SQLite, Oracle, Mongodb
-   Active Record와 Data Mapper 패턴을 모두 지원한다
-   자체적으로 Migration 기능을 지원하며 점진적인 데이터베이스 구조 변경과 버저닝을 모두 지원한다
-   Eager & Lazy 로딩을 모두 지원하기 때문에 어떤 방식으로 데이터를 불러올지 완전한 컨트롤이 가능하다

### DataSource

-   사용할 데이터베이스 지정 및 정보 제공 역할
    -   type: 데이터베이스 종류
    -   host: 연결 호스트
    -   port: 연결 포트
    -   username: 아이디
    -   password: 비밀번호
    -   database: 연결 데이터베이스
    -   entities: TS 엔티티 객체

```ts
const PostgresDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'test',
    password: 'test',
    database: 'test',
    entities: [
        // Entity 입력
    ],
});
```

### Entity

-   `@Entity` Annotation을 사용하면 클래스를 테이블로 관리할 수 있다
-   `@Column` Annotation을 사용하면 테이블의 칼럼을 생성할 수 있다
-   `@PrimaryGeneratedColumn`은 자동 생성되는 ID 칼럼을 생성할 수 있다

```ts
@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    isActive: boolean;
}
```

### Entity Embedding

-   [reference](https://typeorm.io/embedded-entities)
-   Entity Embedding을 통해 공유되는 값들을 별도의 클래스로 관리
    -   여러 엔티티에 공통으로 들어가는 필드를 재사용 -> 중복 제거
    -   프로퍼티 타입이 클래스 -> 객체가 Embedding 되어 있기 때문에 실제로 객체 형태로 인식 (새로운 객체가 들어가 있는 것처럼 표현됨)
-   Embedded column은 자체 column을 가진 클래스를 받아서 현재 엔티티의 데이터베이스 테이블에 그 column들을 병합(merge)한다

```ts
export class Name {
    @Column()
    first: string;

    @Column()
    last: string;
}

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: string;

    @Column(() => Name)
    name: Name;

    @Column()
    isActive: boolean;
}

@Entity()
export class Employee {
    @PrimaryGeneratedColumn()
    id: string;

    @Column(() => Name)
    name: Name;

    @Column()
    salary: number;
}
```

### Entity Inheritance

-   [reference](https://typeorm.io/entity-inheritance)
-   중복을 없애고 추상화를 높이기 위해 공통 부분을 `추상 클래스`로 분리해서 관리
    -   엔티티 상속 패턴 중 가장 간단하면서도 효과적인 방법으로 코드 중복을 크게 줄일 수 있다

```ts
export abstract class Content {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    description: string;
}

@Entity()
export class Photo extends Content {
    @Column()
    size: string;
}

@Entity()
export class Post extends Content {
    @Column()
    viewCount: number;
}
```

### Single Table Inheritance

-   서로 다른 클래스가 각자 고유한 프로퍼티를 가짐에도 불구하고, 데이터베이스에는 하나의 테이블에 모두 저장하는 패턴
    -   아래의 설정을 사용하면 Content라는 단 하나의 테이블만 생성되고 Photo, Post의 모든 인스턴스가 이 테이블에 함께 저장된다
    -   각 레코드는 type 컬럼으로 자신의 구체 클래스(Photo/Post)를 구분한다

```ts
@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class Content {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    description: string;
}

@ChildEntity()
export class Photo extends Content {
    @Column()
    size: string;
}

@ChildEntity()
export class Post extends Content {
    @Column()
    viewCount: number;
}
```

### Column 옵션

-   `type: ColumnType` >> 칼럼 타입. varchar, text, int, bool 등 칼럼 타입
-   `name: string` >> 데이터베이스에 저장될 칼럼 이름. 기본값은 프로퍼티 이름을 따른다
-   `nullable: boolean` >> Null 값이 가능한지 여부. 기본값은 false이다
-   `update: boolean` >> 업데이트 가능 여부. false일 경우 저장 후 업데이트 불가. 기본값은 true
-   `select: boolean` >> 쿼리 실행시 프로퍼티를 가져올지 결정. false일 경우 가져오지 않는게 기본
-   `default: string` >> 칼럼 기본값
-   `unique: boolean` >> unique constraint 적용 여부. 기본 false
-   `comment: string` >> 칼럼 코멘트. 모든 데이터베이스에서 지원되지는 않음
-   `enum: string[]` >> 칼럼에 입력 가능한 값을 enum으로 나열
-   `array: boolean` >> 칼럼 array 타입으로 생성. 예) int[]

```ts
@Entity()
export class User {
    @Column({
        type: 'varchar',
        length: 150,
        unique: true,
        // ...
    })
    name: string;
}
```

### 특수 Column

-   @CreateDateColumn은 자동으로 Row 생성 날짜시간을 저장한다
-   @UpdateDateColumn은 자동으로 Row 최근 업데이트 날짜시간을 저장한다
-   @DeleteDateColumn은 자동으로 Row의 Soft Delete 날짜시간을 저장한다
-   @VersionColumn은 자동으로 Row가 업데이트 될때마다 1씩 증가한다

```ts
@Entity()
export class User {
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;

    @VersionColumn()
    version: number;
}
```

### Dependencies

```sh
$ pnpm install @nestjs/config joi @nestjs/typeorm typeorm pg
```
