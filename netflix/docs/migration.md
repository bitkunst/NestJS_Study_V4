## TypeORM Migration

```sh
# TypeORM CLI 사용시 환경변수 주입 목적
$ npm i dotenv

# TypeORM CLI
$ npm i -g typeorm
```

### Migrations

-   Migration 파일 생성

```sh
$ typeorm migration:create [파일생성디렉토리/파일명]
```

-   DataSource를 사용해서 엔티티 기반으로 Migration 파일 생성

```sh
$ typeorm migration:generate [파일생성디렉토리/파일명] -d [데이터소스파일위치]
```

-   Migration 실행

```sh
$ typeorm migration:run -d [데이터소스파일위치]
```

-   Migraiont revert (직전 마이그레이션 되돌리기)

```sh
$ typeorm migration:revert -d [데이터소스파일위치]
```
