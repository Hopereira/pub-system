import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe, Logger } from '@nestjs/common';
import { EventoService } from './evento.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Cargo } from '../funcionario/enums/cargo.enum';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('eventos')
export class EventoController {
  // ✅ NOVO: Inicializamos o Logger
  private readonly logger = new Logger(EventoController.name);

  constructor(private readonly eventoService: EventoService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  create(@Body() createEventoDto: CreateEventoDto) {
    // ✅ NOVO: Log para ver os dados que chegam
    this.logger.log(`Recebida requisição para criar evento. Dados: ${JSON.stringify(createEventoDto)}`);
    return this.eventoService.create(createEventoDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  findAll() {
    this.logger.log('Recebida requisição para listar todos os eventos.');
    return this.eventoService.findAll();
  }

  @Public()
  @Get('publicos')
  findAllPublic() {
    this.logger.log('Recebida requisição para listar eventos públicos.');
    return this.eventoService.findAllPublic();
  }
  
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateEventoDto: UpdateEventoDto) {
    // ✅ NOVO: Log para ver os dados que chegam na atualização
    this.logger.log(`Recebida requisição para atualizar evento ID ${id}. Dados: ${JSON.stringify(updateEventoDto)}`);
    return this.eventoService.update(id, updateEventoDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`Recebida requisição para remover evento ID ${id}.`);
    return this.eventoService.remove(id);
  }
}