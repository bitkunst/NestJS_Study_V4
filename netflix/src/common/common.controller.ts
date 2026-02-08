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
        await this.thumbnailQueue.add('thumbnail', {
            videoId: video.filename,
            videoPath: video.path,
        });

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
