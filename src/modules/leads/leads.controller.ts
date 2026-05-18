import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AiOrchestratorService } from '../ai/ai.orchestrator.service';
import { AiSummaryRequestDto } from '../ai/dto/ai-summary-request.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadsService } from './leads.service';

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('leads')
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly aiOrchestratorService: AiOrchestratorService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo lead' })
  create(@Body() dto: CreateLeadDto) {
    return this.leadsService.create(dto);
  }

  @Post('ai/summary')
  @ApiOperation({ summary: 'Generar resumen ejecutivo de leads usando IA' })
  @ApiBody({ type: AiSummaryRequestDto, required: false })
  @ApiResponse({
    status: 200,
    description: 'Resumen generado por proveedor de IA o mock',
  })
  async aiSummary(@Body() filters: AiSummaryRequestDto = {}) {
    const aiData = await this.leadsService.getLeadsForAiSummary(filters);

    if (aiData.leads.length === 0) {
      return {
        provider: 'mock',
        summary:
          'No hay leads para los filtros enviados. Ajusta la fuente o rango de fechas para generar un resumen ejecutivo.',
        totalLeadsAnalyzed: 0,
        filters,
      };
    }

    const result = await this.aiOrchestratorService.summarizeLeads(aiData, filters);

    return {
      provider: result.provider,
      summary: result.summary,
      totalLeadsAnalyzed: aiData.leads.length,
      filters,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar leads con filtros y paginación' })
  findAll(@Query() query: QueryLeadsDto) {
    return this.leadsService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de leads' })
  stats() {
    return this.leadsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener lead por ID' })
  findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar lead' })
  update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.leadsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar lead (soft delete)' })
  remove(@Param('id') id: string) {
    return this.leadsService.remove(id);
  }
}
