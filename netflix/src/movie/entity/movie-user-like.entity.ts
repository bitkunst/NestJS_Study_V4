import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Movie } from './movie.entity';
import { User } from 'src/user/entity/user.entity';

// "좋아요" 시스템 중간 테이블 Entity
// MovieUserLike는 중간테이블
// Movie - MovieUserLike : OneToMany
// User - MovieUserLike : OneToMany
// User - Movie : ManyToMany
@Entity()
export class MovieUserLike {
    // movieId & userId 칼럼을 composite primary key 형태로 구성

    // 관계 데코레이터(@ManyToOne)는 “이 프로퍼티는 관계다”라고 TypeORM에 알려주고, FK 컬럼은 내부적으로 자동 생성. (기본 이름: 프로퍼티명 + 참조PK명 → movieId, userId)
    // 반면 칼럼 데코레이터(@PrimaryColumn, @Column)는 “이 프로퍼티는 실제 DB 칼럼(스칼라 타입)이다”라고 선언한다.
    // 관계 프로퍼티(객체 타입)에 @PrimaryColumn을 직접 붙이면, TypeORM은 해당 프로퍼티를 스칼라 칼럼으로 취급하려다 타입을 추론할 수 없어 ColumnTypeUndefinedError를 던진다.
    // 따라서 Relation에 칼럼 데코레이터를 붙였을 때는 자동으로 타입이랑 칼럼명이 유추되지 않는다 -> 직접 작성해서 명시
    @PrimaryColumn({
        name: 'movieId',
        type: 'int8',
    })
    @ManyToOne(() => Movie, (movie) => movie.likedUsers, { onDelete: 'CASCADE' })
    movie: Movie;

    @PrimaryColumn({
        name: 'userId',
        type: 'int8',
    })
    @ManyToOne(() => User, (user) => user.likedMovies, { onDelete: 'CASCADE' })
    user: User;

    @Column()
    isLike: boolean;
}

/**
 * [Like] [Dislike]
 *
 * 아무것도 누르지 않은 상태
 * Like & Dislike 모두 버튼 꺼져 있음
 *
 * Like 버튼 누르면
 * Like 버튼 불 켜짐
 *
 * Like 버튼 다시 누르면
 * Like 버튼 불 꺼짐
 *
 * Dislike 버튼 누르면
 * Dislike 버튼 불 켜짐
 *
 * Dislike 버튼 다시 누르면
 * Dislike 버튼 불 꺼짐
 *
 * Like 버튼 누름
 * Like 버튼 불 켜짐
 *
 * Dislike 버튼 누름
 * Like 버튼 불 꺼지고 Dislike 버튼 불 켜짐
 */
