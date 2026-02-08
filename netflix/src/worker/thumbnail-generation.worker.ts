import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('thumbnail-generation')
export class ThumbnailGenerationProcess extends WorkerHost {
    // 'thumbnail-generation' 큐에 작업이 들어왔을 때 process 메소드 실행
    async process(job: Job, token?: string): Promise<any> {
        const { videoId, videoPath } = job.data;

        console.log(job.data);

        return 0;
    }
}
