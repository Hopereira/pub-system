import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AmbienteService } from './ambiente.service';
import { CreateAmbienteDto } from './dto/create-ambiente.dto';
import { UpdateAmbienteDto } from './dto/update-ambiente.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Cargo } from '../funcionario/enums/cargo.enum';

// --- DECORADORES DO SWAGGER ---
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Ambientes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('ambientes')
export class AmbienteController {
  constructor(private readonly ambienteService: AmbienteService) {}

  @Post()
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Cria um novo ambiente operacional' })
  @ApiResponse({ status: 201, description: 'Ambiente criado com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Apenas Administradores.' })
  create(@Body() createAmbienteDto: CreateAmbienteDto) {
    return this.ambienteService.create(createAmbienteDto);
  }

  @Get()
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.CAIXA, Cargo.COZINHA)
  @ApiOperation({ summary: 'Lista todos os ambientes cadastrados' })
  @ApiResponse({ status: 200, description: 'Lista de ambientes retornada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  findAll() {
    return this.ambienteService.findAll();
  }

  @Get(':id')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Busca um ambiente específico por ID' })
  @ApiResponse({ status: 200, description: 'Dados do ambiente retornados com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Apenas Administradores.' })
  @ApiResponse({ status: 404, description: 'Ambiente não encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ambienteService.findOne(id);
  }

  @Put(':id')
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Atualiza os dados de um ambiente' })
  @ApiResponse({ status: 200, description: 'Ambiente atualizado com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Apenas Administradores.' })
  @ApiResponse({ status: 404, description: 'Ambiente não encontrado.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAmbienteDto: UpdateAmbienteDto,
  ) {
    return this.ambienteService.update(id, updateAmbienteDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Cargo.ADMIN)
  @ApiOperation({ summary: 'Remove um ambiente do sistema' })
  @ApiResponse({ status: 204, description: 'Ambiente removido com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Apenas Administradores.' })
  @ApiResponse({ status: 404, description: 'Ambiente não encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ambienteService.remove(id);
  }
}