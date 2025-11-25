import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Cargo } from '../funcionario/enums/cargo.enum';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('pedidos/relatorio-geral')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Relatório geral de pedidos com todas as métricas' })
  @ApiResponse({ status: 200, description: 'Relatório gerado com sucesso' })
  @ApiQuery({ name: 'dataInicio', required: false, type: String })
  @ApiQuery({ name: 'dataFim', required: false, type: String })
  @ApiQuery({ name: 'ambienteId', required: false, type: String })
  @ApiQuery({ name: 'funcionarioId', required: false, type: String })
  @ApiQuery({ name: 'limite', required: false, type: Number })
  async getRelatorioGeral(
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('ambienteId') ambienteId?: string,
    @Query('funcionarioId') funcionarioId?: string,
    @Query('limite') limite?: string,
  ) {
    return this.analyticsService.getRelatorioGeral({
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
      ambienteId,
      funcionarioId,
      limite: limite ? parseInt(limite, 10) : undefined,
    });
  }

  @Get('pedidos/tempos')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Tempos detalhados de pedidos' })
  @ApiResponse({ status: 200, description: 'Tempos carregados com sucesso' })
  @ApiQuery({ name: 'dataInicio', required: false, type: String })
  @ApiQuery({ name: 'dataFim', required: false, type: String })
  @ApiQuery({ name: 'limite', required: false, type: Number })
  async getTemposPedidos(
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('limite') limite?: string,
  ) {
    return this.analyticsService.getTemposPedidos({
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
      limite: limite ? parseInt(limite, 10) : undefined,
    });
  }

  @Get('garcons/performance')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Performance de garçons' })
  @ApiResponse({
    status: 200,
    description: 'Performance carregada com sucesso',
  })
  @ApiQuery({ name: 'dataInicio', required: false, type: String })
  @ApiQuery({ name: 'dataFim', required: false, type: String })
  async getPerformanceGarcons(
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.analyticsService.getPerformanceGarcons({
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
    });
  }

  @Get('ambientes/performance')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Performance de ambientes' })
  @ApiResponse({
    status: 200,
    description: 'Performance carregada com sucesso',
  })
  @ApiQuery({ name: 'dataInicio', required: false, type: String })
  @ApiQuery({ name: 'dataFim', required: false, type: String })
  async getPerformanceAmbientes(
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.analyticsService.getPerformanceAmbientes({
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
    });
  }

  @Get('produtos/mais-vendidos')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Produtos mais vendidos' })
  @ApiResponse({ status: 200, description: 'Produtos carregados com sucesso' })
  @ApiQuery({ name: 'dataInicio', required: false, type: String })
  @ApiQuery({ name: 'dataFim', required: false, type: String })
  @ApiQuery({ name: 'limite', required: false, type: Number })
  async getProdutosMaisVendidos(
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('limite') limite?: string,
  ) {
    return this.analyticsService.getProdutosMaisVendidos({
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
      limite: limite ? parseInt(limite, 10) : 10,
    });
  }

  @Get('garcons/ranking')
  @Roles(Cargo.ADMIN, Cargo.GARCOM)
  @ApiOperation({ summary: 'Ranking de garçons com pontuação e métricas' })
  @ApiResponse({ status: 200, description: 'Ranking gerado com sucesso' })
  @ApiQuery({
    name: 'periodo',
    required: false,
    enum: ['hoje', 'semana', 'mes'],
    description: 'Período do ranking',
  })
  @ApiQuery({
    name: 'ambienteId',
    required: false,
    type: String,
    description: 'Filtrar por ambiente',
  })
  @ApiQuery({
    name: 'limite',
    required: false,
    type: Number,
    description: 'Limite de resultados',
  })
  async getRankingGarcons(
    @Query('periodo') periodo?: 'hoje' | 'semana' | 'mes',
    @Query('ambienteId') ambienteId?: string,
    @Query('limite') limite?: string,
  ) {
    return this.analyticsService.getRankingGarcons({
      periodo: periodo || 'hoje',
      ambienteId,
      limite: limite ? parseInt(limite, 10) : undefined,
    });
  }

  @Get('garcons/:id/estatisticas')
  @Roles(Cargo.ADMIN, Cargo.GARCOM)
  @ApiOperation({ summary: 'Estatísticas detalhadas de um garçom' })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas carregadas com sucesso',
  })
  @ApiQuery({
    name: 'periodo',
    required: false,
    enum: ['hoje', 'semana', 'mes'],
    description: 'Período das estatísticas',
  })
  async getEstatisticasGarcom(
    @Query('id') garcomId: string,
    @Query('periodo') periodo?: 'hoje' | 'semana' | 'mes',
  ) {
    return this.analyticsService.getEstatisticasGarcom(garcomId, {
      periodo: periodo || 'hoje',
    });
  }
}
