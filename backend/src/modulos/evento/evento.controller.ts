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
  Logger,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { EventoService } from './evento.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Cargo } from '../funcionario/enums/cargo.enum';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('Eventos')
@Controller('eventos')
export class EventoController {
  private readonly logger = new Logger(EventoController.name);

  constructor(private readonly eventoService: EventoService) {}

  @Patch(':id/upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload de imagem para um evento' })
  @ApiResponse({ status: 200, description: 'Imagem enviada com sucesso.' })
  @ApiResponse({
    status: 400,
    description: 'Arquivo inválido ou muito grande.',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImagem(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10 MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp|gif)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    this.logger.log(
      `Recebida imagem para o evento ID ${id}. A fazer upload...`,
    );
    return this.eventoService.uploadImagem(id, file);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria um novo evento' })
  @ApiResponse({ status: 201, description: 'Evento criado com sucesso.' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado. Apenas Administradores.',
  })
  create(@Body() createEventoDto: CreateEventoDto) {
    this.logger.log(
      `Recebida requisição para criar evento. Dados: ${JSON.stringify(createEventoDto)}`,
    );
    return this.eventoService.create(createEventoDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista todos os eventos (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de eventos retornada com sucesso.',
  })
  findAll() {
    return this.eventoService.findAll();
  }

  @Public()
  @Get('publicos')
  @ApiOperation({ summary: 'Lista eventos públicos ativos (sem autenticação)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de eventos públicos retornada com sucesso.',
  })
  findAllPublic() {
    return this.eventoService.findAllPublic();
  }

  // ✅ NOVA ROTA PÚBLICA: Permite que o frontend busque um único evento (para a página /entrada/)
  @Public()
  @Get('publicos/:id') // Endpoint: /eventos/publicos/:id
  @ApiOperation({
    summary: 'Busca um evento público específico (sem autenticação)',
  })
  @ApiResponse({ status: 200, description: 'Evento retornado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Evento não encontrado.' })
  findPublicOne(@Param('id', ParseUUIDPipe) id: string) {
    // Você precisará de um método findPublicOne no seu EventoService para buscar eventos ativos.
    // Se não tiver, use findOne e implemente a verificação de ativo no service.
    return this.eventoService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza um evento' })
  @ApiResponse({ status: 200, description: 'Evento atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Evento não encontrado.' })
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
  @ApiOperation({ summary: 'Remove um evento' })
  @ApiResponse({ status: 200, description: 'Evento removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Evento não encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventoService.remove(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Busca um evento por ID (Admin)' })
  @ApiResponse({ status: 200, description: 'Evento retornado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Evento não encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventoService.findOne(id);
  }
}
