import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateMovieDto {
    @ApiProperty({
        description: '영화 제목',
        example: '컨택트',
    })
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiProperty({
        description: '영화 설명',
        example: '함께 보고싶은 영화',
    })
    @IsNotEmpty()
    @IsString()
    detail: string;

    @ApiProperty({
        description: '감독 객체 ID',
        example: 1,
    })
    @IsNotEmpty()
    @IsNumber()
    directorId: number;

    @ApiProperty({
        description: '장르 IDs',
        example: [1, 2, 3],
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsNumber({}, { each: true }) // Array 안의 모든 값 검증
    @Type(() => Number) // Number 타입으로 transform
    genreIds: number[];

    @ApiProperty({
        description: '영화 파일 이름',
        example: 'aaa-bbb-ccc-ddd.mp4',
    })
    @IsNotEmpty()
    @IsString()
    movieFileName: string;
}
