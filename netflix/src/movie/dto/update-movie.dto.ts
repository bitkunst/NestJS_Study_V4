import { IsNotEmpty, IsOptional } from 'class-validator';
/**
 * class-validator
 * IsDefined : null || undefined 체크
 * IsEmpty : null || undefined || '' 체크
 */

export class UpdateMovieDto {
    @IsNotEmpty()
    @IsOptional()
    title?: string;

    @IsNotEmpty()
    @IsOptional()
    genre?: string;

    @IsNotEmpty()
    @IsOptional()
    detail?: string;
}
