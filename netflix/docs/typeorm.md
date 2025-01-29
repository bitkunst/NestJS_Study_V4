## TypeORM

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
-   @Column Annotation을 사용하면 테이블의 칼럼을 생성할 수 있다
-   @PrimaryGeneratedColumn은 자동 생성되는 ID 칼럼을 생성할 수 있다

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
