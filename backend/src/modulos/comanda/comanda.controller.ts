// Caminho: backend/src/modulos/comanda/comanda.controller.ts
import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe, Query
} from '@nestjs/common';
import { ComandaService } from './comanda.service';
import { CreateComandaDto } from './dto/create-comanda.dto';
import { UpdateComandaDto } from './dto/update-comanda.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Cargo } from 'src/modulos/funcionario/enums/cargo.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Comandas')
@Controller('comandas')
export class ComandaController {
  constructor(private readonly comandaService: ComandaService) {}

  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Cargo.ADMIN, Cargo.CAIXA)
  @ApiOperation({ summary: 'Busca comandas abertas por número da mesa ou nome/CPF do cliente' })
  @ApiQuery({ name: 'term', required: true, description: 'Termo de busca (número da mesa ou texto para cliente)'})
  search(@Query('term') term: string) {
    return this.comandaService.search(term);
  }

  @Public()
  @Get(':id/public')
  @ApiOperation({ summary: 'Busca dados públicos de uma comanda (para cliente via QR Code)' })
  findPublicOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.comandaService.findPublicOne(id);
  }
  
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA)
  @ApiOperation({ summary: 'Cria uma nova comanda (associada a uma mesa ou cliente)' })
  create(@Body() createComandaDto: CreateComandaDto) {
    return this.comandaService.create(createComandaDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA)
  @ApiOperation({ summary: 'Lista todas as comandas do sistema' })
  findAll() {
    return this.comandaService.findAll();
  }

  @Get('mesa/:mesaId/aberta')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Busca a comanda aberta de uma mesa específica' })
  findAbertaByMesaId(@Param('mesaId', ParseUUIDPipe) mesaId: string) {
    return this.comandaService.findAbertaByMesaId(mesaId);
  }

  @Public()
  @Post(':id/finalizar-pedido')
  @ApiOperation({ summary: 'Cliente finaliza o pedido do seu carrinho (autoatendimento)' })
  @ApiResponse({ status: 200, description: 'Pedido enviado para preparo com sucesso.'})
  @ApiResponse({ status: 404, description: 'Comanda não encontrada.' })
  finalizarPedido(@Param('id', ParseUUIDPipe) id: string) {
    return this.comandaService.finalizarPedido(id);
  }

  @Public()
  @Patch(':id/instrucao-entrega')
  @ApiOperation({ summary: 'Cliente define a instrução de entrega para a sua comanda' })
  @ApiResponse({ status: 200, description: 'Instrução de entrega atualizada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Comanda não encontrada.' })
  definirInstrucaoEntrega(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateComandaDto: UpdateComandaDto,
  ) {
    return this.comandaService.definirInstrucaoEntrega(id, updateComandaDto);
  }

  @Patch(':id/fechar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Cargo.ADMIN, Cargo.CAIXA)
  @ApiOperation({ summary: 'Fecha uma comanda e libera a mesa associada, se houver' })
  fecharComanda(@Param('id', ParseUUIDPipe) id: string) {
    return this.comandaService.fecharComanda(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA)
  @ApiOperation({ summary: 'Busca uma comanda específica por ID (visão do funcionário)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.comandaService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA)
  @ApiOperation({ summary: 'Atualiza os dados de uma comanda' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateComandaDto: UpdateComandaDto,
  ) {
    return this.comandaService.update(id, updateComandaDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Remove uma comanda (Apenas Administradores)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.comandaService.remove(id);
  }
}