import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeLocationTable1702262908772 implements MigrationInterface {
  name = 'ChangeLocationTable1702262908772';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "location" ADD "factor" double precision`,
    );
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "city"`);
    await queryRunner.query(
      `ALTER TABLE "location" ADD "city" double precision`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "city"`);
    await queryRunner.query(
      `ALTER TABLE "location" ADD "city" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "factor"`);
  }
}
