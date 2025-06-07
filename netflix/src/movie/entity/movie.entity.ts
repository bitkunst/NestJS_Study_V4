// import { Exclude, Expose, Transform } from 'class-transformer';
import {
    Column,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseTable } from 'src/common/entity/base-table.entity';
import { MovieDetail } from './movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';

// ManyToOne Director -> 감독은 여러개의 영화를 만들 수 있음
// OneToOne MovieDetail -> 영화는 하나의 상세 내용을 가질 수 있음
// ManyToMany Genre -> 영화는 여러개의 장르를 가질 수 있고 장르는 여러개의 영화에 속할 수 있음
@Entity()
export class Movie extends BaseTable {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    title: string;

    @ManyToMany(() => Genre, (genre) => genre.movies)
    @JoinTable({
        joinColumn: {
            name: 'movie_id', // 조인 테이블에 생성될 현재 엔티티의 외래키 칼럼 이름
            referencedColumnName: 'id', // 현재 엔티티의 어떤 칼럼을 참조할지 지정 (선택, 기본값 'id')
        },
        inverseJoinColumn: {
            name: 'genre_id', // 조인 테이블에 생성될 반대 엔티티의 외래키 칼럼 이름
            referencedColumnName: 'id', // 반대 엔티티의 어떤 칼럼을 참조할지 지정 (선택, 기본값 'id')
        },
    })
    genres: Genre[];

    @Column({ default: 0 })
    likeCount: number;

    @OneToOne(() => MovieDetail, (movieDetail) => movieDetail.movie, { cascade: true, nullable: false })
    @JoinColumn({ name: 'detail_id' })
    detail: MovieDetail;

    @ManyToOne(() => Director, (director) => director.movies, { cascade: true, nullable: false })
    @JoinColumn({ name: 'director_id' }) // column name을 지정하기 위해 사용 (원래는 @JoinColumn Annotation 추가하지 않아도 됨)
    director: Director;
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
