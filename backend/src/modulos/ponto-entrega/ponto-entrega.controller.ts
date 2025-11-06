// Caminho: backend/src/modulos/ponto-entrega/ponto-entrega.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PontoEntregaService } from './ponto-entrega.service';
import { CreatePontoEntregaDto } from './dto/create-ponto-entrega.dto';
import { UpdatePontoEntregaDto } from './dto/update-ponto-entrega.dto';
import { AtualizarPosicaoMesaDto } from '../mesa/dto/mapa.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Cargo } from '../funcionario/enums/cargo.enum';

@ApiTags('Pontos de Entrega')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pontos-entrega')
export class PontoEntregaController {
  constructor(private readonly pontoEntregaService: PontoEntregaService) {}

  @Post()
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Criar novo ponto de entrega' })
  @ApiResponse({ status: 201, description: 'Ponto criado com sucesso' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  create(@Body() createDto: CreatePontoEntregaDto) {
    return this.pontoEntregaService.create(createDto);
  }

  @Get()
  @Roles(Cargo.ADMIN, Cargo.CAIXA, Cargo.GARCOM)
  @ApiOperation({ summary: 'Listar todos os pontos de entrega' })
  @ApiResponse({ status: 200, description: 'Lista de pontos retornada' })
  findAll() {
    return this.pontoEntregaService.findAll();
  }

  @Get('ativos')
  @Roles(Cargo.ADMIN, Cargo.CAIXA, Cargo.GARCOM)
  @ApiOperation({ summary: 'Listar apenas pontos ativos' })
  @ApiResponse({ status: 200, description: 'Lista de pontos ativos' })
  findAllAtivos() {
    return this.pontoEntregaService.findAllAtivos();
  }

  @Get('ambiente/:ambienteId')
  @Roles(Cargo.ADMIN, Cargo.GARCOM)
  @ApiOperation({ summary: 'Listar pontos de entrega de um ambiente específico' })
  @ApiResponse({ status: 200, description: 'Lista de pontos do ambiente' })
  findByAmbiente(@Param('ambienteId') ambienteId: string) {
    return this.pontoEntregaService.findByAmbiente(ambienteId);
  }

  @Get(':id')
  @Roles(Cargo.ADMIN, Cargo.CAIXA, Cargo.GARCOM)
  @ApiOperation({ summary: 'Buscar ponto específico por ID' })
  @ApiResponse({ status: 200, description: 'Ponto encontrado' })
  @ApiResponse({ status: 404, description: 'Ponto não encontrado' })
  findOne(@Param('id') id: string) {
    return this.pontoEntregaService.findOne(id);
  }

  @Patch(':id')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Atualizar ponto de entrega' })
  @ApiResponse({ status: 200, description: 'Ponto atualizado' })
  @ApiResponse({ status: 404, description: 'Ponto não encontrado' })
  update(@Param('id') id: string, @Body() updateDto: UpdatePontoEntregaDto) {
    return this.pontoEntregaService.update(id, updateDto);
  }

  @Patch(':id/toggle-ativo')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Ativar/Desativar ponto de entrega' })
  @ApiResponse({ status: 200, description: 'Status alterado' })
  toggleAtivo(@Param('id') id: string) {
    return this.pontoEntregaService.toggleAtivo(id);
  }

  @Delete(':id')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Excluir ponto de entrega' })
  @ApiResponse({ status: 200, description: 'Ponto excluído' })
  @ApiResponse({ status: 400, description: 'Ponto em uso' })
  @ApiResponse({ status: 404, description: 'Ponto não encontrado' })
  remove(@Param('id') id: string) {
    return this.pontoEntregaService.remove(id);
  }

  @Put(':id/posicao')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Atualizar posição do ponto no mapa (Admin)' })
  @ApiResponse({ status: 200, description: 'Posição atualizada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Apenas Administradores.' })
  @ApiResponse({ status: 404, description: 'Ponto não encontrado.' })
  atualizarPosicao(
    @Param('id') id: string,
    @Body() dto: AtualizarPosicaoMesaDto,
  ) {
    return this.pontoEntregaService.atualizarPosicao(id, dto);
  }
}
