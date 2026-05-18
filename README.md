# One Million Copy SAS - Backend Technical Test

API REST desarrollada con NestJS para gestionar leads provenientes de embudos de marketing.

Este proyecto fue construido para la prueba técnica Backend de **One Million Copy SAS** e incluye autenticación JWT, CRUD de leads, estadísticas, webhook público, resumen con IA multiprovider, migraciones, seed, tests e2e y despliegue local con Docker Compose.

## 1) Descripción del proyecto
La API permite:
- Registrar, listar, consultar, actualizar y eliminar lógicamente leads.
- Obtener estadísticas comerciales de leads.
- Generar un resumen ejecutivo con IA (`Groq -> OpenAI -> Mock`).
- Recibir leads desde un webhook público simulando Typeform/Tally/Webflow.

Base path global: ` /api/v1 `  
Swagger: ` /api/docs `

## 2) Tecnologías usadas y por qué
- **NestJS**: arquitectura modular, guards/pipes, Swagger y testing integrados.
- **TypeScript**: tipado estático y mejor mantenibilidad.
- **MySQL**: motor relacional estable y simple para el alcance de la prueba.
- **TypeORM**: entidades, repositorios, migraciones y soft delete.
- **JWT**: autenticación para endpoints protegidos.
- **Swagger/OpenAPI**: documentación y pruebas interactivas.
- **Docker / Docker Compose**: ejecución rápida sin depender de MySQL local.
- **Jest + Supertest**: tests e2e de flujo real.
- **@nestjs/throttler**: rate limiting global.
- **OpenAI SDK + Groq/OpenAI/Mock**: integración IA multiprovider con fallback.

## 3) Arquitectura
Se eligió arquitectura modular de NestJS (sin hexagonal completa) para priorizar claridad, rapidez y mantenibilidad por el límite de tiempo.

```text
src/
├── common/
├── config/
├── database/
│   ├── migrations/
│   └── seeds/
├── modules/
│   ├── auth/
│   ├── leads/
│   └── ai/
└── main.ts
```

## 4) Variables de entorno
1. Copia `.env.example` a `.env`.
2. Ajusta valores según tu entorno.

Variables principales:
- `NODE_ENV`
- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_NAME_TEST`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `AI_PROVIDER`
- `AI_ENABLE_FALLBACK`
- `AI_TIMEOUT_MS`
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `GROQ_BASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_BASE_URL`
- `MOCK_AI_ENABLED`
- `RATE_LIMIT_TTL`
- `RATE_LIMIT_LIMIT`

Para probar IA sin llaves reales, usa:
- `AI_PROVIDER=mock`
- `MOCK_AI_ENABLED=true`

## 5) Ejecución local (manual)
### 5.1 Instalar dependencias
```bash
npm install
```

### 5.2 Crear base de datos
```sql
CREATE DATABASE one_million_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5.3 Ejecutar migraciones
```bash
npm run migration:run
```

### 5.4 Ejecutar seed
```bash
npm run seed:run
```

### 5.5 Levantar API
```bash
npm run start:dev
```

API: `http://localhost:3000`  
Swagger: `http://localhost:3000/api/docs`

## 6) Ejecución con Docker Compose (recomendada)
Levanta API + MySQL contenerizado.

```bash
docker compose up --build
```

Logs:
```bash
docker compose logs -f api
docker compose logs -f mysql
```

Comandos DB dentro del contenedor:
```bash
docker compose exec api npm run db:migrate:prod
docker compose exec api npm run db:seed:prod
```

Apagar y limpiar (incluye volumen MySQL):
```bash
docker compose down -v --remove-orphans
```

Notas:
- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api/docs`
- MySQL corre en contenedor con volumen persistente.
- Si `3306` está ocupado, cambia en `docker-compose.yml` a `3307:3306`.

## 7) Migraciones y seed
Migraciones crean:
- `users`
- `leads`
- `typeorm_migrations` (trazabilidad)

Seed inserta al menos 10 leads de ejemplo.

Comandos locales:
```bash
npm run migration:run
npm run migration:revert
npm run seed:run
```

Comandos Docker:
```bash
docker compose exec api npm run db:migrate:prod
docker compose exec api npm run db:seed:prod
```

## 8) Autenticación (JWT)
### Registrar admin
`POST /api/v1/auth/register`
```json
{
  "name": "Admin User",
  "email": "admin@test.com",
  "password": "123456"
}
```

### Login
`POST /api/v1/auth/login`
```json
{
  "email": "admin@test.com",
  "password": "123456"
}
```

Copia `access_token` y en Swagger usa `Authorize` con:
```text
Bearer <token>
```

## 9) Endpoints principales
### Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

### Leads protegidos (JWT admin)
- `POST /api/v1/leads`
- `GET /api/v1/leads?page=1&limit=10`
- `GET /api/v1/leads?fuente=instagram`
- `GET /api/v1/leads?startDate=2026-05-01&endDate=2026-05-18`
- `GET /api/v1/leads/:id`
- `PATCH /api/v1/leads/:id`
- `DELETE /api/v1/leads/:id`
- `GET /api/v1/leads/stats`

### IA
- `POST /api/v1/leads/ai/summary`
```json
{
  "fuente": "instagram",
  "startDate": "2026-05-01",
  "endDate": "2026-05-18"
}
```

### Webhook público
- `POST /api/v1/leads/webhook`
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "telefono": "3001234567",
  "fuente": "landing_page",
  "producto_interes": "Bootcamp de ventas",
  "presupuesto": 500
}
```

