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
  Put,
  Query,
} from '@nestjs/common';
import { MesaService } from './mesa.service';
import { CreateMesaDto } from './dto/create-mesa.dto';
import { UpdateMesaDto } from './dto/update-mesa.dto';
import {
  AtualizarPosicaoMesaDto,
  AtualizarPosicoesBatchDto,
  MapaCompletoDto,
} from './dto/mapa.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Cargo } from 'src/modulos/funcionario/enums/cargo.enum';

// --- DECORADORES DO SWAGGER ---
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Mesas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('mesas')
export class MesaController {
  constructor(private readonly mesaService: MesaService) {}

  @Post()
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Cria uma nova mesa no sistema' })
  @ApiResponse({ status: 201, description: 'Mesa criada com sucesso.' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado. Apenas Administradores.',
  })
  @ApiResponse({
    status: 409,
    description: 'Uma mesa com este número já existe.',
  })
  create(@Body() createMesaDto: CreateMesaDto) {
    return this.mesaService.create(createMesaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as mesas cadastradas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de mesas retornada com sucesso.',
  })
  findAll() {
    return this.mesaService.findAll();
  }

  @Get('ambiente/:ambienteId')
  @Roles(Cargo.ADMIN, Cargo.GARCOM)
  @ApiOperation({ summary: 'Lista mesas de um ambiente específico' })
  @ApiResponse({
    status: 200,
    description: 'Mesas do ambiente retornadas com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Ambiente não encontrado.' })
  findByAmbiente(@Param('ambienteId', ParseUUIDPipe) ambienteId: string) {
    return this.mesaService.findByAmbiente(ambienteId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma mesa específica por ID' })
  @ApiResponse({
    status: 200,
    description: 'Dados da mesa retornados com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Mesa não encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.mesaService.findOne(id);
  }

  @Patch(':id')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Atualiza o número de uma mesa' })
  @ApiResponse({ status: 200, description: 'Mesa atualizada com sucesso.' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado. Apenas Administradores.',
  })
  @ApiResponse({ status: 404, description: 'Mesa não encontrada.' })
  @ApiResponse({
    status: 409,
    description: 'Uma mesa com este número já existe.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMesaDto: UpdateMesaDto,
  ) {
    return this.mesaService.update(id, updateMesaDto);
  }

  @Delete(':id')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Remove uma mesa do sistema' })
  @ApiResponse({ status: 200, description: 'Mesa removida com sucesso.' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado. Apenas Administradores.',
  })
  @ApiResponse({ status: 404, description: 'Mesa não encontrada.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.mesaService.remove(id);
  }

  // ===== ENDPOINTS DE MAPA VISUAL =====

  @Get('mapa/visualizar')
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA)
  @ApiOperation({ summary: 'Obter mapa visual completo do estabelecimento' })
  @ApiResponse({
    status: 200,
    description: 'Mapa retornado com sucesso.',
    type: MapaCompletoDto,
  })
  getMapa(@Query('ambienteId') ambienteId: string): Promise<MapaCompletoDto> {
    return this.mesaService.getMapa(ambienteId);
  }

  @Put(':id/posicao')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Atualizar posição da mesa no mapa (Admin)' })
  @ApiResponse({ status: 200, description: 'Posição atualizada com sucesso.' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado. Apenas Administradores.',
  })
  @ApiResponse({ status: 404, description: 'Mesa não encontrada.' })
  atualizarPosicao(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarPosicaoMesaDto,
  ) {
    return this.mesaService.atualizarPosicao(id, dto);
  }

  @Put('posicoes/batch')
  @Roles(Cargo.ADMIN)
  @ApiOperation({
    summary: 'Atualizar posições de múltiplas mesas em uma única requisição',
  })
  @ApiResponse({
    status: 200,
    description: 'Posições atualizadas com sucesso.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado. Apenas Administradores.',
  })
  atualizarPosicoesBatch(@Body() dto: AtualizarPosicoesBatchDto) {
    return this.mesaService.atualizarPosicoesBatch(dto);
  }
}
