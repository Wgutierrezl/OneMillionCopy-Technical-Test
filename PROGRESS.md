# PROGRESS - One Million Copy SAS Backend Challenge

## 1. Contexto del proyecto
Backend API REST para gestionar leads provenientes de embudos de marketing, con autenticación JWT para usuarios administradores y persistencia en MySQL usando TypeORM.

## 2. Stack técnico elegido
- NestJS 11
- TypeScript
- MySQL
- TypeORM
- JWT + Passport
- Swagger/OpenAPI
- class-validator + class-transformer
- OpenAI SDK (compatibilidad para OpenAI y Groq vía baseURL)
- Jest + Supertest (e2e)
- Docker + Docker Compose
- @nestjs/throttler (rate limiting)

## 3. Decisiones técnicas tomadas
- Arquitectura modular estándar NestJS (`auth`, `leads`, `ai`, `common`, `config`).
- Validación global con `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`).
- Prefijo global `api/v1` para versionado inicial.
- Manejo uniforme de errores mediante `HttpExceptionFilter` global.
- Soft delete para leads con `DeleteDateColumn`.
- Seguridad por JWT con `JwtAuthGuard` + `RolesGuard` para restringir gestión de leads a rol `admin`.
- `synchronize` deshabilitado y esquema gestionado por migraciones TypeORM.
- Trazabilidad de cambios DB con tabla `typeorm_migrations`.
- Integración IA multiprovider con fallback ordenado: Groq -> OpenAI -> Mock.
- Tests e2e enfocados en flujo real (auth + JWT + leads + IA mock).
- Dockerización con imagen multi-stage y MySQL contenerizado con volumen persistente.
- Rate limiting global con `ThrottlerGuard` y configuración por variables de entorno.

## 4. Funcionalidades implementadas por fases
- Fase 1:
  - Auth JWT (register/login admin).
  - CRUD de leads con validaciones, filtros, paginación, stats y soft delete.
- Fase 2:
  - Configuración MySQL real.
  - Migración inicial (`users`, `leads`).
  - Seed idempotente de mínimo 10 leads.
- Fase 3:
  - Endpoint obligatorio `POST /api/v1/leads/ai/summary`.
  - Filtros opcionales por `fuente`, `startDate`, `endDate`.
  - Prompt ejecutivo en español para análisis comercial.
  - Sanitización de datos enviados al LLM (sin email ni teléfono).
  - Manejo de ausencia de API keys y fallback a mock.
- Fase 4 (bonus calidad):
  - Suite e2e para auth, protección JWT, validaciones, CRUD leads, stats, soft delete y resumen IA con mock.
- Fase 5 (devops local):
  - `Dockerfile` multi-stage para build y runtime.
  - `docker-compose.yml` con servicios `api` y `mysql`.
  - Healthcheck de MySQL + `depends_on` con `service_healthy`.
  - Volumen persistente `mysql_data`.
  - Scripts DB para entorno dev y entorno compilado (`db:migrate`, `db:seed`, `db:setup`, `*:prod`).
- Fase 6 (bonus seguridad):
  - Rate limiting global con `ThrottlerModule.forRootAsync(...)` + `APP_GUARD` (`ThrottlerGuard`).
  - Configurable por `RATE_LIMIT_TTL` y `RATE_LIMIT_LIMIT`.
  - En entorno `test`, límite elevado para evitar falsos negativos en e2e.
- Fase 7 (bonus webhook):
  - Endpoint público `POST /api/v1/leads/webhook`.
  - Simulación de recepción de leads desde Typeform/Tally/Webflow.
  - Reutilización de la lógica de creación de leads (`LeadsService.create`).
  - Sin JWT/API key.
  - Casos e2e para webhook (éxito, validación, duplicado).

## 5. Endpoints implementados
Auth:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

Leads (protegidos con JWT admin):
- `POST /api/v1/leads`
- `GET /api/v1/leads`
- `GET /api/v1/leads/stats`
- `GET /api/v1/leads/:id`
- `PATCH /api/v1/leads/:id`
- `DELETE /api/v1/leads/:id`
- `POST /api/v1/leads/ai/summary`

Leads (público):
- `POST /api/v1/leads/webhook`

## 6. Validaciones implementadas
- `nombre`: obligatorio, mínimo 2 caracteres.
- `email`: obligatorio, formato válido, normalizado en minúsculas y único.
- `fuente`: obligatoria y restringida al enum permitido.
- `presupuesto`: opcional, numérico y >= 0.
- Validación estricta de payload por `ValidationPipe` global.
- Errores HTTP claros para duplicidad y recursos no encontrados.

## 7. Base de datos y trazabilidad
- DB elegida: MySQL.
- Migraciones en `src/database/migrations`.
- DataSource CLI: `src/database/data-source.ts` (TS/dev) y `dist/database/data-source.js` (JS/prod).
- Tabla de trazabilidad: `typeorm_migrations`.
- Tablas creadas por migración inicial: `users`, `leads`.

## 8. Comandos principales
Local:
- `npm run start:dev`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run db:setup`
- `npm run test:e2e`

Docker:
- `docker compose up --build`
- `docker compose logs -f api`
- `docker compose exec api npm run db:migrate:prod`
- `docker compose exec api npm run db:seed:prod`

## 9. Uso básico en Docker
- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api/docs`
- Registrar admin:
  - `POST /api/v1/auth/register`
  - Body: `{ "name": "Admin User", "email": "admin@test.com", "password": "123456" }`
- Login:
  - `POST /api/v1/auth/login`

## 10. Pendientes próximos
- CI/CD con GitHub Actions.
- Deploy Railway.
- README final.
