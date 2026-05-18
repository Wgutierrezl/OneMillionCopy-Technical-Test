import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema20260518132000 implements MigrationInterface {
  name = 'InitialSchema20260518132000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE `users` (' +
        '`id` varchar(36) NOT NULL,' +
        '`name` varchar(120) NOT NULL,' +
        '`email` varchar(180) NOT NULL,' +
        '`password` varchar(255) NOT NULL,' +
        "`role` enum('admin') NOT NULL DEFAULT 'admin'," +
        '`created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),' +
        '`updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),' +
        'UNIQUE INDEX `UQ_users_email` (`email`),' +
        'PRIMARY KEY (`id`)' +
      ') ENGINE=InnoDB;',
    );

    await queryRunner.query(
      'CREATE TABLE `leads` (' +
        '`id` varchar(36) NOT NULL,' +
        '`nombre` varchar(120) NOT NULL,' +
        '`email` varchar(180) NOT NULL,' +
        '`telefono` varchar(40) NULL,' +
        "`fuente` enum('instagram', 'facebook', 'landing_page', 'referido', 'otro') NOT NULL," +
        '`producto_interes` varchar(180) NULL,' +
        '`presupuesto` decimal(10,2) NULL,' +
        '`created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),' +
        '`updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),' +
        '`deleted_at` datetime(6) NULL,' +
        'UNIQUE INDEX `UQ_leads_email` (`email`),' +
        'INDEX `IDX_leads_fuente` (`fuente`),' +
        'INDEX `IDX_leads_created_at` (`created_at`),' +
        'INDEX `IDX_leads_deleted_at` (`deleted_at`),' +
        'PRIMARY KEY (`id`)' +
      ') ENGINE=InnoDB;',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `leads`;');
    await queryRunner.query('DROP TABLE `users`;');
  }
}
