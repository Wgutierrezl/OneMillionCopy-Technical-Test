import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiSummaryRequestDto } from '../ai/dto/ai-summary-request.dto';
import { SanitizedLeadInput } from '../ai/interfaces/ai-provider.interface';
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

  async getLeadsForAiSummary(filters: AiSummaryRequestDto): Promise<{
    leads: SanitizedLeadInput[];
    sourceBreakdown: Array<{ fuente: string; total: number }>;
    averageBudget: number;
    last7Days: number;
    topProducts: Array<{ producto_interes: string; total: number }>;
  }> {
    const qb = this.leadsRepository.createQueryBuilder('lead');

    if (filters.fuente) {
      qb.andWhere('lead.fuente = :fuente', { fuente: filters.fuente });
    }

    if (filters.startDate) {
      qb.andWhere('lead.created_at >= :startDate', {
        startDate: new Date(filters.startDate),
      });
    }

    if (filters.endDate) {
      qb.andWhere('lead.created_at <= :endDate', {
        endDate: new Date(filters.endDate),
      });
    }

    const leads = await qb.orderBy('lead.created_at', 'DESC').getMany();

    const sanitizedLeads: SanitizedLeadInput[] = leads.map((lead) => ({
      nombre: lead.nombre,
      fuente: lead.fuente,
      producto_interes: lead.producto_interes,
      presupuesto:
        lead.presupuesto !== null && lead.presupuesto !== undefined
          ? Number(lead.presupuesto)
          : null,
      created_at: lead.created_at,
    }));

    const sourceMap = new Map<string, number>();
    let budgetSum = 0;
    let budgetCount = 0;
    let last7Days = 0;
    const productMap = new Map<string, number>();
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    for (const lead of sanitizedLeads) {
      sourceMap.set(lead.fuente, (sourceMap.get(lead.fuente) ?? 0) + 1);

      if (lead.presupuesto !== null && lead.presupuesto !== undefined) {
        budgetSum += Number(lead.presupuesto);
        budgetCount += 1;
      }

      if (now - new Date(lead.created_at).getTime() <= sevenDaysMs) {
        last7Days += 1;
      }

      if (lead.producto_interes) {
        productMap.set(
          lead.producto_interes,
          (productMap.get(lead.producto_interes) ?? 0) + 1,
        );
      }
    }

    const sourceBreakdown = Array.from(sourceMap.entries())
      .map(([fuente, total]) => ({ fuente, total }))
      .sort((a, b) => b.total - a.total);

    const topProducts = Array.from(productMap.entries())
      .map(([producto_interes, total]) => ({ producto_interes, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      leads: sanitizedLeads,
      sourceBreakdown,
      averageBudget: budgetCount > 0 ? budgetSum / budgetCount : 0,
      last7Days,
      topProducts,
    };
  }
}
