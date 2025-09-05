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
} from '@nestjs/common';
import { PedidoService } from './pedido.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Cargo } from 'src/modulos/funcionario/enums/cargo.enum';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdatePedidoStatusDto } from './dto/update-pedido-status.dto'; // NOVO: Importamos o DTO de status

@ApiTags('Pedidos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pedidos')
export class PedidoController {
  constructor(private readonly pedidoService: PedidoService) {}

  // ... (método 'create' continua igual)
  @Post()
  @Roles(Cargo.ADMIN, Cargo.GARCOM)
  @ApiOperation({ summary: 'Cria um novo pedido (lança itens numa comanda)' })
  @ApiResponse({ status: 201, description: 'Pedido criado e itens lançados com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Apenas Administradores ou Garçons.' })
  @ApiResponse({ status: 404, description: 'Comanda ou um dos Produtos não encontrado.' })
  create(@Body() createPedidoDto: CreatePedidoDto) {
    return this.pedidoService.create(createPedidoDto);
  }

  // --- NOVA ROTA PARA ATUALIZAR STATUS ---
  @Patch(':id/status')
  @Roles(Cargo.ADMIN, Cargo.COZINHA) // Apenas Admin e Cozinha podem mudar o status
  @ApiOperation({ summary: 'Atualiza o status de um pedido' })
  @ApiResponse({ status: 200, description: 'Status do pedido atualizado com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado.' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePedidoStatusDto: UpdatePedidoStatusDto,
  ) {
    return this.pedidoService.updateStatus(id, updatePedidoStatusDto);
  }
  // --- FIM DA NOVA ROTA ---


  @Get()
  // ... (métodos 'findAll', 'findOne', 'update' e 'remove' continuam iguais)
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA, Cargo.COZINHA)
  @ApiOperation({ summary: 'Lista todos os pedidos do sistema' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos retornada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  findAll() {
    return this.pedidoService.findAll();
  }

  @Get(':id')
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA, Cargo.COZINHA)
  @ApiOperation({ summary: 'Busca um pedido específico por ID' })
  @ApiResponse({ status: 200, description: 'Dados do pedido retornados com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.pedidoService.findOne(id);
  }

  @Patch(':id')
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.COZINHA)
  @ApiOperation({ summary: 'Atualiza um pedido (ex: alterar status para "Pronto")' })
  @ApiResponse({ status: 200, description: 'Pedido atualizado com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Apenas Admin, Garçom ou Cozinha.' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePedidoDto: UpdatePedidoDto,
  ) {
    return this.pedidoService.update(id, updatePedidoDto);
  }

  @Delete(':id')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Remove/cancela um pedido (Apenas Administradores)' })
  @ApiResponse({ status: 200, description: 'Pedido removido com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Apenas Administradores.' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.pedidoService.remove(id);
  }
}