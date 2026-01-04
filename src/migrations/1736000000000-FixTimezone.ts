import { MigrationInterface, QueryRunner } from "typeorm";

export class FixTimezone1736000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "user" 
      SET "updatedAt" = "updatedAt" + INTERVAL '3 hours'
      WHERE "updatedAt" IS NOT NULL;
    `);

    await queryRunner.query(`
      UPDATE "user" 
      SET "lastChargeDate" = "lastChargeDate" + INTERVAL '3 hours'
      WHERE "lastChargeDate" IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "user" 
      SET "updatedAt" = "updatedAt" - INTERVAL '3 hours'
      WHERE "updatedAt" IS NOT NULL;
    `);

    await queryRunner.query(`
      UPDATE "user" 
      SET "lastChargeDate" = "lastChargeDate" - INTERVAL '3 hours'
      WHERE "lastChargeDate" IS NOT NULL;
    `);
  }
}

