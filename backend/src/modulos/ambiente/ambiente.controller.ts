import { Controller, Get, Post, Body, Put, Param, Delete, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { AmbienteService } from './ambiente.service';
import { CreateAmbienteDto } from './dto/create-ambiente.dto';
import { UpdateAmbienteDto } from './dto/update-ambiente.dto';

@Controller('ambientes')
export class AmbienteController {
  constructor(private readonly ambienteService: AmbienteService) {}

  @Post()
  create(@Body() createAmbienteDto: CreateAmbienteDto) {
    return this.ambienteService.create(createAmbienteDto);
  }

  @Get()
  findAll() {
    return this.ambienteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    // CORREÇÃO: Removido o sinal de '+'
    return this.ambienteService.findOne(id);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateAmbienteDto: UpdateAmbienteDto) {
    // CORREÇÃO: Removido o sinal de '+'
    return this.ambienteService.update(id, updateAmbienteDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    // CORREÇÃO: Removido o sinal de '+'
    return this.ambienteService.remove(id);
  }
}