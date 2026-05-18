import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module';
import { LeadsController } from './leads.controller';
import { Lead } from './entities/lead.entity';
import { LeadsService } from './leads.service';

@Module({
  imports: [TypeOrmModule.forFeature([Lead]), AiModule],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
