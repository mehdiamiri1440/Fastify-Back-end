import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeUserTable1712023221201 implements MigrationInterface {
  name = 'ChangeUserTable1712023221201';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "nif"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "position"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "position" text`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD "nif" character varying NOT NULL`,
    );
  }
}
