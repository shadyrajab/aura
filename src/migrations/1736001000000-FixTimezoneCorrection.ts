import { MigrationInterface, QueryRunner } from "typeorm";

export class FixTimezoneCorrection1736001000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "user" 
      SET "updatedAt" = "updatedAt" - INTERVAL '6 hours'
      WHERE "updatedAt" IS NOT NULL;
    `);

    await queryRunner.query(`
      UPDATE "user" 
      SET "lastChargeDate" = "lastChargeDate" - INTERVAL '6 hours'
      WHERE "lastChargeDate" IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "user" 
      SET "updatedAt" = "updatedAt" + INTERVAL '6 hours'
      WHERE "updatedAt" IS NOT NULL;
    `);

    await queryRunner.query(`
      UPDATE "user" 
      SET "lastChargeDate" = "lastChargeDate" + INTERVAL '6 hours'
      WHERE "lastChargeDate" IS NOT NULL;
    `);
  }
}

