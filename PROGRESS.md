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

## 3. Decisiones técnicas tomadas
- Arquitectura modular estándar NestJS (`auth`, `leads`, `common`, `config`).
- Validación global con `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`).
- Prefijo global `api/v1` para versionado inicial.
- Manejo uniforme de errores mediante `HttpExceptionFilter` global.
- Soft delete para leads con `DeleteDateColumn`.
- Seguridad por JWT con `JwtAuthGuard` + `RolesGuard` para restringir gestión de leads a rol `admin`.
- Se deshabilitó `synchronize` para evitar cambios implícitos de esquema.
- Se implementó estrategia de migraciones con TypeORM y DataSource dedicado para CLI.

## 4. Funcionalidades implementadas en Fase 1 y Fase 2
- Módulo de autenticación:
  - Registro de usuario administrador.
  - Login con emisión de `access_token` JWT.
  - Password hasheado con `bcrypt`.
- Módulo de leads:
  - CRUD completo con validaciones.
  - Paginación, filtros por fuente y rango de fechas.
  - Orden por fecha descendente.
  - Soft delete.
  - Endpoint de estadísticas.
- Persistencia SQL real:
  - Configuración TypeORM para MySQL con DataSource reutilizable.
  - Migración inicial manual para `users` y `leads`.
  - Tabla de trazabilidad de migraciones: `typeorm_migrations`.
  - Seed idempotente con mínimo 10 leads de ejemplo.
- Swagger inicial habilitado en `/api/docs`.

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

## 6. Validaciones implementadas
- `nombre`: obligatorio, mínimo 2 caracteres.
- `email`: obligatorio, formato válido, normalizado en minúsculas y único.
- `fuente`: obligatoria y restringida al enum permitido.
- `presupuesto`: opcional, numérico y >= 0.
- Validación estricta de payload por `ValidationPipe` global.
- Errores HTTP claros para casos de duplicidad y recursos no encontrados.

## 7. Base de datos y trazabilidad
- DB elegida: MySQL.
- Migraciones en `src/database/migrations`.
- DataSource CLI: `src/database/data-source.ts`.
- Tabla de trazabilidad: `typeorm_migrations`.
: Esta tabla almacena el historial de migraciones ejecutadas (nombre y orden), permitiendo auditar y reproducir cambios de esquema.
- Tablas creadas por migración inicial:
  - `users`
  - `leads`

## 8. Comandos de migraciones y seed
- Ejecutar migraciones:
  - `npm run migration:run`
- Revertir última migración:
  - `npm run migration:revert`
- Crear nueva migración vacía:
  - `npm run migration:create`
- Generar migración automática (si se requiere en fases siguientes):
  - `npm run migration:generate`
- Ejecutar seed inicial:
  - `npm run seed:run`

## 9. Pendientes próximos
- Integración IA con OpenAI/Groq y mock provider.
- Dockerfile y docker-compose.
- Tests.
- README final.
- Swagger refinado.
- Deploy Railway.
- GitHub Actions CI/CD.
- Endpoint webhook opcional `POST /leads/webhook`.

