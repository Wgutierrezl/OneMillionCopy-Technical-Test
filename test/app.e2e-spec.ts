import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AppModule } from '../src/app.module';
import { Lead } from '../src/modules/leads/entities/lead.entity';

describe('Auth + Leads + AI Summary (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let token: string;
  let createdLeadId: string;

  const testId = Date.now();
  const testEmail = `e2e.lead.${testId}@example.com`;
  const testEmailDuplicate = `e2e.lead.dup.${testId}@example.com`;
  const adminEmail = `e2e.admin.${testId}@example.com`;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.AI_PROVIDER = 'mock';
    process.env.MOCK_AI_ENABLED = 'true';
    process.env.AI_ENABLE_FALLBACK = 'true';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();

    dataSource = app.get(DataSource);
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function cleanupTestData() {
    if (!dataSource?.isInitialized) {
      return;
    }

    await dataSource
      .createQueryBuilder()
      .delete()
      .from('users')
      .where('email LIKE :emailPattern', { emailPattern: 'e2e.admin.%@example.com' })
      .execute();

    await dataSource
      .createQueryBuilder()
      .softDelete()
      .from(Lead)
      .where('email LIKE :emailPattern', { emailPattern: 'e2e.lead.%@example.com' })
      .execute();

    await dataSource
      .createQueryBuilder()
      .delete()
      .from(Lead)
      .where('email LIKE :emailPattern', { emailPattern: 'e2e.lead.%@example.com' })
      .execute();
  }

  it('should reject leads endpoint without JWT', async () => {
    await request(app.getHttpServer()).get('/api/v1/leads').expect(401);
  });

  it('should register admin user', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'E2E Admin',
        email: adminEmail,
        password: '123456',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      name: 'E2E Admin',
      email: adminEmail.toLowerCase(),
      role: 'admin',
    });
    expect(response.body.id).toBeDefined();
  });

  it('should login admin and return access token', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: adminEmail,
        password: '123456',
      })
      .expect(200);

    expect(response.body.access_token).toBeDefined();
    token = response.body.access_token;
  });

  it('should create a valid lead', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/leads')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Lead E2E',
        email: testEmail,
        telefono: '+573001234567',
        fuente: 'instagram',
        producto_interes: 'Curso de ventas digitales',
        presupuesto: 250,
      })
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.nombre).toBe('Lead E2E');
    expect(response.body.email).toBe(testEmail.toLowerCase());
    createdLeadId = response.body.id;
  });

  it('should validate invalid email', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/leads')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Lead Email Invalido',
        email: 'no-es-email',
        fuente: 'instagram',
      })
      .expect(400);

    expect(response.body.message).toBeDefined();
  });

  it('should validate nombre min length', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/leads')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'A',
        email: `e2e.shortname.${testId}@example.com`,
        fuente: 'instagram',
      })
      .expect(400);
  });

  it('should validate invalid fuente', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/leads')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Lead Fuente Invalida',
        email: `e2e.invalidsource.${testId}@example.com`,
        fuente: 'twitter',
      })
      .expect(400);
  });

  it('should reject duplicate email', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/leads')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Lead Duplicado',
        email: testEmail,
        fuente: 'instagram',
      })
      .expect(400);
  });

  it('should list leads with pagination and filters', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/leads?page=1&limit=10&fuente=instagram')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.meta).toMatchObject({
      page: 1,
      limit: 10,
    });
  });

  it('should get lead by id', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/leads/${createdLeadId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.id).toBe(createdLeadId);
    expect(response.body.email).toBe(testEmail.toLowerCase());
  });

  it('should return 404 for non-existing lead id', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/leads/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('should update lead', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/v1/leads/${createdLeadId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Lead E2E Actualizado',
        producto_interes: 'Mentoría de marketing',
        presupuesto: 500,
      })
      .expect(200);

    expect(response.body.nombre).toBe('Lead E2E Actualizado');
    expect(response.body.producto_interes).toBe('Mentoría de marketing');
    expect(Number(response.body.presupuesto)).toBe(500);
  });

  it('should reject update email duplicated', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/leads')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre: 'Lead Dup Candidate',
        email: testEmailDuplicate,
        fuente: 'facebook',
      })
      .expect(201);

    const duplicateLeadId = created.body.id as string;

    await request(app.getHttpServer())
      .patch(`/api/v1/leads/${duplicateLeadId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: testEmail,
      })
      .expect(400);
  });

  it('should return leads stats', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/leads/stats')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(typeof response.body.totalLeads).toBe('number');
    expect(Array.isArray(response.body.leadsBySource)).toBe(true);
    expect(typeof response.body.averageBudget).toBe('number');
    expect(typeof response.body.leadsLast7Days).toBe('number');
  });

  it('should return AI summary using mock provider', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/leads/ai/summary')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fuente: 'instagram',
      })
      .expect(201);

    expect(response.body.provider).toBe('mock');
    expect(typeof response.body.summary).toBe('string');
    expect(typeof response.body.totalLeadsAnalyzed).toBe('number');
    expect(response.body.filters).toMatchObject({ fuente: 'instagram' });
  });

  it('should return AI summary with empty body', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/leads/ai/summary')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(201);

    expect(typeof response.body.summary).toBe('string');
    expect(typeof response.body.totalLeadsAnalyzed).toBe('number');
  });

  it('should soft delete lead and hide it from queries', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/leads/${createdLeadId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/v1/leads/${createdLeadId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    const listResponse = await request(app.getHttpServer())
      .get('/api/v1/leads?page=1&limit=50')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const ids = listResponse.body.data.map((item: { id: string }) => item.id);
    expect(ids).not.toContain(createdLeadId);

    const deletedLead = await dataSource.getRepository(Lead).findOne({
      where: { id: createdLeadId },
      withDeleted: true,
    });

    expect(deletedLead).toBeDefined();
    expect(deletedLead?.deleted_at).toBeTruthy();
  });
});
