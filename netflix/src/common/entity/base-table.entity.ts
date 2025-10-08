import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

// class-transformer를 사용하여 Serialization 적용
// 서버에서 클라이언트에 응답을 주기 전에 데이터를 변환하는 과정
export class BaseTable {
    @ApiHideProperty()
    @Exclude()
    @CreateDateColumn()
    createdAt: Date;

    @ApiHideProperty()
    @Exclude()
    @UpdateDateColumn()
    updatedAt: Date;

    @ApiHideProperty()
    @Exclude()
    @VersionColumn()
    version: number;
}
