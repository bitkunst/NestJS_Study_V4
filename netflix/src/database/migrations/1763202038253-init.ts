import { MigrationInterface, QueryRunner } from 'typeorm';

export class init1763202038253 implements MigrationInterface {
    name = 'init1763202038253';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "movie_detail" ("id" SERIAL NOT NULL, "detail" character varying NOT NULL, CONSTRAINT "PK_e3014d1b25dbc9648b9abc58537" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "director" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "version" integer NOT NULL, "id" SERIAL NOT NULL, "name" character varying NOT NULL, "dob" TIMESTAMP NOT NULL, "nationality" character varying NOT NULL, CONSTRAINT "PK_b85b179882f31c43324ef124fea" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "genre" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "version" integer NOT NULL, "id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "UQ_dd8cd9e50dd049656e4be1f7e8c" UNIQUE ("name"), CONSTRAINT "PK_0285d4f1655d080cfcf7d1ab141" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "user" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "version" integer NOT NULL, "id" SERIAL NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "role" integer NOT NULL DEFAULT '2', CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "movie" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "version" integer NOT NULL, "id" SERIAL NOT NULL, "title" character varying NOT NULL, "likeCount" integer NOT NULL DEFAULT '0', "dislikeCount" integer NOT NULL DEFAULT '0', "movieFilePath" character varying NOT NULL, "detail_id" integer NOT NULL, "director_id" integer NOT NULL, "creator_id" integer, CONSTRAINT "UQ_a81090ad0ceb645f30f9399c347" UNIQUE ("title"), CONSTRAINT "REL_e3014d1b25dbc9648b9abc5853" UNIQUE ("detail_id"), CONSTRAINT "PK_cb3bb4d61cf764dc035cbedd422" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "movie_user_like" ("movieId" integer NOT NULL, "userId" integer NOT NULL, "isLike" boolean NOT NULL, CONSTRAINT "PK_55397b3cefaa6fc1b47370fe84e" PRIMARY KEY ("movieId", "userId"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "movie_genres_genre" ("movie_id" integer NOT NULL, "genre_id" integer NOT NULL, CONSTRAINT "PK_a63e911ed7ae5f720dbd0108cfe" PRIMARY KEY ("movie_id", "genre_id"))`,
        );
        await queryRunner.query(`CREATE INDEX "IDX_b5a7876b5e3325f8417dd35aa8" ON "movie_genres_genre" ("movie_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_6bdad0a1ca42eba9baabef75ad" ON "movie_genres_genre" ("genre_id") `);
        await queryRunner.query(
            `ALTER TABLE "movie" ADD CONSTRAINT "FK_e3014d1b25dbc9648b9abc58537" FOREIGN KEY ("detail_id") REFERENCES "movie_detail"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "movie" ADD CONSTRAINT "FK_8aefbf59e604cdd127da5a093c5" FOREIGN KEY ("director_id") REFERENCES "director"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "movie" ADD CONSTRAINT "FK_a1b39904ac830f5200df1d6a40d" FOREIGN KEY ("creator_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "movie_user_like" ADD CONSTRAINT "FK_fd47c2914ce011f6966368c8486" FOREIGN KEY ("movieId") REFERENCES "movie"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "movie_user_like" ADD CONSTRAINT "FK_6a4d1cde9def796ad01b9ede541" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "movie_genres_genre" ADD CONSTRAINT "FK_b5a7876b5e3325f8417dd35aa85" FOREIGN KEY ("movie_id") REFERENCES "movie"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
        );
        await queryRunner.query(
            `ALTER TABLE "movie_genres_genre" ADD CONSTRAINT "FK_6bdad0a1ca42eba9baabef75ada" FOREIGN KEY ("genre_id") REFERENCES "genre"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movie_genres_genre" DROP CONSTRAINT "FK_6bdad0a1ca42eba9baabef75ada"`);
        await queryRunner.query(`ALTER TABLE "movie_genres_genre" DROP CONSTRAINT "FK_b5a7876b5e3325f8417dd35aa85"`);
        await queryRunner.query(`ALTER TABLE "movie_user_like" DROP CONSTRAINT "FK_6a4d1cde9def796ad01b9ede541"`);
        await queryRunner.query(`ALTER TABLE "movie_user_like" DROP CONSTRAINT "FK_fd47c2914ce011f6966368c8486"`);
        await queryRunner.query(`ALTER TABLE "movie" DROP CONSTRAINT "FK_a1b39904ac830f5200df1d6a40d"`);
        await queryRunner.query(`ALTER TABLE "movie" DROP CONSTRAINT "FK_8aefbf59e604cdd127da5a093c5"`);
        await queryRunner.query(`ALTER TABLE "movie" DROP CONSTRAINT "FK_e3014d1b25dbc9648b9abc58537"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6bdad0a1ca42eba9baabef75ad"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b5a7876b5e3325f8417dd35aa8"`);
        await queryRunner.query(`DROP TABLE "movie_genres_genre"`);
        await queryRunner.query(`DROP TABLE "movie_user_like"`);
        await queryRunner.query(`DROP TABLE "movie"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "genre"`);
        await queryRunner.query(`DROP TABLE "director"`);
        await queryRunner.query(`DROP TABLE "movie_detail"`);
    }
}
