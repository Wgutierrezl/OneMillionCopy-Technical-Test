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
- DataSource CLI: `src/database/data-source.ts`.
- Tabla de trazabilidad: `typeorm_migrations`.
- Tablas creadas por migración inicial: `users`, `leads`.

## 8. Comandos de migraciones, seed y tests
- `npm run migration:run`
- `npm run migration:revert`
- `npm run migration:create`
- `npm run migration:generate`
- `npm run seed:run`
- `npm run test:e2e`
- `npm run test`

## 9. Pendientes próximos
- Dockerfile y docker-compose.
- README final.
- Swagger refinado (respuestas/ejemplos detallados).
- Deploy Railway.
- GitHub Actions CI/CD.
- Endpoint webhook opcional `POST /leads/webhook`.
