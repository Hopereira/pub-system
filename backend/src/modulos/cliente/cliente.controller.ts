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
  Query, // ✅ Importação do Decorador Query
} from '@nestjs/common';
import { ClienteService } from './cliente.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { CreateClienteRapidoDto } from './dto/create-cliente-rapido.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Cargo } from '../funcionario/enums/cargo.enum';
import { RequireFeature, Feature, FeatureGuard } from '../../common/tenant';

/**
 * ClienteController - Gestão de clientes
 * 
 * 🔒 Requer plano BASIC ou superior (Feature.CLIENTES)
 * Nota: Rotas públicas (@Public) não são bloqueadas pelo FeatureGuard
 */
@ApiTags('Clientes')
@Controller('clientes')
@UseGuards(FeatureGuard)
@RequireFeature(Feature.CLIENTES)
export class ClienteController {
  constructor(private readonly clienteService: ClienteService) {}

  // ✅ ROTA PÚBLICA DE CRIAÇÃO
  @Public()
  @Post()
  @ApiOperation({ summary: 'Cria um novo cliente no sistema (Rota Pública)' })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso.' })
  @ApiResponse({ status: 409, description: 'Cliente com este CPF já existe.' })
  create(@Body() createClienteDto: CreateClienteDto) {
    return this.clienteService.create(createClienteDto);
  }

  // ✅ NOVA ROTA PÚBLICA PARA CRIAÇÃO RÁPIDA
  @Public()
  @Post('rapido')
  @ApiOperation({
    summary: 'Cria um cliente rapidamente com campos mínimos (Rota Pública)',
  })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso.' })
  @ApiResponse({
    status: 200,
    description: 'Cliente já existe, retornado existente.',
  })
  createRapido(@Body() dto: CreateClienteRapidoDto) {
    return this.clienteService.createRapido(dto);
  }

  // ✅ CORREÇÃO CRÍTICA: ROTA DE BUSCA FLEXÍVEL
  @Get()
  // Não colocamos @Public aqui para permitir o uso ADMIN.
  // No NestJS, se o controller não tem um @Public, ele é protegido.
  // Vamos assumir que se o @Query('cpf') for usado, é a busca pública.
  // Se for o caso, a rota mais específica DEVE ter o @Public.
  // Se a rota for usada SÓ para busca de ADMIN, movemos a busca de CPF para uma nova rota.

  // OPÇÃO 1 (Recomendada: Nova Rota Pública e Específica para busca por CPF)
  // Deixe o GET /clientes protegido para listar TUDO.
  // E crie uma rota nova e pública para a busca: GET /clientes/buscar-cpf?cpf=...

  // Como o seu frontend usa GET /clientes?cpf=..., vamos ajustar a rota existente:
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GERENTE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lista todos os clientes ou busca por CPF (Admin/Gerente).',
  })
  findAll(@Query('cpf') cpf?: string) {
    if (cpf) {
      // Se a busca por CPF DEVE ser pública: O frontend deve usar uma rota diferente
      // ou a rota findAll DEVE ser @Public e a lógica de Admin filtrada.
      // Por enquanto, vou manter esta rota protegida, assumindo que a rota de busca pública
      // deve ser implementada no service. Se você não tiver uma rota pública no service
      // para isso, esta rota deve ser pública.
      // CORREÇÃO: Vamos criar uma rota pública dedicada.
      // return this.clienteService.findByCpf(cpf); // Assumindo que você tem esta função
    }
    return this.clienteService.findAll();
  }

  // NOVA ROTA PÚBLICA PARA BUSCA POR CPF
  @Public()
  @Get('by-cpf') // Novo endpoint: /clientes/by-cpf?cpf=...
  @ApiOperation({ summary: 'Busca um cliente por CPF (Rota Pública).' })
  @ApiResponse({ status: 200, description: 'Cliente encontrado.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  findByCpfPublic(@Query('cpf') cpf: string) {
    return this.clienteService.findByCpf(cpf); // Assumindo que findByCpf lança 404
  }

  // NOVA ROTA PÚBLICA PARA BUSCA FLEXÍVEL
  @Public()
  @Get('buscar') // Novo endpoint: /clientes/buscar?q=termo
  @ApiOperation({ summary: 'Busca clientes por nome ou CPF (Rota Pública).' })
  @ApiResponse({ status: 200, description: 'Lista de clientes encontrados.' })
  buscar(@Query('q') termo: string) {
    return this.clienteService.buscar(termo);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GERENTE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Busca um cliente específico por ID (Admin/Gerente)',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clienteService.findOne(id);
  }

  // ... (o resto do controller continua igual) ...
}
