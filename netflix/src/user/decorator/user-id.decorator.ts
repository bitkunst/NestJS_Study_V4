import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const UserId = createParamDecorator((data: unknown, context: ExecutionContext) => {
    // @UserId() 데코레이터에 전달한 파라미터가 data 변수에 들어간다
    const request = context.switchToHttp().getRequest();
    // if (!request || !request.user || !request.user.sub)
    //     throw new UnauthorizedException('사용자 정보를 찾을 수 없습니다!');

    return request?.user?.sub;
});
