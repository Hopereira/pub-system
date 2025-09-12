// Caminho: backend/src/modulos/pagina-evento/pagina-evento.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { PaginaEventoService } from './pagina-evento.service';
import { CreatePaginaEventoDto } from './dto/create-pagina-evento.dto';
import { UpdatePaginaEventoDto } from './dto/update-pagina-evento.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

// --- CORREÇÃO DOS CAMINHOS DE IMPORTAÇÃO ---
import { Roles } from '../../auth/decorators/roles.decorator';
import { Cargo } from '../funcionario/enums/cargo.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
// --- FIM DA CORREÇÃO ---

@ApiTags('Páginas de Evento')
@ApiBearerAuth()
@Controller('paginas-evento')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaginaEventoController {
  constructor(private readonly paginaEventoService: PaginaEventoService) {}

  @Post()
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Cria uma nova página de evento' })
  @ApiResponse({ status: 201, description: 'A página foi criada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  create(@Body() createPaginaEventoDto: CreatePaginaEventoDto) {
    return this.paginaEventoService.create(createPaginaEventoDto);
  }

  @Get()
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Lista todas as páginas de evento' })
  findAll() {
    return this.paginaEventoService.findAll();
  }

  @Get(':id')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Busca uma página de evento pelo ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paginaEventoService.findOne(id);
  }

  @Patch(':id')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Atualiza uma página de evento' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePaginaEventoDto: UpdatePaginaEventoDto,
  ) {
    return this.paginaEventoService.update(id, updatePaginaEventoDto);
  }

  @Delete(':id')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Apaga uma página de evento' })
  @ApiResponse({ status: 204, description: 'A página foi apagada com sucesso.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.paginaEventoService.remove(id);
  }
}