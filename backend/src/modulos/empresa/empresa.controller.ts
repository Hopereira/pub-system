import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Cargo } from '../funcionario/enums/cargo.enum';

@ApiTags('Empresa')
@ApiBearerAuth()
@Controller('empresa') // A rota base é no singular
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Cargo.ADMIN) // Protege todas as rotas para apenas ADMIN
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  // POST /empresa
  @Post()
  @ApiOperation({ summary: 'Cria os dados da empresa' })
  @ApiResponse({ status: 201, description: 'Empresa criada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Apenas Administradores.' })
  create(@Body() createEmpresaDto: CreateEmpresaDto) {
    return this.empresaService.create(createEmpresaDto);
  }

  // GET /empresa
  @Get()
  @ApiOperation({ summary: 'Busca os dados da empresa cadastrada' })
  @ApiResponse({ status: 200, description: 'Dados da empresa retornados com sucesso.' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada.' })
  findOne() {
    return this.empresaService.findOne();
  }

  // PATCH /empresa/:id
  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza os dados da empresa' })
  @ApiResponse({ status: 200, description: 'Empresa atualizada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEmpresaDto: UpdateEmpresaDto,
  ) {
    return this.empresaService.update(id, updateEmpresaDto);
  }
}