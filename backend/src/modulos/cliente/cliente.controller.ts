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
import { ClienteService } from './cliente.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Cargo } from '../funcionario/enums/cargo.enum';

@ApiTags('Clientes')
@Controller('clientes') // ✅ MUDANÇA: Removemos a proteção geral daqui
export class ClienteController {
  constructor(private readonly clienteService: ClienteService) {}

  // ✅ ROTA PÚBLICA:
  // Esta rota é para o cliente se cadastrar, então ela é marcada como @Public
  @Public() 
  @Post()
  @ApiOperation({ summary: 'Cria um novo cliente no sistema (Rota Pública)' })
  @ApiResponse({ status: 201, description: 'Cliente criado com sucesso.' })
  @ApiResponse({ status: 409, description: 'Cliente com este CPF já existe.' })
  create(@Body() createClienteDto: CreateClienteDto) {
    return this.clienteService.create(createClienteDto);
  }

  // ✅ ROTAS PROTEGIDAS PARA ADMINS:
  // Todas as outras rotas agora têm a sua própria proteção explícita.
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista todos os clientes cadastrados (Apenas Admin)' })
  @ApiResponse({ status: 200, description: 'Lista de clientes retornada com sucesso.' })
  findAll() {
    return this.clienteService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Busca um cliente específico por ID (Apenas Admin)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clienteService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza os dados de um cliente (Apenas Admin)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClienteDto: UpdateClienteDto,
  ) {
    return this.clienteService.update(id, updateClienteDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove um cliente do sistema (Apenas Admin)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.clienteService.remove(id);
  }
}