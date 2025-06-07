import { IsOptional, IsString } from 'class-validator';
import { CursorPaginationDto } from 'src/common/dto/cursor-pagination.dto';
// import { PagePaginationDto } from 'src/common/dto/page-pagination.dto';

// Page pagination 적용시
// export class GetMoviesDto extends PagePaginationDto {
//     @IsString()
//     @IsOptional()
//     title?: string;
// }

// Cursor pagination 적용시
export class GetMoviesDto extends CursorPaginationDto {
    @IsString()
    @IsOptional()
    title?: string;
}
