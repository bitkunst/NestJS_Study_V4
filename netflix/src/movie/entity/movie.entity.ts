// import { Exclude, Expose, Transform } from 'class-transformer';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

@Entity()
export class Movie {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    genre: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @VersionColumn()
    version: number;
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
