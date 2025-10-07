## Task Scheduling

### Task Scheduling의 용도

-   메일링 리스트에 추천 영화 리스트를 주기적으로 보내줄 때
-   총 좋아요 개수나 총 조회수처럼 특정 데이터를 주기적으로 업데이트할 때
-   주기적으로 데이터나 파일을 정리할 때
-   주기적으로 데이터 분석 리포트를 제작할 때
-   주기적으로 데이터베이스를 백업할 때

### Cron 문법

-   Cron: Unix 시스템에서 어떤 기능을 주기적으로 실행할 수 있도록 해주는 프로그램

```text
* * * * * *  실행할 커맨드
- - - - - -
| | | | | +----- 요일 (월...일) (0 - 7)
| | | | +------- 월 (1 - 12)
| | | +--------- 일 (1 - 31)
| | +----------- 시 (0 - 23)
| +------------- 분 (0 - 59)
+--------------- 초 (0 - 59)
```

-   초 : 0-59
    -   0초부터 59초까지의 숫자를 입력한다
-   분 : 0-59
    -   0분부터 59분까지의 숫자를 입력한다
-   시 : 0-23
    -   0시부터 23시까지의 숫자를 입력한다
-   일 : 1-31
    -   1일부터 31일까지의 숫자를 입력한다
-   월 : 1-12
    -   1월부터 12월까지의 숫자를 입력한다
-   요일 : 0-7
    -   0부터 7까지의 숫자가 각 [일,월,화,수,목,금,토,일]에 해당된다
    -   일요일은 두번 있다
-   `*` [별] : 필드의 모든 값을 매칭한다
    -   ex) 1초마다 실행
-   `,` [컴마] : 여러개의 값을 구분한다
    -   ex) '일' 위치에 1,2,3 입력 -> 1일,2일,3일에 실행
-   `-` [하이픈] : 범위를 표현한다
    -   ex) '요일' 위치에 1-3 입력 -> 월요일부터 수요일에 해당될 때 실행
-   `/` [슬래시] : 배수를 표현한다
    -   ex) '분' 위치에 \*/15 입력 -> 15분마다 실행 (0, 15, 30, 45분)
-   `L` [알파벳 L] : 달의 마지막 날을 의미한다
    -   ex) '요일' 위치에 5L 입력 -> 달의 마지막 금요일
-   `W` [알파벳 W] : '일' 위치에 입력시 가까운 평일
    -   ex) '일' 위치에 15W 입력 -> 15일에 가장 가까운 평일
-   `#` [샾] : 몇번째 요일인지 표현한다
    -   ex) '요일' 위치에 5#3 입력 -> 달의 세번째 금요일

> NestJS Scheduler 포함 몇몇 Cron에서는 L, W, # 패턴 사용 불가

### Cron 예제

-   0초마다 실행 (1분에 한번 실행)

```text
0 * * * * *
```

-   정확히 자정에 실행 (0초 0분 0시)

```text
0 0 0 * * *
```

-   일요일 3시 0분 30초에 실행 (일요일 3:00:30AM)

```text
30 0 3 * * 0
```

-   매월 마지막 날 17시 30분 45초에 실행 (매월 마지막 날 5:30:45PM)

```text
45 30 17 L * *
```

-   월,수,금 10시 15분에 실행 (월,수,금 10:15:00AM)

```text
0 15 10 * * 1,3,5
```

-   0초 5분마다 실행 (5분마다 실행, 시 정각에 시작)

```text
0 */5 * * * *
```

-   8시와 20시 사이에 2시간마다 실행

```text
0 0 8-20/2 * * *
```

-   매월 마지막 금요일 11:00:00PM에 실행

```text
0 0 23 * * 5L
```

-   1초마다 실행

```text
* * * * * *
```

-   30초마다 실행

```text
*/30 * * * * *
```

### NestJS Schedule 선언형

```sh
$ npm i @nestjs/schedule
```

```ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    @Cron('45 * * * * *')
    handleCron() {
        this.logger.debug('Called when the current second is 45');
    }
}
```

### NestJS Schedule 옵션

```ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NotificationService {
    @Cron('* * 0 * * *', {
        name: 'notifications',
        timeZone: 'Europe/Paris',
    })
    triggerNotification() {}
}
```

### SchedulerRegistry 함수

```ts
addCronJob(name: string, seconds: string) {
    const job = new CronJob(`${seconds} * * * * *`, () => {
        this.logger.warn(`time (${seconds}) for job ${name} to run!`)
    });

    this.schedulerRegistry.addCronJob(name, job);
    job.start();

    this.logger.warn(
        `job ${name} added for each minute at ${seconds} seconds!`
    );
}
```

-   `stop()` : 예정된 작업을 중지한다
-   `start()` : stop()이 실행된 작업을 재실행한다
-   `setTime(time: CronTime)` : 작업을 중지하고 새로운 주기를 지정하고 시작한다
-   `lastDate()` : 마지막으로 작업이 실행된 날짜를 반환한다
-   `nextDate()` : 다음으로 작업이 실행될 날짜를 반환한다
-   `nextDates(count: number)` : 다음으로 작업이 실행될 날짜들을 n개 반환한다
