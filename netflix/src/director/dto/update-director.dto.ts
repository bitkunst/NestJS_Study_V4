import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateDirectorDto {
    @IsNotEmpty()
    @IsString()
    @IsOptional()
    name?: string;

    @IsNotEmpty()
    @IsOptional()
    @IsDateString()
    dob?: Date;

    @IsNotEmpty()
    @IsString()
    @IsOptional()
    nationality?: string;
}
