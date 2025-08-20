## File upload

### Simple File upload

-   서버의 파일 시스템에 저장하는 방식
-   단일 파일 업로드: `@FileInterceptor`
-   복수 파일 업로드: `@FilesInterceptor`
-   여러개의 파일 필드를 사용해 업로드: `@FileFieldsInterceptor`

```ts
// module.ts
import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path from 'path';

@Module({
    imports: [
        MulterModule.register({
            // diskStorage -> 서버의 파일시스템에 저장
            // process.cwd() -> 프로젝트의 루트 경로
            storage: diskStorage({
                destination: path.join(process.cwd(), 'public', 'movie'),
                filename: (req, file, callback) => {
                    const split = file.originalname.split('.');
                    let extension = 'mp4';
                    if (split.length > 1) extension = split[split.length - 1];
                    callback(null, `${v4()}_${Date.now()}.${extension}`); // callback 파라미터로 '파일이름' 전달
                },
            }),
        }),
    ],
    controllers: [MovieController],
    providers: [MovieService],
})
export class MovieModule {}
```

```ts
// controller.ts
// 단일 파일 업로드
@UseInterceptors(FileInterceptor('movie'))
@Post()
postMovie(@Body() body: CreateMovieDto, @UploadedFile() file: Express.Multer.File) {
    console.log('file', file);
    return this.movieService.create(body);
}

// 복수 파일 업로드
@UseInterceptors(FilesInterceptor('movies'))
@Post()
postMovie(@Body() body: CreateMovieDto, @UploadedFiles() files: Express.Multer.File[]) {
    console.log('files', files);
    return this.movieService.create(body);
}

// 여러개의 파일 필드를 사용해 업로드
@UseInterceptors(
    FileFieldsInterceptor([
        { name: 'movie', maxCount: 1 }, // name: {필드명}, maxCount: {최대파일개수}
        { name: 'poster', maxCount: 2 },
    ]),
)
@Post()
postMovie(
    @Body() body: CreateMovieDto,
    @UploadedFiles()
    files: {
        movie?: Express.Multer.File[];
        poster?: Express.Multer.File[];
    },
) {
    console.log('files', files);
    return this.movieService.create(body);
}
```

### Multer Options

```ts
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
    @UploadedFiles()
    files: {
        movie?: Express.Multer.File[];
        poster?: Express.Multer.File[];
    },
) {
    console.log('files', files);
    return this.movieService.create(body);
}
```

### Serve Static

-   Static 파일 서빙하기

```sh
$ npm i @nestjs/serve-static
```

```ts
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: path.join(process.cwd(), 'public'), // 어떤 디렉토리로부터 파일들을 서빙할지 설정
            serveRoot: '/public/', // rootPath에서 서빙해주는 경로에 serveRoot를 붙였을 때 해당되는 파일들을 가져올 수 있다
            // 서버에서 파일을 찾을 때는 rootPath에서 찾는다 -> rootPath 경로에 있는 파일을 가져오기 위해서는 serveRoot를 앞에 붙여서 요청해야 한다
        }),
    ],
    providers: [],
})
export class AppModule {}
```
