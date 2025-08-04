## RBAC

### Role Based Access Control

-   RBAC은 `Role Based Access Control`의 약자다
-   역할(Role) 기반으로 권한(Permission)을 나눠서 특정 리소스에 CRUD 작업을 할 수 있는지 여부를 결정한다

### 구현 방식

```ts
export enum Role {
    Admin = 'admin',
    User = 'user',
    Guest = 'guest',
}
```

```ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './role.enum';
import { RBAC } from './decorator/rbac.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const roles = this.reflector.get<Role[]>(RBAC, context.getHandler());
        if (!roles) return true;

        const request = context.switchToHttp().getRequest();
        const user = request.user;
        return roles.some((role) => user.roles?.includes(role));
    }
}
```
