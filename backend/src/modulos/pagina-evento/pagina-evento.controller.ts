// Caminho: backend/src/modulos/pagina-evento/pagina-evento.controller.ts

import {
  Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards,
} from '@nestjs/common';
import { PaginaEventoService } from './pagina-evento.service';
import { CreatePaginaEventoDto } from './dto/create-pagina-evento.dto';
import { UpdatePaginaEventoDto } from './dto/update-pagina-evento.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Cargo } from '../funcionario/enums/cargo.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('Páginas de Evento')
@Controller('paginas-evento')
export class PaginaEventoController {
  constructor(private readonly paginaEventoService: PaginaEventoService) {}

  // --- MÉTODO CREATE SIMPLIFICADO ---
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria uma nova página de evento (Apenas Admin)' })
  create(@Body() createPaginaEventoDto: CreatePaginaEventoDto) {
    // Removemos toda a lógica de upload. Agora apenas passamos o DTO para o serviço.
    return this.paginaEventoService.create(createPaginaEventoDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista todas as páginas de evento (Público)' })
  findAll() {
    return this.paginaEventoService.findAll();
  }
  
  // ... (Os outros métodos: findOne, update, remove continuam iguais por enquanto)
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paginaEventoService.findOne(id);
  }
  
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePaginaEventoDto: UpdatePaginaEventoDto,
  ) {
    return this.paginaEventoService.update(id, updatePaginaEventoDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.paginaEventoService.remove(id);
  }
}