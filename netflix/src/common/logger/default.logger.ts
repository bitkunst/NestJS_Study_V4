import { ConsoleLogger, Injectable } from '@nestjs/common';

// 기본 Logger를 오버라이딩해서 사용
@Injectable()
export class DefaultLogger extends ConsoleLogger {
    warn(message: unknown, ...rest: unknown[]): void {
        console.log('---- WARN LOG ----');
        // 추가 로직 작성
        super.warn(message, ...rest);
    }

    error(message: unknown, ...rest: unknown[]): void {
        console.log('---- ERROR LOG ----');
        // 추가 로직 작성
        super.error(message, ...rest);
    }
}
