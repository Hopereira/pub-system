import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PlanService } from './plan.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/create-plan.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Cargo } from '../funcionario/enums/cargo.enum';

@ApiTags('Planos')
@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  /**
   * Lista planos públicos (para landing page)
   */
  @Get('public')
  @ApiOperation({ summary: 'Lista planos para exibição pública' })
  @ApiResponse({ status: 200, description: 'Lista de planos' })
  async getPublicPlans() {
    return this.planService.getPublicPlans();
  }

  /**
   * Lista todas as features disponíveis
   */
  @Get('features')
  @ApiOperation({ summary: 'Lista todas as features disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de features' })
  async getAllFeatures() {
    return this.planService.getAllFeatures();
  }

  /**
   * Lista todos os planos (Super Admin)
   */
  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.SUPER_ADMIN)
  @ApiOperation({ summary: 'Lista todos os planos (Super Admin)' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Lista de planos' })
  async findAll(@Query('includeInactive') includeInactive?: string) {
    return this.planService.findAll(includeInactive === 'true');
  }

  /**
   * Busca plano por ID
   */
  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.SUPER_ADMIN)
  @ApiOperation({ summary: 'Busca plano por ID' })
  @ApiResponse({ status: 200, description: 'Plano encontrado' })
  @ApiResponse({ status: 404, description: 'Plano não encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.planService.findOne(id);
  }

  /**
   * Cria novo plano
   */
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cria novo plano' })
  @ApiResponse({ status: 201, description: 'Plano criado' })
  @ApiResponse({ status: 409, description: 'Código já existe' })
  async create(@Body() dto: CreatePlanDto) {
    return this.planService.create(dto);
  }

  /**
   * Atualiza plano
   */
  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualiza plano' })
  @ApiResponse({ status: 200, description: 'Plano atualizado' })
  @ApiResponse({ status: 404, description: 'Plano não encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.planService.update(id, dto);
  }

  /**
   * Desativa plano
   */
  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.SUPER_ADMIN)
  @ApiOperation({ summary: 'Desativa plano' })
  @ApiResponse({ status: 200, description: 'Plano desativado' })
  @ApiResponse({ status: 404, description: 'Plano não encontrado' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.planService.remove(id);
    return { success: true };
  }
}
