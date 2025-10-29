// Caminho: backend/src/modulos/comanda/dto/finalizar-pedido.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export enum MetodoEntrega {
  RETIRAR = 'RETIRAR',
  GARCOM = 'GARCOM',
  MESA = 'MESA',
}

export class FinalizarPedidoDto {
  @ApiProperty({
    description: 'Método de entrega escolhido pelo cliente',
    enum: MetodoEntrega,
  })
  @IsEnum(MetodoEntrega)
  metodoEntrega: MetodoEntrega;

  @ApiProperty({
    description: 'ID do ambiente/ponto de retirada (obrigatório para RETIRAR)',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  pontoRetiradaId?: string;

  @ApiProperty({
    description: 'Instruções de entrega (opcional, usado principalmente para GARCOM)',
    required: false,
  })
  @IsString()
  @IsOptional()
  instrucaoEntrega?: string;
}
