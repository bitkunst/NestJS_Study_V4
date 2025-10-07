import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { readdir, unlink } from 'fs/promises';
import path from 'path';

@Injectable()
export class TasksService {
    constructor() {}

    // @Cron('* * * * * *')
    logEverySecond() {
        console.log('1초마다 실행!');
    }

    @Cron('*/3 * * * * *')
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
}
