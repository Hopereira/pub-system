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
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('comandas')
export class ComandaController {
  constructor(private readonly comandaService: ComandaService) {}

  @Get('search')
  @Roles(Cargo.ADMIN, Cargo.CAIXA)
  @ApiOperation({ summary: 'Busca comandas abertas por número da mesa ou nome/CPF do cliente' })
  @ApiQuery({ name: 'term', required: true, description: 'Termo de busca (número da mesa ou texto para cliente)'})
  @ApiResponse({ status: 200, description: 'Lista de comandas correspondentes retornada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  search(@Query('term') term: string) {
    return this.comandaService.search(term);
  }

  @Public()
  @Get(':id/public')
  @ApiOperation({ summary: 'Busca dados públicos de uma comanda (para cliente via QR Code)' })
  @ApiResponse({ status: 200, description: 'Dados públicos da comanda retornados com sucesso.' })
  @ApiResponse({ status: 404, description: 'Comanda não encontrada.' })
  findPublicOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.comandaService.findPublicOne(id);
  }
  
  @Post()
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA)
  @ApiOperation({ summary: 'Cria uma nova comanda (associada a uma mesa ou cliente)' })
  @ApiResponse({ status: 201, description: 'Comanda criada com sucesso.' })
  create(@Body() createComandaDto: CreateComandaDto) {
    return this.comandaService.create(createComandaDto);
  }

  @Get()
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA)
  @ApiOperation({ summary: 'Lista todas as comandas do sistema' })
  findAll() {
    return this.comandaService.findAll();
  }

  @Get('mesa/:mesaId/aberta')
  @ApiOperation({ summary: 'Busca a comanda aberta de uma mesa específica' })
  findAbertaByMesaId(@Param('mesaId', ParseUUIDPipe) mesaId: string) {
    return this.comandaService.findAbertaByMesaId(mesaId);
  }

  // --- NOVA ROTA PARA FECHAR COMANDA ---
  @Patch(':id/fechar')
  @Roles(Cargo.ADMIN, Cargo.CAIXA)
  @ApiOperation({ summary: 'Fecha uma comanda e libera a mesa associada, se houver' })
  @ApiResponse({ status: 200, description: 'Comanda fechada com sucesso.' })
  @ApiResponse({ status: 400, description: 'A comanda não pode ser fechada (ex: já está fechada).' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Apenas Admin ou Caixa.' })
  @ApiResponse({ status: 404, description: 'Comanda não encontrada.' })
  fecharComanda(@Param('id', ParseUUIDPipe) id: string) {
    return this.comandaService.fecharComanda(id);
  }
  // --- FIM DA NOVA ROTA ---

  @Get(':id')
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA)
  @ApiOperation({ summary: 'Busca uma comanda específica por ID (visão do funcionário)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.comandaService.findOne(id);
  }

  @Patch(':id')
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA)
  @ApiOperation({ summary: 'Atualiza os dados de uma comanda' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateComandaDto: UpdateComandaDto,
  ) {
    return this.comandaService.update(id, updateComandaDto);
  }

  @Delete(':id')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Remove uma comanda (Apenas Administradores)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.comandaService.remove(id);
  }
}