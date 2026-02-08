import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CommonService } from './common.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@ApiTags('common')
@ApiBearerAuth()
@Controller('common')
export class CommonController {
    constructor(
        private readonly commonService: CommonService,
        @InjectQueue('thumbnail-generation')
        private readonly thumbnailQueue: Queue,
    ) {}

    @Post('video')
    @UseInterceptors(
        FileInterceptor('video', {
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
        }),
    )
    async createVideo(@UploadedFile() video: Express.Multer.File) {
        // Producer가 큐에 넣은 파라미터를 가지고 Consumer가 작업을 할 수 있는 정도의 정보를 넣어줘야 된다
        await this.thumbnailQueue.add(
            'thumbnail',
            {
                videoId: video.filename,
                videoPath: video.path,
            },
            {
                priority: 1, // 숫자가 낮을수록 우선순위 높음
                delay: 500, // 500ms 뒤에 작업 실행
                attempts: 3, // 작업 실패 시 최대 3번 재시도
                lifo: false, // 작업 실행 순서 지정 (true: 최근 작업 우선, false: 오래된 작업 우선) -> true일 경우 Stack 구조로 작업 실행
                removeOnComplete: true, // 작업 완료 시 작업 정보 삭제
                removeOnFail: true, // 작업 실패 시 작업 정보 삭제
            },
        );

        return {
            fileName: video.filename,
        };
    }

    @Post('presigned-url')
    async createPresignedUrl() {
        return {
            url: await this.commonService.createPresignedUrl(),
        };
    }
}
