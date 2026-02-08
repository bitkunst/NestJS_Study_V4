import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import path from 'path';
import { cwd } from 'process';
import * as ffmpegFluent from 'fluent-ffmpeg';

@Processor('thumbnail-generation')
export class ThumbnailGenerationProcess extends WorkerHost {
    // 'thumbnail-generation' 큐에 작업이 들어왔을 때 process 메소드 실행
    async process(job: Job, token?: string): Promise<any> {
        const { videoId, videoPath } = job.data;

        console.log(`Transcoding video with ID: ${videoId}`);

        const outputDirectory = path.join(cwd(), 'public', 'thumbnail');

        ffmpegFluent
            .default(videoPath)
            .screenshots({
                count: 1,
                filename: `${videoId}.png`,
                folder: outputDirectory,
                size: '320x240',
            })
            .on('end', () => {
                console.log(`썸네일 생성 완료! ID: ${videoId}`);
            })
            .on('error', (error) => {
                console.error(error);
                console.log(`썸네일 생성 실패! ID: ${videoId}`);
            });
    }
}
