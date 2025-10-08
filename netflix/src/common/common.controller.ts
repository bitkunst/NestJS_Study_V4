import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('common')
export class CommonController {
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
    createVideo(@UploadedFile() video: Express.Multer.File) {
        return {
            fileName: video.filename,
        };
    }
}
