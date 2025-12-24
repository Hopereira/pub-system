import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AvaliacaoService } from './avaliacao.service';
import { CreateAvaliacaoDto } from './dto/create-avaliacao.dto';
import {
  AvaliacaoResponseDto,
  EstatisticasSatisfacaoDto,
} from './dto/avaliacao-response.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Cargo } from '../funcionario/enums/cargo.enum';
import { Public } from 'src/auth/decorators/public.decorator';
import { RequireFeature, Feature, FeatureGuard } from '../../common/tenant';

/**
 * AvaliacaoController - Sistema de avaliações de clientes
 * 
 * 🔒 Requer plano BASIC ou superior (Feature.AVALIACOES)
 * Nota: Rota POST é pública para clientes avaliarem
 */
@ApiTags('Avaliações')
@Controller('avaliacoes')
@UseGuards(JwtAuthGuard, FeatureGuard)
@ApiBearerAuth()
@RequireFeature(Feature.AVALIACOES)
export class AvaliacaoController {
  constructor(private readonly avaliacaoService: AvaliacaoService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Criar nova avaliação (Público - Cliente)' })
  @ApiResponse({ status: 201, description: 'Avaliação criada com sucesso.' })
  @ApiResponse({
    status: 400,
    description: 'Comanda já avaliada ou não está fechada.',
  })
  @ApiResponse({ status: 404, description: 'Comanda não encontrada.' })
  create(@Body() createAvaliacaoDto: CreateAvaliacaoDto) {
    return this.avaliacaoService.create(createAvaliacaoDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Listar todas as avaliações' })
  @ApiQuery({ name: 'dataInicio', required: false, type: Date })
  @ApiQuery({ name: 'dataFim', required: false, type: Date })
  @ApiResponse({
    status: 200,
    description: 'Lista de avaliações',
    type: [AvaliacaoResponseDto],
  })
  findAll(
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ): Promise<AvaliacaoResponseDto[]> {
    const inicio = dataInicio ? new Date(dataInicio) : undefined;
    const fim = dataFim ? new Date(dataFim) : undefined;
    return this.avaliacaoService.findAll(inicio, fim);
  }

  @Get('estatisticas')
  @UseGuards(RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.CAIXA)
  @ApiOperation({ summary: 'Obter estatísticas de satisfação' })
  @ApiQuery({ name: 'dataInicio', required: false, type: Date })
  @ApiQuery({ name: 'dataFim', required: false, type: Date })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas de satisfação',
    type: EstatisticasSatisfacaoDto,
  })
  getEstatisticas(
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ): Promise<EstatisticasSatisfacaoDto> {
    const inicio = dataInicio ? new Date(dataInicio) : undefined;
    const fim = dataFim ? new Date(dataFim) : undefined;
    return this.avaliacaoService.getEstatisticas(inicio, fim);
  }

  @Get('estatisticas/hoje')
  @UseGuards(RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.CAIXA, Cargo.GARCOM, Cargo.COZINHA, Cargo.COZINHEIRO, Cargo.BARTENDER)
  @ApiOperation({ summary: 'Obter estatísticas de satisfação do dia' })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas de satisfação do dia',
    type: EstatisticasSatisfacaoDto,
  })
  getEstatisticasDoDia(): Promise<EstatisticasSatisfacaoDto> {
    return this.avaliacaoService.getEstatisticasDoDia();
  }
}
