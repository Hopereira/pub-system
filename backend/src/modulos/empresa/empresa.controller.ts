import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

// --- IMPORTAÇÕES DE SEGURANÇA E SWAGGER ---
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Cargo } from 'src/modulos/funcionario/enums/cargo.enum';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Empresa')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('empresa')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @Post()
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Cria os dados da empresa (apenas um registro permitido)' })
  @ApiResponse({ status: 201, description: 'Dados da empresa criados com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Apenas Administradores.' })
  @ApiResponse({ status: 409, description: 'Já existem dados de uma empresa cadastrados.' })
  create(@Body() createEmpresaDto: CreateEmpresaDto) {
    return this.empresaService.create(createEmpresaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Busca os dados da empresa' })
  @ApiResponse({ status: 200, description: 'Dados da empresa retornados com sucesso.' })
  find() {
    return this.empresaService.findOne();
  }

  @Put(':id')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Atualiza os dados da empresa' })
  @ApiResponse({ status: 200, description: 'Dados da empresa atualizados com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Apenas Administradores.' })
  @ApiResponse({ status: 404, description: 'Registro da empresa não encontrado.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEmpresaDto: UpdateEmpresaDto,
  ) {
    return this.empresaService.update(id, updateEmpresaDto);
  }
}