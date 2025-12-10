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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Cargo } from './enums/cargo.enum';

// --- DECORADORES DO SWAGGER ---
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Funcionários') // Agrupa todos os endpoints sob a tag "Funcionários"
@Controller('funcionarios')
export class FuncionarioController {
  constructor(private readonly funcionarioService: FuncionarioService) {}

  // --- VERIFICAR SE É PRIMEIRO ACESSO ---
  @Get('check-first-access')
  @ApiOperation({
    summary: 'Verifica se é o primeiro acesso ao sistema',
    description:
      'Retorna true se não há nenhum usuário cadastrado, false caso contrário.',
  })
  @ApiResponse({ status: 200, description: 'Status retornado com sucesso.' })
  async checkFirstAccess() {
    const isFirstAccess = await this.funcionarioService.isFirstAccess();
    return { isFirstAccess };
  }

  // --- REGISTRO PÚBLICO (Primeiro usuário vira ADMIN) ---
  // ✅ CORREÇÃO: Rate limiting muito restritivo para evitar brute force
  @Post('registro')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // Máximo 3 tentativas por minuto
  @ApiOperation({
    summary: 'Registro público de primeiro acesso (Rate Limited)',
    description:
      'O primeiro usuário a se registrar automaticamente vira ADMIN. Depois disso, apenas ADMIN pode criar novos funcionários.',
  })
  @ApiResponse({ status: 201, description: 'Usuário registrado com sucesso.' })
  @ApiResponse({
    status: 403,
    description:
      'Já existe um usuário no sistema. Use o endpoint /funcionarios para criar novos.',
  })
  @ApiResponse({ status: 409, description: 'Conflito. O e-mail já existe.' })
  @ApiResponse({ status: 429, description: 'Muitas tentativas. Aguarde 1 minuto.' })
  async registro(@Body() createFuncionarioDto: CreateFuncionarioDto) {
    return this.funcionarioService.registroPrimeiroAcesso(createFuncionarioDto);
  }

  // --- CRIAR FUNCIONÁRIO (Apenas ADMIN) ---
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiOperation({
    summary: 'Cria um novo funcionário no sistema (Apenas ADMIN)',
  })
  @ApiResponse({ status: 201, description: 'Funcionário criado com sucesso.' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado. Rota apenas para administradores.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflito. O e-mail ou CPF já existe.',
  })
  create(@Body() createFuncionarioDto: CreateFuncionarioDto) {
    return this.funcionarioService.create(createFuncionarioDto);
  }

  // --- LISTAR TODOS OS FUNCIONÁRIOS ---
  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Lista todos os funcionários cadastrados' })
  @ApiResponse({
    status: 200,
    description: 'Lista de funcionários retornada com sucesso.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado. Rota apenas para administradores.',
  })
  findAll() {
    return this.funcionarioService.findAll();
  }

  // --- BUSCAR UM FUNCIONÁRIO POR ID ---
  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Busca um único funcionário pelo seu ID' })
  @ApiResponse({
    status: 200,
    description: 'Dados do funcionário retornados com sucesso.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado. Rota apenas para administradores.',
  })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.funcionarioService.findOne(id);
  }

  // --- ATUALIZAR UM FUNCIONÁRIO ---
  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Atualiza os dados de um funcionário específico' })
  @ApiResponse({
    status: 200,
    description: 'Funcionário atualizado com sucesso.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado. Rota apenas para administradores.',
  })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFuncionarioDto: UpdateFuncionarioDto,
  ) {
    return this.funcionarioService.update(id, updateFuncionarioDto);
  }

  // --- REMOVER UM FUNCIONÁRIO ---
  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Remove um funcionário do sistema' })
  @ApiResponse({
    status: 200,
    description: 'Funcionário removido com sucesso.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado. Rota apenas para administradores.',
  })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.funcionarioService.remove(id);
  }
}
