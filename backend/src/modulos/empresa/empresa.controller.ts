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
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Cargo } from '../funcionario/enums/cargo.enum';

@Controller('empresas') // A rota base para o recurso é no plural
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  // POST /empresas -> Cria uma nova empresa
  @Post()
  @Roles(Cargo.ADMIN)
  create(@Body() createEmpresaDto: CreateEmpresaDto) {
    return this.empresaService.create(createEmpresaDto);
  }

  // GET /empresas/unica -> Busca a única empresa cadastrada
  @Get('unica')
  @Roles(Cargo.ADMIN)
  findOne() {
    return this.empresaService.findOne();
  }

  // PATCH /empresas/:id -> Atualiza a empresa pelo ID
  @Patch(':id')
  @Roles(Cargo.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEmpresaDto: UpdateEmpresaDto,
  ) {
    return this.empresaService.update(id, updateEmpresaDto);
  }
}