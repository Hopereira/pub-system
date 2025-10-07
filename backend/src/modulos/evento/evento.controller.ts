// Caminho: backend/src/modulos/evento/evento.controller.ts

import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe, Logger,
  UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator
} from '@nestjs/common';
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

@Controller('eventos')
export class EventoController {
  private readonly logger = new Logger(EventoController.name);

  constructor(private readonly eventoService: EventoService) {}

  @Patch(':id/upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImagem(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp|gif)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    this.logger.log(`Recebida imagem para o evento ID ${id}. A fazer upload...`);
    
    // ✅ CORREÇÃO AQUI: Chamamos a função com o nome correto 'uploadImagem'
    return this.eventoService.uploadImagem(id, file);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  create(@Body() createEventoDto: CreateEventoDto) {
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
    this.logger.log(`Recebida requisição para atualizar dados de texto do evento ID ${id}.`);
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