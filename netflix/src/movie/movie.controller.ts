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
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                // name: {필드명}, maxCount: {최대파일개수}
                { name: 'movie', maxCount: 1 },
                { name: 'poster', maxCount: 2 },
            ],
            {
                // Multer Options
                limits: {
                    fileSize: 20000000, // 20MB
                },
                fileFilter(req, file, callback) {
                    if (file.mimetype !== 'video/mp4') {
                        return callback(new BadRequestException('MP4 타입만 업로드 가능합니다!'), false);
                    }
                    callback(null, true); // callback() 함수의 파라미터로 "에러", "파일 수신 여부" 전달
                },
            },
        ),
    )
    @Post()
    postMovie(
        @Body() body: CreateMovieDto,
        @Request() req,
        @UploadedFiles()
        files: {
            movie?: Express.Multer.File[];
            poster?: Express.Multer.File[];
        },
    ) {
        console.log('files', files);
        return this.movieService.create(body, req.queryRunner);
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
