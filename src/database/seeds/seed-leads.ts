import 'dotenv/config';
import { DataSource } from 'typeorm';
import dataSource from '../data-source';
import { Lead } from '../../modules/leads/entities/lead.entity';
import { LeadSource } from '../../modules/leads/enums/lead-source.enum';

type SeedLead = {
  nombre: string;
  email: string;
  telefono?: string;
  fuente: LeadSource;
  producto_interes?: string;
  presupuesto?: number;
  created_at: Date;
};

const leadSeeds: SeedLead[] = [
  { nombre: 'María Gómez', email: 'maria.gomez@example.com', telefono: '+573001112233', fuente: LeadSource.INSTAGRAM, producto_interes: 'Curso de ventas digitales', presupuesto: 250, created_at: new Date('2026-05-01T10:00:00Z') },
  { nombre: 'Carlos Ramírez', email: 'carlos.ramirez@example.com', telefono: '+573001112234', fuente: LeadSource.FACEBOOK, producto_interes: 'Mentoría de marketing', presupuesto: 500, created_at: new Date('2026-05-02T11:30:00Z') },
  { nombre: 'Laura Pérez', email: 'laura.perez@example.com', telefono: '+573001112235', fuente: LeadSource.LANDING_PAGE, producto_interes: 'Ebook de copywriting', presupuesto: 80, created_at: new Date('2026-05-03T08:15:00Z') },
  { nombre: 'Andrés Torres', email: 'andres.torres@example.com', telefono: '+573001112236', fuente: LeadSource.REFERIDO, producto_interes: 'Programa premium', presupuesto: 1200, created_at: new Date('2026-05-04T16:45:00Z') },
  { nombre: 'Sofía Martínez', email: 'sofia.martinez@example.com', telefono: '+573001112237', fuente: LeadSource.OTRO, producto_interes: 'Consultoría', presupuesto: 300, created_at: new Date('2026-05-05T14:20:00Z') },
  { nombre: 'Diego Herrera', email: 'diego.herrera@example.com', telefono: '+573001112238', fuente: LeadSource.INSTAGRAM, producto_interes: 'Bootcamp de lanzamiento', presupuesto: 700, created_at: new Date('2026-05-06T13:00:00Z') },
  { nombre: 'Valentina Castro', email: 'valentina.castro@example.com', telefono: '+573001112239', fuente: LeadSource.FACEBOOK, producto_interes: 'Plantillas de anuncios', presupuesto: 150, created_at: new Date('2026-05-07T09:10:00Z') },
  { nombre: 'Juan Esteban Díaz', email: 'juan.diaz@example.com', telefono: '+573001112240', fuente: LeadSource.LANDING_PAGE, producto_interes: 'Masterclass de funnels', presupuesto: 420, created_at: new Date('2026-05-08T17:05:00Z') },
  { nombre: 'Paula Rojas', email: 'paula.rojas@example.com', telefono: '+573001112241', fuente: LeadSource.REFERIDO, producto_interes: 'Sesión estratégica', presupuesto: 350, created_at: new Date('2026-05-09T12:25:00Z') },
  { nombre: 'Sebastián León', email: 'sebastian.leon@example.com', telefono: '+573001112242', fuente: LeadSource.OTRO, producto_interes: 'Comunidad VIP', presupuesto: 999, created_at: new Date('2026-05-10T18:40:00Z') },
];

async function runSeed(db: DataSource) {
  const leadRepository = db.getRepository(Lead);

  for (const leadSeed of leadSeeds) {
    const exists = await leadRepository.findOne({
      where: { email: leadSeed.email.toLowerCase() },
      withDeleted: true,
    });

    if (!exists) {
      const lead = leadRepository.create({
        ...leadSeed,
        email: leadSeed.email.toLowerCase(),
      });
      await leadRepository.save(lead);
    }
  }
}

async function bootstrap() {
  try {
    await dataSource.initialize();
    await runSeed(dataSource);
    console.log('Seed de leads ejecutado correctamente.');
  } catch (error) {
    console.error('Error ejecutando seed de leads:', error);
    process.exitCode = 1;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

void bootstrap();

