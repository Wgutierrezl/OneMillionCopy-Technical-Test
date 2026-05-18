import { Injectable } from '@nestjs/common';
import {
  AiProvider,
  AiSummaryInput,
  AiSummaryResult,
} from '../interfaces/ai-provider.interface';

@Injectable()
export class MockAiProvider implements AiProvider {
  name = 'mock' as const;

  isAvailable(): boolean {
    return true;
  }

  async summarize(
    input: AiSummaryInput,
    _timeoutMs: number,
  ): Promise<AiSummaryResult> {
    const topSource = input.sourceBreakdown[0]?.fuente ?? 'sin datos';
    const topProduct = input.topProducts[0]?.producto_interes ?? 'sin datos';

    return {
      provider: this.name,
      summary:
        `Análisis general: Se analizaron ${input.totalLeads} leads y se observó una captación activa en los canales evaluados. ` +
        `Fuente principal: ${topSource}. ` +
        `Oportunidades detectadas: potenciar campañas en ${topSource} y optimizar el seguimiento de productos con mayor interés como ${topProduct}. ` +
        `Recomendaciones: priorizar contacto rápido en leads recientes, segmentar por fuente y ajustar oferta según presupuesto promedio (${input.averageBudget.toFixed(2)} USD). ` +
        `Observaciones de presupuesto y productos: los últimos 7 días registran ${input.last7Days} leads, lo que sugiere monitoreo semanal para iterar embudos.`,
    };
  }
}
