import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { PagePaginationDto } from './dto/page-pagination.dto';
import { CursorPaginationDto } from './dto/cursor-pagination.dto';
// import AWS from 'aws-sdk';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ObjectCannedACL, PutObjectCommand, PutObjectCommandInput, S3 } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import { envVariableKeys } from './constant/env.constant';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CommonService {
    // private s3: AWS.S3;
    private s3: S3;

    constructor(protected readonly configService: ConfigService) {
        // AWS SDK 초기화 (v2)
        // JS SDK v3 does not support global configuration.
        // Codemod has attempted to pass values to each service client in this file.
        // You may need to update clients outside of this file, if they use global config.
        // AWS.config.update({
        //     credentials: {
        //         accessKeyId: configService.get<string>(envVariableKeys.awsAccessKey),
        //         secretAccessKey: configService.get<string>(envVariableKeys.awsSecretAccessKey),
        //     },
        //     region: configService.get<string>(envVariableKeys.awsRegion),
        // });

        this.s3 = new S3({
            credentials: {
                accessKeyId: configService.get<string>(envVariableKeys.awsAccessKey),
                secretAccessKey: configService.get<string>(envVariableKeys.awsSecretAccessKey),
            },
            region: configService.get<string>(envVariableKeys.awsRegion),
        });
    }

    async saveMovieToPermanentStorage(fileName: string) {
        try {
            const bucketName = this.configService.get<string>(envVariableKeys.bucketName);
            await this.s3.copyObject({
                Bucket: bucketName,
                CopySource: `${bucketName}/public/temp/${fileName}`,
                Key: `public/movie/${fileName}`,
                ACL: ObjectCannedACL.public_read,
            });

            await this.s3.deleteObject({
                Bucket: bucketName,
                Key: `public/temp/${fileName}`,
            });
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('S3 저장 실패');
        }
    }

    async createPresignedUrl(expiresIn: number = 300) {
        const params: PutObjectCommandInput = {
            Bucket: this.configService.get<string>(envVariableKeys.bucketName),
            Key: `public/temp/${uuid()}.mp4`,
            ACL: ObjectCannedACL.public_read,
        };

        try {
            const url = await getSignedUrl(this.s3, new PutObjectCommand(params), {
                expiresIn,
            });
            return url;
        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException('S3 Presigned URL 생성 실패');
        }
    }

    applyPagePaginationParamsToQb<T>(qb: SelectQueryBuilder<T>, dto: PagePaginationDto) {
        const { page, take } = dto;
        const skip = (page - 1) * take;
        qb.skip(skip);
        qb.take(take);
    }

    async applyCursorPaginationParamsToQb<T>(qb: SelectQueryBuilder<T>, dto: CursorPaginationDto) {
        // Basic cursor pagination
        // const { id, order, take } = dto;

        // if (id) {
        //     const direction = order === 'ASC' ? '>' : '<';
        //     qb.where(`${qb.alias}.id ${direction} :id`, { id });
        // }

        // qb.orderBy(`${qb.alias}.id`, order);
        // qb.take(take);

        // Multi cursor pagination
        let { cursor, take, order } = dto;

        if (cursor) {
            const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');
            /**
             *  {
             *    values: { id: 27 },
             *    order: ['id_DESC']
             *  }
             */
            const cursorObj = JSON.parse(decodedCursor);
            order = cursorObj.order;

            const { values } = cursorObj;
            // WHERE (column1 < value1)
            // OR   (column1 = value1 AND column2 < value2)
            // OR   (column1 = value1 AND column2 = value2 AND column3 < value3)
            // (alias.column1, alias.column2, alias.column3) < (:value1, :value2, :value3)
            const columns = Object.keys(values);
            const comparisonOperator = order.some((o) => o.endsWith('DESC')) ? '<' : '>';
            const whereConditions = columns.map((c) => `${qb.alias}.${c}`).join(',');
            const whereParams = columns.map((c) => `:${c}`).join(',');

            qb.where(`(${whereConditions}) ${comparisonOperator} (${whereParams})`, values);
        }

        // order: ['likeCount_DESC', 'id_DESC']
        for (let i = 0; i < order.length; i++) {
            const [column, direction] = order[i].split('_');

            if (direction !== 'ASC' && direction !== 'DESC')
                throw new BadRequestException('Order는 ASC 또는 DESC로 입력해주세요!');

            if (i === 0) {
                qb.orderBy(`${qb.alias}.${column}`, direction);
            } else {
                qb.addOrderBy(`${qb.alias}.${column}`, direction);
            }
        }

        qb.take(take);

        const results = await qb.getMany();
        const nextCursor = this.generateNextCursor(results, order);

        return { qb, nextCursor };
    }

    // 클라이언트에서 cursor를 만들어서 주는 방식이 아닌 서버에서 cursor를 생성해서 전달하는 방식
    generateNextCursor<T>(results: T[], order: string[]): string | null {
        if (results.length === 0) return null;

        /**
         *  {
         *    values: { id: 27 },
         *    order: ['id_DESC']
         *  }
         */
        const lastItem = results[results.length - 1];
        const values = {};

        order.forEach((columnOrder) => {
            const [column] = columnOrder.split('_');
            values[column] = lastItem[column];
        });

        const cursorObj = { values, order };
        // 클라이언트에서 쿼리스트링으로 전달받을 값이기 때문에 base64로 인코딩해서 전달
        const nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString('base64');
        return nextCursor;
    }
}
