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
import { ComandaService } from './comanda.service';
import { CreateComandaDto } from './dto/create-comanda.dto';
import { UpdateComandaDto } from './dto/update-comanda.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Cargo } from 'src/modulos/funcionario/enums/cargo.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

// --- DECORADORES DO SWAGGER ---
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Comandas')
@ApiBearerAuth() // Aplica a necessidade de autenticação a todas as rotas, exceto as marcadas com @Public
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('comandas')
export class ComandaController {
  constructor(private readonly comandaService: ComandaService) {}

  // Rota pública para o cliente (QR Code)
  @Public() // Esta anotação isenta a rota da autenticação JWT
  @Get(':id/public')
  @ApiOperation({ summary: 'Busca dados públicos de uma comanda (para cliente via QR Code)' })
  @ApiResponse({ status: 200, description: 'Dados públicos da comanda retornados com sucesso.' })
  @ApiResponse({ status: 404, description: 'Comanda não encontrada.' })
  findPublicOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.comandaService.findPublicOne(id);
  }

  // --- Rotas protegidas para funcionários ---

  @Post()
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA)
  @ApiOperation({ summary: 'Cria uma nova comanda (associada a uma mesa ou cliente)' })
  @ApiResponse({ status: 201, description: 'Comanda criada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos. É necessário fornecer ou mesaId ou clienteId.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Mesa ou Cliente não encontrado.' })
  create(@Body() createComandaDto: CreateComandaDto) {
    return this.comandaService.create(createComandaDto);
  }

  @Get()
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA)
  @ApiOperation({ summary: 'Lista todas as comandas do sistema' })
  @ApiResponse({ status: 200, description: 'Lista de comandas retornada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  findAll() {
    return this.comandaService.findAll();
  }

  @Get(':id')
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA)
  @ApiOperation({ summary: 'Busca uma comanda específica por ID (visão do funcionário)' })
  @ApiResponse({ status: 200, description: 'Dados da comanda retornados com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Comanda não encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.comandaService.findOne(id);
  }

  @Patch(':id')
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA)
  @ApiOperation({ summary: 'Atualiza os dados de uma comanda' })
  @ApiResponse({ status: 200, description: 'Comanda atualizada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Comanda não encontrada.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateComandaDto: UpdateComandaDto,
  ) {
    return this.comandaService.update(id, updateComandaDto);
  }

  @Delete(':id')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Remove uma comanda (Apenas Administradores)' })
  @ApiResponse({ status: 200, description: 'Comanda removida com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Apenas Administradores.' })
  @ApiResponse({ status: 404, description: 'Comanda não encontrada.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.comandaService.remove(id);
  }
}