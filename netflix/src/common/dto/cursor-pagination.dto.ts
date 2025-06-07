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
    @IsString()
    @IsOptional()
    cursor?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    order: string[] = ['id_DESC']; // 예시: ['likeCount_DESC', 'id_DESC']

    @IsInt()
    @IsOptional()
    take: number = 10;
}
