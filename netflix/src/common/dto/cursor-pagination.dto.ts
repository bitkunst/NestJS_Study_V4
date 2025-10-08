import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class CursorPaginationDto {
    // Basic cursor pagination
    // @IsInt()
    // @IsOptional()
    // id?: number;

    // @IsIn(['ASC', 'DESC'])
    // @IsOptional()
    // order: 'ASC' | 'DESC' = 'DESC';

    // @IsInt()
    // @IsOptional()
    // take: number = 10;

    // Multi cursor pagination
    @ApiProperty({
        description: '페이지네이션 커서',
        example: 'eyJ2YWx1ZXMiOnsiaWQiOjN9LCJvcmRlciI6WyJpZF9ERVNDIl19',
    })
    @IsString()
    @IsOptional()
    cursor?: string;

    @ApiProperty({
        description: '내림차 또는 오름차 정렬',
        example: ['id_DESC'],
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
    order: string[] = ['id_DESC']; // 예시: ['likeCount_DESC', 'id_DESC']

    @ApiProperty({
        description: '가져올 데이터 개수',
        example: 5,
    })
    @IsInt()
    @IsOptional()
    take: number = 10;
}
