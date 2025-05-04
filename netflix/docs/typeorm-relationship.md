## Relationships

**@OneToOne** : A 테이블의 Row 하나와 B 테이블의 Row 하나가 연결되는 관계 (1:1)
<br />

**@ManyToOne** : A 테이블의 Row 여러개와 B 테이블의 Row 하나가 연결되는 관계 (N:1)
<br />

**@OneToMany** : A 테이블의 Row 하나와 B 테이블의 Row 여러개가 연결되는 관계 (1:N)
<br />

**@ManyToMany** : A 테이블의 Row 여러개와 B 테이블의 Row 여러개가 연결되는 관계 (N:N)
<br />

## Relationship Annotation 적용

```ts
@Entity()
export class Photo {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    url: string;

    @ManyToOne(() => User, (user) => user.photos)
    user: User;
}

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(() => Photo, (photo) => photo.user)
    photos: Photo[];
}
```

-   첫번째 파라미터에는 타입을 반환하는 함수를 입력한다 (class-transformer Type과 같은 개념)
-   두번째 파라미터에는 첫번째 파라미터에 입력한 클래스의 칼럼중 하나를 입력한다. 이 칼럼은 서로 관련지을 프로퍼티여야 한다
-   예를 들어 ManyToOne 관계이니 photo 테이블에 user_id 칼럼이 생성되며 user 테이블과 관계가 형성된다
-   특정 photo와 관련있는 user는 photo.user로 불러올 수 있고 user와 관련있는 photo들은 user.photos로 불러올 수 있다

### ManyToOne & OneToMany Relationship

-   photo 테이블에는 user_id 칼럼이 자동으로 생긴다. 네이밍 패턴은 `{상대 테이블 이름}_id`
-   user_id는 user 테이블의 id 칼럼을 FOREIGN KEY로 레퍼런스한다
-   user 테이블은 추가로 칼럼이 생성되지 않는다. 원래 ManyToOne 또는 OneToMany 관계는 `FOREIGN KEY 레퍼런스를 들고있는 테이블이 Many 입장`이다

| **photo** |         |                             |
| --------- | ------- | --------------------------- |
| id        | int     | PRIMARY KEY, AUTO_INCREMENT |
| url       | varchar |                             |
| user_id   | varchar | FOREIGN KEY                 |

| **user** |         |                             |
| -------- | ------- | --------------------------- |
| id       | int     | PRIMARY KEY, AUTO_INCREMENT |
| name     | varchar |                             |

### OneToOne Relationship

-   Uni-directional & Bi-directional 존재
-   Uni-directional: 한쪽 entity에만 관계 데코레이터가 있는 경우
    -   한쪽 entity에서만 관계를 정의하는 방식으로 반대쪽 entity에서는 관계를 인식하지 않음
-   Bi-directional: 관계의 양쪽 entity에 데코레이터가 있는 경우

```ts
// Bi-directional

@Entity()
export class Profile {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    gender: string;

    @Column()
    photo: string;

    @OneToOne(() => User, (user) => user.profile)
    user: User;
}

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToOne(() => Profile, (profile) => profile.user)
    @JoinColumn() // User 테이블에 profile_id로 칼럼 생성 (Profile 테이블에 대한 레퍼런스)
    profile: Profile;
}
```

-   OneToOne Relationship도 마찬가지로 Annotation을 원하는 프로퍼티에 정의해주면 된다
-   ManyToOne은 상대의 레퍼런스를 갖는 테이블이 명확하다
-   OneToOne은 두 테이블 중 누가 레퍼런스를 들고 있어도 상관이 없기 떄문에 어떤 테이블이 레퍼런스를 들고 있을지 명시해줘야 한다
-   @JoinColumn Annotation을 사용해서 어떤 프로퍼티가 레퍼런스를 들고 있을지 정해줄 수 있다
-   `@JoinColumn은 꼭 한쪽에만 적용`해야 한다. 둘 모두 적용하는건 불가능하고 의미도 없다
-   @JoinColumn을 설정한 측의 테이블에는 “relation id”와 대상 entity 테이블에 대한 FOREIGN KEY가 포함된다

### ManyToMany Relationship

```ts
// Bi-directional

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(() => Question, (question) => question.categories)
    questions: Question[];
}

@Entity()
export class Question {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @ManyToMany(() => Category, (category) => category.questions)
    @JoinTable()
    categories: Category[];
}
```

-   ManyToMany Relationship도 OneToOne Relationship과 마찬가지로 `@JoinTable Annotation을 한쪽에 적용`해줘야 한다
    -   서로가 각자에 대한 레퍼런스를 갖고 있지만 어떤 테이블이 주도적으로 관리할지 @JoinTable Annotation을 통해 지정할 수 있다
-   중간 테이블이 생성될 때 @JoinTable이 적용된 테이블 이름이 먼저 위치하게 된다
    -   ManyToMany의 경우 테이블 2개만으로 해결할 수 없다 -> 서로가 서로를 레퍼런스 하는 세번째 중간 테이블을 만들어줘야 한다
