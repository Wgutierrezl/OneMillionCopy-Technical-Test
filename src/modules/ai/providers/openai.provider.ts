import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { buildExecutiveSummaryPrompt } from '../ai.prompt-builder';
import {
  AiProvider,
  AiSummaryInput,
  AiSummaryResult,
} from '../interfaces/ai-provider.interface';

@Injectable()
export class OpenAiProvider implements AiProvider {
  name = 'openai' as const;

  constructor(private readonly configService: ConfigService) {}

  isAvailable(): boolean {
    return Boolean(this.configService.get<string>('OPENAI_API_KEY'));
  }

  async summarize(
    input: AiSummaryInput,
    timeoutMs: number,
  ): Promise<AiSummaryResult> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY no configurada');
    }

    const model = this.configService.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
    const baseURL =
      this.configService.get<string>('OPENAI_BASE_URL') ??
      'https://api.openai.com/v1';

    const client = new OpenAI({ apiKey, baseURL });
    const prompt = buildExecutiveSummaryPrompt(input);

    const completion = await Promise.race([
      client.chat.completions.create({
        model,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content:
              'Responde únicamente en español, de forma ejecutiva, clara y accionable.',
          },
          { role: 'user', content: prompt },
        ],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('OpenAI timeout')), timeoutMs),
      ),
    ]);

    const summary = completion.choices?.[0]?.message?.content?.trim();
    if (!summary) {
      throw new Error('OpenAI no devolvió contenido');
    }

    return { provider: this.name, summary };
  }
}
