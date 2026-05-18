import { DataSourceOptions } from 'typeorm';
import { Lead } from '../modules/leads/entities/lead.entity';
import { User } from '../modules/auth/entities/user.entity';

const isTsRuntime =
  process.env.TS_NODE === 'true' || __filename.endsWith('.ts');

function getEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function resolveDatabaseName(): string {
  if (process.env.NODE_ENV === 'test' && process.env.DB_NAME_TEST) {
    return process.env.DB_NAME_TEST;
  }

  return getEnv('DB_NAME', 'one_million_test');
}

export const typeOrmConfig: DataSourceOptions = {
  type: 'mysql',
  host: getEnv('DB_HOST', 'localhost'),
  port: parseInt(getEnv('DB_PORT', '3306'), 10),
  username: getEnv('DB_USERNAME', 'root'),
  password: getEnv('DB_PASSWORD', ''),
  database: resolveDatabaseName(),
  entities: isTsRuntime
    ? [User, Lead, 'src/**/*.entity.ts']
    : [User, Lead, 'dist/**/*.entity.js'],
  migrations: isTsRuntime
    ? ['src/database/migrations/*.ts']
    : ['dist/database/migrations/*.js'],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
};
