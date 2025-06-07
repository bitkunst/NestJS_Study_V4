## Page Based Pagination

-   데이터를 페이지 기반으로 나눠서 처리한다
-   예를 들어 100개의 데이터를 한번에 20개씩 가져온다면 5개의 페이지로 나눌 수 있다
-   페이지 기반 pagination은 ordering을 어떻게 하든 `LIMIT`과 `OFFSET`만 바꿔주면 된다

```sql
-- 첫번째 페이지
SELECT id, title, "likeCount"
FROM movie
ORDER BY id DESC
LIMIT 5;

-- 두번째 페이지
SELECT id, title, "likeCount"
FROM movie
ORDER BY id DESC
LIMIT 5
OFFSET 5;

-- Multi column pagination
-- 첫번째 페이지
SELECT id, title, "likeCount"
FROM movie
ORDER BY "likeCount" DESC, id DESC
LIMIT 5;

-- 두번째 페이지
SELECT id, title, "likeCount"
FROM movie
ORDER BY "likeCount" DESC, id DESC
LIMIT 5
OFFSET 5;
```

<br />

## Cursor Based Pagination

-   마지막 불러온 데이터를 기반으로 다음 가져올 데이터를 정한다
-   예를 들어 마지막으로 불러온 데이터가 20번이었다면 다음 요청은 21번부터 가져온다

```sql
-- 첫번째 페이지
SELECT id, title, "likeCount"
FROM movie
ORDER BY id DESC
LIMIT 5;

-- 두번째 페이지
SELECT id, title, "likeCount"
FROM movie
WHERE id < 252
ORDER BY id DESC
LIMIT 5;

-- Multi column pagination (2 columns)
-- 첫번째 페이지
SELECT id, title, "likeCount"
FROM movie
ORDER BY "likeCount" DESC, id DESC
LIMIT 5;

-- 두번째 페이지
SELECT id, title, "likeCount"
FROM movie
WHERE ("likeCount" < 20)
    OR ("likeCount" = 20 AND id < 35)
ORDER BY "likeCount" DESC, id DESC
LIMIT 5;

-- Multi column pagination (3 columns)
-- 첫번째 페이지
SELECT id, title, "likeCount", "createdAt"
FROM movie
ORDER BY "likeCount" DESC, id DESC, "createdAt" DESC
LIMIT 5;

-- 두번째 페이지(A)
SELECT id, title, "likeCount", "createdAt"
FROM movie
WHERE ("likeCount" < 20)
    OR ("likeCount" = 20 AND id < 35)
    OR ("likeCount" = 20 AND id = 35 AND "createdAt" < '2025-06-06 18:51:13.940797')
ORDER BY "likeCount" DESC, id DESC, "createdAt" DESC
LIMIT 5;

-- 두번째 페이지(B)
SELECT id, title, "likeCount", "createdAt"
FROM movie
WHERE ("likeCount", id, "createdAt") < (20, 35, '2025-06-06 18:51:13.940797')
ORDER BY "likeCount" DESC, id DESC, "createdAt" DESC
LIMIT 5;

-- A와 B는 똑같은 쿼리
```
