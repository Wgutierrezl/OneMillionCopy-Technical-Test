import { AiSummaryInput } from './interfaces/ai-provider.interface';

export function buildExecutiveSummaryPrompt(input: AiSummaryInput): string {
  const leadsSample = input.leads.slice(0, 25).map((lead, idx) => ({
    n: idx + 1,
    nombre: lead.nombre,
    fuente: lead.fuente,
    producto_interes: lead.producto_interes ?? null,
    presupuesto: lead.presupuesto ?? null,
    created_at: lead.created_at,
  }));

  return `Eres un analista senior comercial y de marketing digital de One Million Copy SAS.
La empresa ayuda a creadores digitales a vender productos por internet.
Debes generar un resumen ejecutivo claro, breve y accionable para el equipo comercial.

Instrucciones:
1) Analiza el comportamiento general de los leads.
2) Identifica la fuente principal (canal con mayor volumen/calidad observada).
3) Detecta oportunidades y riesgos.
4) Propón recomendaciones comerciales y de marketing priorizadas.
5) Comenta presupuesto promedio, productos de interés más frecuentes y señales recientes.

Reglas:
- Responde en español.
- Sé concreto y orientado a decisiones.
- No inventes datos no presentes.
- Si faltan datos, indícalo explícitamente.

Formato de salida:
- Análisis general:
- Fuente principal:
- Oportunidades detectadas:
- Recomendaciones:
- Observaciones de presupuesto y productos:

Datos para analizar (JSON):
${JSON.stringify(
  {
    filters: input.filters,
    totalLeads: input.totalLeads,
    sourceBreakdown: input.sourceBreakdown,
    averageBudget: input.averageBudget,
    leadsLast7Days: input.last7Days,
    topProducts: input.topProducts,
    leadsSample,
  },
  null,
  2,
)}`;
}
