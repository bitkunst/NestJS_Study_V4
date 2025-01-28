// import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseTable } from './base-table.entity';
import { MovieDetail } from './movie-detail.entity';

@Entity()
export class Movie extends BaseTable {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    genre: string;

    @OneToOne(() => MovieDetail, (movieDetail) => movieDetail.movie, { cascade: true })
    @JoinColumn({ name: 'detail_id' })
    detail: MovieDetail;
}

// 보안에 민감한 경우 Entity 클래스 전체를 Exclude 하는 경우도 존재
// 노출하고 싶은 프로퍼티에 Expose 적용
// @Exclude()
// export class Movie {
//     id: number;

//     @Expose()
//     title: string;

//     @Expose()
//     @Transform(({ value }) => value.toString().toUpperCase())
//     genre: string;

//     @Expose()
//     get description() {
//         return `id: ${this.id}, title: ${this.title}`;
//     }
// }
