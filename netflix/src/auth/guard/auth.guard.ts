import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Public } from '../decorator/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        console.log('AUTH GUARD');
        // 만약 @Public decoration이 되어 있으면 모든 로직을 bypass
        const isPublic = this.reflector.get(Public, context.getHandler()); // context.getHandler()로 가져온 문맥에서 Public 데코레이터를 가져온다
        // isPublic에는 Public 데코레이터에 입력된 객체가 들어온다
        if (isPublic) return true;

        // 요청에서 user 객체가 존재하는지 확인 (user 객체가 존재한다는 것 자체가 middleware에서 검증을 통과했다는 뜻)
        const request = context.switchToHttp().getRequest();
        if (!request.user || request.user.type !== 'access') return false;

        return true;
    }
}
