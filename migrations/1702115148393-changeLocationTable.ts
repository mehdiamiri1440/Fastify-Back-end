import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeLocationTable1702115148393 implements MigrationInterface {
  name = 'ChangeLocationTable1702115148393';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "location" ADD "created_at" date DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "updated_at"`);
    await queryRunner.query(
      `ALTER TABLE "location" ADD "updated_at" date DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "location" ADD "deleted_at" date`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "deleted_at"`);
    await queryRunner.query(
      `ALTER TABLE "location" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "updated_at"`);
    await queryRunner.query(
      `ALTER TABLE "location" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "location" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
  }
}
