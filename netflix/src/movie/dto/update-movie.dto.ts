import { PartialType } from '@nestjs/mapped-types';
import { CreateMovieDto } from './create-movie.dto';
/**
 * class-validator
 * IsDefined : null || undefined 체크
 * IsEmpty : null || undefined || '' 체크
 */

// PartialType이 CreateMovieDto의 모든 프로퍼티들을 Optional로 만들어준다
export class UpdateMovieDto extends PartialType(CreateMovieDto) {}
