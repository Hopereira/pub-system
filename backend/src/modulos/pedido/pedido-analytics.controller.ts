import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PedidoAnalyticsService } from './pedido-analytics.service';
import { FiltroRelatorioDto } from './dto/analytics.dto';

@Controller('analytics/pedidos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PedidoAnalyticsController {
  constructor(private readonly analyticsService: PedidoAnalyticsService) {}

  /**
   * GET /analytics/pedidos/relatorio-geral
   * Retorna relatório completo com todas as métricas
   * Apenas ADMIN e GERENTE
   */
  @Get('relatorio-geral')
  @Roles('ADMIN', 'GERENTE')
  async getRelatorioGeral(@Query() filtro: FiltroRelatorioDto) {
    // Converte strings de data para Date objects
    if (filtro.dataInicio) {
      filtro.dataInicio = new Date(filtro.dataInicio);
    }
    if (filtro.dataFim) {
      filtro.dataFim = new Date(filtro.dataFim);
    }
    
    return this.analyticsService.gerarRelatorioGeral(filtro);
  }

  /**
   * GET /analytics/pedidos/tempos
   * Retorna tempos detalhados de pedidos
   * Acessível por ADMIN, GERENTE, GARCOM
   */
  @Get('tempos')
  @Roles('ADMIN', 'GERENTE', 'GARCOM')
  async getTemposPedidos(@Query() filtro: FiltroRelatorioDto) {
    if (filtro.dataInicio) {
      filtro.dataInicio = new Date(filtro.dataInicio);
    }
    if (filtro.dataFim) {
      filtro.dataFim = new Date(filtro.dataFim);
    }
    
    return this.analyticsService.getTemposPedidos(filtro);
  }
}
