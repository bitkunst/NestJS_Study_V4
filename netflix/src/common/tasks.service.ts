import { Injectable } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { readdir, unlink } from 'fs/promises';
import path from 'path';
import { Movie } from 'src/movie/entity/movie.entity';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);

    constructor(
        @InjectRepository(Movie)
        private readonly movieRepository: Repository<Movie>,
        private readonly schedulerRegistry: SchedulerRegistry,
    ) {}

    // @Cron('*/5 * * * * *')
    logEverySecond() {
        // NestJS에서 제공해주는 로그 레벨 순서
        this.logger.fatal('FATAL 레벨 로그'); // 지금 당장 해결해야 하는 문제 관련 로그
        this.logger.error('ERROR 레벨 로그'); // 에러 로그
        this.logger.warn('WARN 레벨 로그'); // 경고성 로그 (프로그램 실행에는 문제가 되지 않지만, 일어나면 안 좋은 상황)
        this.logger.log('LOG 레벨 로그'); // 정보성 로그 (INFO 레벨)
        this.logger.debug('DEBUG 레벨 로그'); // 개발환경에서 중요한 로그
        this.logger.verbose('VERBOSE 레벨 로그'); // 세밀한 추적/진단 로그
    }

    // @Cron('*/5 * * * * *')
    async eraseOrphanFiles() {
        const files = await readdir(path.join(process.cwd(), 'public', 'temp'));
        const deleteFilesTargets = files.filter((file) => {
            const filename = path.parse(file).name;
            const split = filename.split('_');
            if (split.length !== 2) return true;

            try {
                const date = +new Date(parseInt(split[split.length - 1]));
                const oneDayInMilSec = 24 * 60 * 60 * 1000;
                const now = Date.now();
                return now - date > oneDayInMilSec;
            } catch (error) {
                console.error(error);
                return true;
            }
        });
        console.log('deleteFilesTargets', deleteFilesTargets);

        // 파일 삭제 병렬처리
        await Promise.all(
            deleteFilesTargets.map((fileName) => unlink(path.join(process.cwd(), 'public', 'temp', fileName))),
        );
    }

    // @Cron('0 * * * * *')
    async calculateMovieLikeCounts() {
        console.log('query run!');
        await this.movieRepository.query(`
            UPDATE movie m
            SET "likeCount" = (
                SELECT count(*) FROM movie_user_like mul
                WHERE m.id = mul."movieId" AND mul."isLike" = true
            );
        `);

        await this.movieRepository.query(`
            UPDATE movie m
            SET "dislikeCount" = (
                SELECT count(*) FROM movie_user_like mul
                WHERE m.id = mul."movieId" AND mul."isLike" = false
            );
        `);
    }

    // @Cron('* * * * * *', {
    //     name: 'printer',
    // })
    // printer() {
    //     console.log('print every seconds');
    // }

    //* Dynamic Task Scheduling
    // @Cron('*/5 * * * * *')
    // stopper() {
    //     console.log('---stopper run---');
    //     const job = this.schedulerRegistry.getCronJob('printer');

    //     console.log('# Last Date');
    //     console.log(job.lastDate());
    //     console.log('# Next Date');
    //     console.log(job.nextDate());
    //     console.log('# Next Dates');
    //     console.log(job.nextDates(5));

    //     if (job.isActive) {
    //         job.stop();
    //     } else {
    //         job.start();
    //     }
    // }
}
