import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeLocationTable1702264612479 implements MigrationInterface {
  name = 'ChangeLocationTable1702264612479';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "zip_code"`);
    await queryRunner.query(`ALTER TABLE "location" ADD "zip_code" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "zip_code"`);
    await queryRunner.query(
      `ALTER TABLE "location" ADD "zip_code" character varying`,
    );
  }
}
