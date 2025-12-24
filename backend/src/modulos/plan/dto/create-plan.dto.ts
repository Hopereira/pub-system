import { IsString, IsNumber, IsArray, IsBoolean, IsOptional, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanLimits } from '../entities/plan.entity';

export class CreatePlanDto {
  @ApiProperty({ example: 'STANDARD', description: 'Código único do plano' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Standard', description: 'Nome de exibição' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Para bares em crescimento' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 149, description: 'Preço mensal em reais' })
  @IsNumber()
  @Min(0)
  priceMonthly: number;

  @ApiProperty({ example: 1490, description: 'Preço anual em reais' })
  @IsNumber()
  @Min(0)
  priceYearly: number;

  @ApiProperty({ example: ['pedidos', 'comandas', 'mesas'], description: 'Features ativas' })
  @IsArray()
  @IsString({ each: true })
  features: string[];

  @ApiProperty({ description: 'Limites do plano' })
  @IsObject()
  limits: PlanLimits;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isPopular?: boolean;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdatePlanDto {
  @ApiPropertyOptional({ example: 'Standard Plus' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 159 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  priceMonthly?: number;

  @ApiPropertyOptional({ example: 1590 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  priceYearly?: number;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  limits?: PlanLimits;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPopular?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
