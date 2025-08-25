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
import { FuncionarioService } from './funcionario.service';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Cargo } from './enums/cargo.enum';

// --- DECORADORES DO SWAGGER ---
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Funcionários') // Agrupa todos os endpoints sob a tag "Funcionários"
@ApiBearerAuth() // Indica que todos os endpoints aqui precisam de um token de autenticação
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('funcionarios')
export class FuncionarioController {
  constructor(private readonly funcionarioService: FuncionarioService) {}

  // --- CRIAR FUNCIONÁRIO ---
  @Post()
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Cria um novo funcionário no sistema' })
  @ApiResponse({ status: 201, description: 'Funcionário criado com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Rota apenas para administradores.' })
  @ApiResponse({ status: 409, description: 'Conflito. O e-mail ou CPF já existe.'})
  create(@Body() createFuncionarioDto: CreateFuncionarioDto) {
    return this.funcionarioService.create(createFuncionarioDto);
  }

  // --- LISTAR TODOS OS FUNCIONÁRIOS ---
  @Get()
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Lista todos os funcionários cadastrados' })
  @ApiResponse({ status: 200, description: 'Lista de funcionários retornada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Rota apenas para administradores.' })
  findAll() {
    return this.funcionarioService.findAll();
  }

  // --- BUSCAR UM FUNCIONÁRIO POR ID ---
  @Get(':id')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Busca um único funcionário pelo seu ID' })
  @ApiResponse({ status: 200, description: 'Dados do funcionário retornados com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Rota apenas para administradores.' })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.funcionarioService.findOne(id);
  }

  // --- ATUALIZAR UM FUNCIONÁRIO ---
  @Patch(':id')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Atualiza os dados de um funcionário específico' })
  @ApiResponse({ status: 200, description: 'Funcionário atualizado com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Rota apenas para administradores.' })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFuncionarioDto: UpdateFuncionarioDto,
  ) {
    return this.funcionarioService.update(id, updateFuncionarioDto);
  }

  // --- REMOVER UM FUNCIONÁRIO ---
  @Delete(':id')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Remove um funcionário do sistema' })
  @ApiResponse({ status: 200, description: 'Funcionário removido com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Rota apenas para administradores.' })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.funcionarioService.remove(id);
  }
}