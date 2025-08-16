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
import { ComandaService } from './comanda.service';
import { CreateComandaDto } from './dto/create-comanda.dto';
import { UpdateComandaDto } from './dto/update-comanda.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Cargo } from 'src/modulos/funcionario/enums/cargo.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('comandas')
export class ComandaController {
  constructor(private readonly comandaService: ComandaService) {}

  // Rota pública para o cliente (QR Code)
  @Public()
  @Get(':id/public')
  findPublicOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.comandaService.findPublicOne(id);
  }

  // --- Rotas protegidas para funcionários ---

  @Post()
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA)
  create(@Body() createComandaDto: CreateComandaDto) {
    return this.comandaService.create(createComandaDto);
  }

  @Get()
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA)
  findAll() {
    return this.comandaService.findAll();
  }

  @Get(':id')
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.comandaService.findOne(id);
  }

  @Patch(':id')
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateComandaDto: UpdateComandaDto,
  ) {
    return this.comandaService.update(id, updateComandaDto);
  }

  @Delete(':id')
  @Roles(Cargo.ADMIN) // Apenas admins podem deletar uma comanda
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.comandaService.remove(id);
  }
}