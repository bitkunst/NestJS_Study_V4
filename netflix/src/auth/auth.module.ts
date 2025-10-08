import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategy/local.strategy';
import { JwtStrategy } from './strategy/jwt.strategy';
import { UserModule } from 'src/user/user.module';

// JwtModule.register({}) -> atk, rtk에 각각 다른 옵션을 적용하기 위해 JwtModuleOptions 생략
@Module({
    imports: [TypeOrmModule.forFeature([User]), JwtModule.register({}), UserModule],
    controllers: [AuthController],
    providers: [AuthService, LocalStrategy, JwtStrategy],
    exports: [AuthService, JwtModule],
})
export class AuthModule {}
