## Queue

### Queue의 장점

-   서버 성능 최적화가 가능하다
    -   오래 걸리는 작업을 따로 Worker Node에게 전가할 수 있다
-   스케일링이 자유롭다
    -   Worker Node만 따로 스케일링 가능하다
    -   여러 개의 Worker Node를 생성하고 동시에 작업을 프로세싱 할 수 있다
-   작업이 유실될 확률이 적다
    -   실패한 작업 재시도
    -   실패한 작업 메타데이터 유지
-   우선순위 지정 가능
    -   중요한 작업을 우선 처리하도록 할 수 있다
-   Request <-> Response 라이프 사이클에 딜레이를 줄여줄 수 있다

### BullMQ

-   Redis를 기반으로 구축된 Node.js 라이브러리

```sh
## Queue
$ npm i @nestjs/bullmq bullmq
```

-   Setup
    -   Redis 엔드포인트 연결 세팅
    -   BullMQ에 등록할 프로세스 세팅 (registerQueue)

```ts
import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { TasksService } from './tasks.service';
import { DefaultLogger } from './logger/default.logger';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { envVariableKeys } from './constant/env.constant';

@Module({
    imports: [
        BullModule.forRootAsync({
            useFactory: (configService: ConfigService) => ({
                connection: {
                    host: configService.get<string>(envVariableKeys.redisHost),
                    port: Number(configService.get<number>(envVariableKeys.redisPort)),
                    username: configService.get<string>(envVariableKeys.redisUsername),
                    password: configService.get<string>(envVariableKeys.redisPassword),
                },
            }),
            inject: [ConfigService],
        }),
        BullModule.registerQueue({
            name: 'thumbnail-generation', // Queue 이름 (실제 작업에 대한 이름)
        }),
    ],
    controllers: [CommonController],
    providers: [CommonService, TasksService, DefaultLogger],
    exports: [CommonService, DefaultLogger],
})
export class CommonModule {}
```
