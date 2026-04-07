// Caminho: backend/src/modulos/comanda/comanda.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ComandaService } from './comanda.service';
import { CreateComandaDto } from './dto/create-comanda.dto';
import { UpdateComandaDto } from './dto/update-comanda.dto';
import { UpdatePontoEntregaComandaDto } from './dto/update-ponto-entrega.dto';
import { FecharComandaDto } from './dto/fechar-comanda.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Cargo } from 'src/modulos/funcionario/enums/cargo.enum';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SkipTenantGuard } from '../../common/tenant/guards/tenant.guard';
import { SkipRateLimit } from '../../common/tenant/guards/tenant-rate-limit.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Comandas')
// ✅ MUDANÇA: A proteção geral foi movida para cada rota individualmente,
// para termos um controle mais claro do que é público e o que é privado.
@Controller('comandas')
export class ComandaController {
  constructor(private readonly comandaService: ComandaService) {}

  // =======================================================
  // ✅ ROTA CORRIGIDA PARA SER PÚBLICA
  // =======================================================
  @Public() // Permite que qualquer pessoa (incluindo novos clientes) acesse esta rota.
  @SkipTenantGuard() // Pular validação de tenant para rotas públicas
  @SkipRateLimit() // Pular rate limit para criação de comanda pública
  @Post()
  @ApiOperation({
    summary:
      'Cria uma nova comanda (Rota Pública para novos clientes ou privada para funcionários)',
  })
  @ApiResponse({ status: 201, description: 'Comanda criada com sucesso.' })
  create(@Body() createComandaDto: CreateComandaDto) {
    return this.comandaService.create(createComandaDto);
  }

  // --- As rotas abaixo continuam protegidas ---

  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GERENTE, Cargo.CAIXA)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Busca comandas abertas por número da mesa ou nome/CPF do cliente',
  })
  search(@Query('term') term: string) {
    return this.comandaService.search(term);
  }

  // ===== ENDPOINT PÚBLICO PARA CLIENTES RECUPERAREM COMANDA =====
  @Public()
  @Get('recuperar')
  @ApiOperation({
    summary: 'Busca comanda por código ou CPF (Rota Pública para clientes)',
  })
  @ApiQuery({ name: 'q', description: 'Código da comanda ou CPF do cliente' })
  @ApiResponse({ status: 200, description: 'Comanda encontrada.' })
  @ApiResponse({ status: 404, description: 'Comanda não encontrada.' })
  recuperarComanda(@Query('q') termo: string) {
    return this.comandaService.recuperarComandaPublica(termo);
  }

  @Public()
  @SkipTenantGuard()
  @SkipRateLimit()
  @Get(':id/public')
  @ApiOperation({
    summary: 'Busca dados públicos de uma comanda (para cliente via QR Code)',
  })
  findPublicOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.comandaService.findPublicOne(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GERENTE, Cargo.GARCOM, Cargo.CAIXA)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista todas as comandas do sistema com paginação' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página atual (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 20, máx: 100)' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Campo para ordenação (padrão: criadoEm)' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Direção da ordenação (padrão: DESC)' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.comandaService.findAll(paginationDto);
  }

  @Get('mesa/:mesaId/aberta')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GERENTE, Cargo.GARCOM, Cargo.CAIXA)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Busca a comanda aberta de uma mesa específica' })
  findAbertaByMesaId(@Param('mesaId', ParseUUIDPipe) mesaId: string) {
    return this.comandaService.findAbertaByMesaId(mesaId);
  }

  @Patch(':id/fechar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GERENTE, Cargo.CAIXA)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Fecha uma comanda, registra venda no caixa e libera a mesa associada',
  })
  @ApiResponse({
    status: 200,
    description: 'Comanda fechada e venda registrada no caixa com sucesso.',
  })
  @ApiResponse({
    status: 400,
    description: 'Comanda já fechada ou não há caixa aberto.',
  })
  @ApiResponse({ status: 404, description: 'Comanda não encontrada.' })
  fecharComanda(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FecharComandaDto,
    @CurrentUser() user: { id: string; cargo: string },
  ) {
    return this.comandaService.fecharComanda(id, dto, user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GERENTE, Cargo.GARCOM, Cargo.CAIXA)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Busca uma comanda específica por ID (visão do funcionário)',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.comandaService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GERENTE, Cargo.GARCOM, Cargo.CAIXA)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza os dados de uma comanda' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateComandaDto: UpdateComandaDto,
  ) {
    return this.comandaService.update(id, updateComandaDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Exclui uma comanda (apenas admin)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.comandaService.remove(id);
  }

  @Public()
  @SkipTenantGuard()
  @SkipRateLimit()
  @Patch(':id/local')
  @ApiOperation({
    summary:
      'Atualizar local da comanda - mesa ou ponto de entrega (Rota Pública)',
  })
  @ApiResponse({ status: 200, description: 'Local atualizado com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Comanda não está aberta ou dados inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Comanda, mesa ou ponto de entrega não encontrado',
  })
  updateLocal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { mesaId?: string | null; pontoEntregaId?: string | null },
  ) {
    return this.comandaService.updateLocal(id, dto);
  }

  @Public()
  @Patch(':id/ponto-entrega')
  @ApiOperation({
    summary:
      'Atualizar ponto de entrega da comanda (cliente pode mudar de local)',
  })
  @ApiResponse({
    status: 200,
    description: 'Ponto de entrega atualizado com sucesso',
  })
  @ApiResponse({
    status: 200,
    description: 'Ponto atualizado com alerta (pedidos em preparo)',
  })
  @ApiResponse({
    status: 400,
    description: 'Comanda não está aberta ou ponto inválido',
  })
  @ApiResponse({
    status: 404,
    description: 'Comanda ou ponto de entrega não encontrado',
  })
  updatePontoEntrega(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePontoEntregaComandaDto,
  ) {
    return this.comandaService.updatePontoEntrega(id, dto);
  }

  @Public()
  @SkipTenantGuard()
  @SkipRateLimit()
  @Get(':id/agregados')
  @ApiOperation({ summary: 'Listar agregados (acompanhantes) da comanda' })
  @ApiResponse({ status: 200, description: 'Lista de agregados retornada' })
  @ApiResponse({ status: 404, description: 'Comanda não encontrada' })
  getAgregados(@Param('id', ParseUUIDPipe) id: string) {
    return this.comandaService.findAgregadosPublic(id);
  }
}
