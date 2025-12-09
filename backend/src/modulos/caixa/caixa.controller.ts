import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CaixaService } from './caixa.service';
import { CreateAberturaCaixaDto } from './dto/create-abertura-caixa.dto';
import { CreateFechamentoCaixaDto } from './dto/create-fechamento-caixa.dto';
import { CreateSangriaDto } from './dto/create-sangria.dto';
import { CreateVendaDto } from './dto/create-venda.dto';
import { CreateSuprimentoDto } from './dto/create-suprimento.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Cargo } from '../funcionario/enums/cargo.enum';

@ApiTags('Caixa')
@ApiBearerAuth()
@Controller('caixa')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Cargo.ADMIN, Cargo.CAIXA, Cargo.GERENTE)
export class CaixaController {
  constructor(private readonly caixaService: CaixaService) {}

  /**
   * POST /caixa/abertura
   * Abre um novo caixa
   */
  @Post('abertura')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Abrir caixa', description: 'Abre um novo caixa com valor inicial' })
  @ApiResponse({ status: 201, description: 'Caixa aberto com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou caixa já aberto' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async abrirCaixa(@Body() dto: CreateAberturaCaixaDto) {
    return await this.caixaService.abrirCaixa(dto);
  }

  /**
   * POST /caixa/fechamento
   * Fecha o caixa com conferência de valores
   */
  @Post('fechamento')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Fechar caixa', description: 'Fecha o caixa com conferência de valores e cálculo de diferenças' })
  @ApiResponse({ status: 201, description: 'Caixa fechado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou caixa não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async fecharCaixa(@Body() dto: CreateFechamentoCaixaDto) {
    return await this.caixaService.fecharCaixa(dto);
  }

  /**
   * POST /caixa/sangria
   * Registra uma sangria
   */
  @Post('sangria')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar sangria', description: 'Registra uma retirada de dinheiro do caixa (sangria)' })
  @ApiResponse({ status: 201, description: 'Sangria registrada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async registrarSangria(@Body() dto: CreateSangriaDto) {
    return await this.caixaService.registrarSangria(dto);
  }

  /**
   * POST /caixa/venda
   * Registra uma venda (fechamento de comanda)
   */
  @Post('venda')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar venda', description: 'Registra uma venda no caixa (fechamento de comanda)' })
  @ApiResponse({ status: 201, description: 'Venda registrada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async registrarVenda(@Body() dto: CreateVendaDto) {
    return await this.caixaService.registrarVenda(dto);
  }

  /**
   * POST /caixa/suprimento
   * Registra um suprimento (entrada de dinheiro)
   */
  @Post('suprimento')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar suprimento', description: 'Registra uma entrada de dinheiro no caixa (suprimento)' })
  @ApiResponse({ status: 201, description: 'Suprimento registrado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async registrarSuprimento(@Body() dto: CreateSuprimentoDto) {
    return await this.caixaService.registrarSuprimento(dto);
  }

  /**
   * GET /caixa/aberto
   * Busca caixa aberto do funcionário específico ou por turno
   */
  @Get('aberto')
  @ApiOperation({ summary: 'Buscar caixa aberto', description: 'Busca caixa aberto por turno ou funcionário' })
  @ApiQuery({ name: 'turnoId', required: false, description: 'ID do turno' })
  @ApiQuery({ name: 'funcionarioId', required: false, description: 'ID do funcionário' })
  @ApiResponse({ status: 200, description: 'Caixa encontrado' })
  @ApiResponse({ status: 404, description: 'Caixa não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async getCaixaAberto(
    @Query('turnoId') turnoId?: string,
    @Query('funcionarioId') funcionarioId?: string,
  ) {
    if (turnoId) {
      // Busca por turno específico
      return await this.caixaService.getCaixaAberto(turnoId);
    } else if (funcionarioId) {
      // Busca por funcionário específico (isolamento de caixas)
      return await this.caixaService.getCaixaAbertoPorFuncionario(
        funcionarioId,
      );
    } else {
      // Fallback: busca qualquer caixa aberto (manter compatibilidade)
      return await this.caixaService.getCaixaAbertoAtual();
    }
  }

  /**
   * GET /caixa/aberto/todos
   * Busca todos os caixas abertos (apenas para admin/gestor)
   */
  @Get('aberto/todos')
  @ApiOperation({ summary: 'Listar todos os caixas abertos', description: 'Lista todos os caixas abertos (apenas admin/gestor)' })
  @ApiResponse({ status: 200, description: 'Lista de caixas abertos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async getTodosCaixasAbertos() {
    return await this.caixaService.getTodosCaixasAbertos();
  }

  /**
   * GET /caixa/:aberturaCaixaId/resumo
   * Busca resumo completo do caixa
   */
  @Get(':aberturaCaixaId/resumo')
  @ApiOperation({ summary: 'Resumo do caixa', description: 'Busca resumo completo do caixa com movimentações e sangrias' })
  @ApiResponse({ status: 200, description: 'Resumo do caixa' })
  @ApiResponse({ status: 404, description: 'Caixa não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async getResumoCaixa(@Param('aberturaCaixaId') aberturaCaixaId: string) {
    return await this.caixaService.getResumoCaixa(aberturaCaixaId);
  }

  /**
   * GET /caixa/:aberturaCaixaId/movimentacoes
   * Busca movimentações do caixa
   */
  @Get(':aberturaCaixaId/movimentacoes')
  @ApiOperation({ summary: 'Movimentações do caixa', description: 'Lista todas as movimentações de um caixa' })
  @ApiResponse({ status: 200, description: 'Lista de movimentações' })
  @ApiResponse({ status: 404, description: 'Caixa não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async getMovimentacoes(@Param('aberturaCaixaId') aberturaCaixaId: string) {
    const resumo = await this.caixaService.getResumoCaixa(aberturaCaixaId);
    return resumo.movimentacoes;
  }

  /**
   * GET /caixa/:aberturaCaixaId/sangrias
   * Busca sangrias do caixa
   */
  @Get(':aberturaCaixaId/sangrias')
  @ApiOperation({ summary: 'Sangrias do caixa', description: 'Lista todas as sangrias de um caixa' })
  @ApiResponse({ status: 200, description: 'Lista de sangrias' })
  @ApiResponse({ status: 404, description: 'Caixa não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async getSangrias(@Param('aberturaCaixaId') aberturaCaixaId: string) {
    const resumo = await this.caixaService.getResumoCaixa(aberturaCaixaId);
    return resumo.sangrias;
  }

  /**
   * GET /caixa/historico
   * Busca histórico de fechamentos
   */
  @Get('historico')
  @ApiOperation({ summary: 'Histórico de fechamentos', description: 'Busca histórico de fechamentos de caixa com filtros' })
  @ApiQuery({ name: 'funcionarioId', required: false, description: 'Filtrar por funcionário' })
  @ApiQuery({ name: 'dataInicio', required: false, description: 'Data inicial (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataFim', required: false, description: 'Data final (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Histórico de fechamentos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async getHistoricoFechamentos(
    @Query('funcionarioId') funcionarioId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return await this.caixaService.getHistoricoFechamentos({
      funcionarioId,
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
    });
  }
}
