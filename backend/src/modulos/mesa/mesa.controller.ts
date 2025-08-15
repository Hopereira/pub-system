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
import { MesaService } from './mesa.service';
import { CreateMesaDto } from './dto/create-mesa.dto';
import { UpdateMesaDto } from './dto/update-mesa.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Cargo } from 'src/modulos/funcionario/enums/cargo.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('mesas')
export class MesaController {
  constructor(private readonly mesaService: MesaService) {}

  @Post()
  @Roles(Cargo.ADMIN)
  create(@Body() createMesaDto: CreateMesaDto) {
    return this.mesaService.create(createMesaDto);
  }

  @Get()
  findAll() {
    return this.mesaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.mesaService.findOne(id);
  }

  @Patch(':id')
  @Roles(Cargo.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMesaDto: UpdateMesaDto,
  ) {
    return this.mesaService.update(id, updateMesaDto);
  }

  @Delete(':id')
  @Roles(Cargo.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.mesaService.remove(id);
  }
}