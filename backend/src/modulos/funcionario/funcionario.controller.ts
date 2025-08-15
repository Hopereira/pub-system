import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards, // Importa o UseGuards
  ParseUUIDPipe,
} from '@nestjs/common';
import { FuncionarioService } from './funcionario.service';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'; // Importa o guarda do JWT
import { RolesGuard } from 'src/auth/guards/roles.guard'; // Importa o guarda de Cargos
import { Roles } from 'src/auth/decorators/roles.decorator'; // Importa a "placa" de Cargos
import { Cargo } from './enums/cargo.enum'; // Importa os cargos

// Usando os dois guardas para proteger TODAS as rotas deste controller
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('funcionarios')
export class FuncionarioController {
  constructor(private readonly funcionarioService: FuncionarioService) {}

  // Apenas ADMINS podem criar novos funcionários
  @Post()
  @Roles(Cargo.ADMIN)
  create(@Body() createFuncionarioDto: CreateFuncionarioDto) {
    return this.funcionarioService.create(createFuncionarioDto);
  }

  // Apenas ADMINS podem ver a lista de todos os funcionários
  @Get()
  @Roles(Cargo.ADMIN)
  findAll() {
    return this.funcionarioService.findAll();
  }

  // Apenas ADMINS podem ver um funcionário específico
  @Get(':id')
  @Roles(Cargo.ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.funcionarioService.findOne(id);
  }

  // Apenas ADMINS podem atualizar um funcionário
  @Patch(':id') // Usando PATCH para atualizações parciais
  @Roles(Cargo.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFuncionarioDto: UpdateFuncionarioDto,
  ) {
    return this.funcionarioService.update(id, updateFuncionarioDto);
  }

  // Apenas ADMINS podem remover um funcionário
  @Delete(':id')
  @Roles(Cargo.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.funcionarioService.remove(id);
  }
}