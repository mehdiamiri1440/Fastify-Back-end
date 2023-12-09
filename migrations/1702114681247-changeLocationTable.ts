import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeLocationTable1702114681247 implements MigrationInterface {
  name = 'ChangeLocationTable1702114681247';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "de"`);
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "zip_code"`);
    await queryRunner.query(`ALTER TABLE "location" ADD "zip_code" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "zip_code"`);
    await queryRunner.query(
      `ALTER TABLE "location" ADD "zip_code" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "location" ADD "de" character varying`,
    );
  }
}
