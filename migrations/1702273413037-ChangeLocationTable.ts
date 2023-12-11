import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeLocationTable1702273413037 implements MigrationInterface {
  name = 'ChangeLocationTable1702273413037';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "zip_code"`);
    await queryRunner.query(
      `ALTER TABLE "location" ADD "zip_code" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "zip_code"`);
    await queryRunner.query(`ALTER TABLE "location" ADD "zip_code" integer`);
  }
}
