// ARQUIVO CORRIGIDO: backend/src/modulos/ambiente/ambiente.controller.ts

import { Controller, Get, Post, Body, Put, Param, Delete, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AmbienteService } from './ambiente.service';
import { CreateAmbienteDto } from './dto/create-ambiente.dto';
import { UpdateAmbienteDto } from './dto/update-ambiente.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';      // <-- CAMINHO CORRIGIDO
import { Roles } from '../../auth/decorators/roles.decorator';  // <-- CAMINHO CORRIGIDO
import { Cargo } from '../funcionario/enums/cargo.enum';        // <-- CAMINHO E NOME CORRIGIDOS

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('ambientes')
export class AmbienteController {
  constructor(private readonly ambienteService: AmbienteService) {}

  @Post()
  @Roles(Cargo.ADMIN) // <-- NOME CORRIGIDO
  create(@Body() createAmbienteDto: CreateAmbienteDto) {
    return this.ambienteService.create(createAmbienteDto);
  }

  @Get()
  @Roles(Cargo.ADMIN) // <-- NOME CORRIGIDO
  findAll() {
    return this.ambienteService.findAll();
  }

  @Get(':id')
  @Roles(Cargo.ADMIN) // <-- NOME CORRIGIDO
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ambienteService.findOne(id);
  }

  @Put(':id')
  @Roles(Cargo.ADMIN) // <-- NOME CORRIGIDO
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateAmbienteDto: UpdateAmbienteDto) {
    return this.ambienteService.update(id, updateAmbienteDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Cargo.ADMIN) // <-- NOME CORRIGIDO
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ambienteService.remove(id);
  }
}