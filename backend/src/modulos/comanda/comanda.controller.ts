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
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Cargo } from 'src/modulos/funcionario/enums/cargo.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
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
  @Roles(Cargo.ADMIN, Cargo.CAIXA)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Busca comandas abertas por número da mesa ou nome/CPF do cliente',
  })
  search(@Query('term') term: string) {
    return this.comandaService.search(term);
  }

  @Public()
  @Get(':id/public')
  @ApiOperation({
    summary: 'Busca dados públicos de uma comanda (para cliente via QR Code)',
  })
  findPublicOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.comandaService.findPublicOne(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista todas as comandas do sistema' })
  findAll() {
    return this.comandaService.findAll();
  }

  @Get('mesa/:mesaId/aberta')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Busca a comanda aberta de uma mesa específica' })
  findAbertaByMesaId(@Param('mesaId', ParseUUIDPipe) mesaId: string) {
    return this.comandaService.findAbertaByMesaId(mesaId);
  }

  @Patch(':id/fechar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.CAIXA)
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
  ) {
    return this.comandaService.fecharComanda(id, dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Busca uma comanda específica por ID (visão do funcionário)',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.comandaService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA)
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
  @Get(':id/agregados')
  @ApiOperation({ summary: 'Listar agregados (acompanhantes) da comanda' })
  @ApiResponse({ status: 200, description: 'Lista de agregados retornada' })
  @ApiResponse({ status: 404, description: 'Comanda não encontrada' })
  async getAgregados(@Param('id', ParseUUIDPipe) id: string) {
    const comanda = await this.comandaService.findOne(id);
    return comanda.agregados || [];
  }
}
