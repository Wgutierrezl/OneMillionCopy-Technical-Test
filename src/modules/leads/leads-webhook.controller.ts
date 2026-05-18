import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadsService } from './leads.service';

@ApiTags('Leads Webhook')
@Controller('leads')
export class LeadsWebhookController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post('webhook')
  @ApiOperation({
    summary: 'Webhook público para recepción de leads (simulación Typeform)',
    description:
      'Endpoint público para recibir leads desde herramientas externas como Typeform, Tally o Webflow.',
  })
  @ApiBody({ type: CreateLeadDto })
  @ApiCreatedResponse({
    description: 'Lead recibido y creado exitosamente',
  })
  @ApiBadRequestResponse({
    description: 'Payload inválido o email duplicado',
  })
  @ApiConflictResponse({
    description: 'Conflicto por email duplicado (si se decide usar 409)',
  })
  async receiveWebhookLead(@Body() dto: CreateLeadDto) {
    const lead = await this.leadsService.create(dto);

    return {
      message: 'Webhook lead received successfully',
      lead: {
        id: lead.id,
        nombre: lead.nombre,
        email: lead.email,
        fuente: lead.fuente,
        producto_interes: lead.producto_interes,
        presupuesto: lead.presupuesto,
        created_at: lead.created_at,
      },
    };
  }
}
