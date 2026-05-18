import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiSummaryRequestDto } from './dto/ai-summary-request.dto';
import {
  AiSummaryInput,
  AiSummaryResult,
  SanitizedLeadInput,
} from './interfaces/ai-provider.interface';
import { GroqProvider } from './providers/groq.provider';
import { MockAiProvider } from './providers/mock-ai.provider';
import { OpenAiProvider } from './providers/openai.provider';

@Injectable()
export class AiOrchestratorService {
  private readonly logger = new Logger(AiOrchestratorService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly groqProvider: GroqProvider,
    private readonly openAiProvider: OpenAiProvider,
    private readonly mockProvider: MockAiProvider,
  ) {}

  async summarizeLeads(
    payload: {
      leads: SanitizedLeadInput[];
      sourceBreakdown: Array<{ fuente: string; total: number }>;
      averageBudget: number;
      last7Days: number;
      topProducts: Array<{ producto_interes: string; total: number }>;
    },
    filters: AiSummaryRequestDto,
  ): Promise<AiSummaryResult> {
    const input: AiSummaryInput = {
      totalLeads: payload.leads.length,
      sourceBreakdown: payload.sourceBreakdown,
      averageBudget: payload.averageBudget,
      last7Days: payload.last7Days,
      topProducts: payload.topProducts,
      leads: payload.leads,
      filters: {
        fuente: filters.fuente,
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
    };

    const timeoutMs = Number(this.configService.get('AI_TIMEOUT_MS') ?? 15000);
    const enableFallback =
      this.configService.get<string>('AI_ENABLE_FALLBACK', 'true') === 'true';
    const preferred = (this.configService.get<string>('AI_PROVIDER') ??
      'groq') as 'groq' | 'openai' | 'mock';

    const orderedProviders = this.resolveProviderOrder(preferred);

    for (const provider of orderedProviders) {
      try {
        if (!provider.isAvailable()) {
          continue;
        }

        return await provider.summarize(input, timeoutMs);
      } catch (error) {
        this.logger.warn(
          `Provider ${provider.name} falló: ${(error as Error).message}`,
        );

        if (!enableFallback && provider.name !== 'mock') {
          break;
        }
      }
    }

    if (this.configService.get<string>('MOCK_AI_ENABLED', 'true') === 'true') {
      return this.mockProvider.summarize(input, timeoutMs);
    }

    throw new Error('No fue posible generar el resumen con los providers configurados');
  }

  private resolveProviderOrder(preferred: 'groq' | 'openai' | 'mock') {
    if (preferred === 'openai') {
      return [this.openAiProvider, this.groqProvider, this.mockProvider];
    }

    if (preferred === 'mock') {
      return [this.mockProvider, this.groqProvider, this.openAiProvider];
    }

    return [this.groqProvider, this.openAiProvider, this.mockProvider];
  }
}
