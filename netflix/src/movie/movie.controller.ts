import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseInterceptors,
    ClassSerializerInterceptor,
    ParseIntPipe,
    Request,
    UploadedFile,
    UploadedFiles,
    BadRequestException,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/user/entity/user.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MovieFilePipe } from './pipe/movie-file.pipe';
import { UserId } from 'src/user/decorator/user-id.decorator';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
import { QueryRunner as QR } from 'typeorm';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor) // class-transformer 적용
export class MovieController {
    constructor(private readonly movieService: MovieService) {}

    @Public()
    @Get()
    getMovies(@Query() dto: GetMoviesDto) {
        return this.movieService.findAll(dto);
    }

    @Public()
    @Get(':id')
    getMovie(@Param('id', ParseIntPipe) id: number) {
        return this.movieService.findOne(id);
    }

    @RBAC(Role.ADMIN)
    @UseInterceptors(TransactionInterceptor)
    @Post()
    postMovie(@Body() body: CreateMovieDto, @UserId() userId: number, @QueryRunner() queryRunner: QR) {
        return this.movieService.create(body, userId, queryRunner);
    }

    @RBAC(Role.ADMIN)
    @Patch(':id')
    patchMovie(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateMovieDto) {
        return this.movieService.update(id, body);
    }

    @RBAC(Role.ADMIN)
    @Delete(':id')
    deleteMovie(@Param('id', ParseIntPipe) id: number) {
        return this.movieService.remove(id);
    }
}
