import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeLocationTable1706839901387 implements MigrationInterface {
  name = 'ChangeLocationTable1706839901387';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "state"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "location" ADD "state" character varying`,
    );
  }
}
