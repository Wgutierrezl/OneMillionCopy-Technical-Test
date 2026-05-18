import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiOrchestratorService } from './ai.orchestrator.service';
import { GroqProvider } from './providers/groq.provider';
import { MockAiProvider } from './providers/mock-ai.provider';
import { OpenAiProvider } from './providers/openai.provider';

@Module({
  imports: [ConfigModule],
  providers: [AiOrchestratorService, GroqProvider, OpenAiProvider, MockAiProvider],
  exports: [AiOrchestratorService],
})
export class AiModule {}