## 10) Reglas y validaciones de leads
- `nombre`: obligatorio, mínimo 2 caracteres.
- `email`: obligatorio, formato válido y único.
- `fuente`: obligatoria y enum permitido:
  - `instagram`
  - `facebook`
  - `landing_page`
  - `referido`
  - `otro`
- `telefono`: opcional.
- `producto_interes`: opcional.
- `presupuesto`: opcional.
- `DELETE` usa soft delete (`deleted_at`).

## 11) Manejo de errores consistente
Formato general:
```json
{
  "statusCode": 400,
  "message": "...",
  "timestamp": "..."
}
```

Códigos frecuentes:
- `400` Bad Request: DTO/validaciones.
- `401` Unauthorized: falta o invalidez de JWT.
- `403` Forbidden: rol no permitido.
- `404` Not Found: recurso no existe.
- `409` Conflict: duplicados (según implementación puede responder 400).
- `429` Too Many Requests: rate limiting.
- `500` Internal Server Error: error inesperado.

## 12) IA multiprovider
Endpoint: `POST /api/v1/leads/ai/summary`

Flujo:
1. Obtiene leads por filtros.
2. Sanitiza datos (no envía email ni teléfono al LLM).
3. Intenta provider principal (`Groq`).
4. Si falla, fallback a `OpenAI`.
5. Si falla/no hay keys, fallback a `Mock`.

Configurable por variables de entorno.

## 13) Rate limiting
Rate limiting global con `@nestjs/throttler`.

Variables:
- `RATE_LIMIT_TTL=60`
- `RATE_LIMIT_LIMIT=100`

Interpretación: máximo 100 requests cada 60 segundos por cliente (tracker por IP por defecto).

Para probar `429` rápidamente:
1. Baja `RATE_LIMIT_LIMIT=3`.
2. Reinicia API.
3. Ejecuta varias requests seguidas al mismo endpoint.

## 14) Tests
Cobertura e2e incluye:
- Auth
- Protección JWT
- CRUD leads
- Soft delete
- Stats
- IA con provider mock
- Webhook público

Comandos:
```bash
npm run test
npm run test:e2e
npx tsc -p tsconfig.json --noEmit
```

Nota: e2e usa configuración IA mock para evitar depender de API keys reales.

### Entorno de testing
El proyecto soporta un entorno dedicado para pruebas e2e, aislado del entorno de desarrollo y producción.

Ejemplo:
```env
NODE_ENV=test
DB_NAME_TEST=one_million_test_test
AI_PROVIDER=mock
MOCK_AI_ENABLED=true
```

Esto permite:
- Usar una base de datos separada para pruebas (`DB_NAME_TEST`).
- Evitar dependencias de API keys reales durante tests.
- Proteger datos de desarrollo/producción de ejecuciones e2e.

## 15) Swagger
- URL: `http://localhost:3000/api/docs`
- Para endpoints protegidos, usar `Authorize` con Bearer token.

## 16) Commits y proceso
Se trabajó con cambios incrementales y commits descriptivos por fase (arquitectura, auth, leads, migraciones, IA, tests, Docker, rate limiting, webhook).

## 17) Deployment
El backend fue desplegado utilizando:

- Render (hosting del backend NestJS)
- Railway MySQL (hosting de la base de datos)

URL pública de producción:  
https://onemillioncopy-technical-test.onrender.com

Documentación Swagger:  
https://onemillioncopy-technical-test.onrender.com/api/docs

Notas:
- La base de datos se encuentra desplegada separadamente en Railway.
- Las variables de entorno se manejan de forma segura desde la plataforma de despliegue.
- Docker sigue disponible para desarrollo local y reproducibilidad del entorno.

---
