import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  jwtSecret: process.env.JWT_SECRET ?? 'changeme',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
}));
