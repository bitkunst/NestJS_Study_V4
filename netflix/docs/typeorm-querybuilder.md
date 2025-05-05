## Query Builder

-   복잡하지 않은 일반적인 쿼리를 실행할 때는 Repository를 사용하는게 편리하다
-   조금 더 복잡한 쿼리를 실행해야 하거나 다이나믹하게 쿼리를 만들어가야 할 경우 Query Builder를 사용해야 한다

```ts
const users = await userRepository
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.profile', 'profile')
    .where('user.isActive = :isActive', { isActive: true })
    .orderBy('user.firstName', 'ASC')
    .skip(10)
    .take(5)
    .getMany();
```

### Query Builder의 5가지 실행 타입

1. SELECT
2. INSERT
3. UPDATE
4. DELETE
5. RELATIONS

### SELECT

-   Repository에서 Query Builder를 가져올 경우 `.select().from()` 생략 가능
-   `.leftJoinAndSelect()`
    -   내부적으로 조인된 엔티티의 모든 칼럼을 SELECT 목록에 추가
-   `.leftJoin().addSelect()`
    -   조인된 엔티티에서 특정 칼럼만 가져오고 싶을 때 사용

```ts
const movie = await dataSource
    .createQueryBuilder()
    .select('movie') // 여기서는 'movie'라는 별칭 전체를 넘겼기 때문에 내부적으로 SELECT movie.* 와 동일하게 동작
    .from(Movie, 'movie') // 조회 대상이 되는 엔티티 클래스, 해당 엔티티(테이블)에 붙일 별칭(alias) 지정
    .leftJoinAndSelect('movie.detail', 'detail')
    .leftJoinAndSelect('movie.director', 'director')
    .leftJoinAndSelect('movie.genres', 'genres')
    .where('movie.id = :id', { id: 1 })
    .getOne();

const movie = await dataSource
    .createQueryBuilder()
    .select(['movie.id', 'movie.title'])
    .from(Movie, 'movie') // 엔티티 + 별칭 지정
    .leftJoin('movie.detail', 'detail')
    .addSelect('detail.description')
    .where('movie.id = :id', { id: 1 })
    .getOne();

// Repository에서 QueryBuilder를 가져올 경우
const movie = await movieRepository
    .createQueryBuilder('movie')
    .leftJoinAndSelect('movie.detail', 'detail')
    .leftJoinAndSelect('movie.director', 'director')
    .leftJoinAndSelect('movie.genres', 'genres')
    .where('movie.id = :id', { id: 1 })
    .getOne();
```

### INSERT

```ts
await dataSource
    .createQueryBuilder()
    .insert()
    .into(Movie)
    .values([{ title: 'New Movie', genre: 'Action', director, genres }])
    .execute();
```

### UPDATE

```ts
await dataSource
    .createQueryBuilder()
    .update(Movie)
    .set({ title: 'Updated Title', genre: 'Fantasy' })
    .where('id = :id', { id: 1 })
    .execute();
```

### DELETE

```ts
await dataSource.createQueryBuilder().delete().from(Movie).where('id = :id', { id: 1 }).execute();
```

### RELATIONS

```ts
// .of() 메소드의 인자로는 관계를 가져올 타겟 id (여기서는 Movie id)
const genres = await dataSource.createQueryBuilder().relation(Movie, 'genres').of(1).loadMany();
```

<br />

## QueryBuilder Methods

### select(), getOne(), getMany()

```ts
// 단일 row만 가져올 때
const user = await connection
    .getRepository(User)
    .createQueryBuilder('user')
    .select(['user.id', 'user.firstName', 'user.lastName'])
    .getOne();

// 복수 row 가져올 때
const users = await connection
    .getRepository(User)
    .createQueryBuilder('user')
    .select(['user.id', 'user.firstName', 'user.lastName'])
    .getMany();
```

### where()

```ts
// 하나의 필터링 조건 적용
const users = await connection
    .getRepository(User)
    .createQueryBuilder('user')
    .where('user.isActive = :isActive', { isActive: true })
    .getMany();

// 다수의 필터링 조건 적용
const users = await connection
    .getRepository(User)
    .createQueryBuilder('user')
    .where('user.firstName = :firstName', { firstName: 'John' })
    .andWhere('user.lastName = :lastName', { lastName: 'Doe' })
    .getMany();
```

### orderBy()

```ts
const users = await connection
    .getRepository(User)
    .createQueryBuilder('user')
    .orderBy('user.lastName', 'ASC')
    .addOrderBy('user.firtName', 'DESC')
    .getMany();
```

### skip(), take()

```ts
// 11번째부터 5개 가져오기
const users = await connection.getRepository(User).createQueryBuilder('user').skip(10).take(5).getMany();
```

### join()

```ts
// Inner Join
const users = await connection
    .getRepository(User)
    .createQueryBuilder('user')
    .innerJoinAndSelect('user.profile', 'profile')
    .getMany();

// Left Join
const users = await connection
    .getRepository(User)
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.photos', 'photo')
    .getMany();
```

### Aggregation

```ts
const userCount = await connection
    .getRepository(User)
    .createQueryBuilder('user')
    .select('COUNT(user.id)', 'count')
    .getRawOne();
```

### SubQuery

```ts
const users = await connection
    .getRepository(User)
    .createQueryBuilder('user')
    .where((qb) => {
        const subQuery = qb
            .subQuery()
            .select('subUser.id')
            .from(User, 'subUser')
            .where('subUser.isActive = :isActive', { isActive: true })
            .getQuery();
        return 'user.id IN ' + subQuery;
    })
    .setParameter('isActive', true) // 서브쿼리 내 :isActive 플레이스홀더에 true 값을 바인딩
    .getMany();
```

-   `.where('subUser.isActive = :isActive', { isActive: true })`는 subQueryBuilder에만 파라미터를 바인딩
-   .getQuery()로 SQL 문자열만 꺼내면 그 안의 :isActive 플레이스홀더는 아직 메인 QueryBuilder에 값이 전달되지 않은 상태가 된다
-   최종 실행시 메인 QueryBuilder에도 :isActive 값(true)를 알려주기 위해 `.setParameter('isActive', true)`를 호출
