// Caminho: backend/src/modulos/pagina-evento/pagina-evento.controller.ts

import {
  Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards,
  UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PaginaEventoService } from './pagina-evento.service';
import { CreatePaginaEventoDto } from './dto/create-pagina-evento.dto';
import { UpdatePaginaEventoDto } from './dto/update-pagina-evento.dto';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Cargo } from '../funcionario/enums/cargo.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Public } from '../../auth/decorators/public.decorator';

@ApiTags('Páginas de Evento')
@Controller('paginas-evento')
export class PaginaEventoController {
  constructor(private readonly paginaEventoService: PaginaEventoService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria uma nova página de evento (Apenas Admin)' })
  create(@Body() createPaginaEventoDto: CreatePaginaEventoDto) {
    return this.paginaEventoService.create(createPaginaEventoDto);
  }

  @Public()
  @Get('ativa/publica')
  @ApiOperation({ summary: 'Busca a página de evento atualmente ativa (Público)' })
  findAtiva() {
    return this.paginaEventoService.findAtiva();
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista todas as páginas de evento (Público)' })
  findAll() {
    return this.paginaEventoService.findAll();
  }
  
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Busca uma página de evento específica pelo ID (Público)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paginaEventoService.findOne(id);
  }
  
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza os dados de texto de uma página de evento' })
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

  // CORREÇÃO AQUI: Ajustamos a rota de '/:id/media' para '/:id/upload-media'
  @Patch(':id/upload-media')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Faz o upload de uma mídia para uma página de evento' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Ficheiro de mídia (imagem ou vídeo)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|mp4|webp)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.paginaEventoService.uploadMedia(id, file);
  }
}