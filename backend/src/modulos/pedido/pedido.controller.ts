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
import { PedidoService } from './pedido.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { CreatePedidoGarcomDto } from './dto/create-pedido-garcom.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Cargo } from 'src/modulos/funcionario/enums/cargo.enum';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';
import { UpdateItemPedidoStatusDto } from './dto/update-item-pedido-status.dto';
import { DeixarNoAmbienteDto } from './dto/deixar-no-ambiente.dto';
import { MarcarEntregueDto } from './dto/marcar-entregue.dto';
import { RetirarItemDto } from './dto/retirar-item.dto';

@ApiTags('Pedidos')
@Controller('pedidos')
export class PedidoController {
  constructor(private readonly pedidoService: PedidoService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GARCOM)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cria um novo pedido (Rota interna para funcionários)',
  })
  @ApiResponse({ status: 201, description: 'Pedido criado com sucesso.' })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou pedido sem itens.',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão (apenas ADMIN e GARCOM).',
  })
  @ApiResponse({
    status: 404,
    description: 'Comanda ou produto não encontrado.',
  })
  create(@Body() createPedidoDto: CreatePedidoDto) {
    return this.pedidoService.create(createPedidoDto);
  }

  @Public()
  @Post('cliente')
  @ApiOperation({ summary: 'Cria um novo pedido (Fluxo do cliente público)' })
  @ApiResponse({ status: 201, description: 'Pedido criado com sucesso.' })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou pedido sem itens.',
  })
  @ApiResponse({
    status: 404,
    description: 'Comanda ou produto não encontrado.',
  })
  createFromCliente(@Body() createPedidoDto: CreatePedidoDto) {
    return this.pedidoService.create(createPedidoDto);
  }

  // ✅ NOVO: Endpoint para pedido pelo garçom
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GARCOM)
  @ApiBearerAuth()
  @Post('garcom')
  @ApiOperation({
    summary: 'Cria pedido pelo garçom (cria/busca comanda automaticamente)',
    description:
      'Garçom faz pedido para cliente. Sistema cria comanda automaticamente se não existir.',
  })
  @ApiResponse({ status: 201, description: 'Pedido criado com sucesso.' })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou pedido sem itens.',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão (apenas ADMIN e GARCOM).',
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente ou produto não encontrado.',
  })
  createPedidoGarcom(@Body() dto: CreatePedidoGarcomDto) {
    return this.pedidoService.createPedidoGarcom(dto);
  }

  @Patch('/item/:itemPedidoId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.COZINHA, Cargo.GARCOM)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Atualiza o status de um item de pedido específico',
  })
  @ApiResponse({ status: 200, description: 'Status atualizado com sucesso.' })
  @ApiResponse({ status: 400, description: 'UUID inválido.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  @ApiResponse({ status: 404, description: 'Item de pedido não encontrado.' })
  updateItemStatus(
    @Param('itemPedidoId', ParseUUIDPipe) itemPedidoId: string,
    @Body() updateItemPedidoStatusDto: UpdateItemPedidoStatusDto,
  ) {
    return this.pedidoService.updateItemStatus(
      itemPedidoId,
      updateItemPedidoStatusDto,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA, Cargo.COZINHA)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lista todos os pedidos, com filtros opcionais',
  })
  @ApiQuery({
    name: 'ambienteId',
    required: false,
    description: 'Filtrar por ambiente de preparo',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description:
      'Filtrar por status do pedido (FEITO, EM_PREPARO, PRONTO, ENTREGUE, CANCELADO)',
  })
  @ApiQuery({
    name: 'comandaId',
    required: false,
    description: 'Filtrar por comanda específica',
  })
  @ApiResponse({ status: 200, description: 'Lista de pedidos retornada.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  findAll(
    @Query('ambienteId') ambienteId?: string,
    @Query('status') status?: string,
    @Query('comandaId') comandaId?: string,
  ) {
    return this.pedidoService.findAll({ ambienteId, status, comandaId });
  }

  @Get('prontos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GARCOM)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lista pedidos prontos para entrega',
    description:
      'Retorna pedidos com status PRONTO formatados com informações de localização (Mesa ou Ponto de Entrega)',
  })
  @ApiQuery({
    name: 'ambienteId',
    required: false,
    description: 'Filtrar por ambiente de preparo (opcional)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de pedidos prontos com informações de localização',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão (apenas ADMIN e GARCOM).',
  })
  async getPedidosProntos(@Query('ambienteId') ambienteId?: string) {
    return this.pedidoService.findProntos(ambienteId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA, Cargo.COZINHA)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Busca um pedido específico por ID' })
  @ApiResponse({ status: 200, description: 'Pedido encontrado.' })
  @ApiResponse({ status: 400, description: 'UUID inválido.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.pedidoService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.COZINHA)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza dados gerais de um pedido' })
  @ApiResponse({ status: 200, description: 'Pedido atualizado.' })
  @ApiResponse({
    status: 400,
    description: 'UUID inválido ou dados inválidos.',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePedidoDto: UpdatePedidoDto,
  ) {
    return this.pedidoService.update(id, updatePedidoDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remove/cancela um pedido (Apenas Administradores)',
  })
  @ApiResponse({ status: 200, description: 'Pedido removido com sucesso.' })
  @ApiResponse({ status: 400, description: 'UUID inválido.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({ status: 403, description: 'Sem permissão (apenas ADMIN).' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.pedidoService.remove(id);
  }

  // ==================== NOVOS ENDPOINTS ====================

  // ✅ NOVO: Retirar item (garçom pega no ambiente)
  @Patch('item/:id/retirar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GARCOM)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Marca item como retirado pelo garçom',
    description:
      'Registra que o garçom pegou o item no ambiente de produção. Valida se o garçom está em turno ativo. Emite evento WebSocket.',
  })
  @ApiResponse({
    status: 200,
    description: 'Item marcado como retirado com sucesso.',
  })
  @ApiResponse({
    status: 400,
    description: 'UUID inválido ou item não está PRONTO.',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão ou garçom sem turno ativo.',
  })
  @ApiResponse({ status: 404, description: 'Item não encontrado.' })
  @ApiResponse({
    status: 409,
    description: 'Item já foi retirado ou entregue.',
  })
  retirarItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RetirarItemDto,
  ) {
    return this.pedidoService.retirarItem(id, dto);
  }

  @Patch('item/:id/deixar-no-ambiente')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GARCOM)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Deixar item no ambiente (cliente não encontrado)',
    description:
      'Marca item como DEIXADO_NO_AMBIENTE quando o cliente não é encontrado no local. Notifica o cliente via WebSocket.',
  })
  @ApiResponse({
    status: 200,
    description: 'Item marcado como deixado no ambiente. Cliente notificado.',
  })
  @ApiResponse({
    status: 400,
    description: 'UUID inválido ou item não está pronto.',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão (apenas ADMIN e GARCOM).',
  })
  @ApiResponse({ status: 404, description: 'Item ou ambiente não encontrado.' })
  deixarNoAmbiente(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeixarNoAmbienteDto,
  ) {
    return this.pedidoService.deixarNoAmbiente(id, dto);
  }

  // ✅ NOVO: Marcar item como entregue
  @Patch('item/:id/marcar-entregue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GARCOM)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Marca item como entregue pelo garçom',
    description:
      'Registra a entrega do item, incluindo o garçom responsável e o tempo de entrega. Emite notificação via WebSocket.',
  })
  @ApiResponse({
    status: 200,
    description: 'Item marcado como entregue com sucesso.',
  })
  @ApiResponse({
    status: 400,
    description: 'UUID inválido ou item não está pronto.',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão (apenas ADMIN e GARCOM).',
  })
  @ApiResponse({ status: 404, description: 'Item ou garçom não encontrado.' })
  marcarComoEntregue(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MarcarEntregueDto,
  ) {
    return this.pedidoService.marcarComoEntregue(id, dto);
  }
}
