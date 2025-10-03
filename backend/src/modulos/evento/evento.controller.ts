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
import { EventoService } from './evento.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Cargo } from '../funcionario/enums/cargo.enum';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('Eventos')
@Controller('eventos')
export class EventoController {
  constructor(private readonly eventoService: EventoService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria um novo evento (Apenas Admin)' })
  create(@Body() createEventoDto: CreateEventoDto) {
    return this.eventoService.create(createEventoDto);
  }

  @Public()
  @Get('publicos')
  @ApiOperation({ summary: 'Lista todos os eventos para o público' })
  findAllPublic() {
    // Assumindo que o seu service tem um método findAll() que busca todos os eventos
    return this.eventoService.findAll();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista todos os eventos (Apenas Admin)' })
  findAll() {
    return this.eventoService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Busca um evento por ID (Apenas Admin)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventoService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza um evento (Apenas Admin)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEventoDto: UpdateEventoDto,
  ) {
    return this.eventoService.update(id, updateEventoDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove um evento (Apenas Admin)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventoService.remove(id);
  }
}