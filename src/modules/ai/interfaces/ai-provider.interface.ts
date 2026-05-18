export type AiProviderName = 'groq' | 'openai' | 'mock';

export interface SanitizedLeadInput {
  nombre: string;
  fuente: string;
  producto_interes?: string | null;
  presupuesto?: number | null;
  created_at: Date;
}

export interface AiSummaryInput {
  totalLeads: number;
  sourceBreakdown: Array<{ fuente: string; total: number }>;
  averageBudget: number;
  last7Days: number;
  topProducts: Array<{ producto_interes: string; total: number }>;
  leads: SanitizedLeadInput[];
  filters: {
    fuente?: string;
    startDate?: string;
    endDate?: string;
  };
}

export interface AiSummaryResult {
  provider: AiProviderName;
  summary: string;
}

export interface AiProvider {
  name: AiProviderName;
  isAvailable(): boolean;
  summarize(input: AiSummaryInput, timeoutMs: number): Promise<AiSummaryResult>;
}
