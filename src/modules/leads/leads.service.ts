import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLeadDto } from './dto/create-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { Lead } from './entities/lead.entity';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadsRepository: Repository<Lead>,
  ) {}

  async create(dto: CreateLeadDto): Promise<Lead> {
    const normalizedEmail = dto.email.toLowerCase();

    const existingLead = await this.leadsRepository.findOne({
      where: { email: normalizedEmail },
      withDeleted: false,
    });

    if (existingLead) {
      throw new BadRequestException('El email ya está registrado como lead');
    }

    const lead = this.leadsRepository.create({
      ...dto,
      email: normalizedEmail,
    });

    return this.leadsRepository.save(lead);
  }

  async findAll(query: QueryLeadsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.leadsRepository.createQueryBuilder('lead');

    if (query.fuente) {
      qb.andWhere('lead.fuente = :fuente', { fuente: query.fuente });
    }

    if (query.startDate) {
      qb.andWhere('lead.created_at >= :startDate', {
        startDate: new Date(query.startDate),
      });
    }

    if (query.endDate) {
      qb.andWhere('lead.created_at <= :endDate', {
        endDate: new Date(query.endDate),
      });
    }

    qb.orderBy('lead.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string): Promise<Lead> {
    const lead = await this.leadsRepository.findOne({ where: { id } });

    if (!lead) {
      throw new NotFoundException('Lead no encontrado');
    }

    return lead;
  }

  async update(id: string, dto: UpdateLeadDto): Promise<Lead> {
    const lead = await this.findOne(id);

    if (dto.email && dto.email.toLowerCase() !== lead.email.toLowerCase()) {
      const existingLead = await this.leadsRepository.findOne({
        where: { email: dto.email.toLowerCase() },
      });

      if (existingLead) {
        throw new BadRequestException('El email ya está registrado como lead');
      }
    }

    Object.assign(lead, {
      ...dto,
      email: dto.email ? dto.email.toLowerCase() : lead.email,
    });

    return this.leadsRepository.save(lead);
  }

  async remove(id: string): Promise<{ message: string }> {
    const lead = await this.findOne(id);
    await this.leadsRepository.softRemove(lead);
    return { message: 'Lead eliminado correctamente' };
  }

  async getStats() {
    const total = await this.leadsRepository.count();

    const bySourceRaw = await this.leadsRepository
      .createQueryBuilder('lead')
      .select('lead.fuente', 'fuente')
      .addSelect('COUNT(*)', 'total')
      .groupBy('lead.fuente')
      .getRawMany();

    const avgBudgetRaw = await this.leadsRepository
      .createQueryBuilder('lead')
      .select('AVG(lead.presupuesto)', 'avg')
      .getRawOne<{ avg: string | null }>();

    const last7Days = await this.leadsRepository
      .createQueryBuilder('lead')
      .where('lead.created_at >= :date', {
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      })
      .getCount();

    return {
      totalLeads: total,
      leadsBySource: bySourceRaw.map((item) => ({
        fuente: item.fuente,
        total: Number(item.total),
      })),
      averageBudget: avgBudgetRaw?.avg ? Number(avgBudgetRaw.avg) : 0,
      leadsLast7Days: last7Days,
    };
  }
}
