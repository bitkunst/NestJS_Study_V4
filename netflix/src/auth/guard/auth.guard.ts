import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        // 요청에서 user 객체가 존재하는지 확인 (user 객체가 존재한다는 것 자체가 middleware에서 검증을 통과했다는 뜻)
        const request = context.switchToHttp().getRequest();
        if (!request.user || request.user.type !== 'access') return false;

        return true;
    }
}
