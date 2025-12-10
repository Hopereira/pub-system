import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
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
    return this.ambienteService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAmbienteDto: UpdateAmbienteDto,
  ) {
    return this.ambienteService.update(id, updateAmbienteDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Retorna status 204 No Content, padrão para delete
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ambienteService.remove(id);
  }
}
