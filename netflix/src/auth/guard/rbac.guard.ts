import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RBAC } from '../decorator/rbac.decorator';
import { Role } from 'src/user/entity/user.entity';

@Injectable()
export class RBACGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        console.log('RBAC GUARD');
        const role = this.reflector.get<Role>(RBAC, context.getHandler());

        // Role Enum에 해당되는 값이 데코레이터에 들어갔는지 확인
        if (!Object.values(Role).includes(role)) return true; // RBAC을 적용하지 않았거나 아예 다른 값을 넣은 경우 bypass

        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) return false;

        return user.role <= role;
    }
}
