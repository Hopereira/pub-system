// Caminho: backend/src/modulos/pedido/pedido.controller.ts

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
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Cargo } from 'src/modulos/funcionario/enums/cargo.enum';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdatePedidoStatusDto } from './dto/update-pedido-status.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { UpdateItemPedidoStatusDto } from './dto/update-item-pedido-status.dto';

@ApiTags('Pedidos')
@Controller('pedidos')
export class PedidoController {
  constructor(private readonly pedidoService: PedidoService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GARCOM)
  @ApiOperation({ summary: 'Cria um novo pedido (Rota interna para funcionários)' })
  @ApiResponse({ status: 201, description: 'Pedido criado com sucesso.' })
  create(@Body() createPedidoDto: CreatePedidoDto) {
    return this.pedidoService.create(createPedidoDto);
  }

  @Public()
  @Post('cliente')
  @ApiOperation({ summary: 'Cria um novo pedido (Fluxo do cliente público)' })
  @ApiResponse({ status: 201, description: 'Pedido enviado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Comanda ou um dos Produtos não encontrado.' })
  createFromCliente(@Body() createPedidoDto: CreatePedidoDto) {
    return this.pedidoService.create(createPedidoDto);
  }

  // --- NOVO ENDPOINT PARA ATUALIZAR STATUS DO ITEM ---
  @Patch('/item/:itemPedidoId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.COZINHA) // Adicione outros cargos se necessário (ex: BAR)
  @ApiOperation({ summary: 'Atualiza o status de um item de pedido específico' })
  updateItemStatus(
    @Param('itemPedidoId', ParseUUIDPipe) itemPedidoId: string,
    @Body() updateItemPedidoStatusDto: UpdateItemPedidoStatusDto,
  ) {
    return this.pedidoService.updateItemStatus(
      itemPedidoId,
      updateItemPedidoStatusDto,
    );
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.COZINHA)
  @ApiOperation({
    summary: 'Atualiza o status de um pedido inteiro (Obsoleto)',
    deprecated: true,
  })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePedidoStatusDto: UpdatePedidoStatusDto,
  ) {
    return this.pedidoService.updateStatus(id, updatePedidoStatusDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA, Cargo.COZINHA)
  @ApiOperation({ summary: 'Lista todos os pedidos, com filtro opcional por ambiente' })
  findAll(@Query('ambienteId') ambienteId?: string) {
    return this.pedidoService.findAll(ambienteId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA, Cargo.COZINHA)
  @ApiOperation({ summary: 'Busca um pedido específico por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.pedidoService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.COZINHA)
  @ApiOperation({ summary: 'Atualiza dados gerais de um pedido' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePedidoDto: UpdatePedidoDto,
  ) {
    return this.pedidoService.update(id, updatePedidoDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Remove/cancela um pedido (Apenas Administradores)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.pedidoService.remove(id);
  }
}