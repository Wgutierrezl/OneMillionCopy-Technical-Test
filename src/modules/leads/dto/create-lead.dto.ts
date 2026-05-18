import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { LeadSource } from '../enums/lead-source.enum';

export class CreateLeadDto {
  @ApiProperty({ minLength: 2 })
  @IsString()
  @MinLength(2)
  nombre: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiProperty({ enum: LeadSource })
  @IsEnum(LeadSource)
  fuente: LeadSource;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  producto_interes?: string;

  @ApiPropertyOptional({ description: 'Presupuesto en USD' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  presupuesto?: number;
}
