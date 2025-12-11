// DTOs para Analytics e Relatórios de Pedidos
import { IsOptional, IsDateString, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PedidoTempoDto {
  pedidoId: string;
  criadoEm: Date;
  tempoPreparoMinutos?: number;
  tempoEntregaMinutos?: number;
  tempoTotalMinutos?: number;
  ambiente?: string;
  status: string;
}

export class GarcomPerformanceDto {
  funcionarioId: string;
  funcionarioNome: string;
  totalPedidosEntregues: number;
  tempoMedioEntregaMinutos: number;
  ultimaEntrega?: Date;
}

export class AmbientePerformanceDto {
  ambienteId: string;
  ambienteNome: string;
  totalPedidosPreparados: number;
  tempoMedioPreparoMinutos: number;
  pedidosEmPreparo: number;
}

export class ProdutoVendasDto {
  produtoId: string;
  produtoNome: string;
  quantidadeVendida: number;
  valorTotal: number;
  ultimaVenda?: Date;
}

export class RelatorioGeralDto {
  periodo: {
    inicio: Date;
    fim: Date;
  };

  resumo: {
    totalPedidos: number;
    totalItens: number;
    valorTotal: number;
    tempoMedioPreparo: number;
    tempoMedioEntrega: number;
  };

  garcons: GarcomPerformanceDto[];
  ambientes: AmbientePerformanceDto[];
  produtosMaisVendidos: ProdutoVendasDto[];
  produtosMenosVendidos: ProdutoVendasDto[];

  pedidosPorHora: {
    hora: number;
    quantidade: number;
  }[];

  pedidosPorDiaSemana: {
    dia: string;
    quantidade: number;
  }[];
}

export class FiltroRelatorioDto {
  @IsOptional()
  @IsDateString()
  dataInicio?: Date;

  @IsOptional()
  @IsDateString()
  dataFim?: Date;

  @IsOptional()
  @IsUUID()
  ambienteId?: string;

  @IsOptional()
  @IsUUID()
  funcionarioId?: string;

  @IsOptional()
  @IsUUID()
  produtoId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number;
}
