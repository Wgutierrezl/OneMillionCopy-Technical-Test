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
export class GroqProvider implements AiProvider {
  name = 'groq' as const;

  constructor(private readonly configService: ConfigService) {}

  isAvailable(): boolean {
    return Boolean(this.configService.get<string>('GROQ_API_KEY'));
  }

  async summarize(
    input: AiSummaryInput,
    timeoutMs: number,
  ): Promise<AiSummaryResult> {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      throw new Error('GROQ_API_KEY no configurada');
    }

    const model =
      this.configService.get<string>('GROQ_MODEL') ?? 'llama-3.1-8b-instant';
    const baseURL =
      this.configService.get<string>('GROQ_BASE_URL') ??
      'https://api.groq.com/openai/v1';

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
        setTimeout(() => reject(new Error('Groq timeout')), timeoutMs),
      ),
    ]);

    const summary = completion.choices?.[0]?.message?.content?.trim();
    if (!summary) {
      throw new Error('Groq no devolvió contenido');
    }

    return { provider: this.name, summary };
  }
}
