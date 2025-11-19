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
import { CaixaService } from './caixa.service';
import { CreateAberturaCaixaDto } from './dto/create-abertura-caixa.dto';
import { CreateFechamentoCaixaDto } from './dto/create-fechamento-caixa.dto';
import { CreateSangriaDto } from './dto/create-sangria.dto';
import { CreateVendaDto } from './dto/create-venda.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('caixa')
@UseGuards(JwtAuthGuard)
export class CaixaController {
  constructor(private readonly caixaService: CaixaService) {}

  /**
   * POST /caixa/abertura
   * Abre um novo caixa
   */
  @Post('abertura')
  @HttpCode(HttpStatus.CREATED)
  async abrirCaixa(@Body() dto: CreateAberturaCaixaDto) {
    return await this.caixaService.abrirCaixa(dto);
  }

  /**
   * POST /caixa/fechamento
   * Fecha o caixa com conferência de valores
   */
  @Post('fechamento')
  @HttpCode(HttpStatus.CREATED)
  async fecharCaixa(@Body() dto: CreateFechamentoCaixaDto) {
    return await this.caixaService.fecharCaixa(dto);
  }

  /**
   * POST /caixa/sangria
   * Registra uma sangria
   */
  @Post('sangria')
  @HttpCode(HttpStatus.CREATED)
  async registrarSangria(@Body() dto: CreateSangriaDto) {
    return await this.caixaService.registrarSangria(dto);
  }

  /**
   * POST /caixa/venda
   * Registra uma venda (fechamento de comanda)
   */
  @Post('venda')
  @HttpCode(HttpStatus.CREATED)
  async registrarVenda(@Body() dto: CreateVendaDto) {
    return await this.caixaService.registrarVenda(dto);
  }

  /**
   * GET /caixa/aberto
   * Busca caixa aberto do funcionário específico ou por turno
   */
  @Get('aberto')
  async getCaixaAberto(
    @Query('turnoId') turnoId?: string,
    @Query('funcionarioId') funcionarioId?: string,
  ) {
    if (turnoId) {
      // Busca por turno específico
      return await this.caixaService.getCaixaAberto(turnoId);
    } else if (funcionarioId) {
      // Busca por funcionário específico (isolamento de caixas)
      return await this.caixaService.getCaixaAbertoPorFuncionario(funcionarioId);
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
  async getTodosCaixasAbertos() {
    return await this.caixaService.getTodosCaixasAbertos();
  }

  /**
   * GET /caixa/:aberturaCaixaId/resumo
   * Busca resumo completo do caixa
   */
  @Get(':aberturaCaixaId/resumo')
  async getResumoCaixa(@Param('aberturaCaixaId') aberturaCaixaId: string) {
    return await this.caixaService.getResumoCaixa(aberturaCaixaId);
  }

  /**
   * GET /caixa/:aberturaCaixaId/movimentacoes
   * Busca movimentações do caixa
   */
  @Get(':aberturaCaixaId/movimentacoes')
  async getMovimentacoes(@Param('aberturaCaixaId') aberturaCaixaId: string) {
    const resumo = await this.caixaService.getResumoCaixa(aberturaCaixaId);
    return resumo.movimentacoes;
  }

  /**
   * GET /caixa/:aberturaCaixaId/sangrias
   * Busca sangrias do caixa
   */
  @Get(':aberturaCaixaId/sangrias')
  async getSangrias(@Param('aberturaCaixaId') aberturaCaixaId: string) {
    const resumo = await this.caixaService.getResumoCaixa(aberturaCaixaId);
    return resumo.sangrias;
  }

  /**
   * GET /caixa/historico
   * Busca histórico de fechamentos
   */
  @Get('historico')
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
