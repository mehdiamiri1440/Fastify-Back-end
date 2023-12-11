import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeLocationTable1702263102055 implements MigrationInterface {
  name = 'ChangeLocationTable1702263102055';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "city"`);
    await queryRunner.query(
      `ALTER TABLE "location" ADD "city" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "city"`);
    await queryRunner.query(
      `ALTER TABLE "location" ADD "city" double precision`,
    );
  }
}
