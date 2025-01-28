import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
/**
 * class-validator
 * IsDefined : null || undefined 체크
 * IsEmpty : null || undefined || '' 체크
 */

export class UpdateMovieDto {
    @IsNotEmpty()
    @IsString()
    @IsOptional()
    title?: string;

    @IsArray()
    @ArrayNotEmpty()
    @IsNumber({}, { each: true })
    @IsOptional()
    genreIds?: number[];

    @IsNotEmpty()
    @IsString()
    @IsOptional()
    detail?: string;

    @IsNotEmpty()
    @IsNumber()
    @IsOptional()
    directorId?: number;
}
