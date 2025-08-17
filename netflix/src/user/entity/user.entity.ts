import { Exclude } from 'class-transformer';
import { BaseTable } from 'src/common/entity/base-table.entity';
import { Movie } from 'src/movie/entity/movie.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

export enum Role {
    ADMIN,
    PAID_USER,
    USER,
}

@Entity()
export class User extends BaseTable {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    // toClassOnly: 요청을 받을 때
    // toPlainOnly: 응답을 할때
    @Exclude({
        toPlainOnly: true,
    })
    @Column()
    password: string;

    @Column({
        enum: Role,
        default: Role.USER,
    })
    role: Role;

    @OneToMany(() => Movie, (movie) => movie.creator)
    createdMovies: Movie[];
}
