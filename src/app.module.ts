import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { User } from './modules/auth/entities/user.entity';
import { Lead } from './modules/leads/entities/lead.entity';
import { LeadsModule } from './modules/leads/leads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, databaseConfig],
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isTest = configService.get<string>('NODE_ENV') === 'test';
        const ttlSeconds = parseInt(
          configService.get<string>('RATE_LIMIT_TTL', '60'),
          10,
        );
        const limit = parseInt(
          configService.get<string>('RATE_LIMIT_LIMIT', '100'),
          10,
        );

        return [
          {
            ttl: ttlSeconds * 1000,
            limit: isTest ? 10000 : limit,
          },
        ];
      },
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): DataSourceOptions => {
        const host = configService.get<string>('database.host', 'localhost');
        const port = configService.get<number>('database.port', 3306);
        const username = configService.get<string>('database.username', 'root');
        const password = configService.get<string>('database.password', '');
        const database = configService.get<string>(
          'database.database',
          'one_million_test',
        );

        if (process.env.DEBUG_DB_CONFIG === 'true') {
          Logger.log(
            `DB config -> host=${host} port=${port} user=${username} db=${database} passwordSet=${password.length > 0} passwordLength=${password.length}`,
            'TypeORM',
          );
        }

        return {
          type: 'mysql',
          host,
          port,
          username,
          password,
          database,
          entities: [User, Lead],
          migrationsTableName: 'typeorm_migrations',
          synchronize: false,
        };
      },
    }),
    AuthModule,
    LeadsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
