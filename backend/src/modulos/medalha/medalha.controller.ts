import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Cargo } from '../funcionario/enums/cargo.enum';
import { MedalhaService } from './medalha.service';

@ApiTags('Medalhas')
@ApiBearerAuth()
@Controller('medalhas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MedalhaController {
  constructor(private readonly medalhaService: MedalhaService) {}

  // ✅ CORREÇÃO DE SEGURANÇA: Adicionado @Roles
  @Get('garcom/:garcomId')
  @Roles(Cargo.ADMIN, Cargo.GARCOM)
  @ApiOperation({ summary: 'Listar medalhas conquistadas por um garçom' })
  @ApiResponse({ status: 200, description: 'Lista de medalhas retornada' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  async getMedalhasGarcom(@Param('garcomId') garcomId: string) {
    return this.medalhaService.getMedalhasGarcom(garcomId);
  }

  // ✅ CORREÇÃO DE SEGURANÇA: Adicionado @Roles
  @Get('garcom/:garcomId/progresso')
  @Roles(Cargo.ADMIN, Cargo.GARCOM)
  @ApiOperation({ summary: 'Ver progresso das medalhas de um garçom' })
  @ApiResponse({ status: 200, description: 'Progresso retornado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  async getProgressoMedalhas(@Param('garcomId') garcomId: string) {
    return this.medalhaService.getProgressoMedalhas(garcomId);
  }

  // ✅ CORREÇÃO DE SEGURANÇA: Adicionado @Roles
  @Get('garcom/:garcomId/verificar')
  @Roles(Cargo.ADMIN, Cargo.GARCOM)
  @ApiOperation({ summary: 'Verificar e conceder novas medalhas' })
  @ApiResponse({ status: 200, description: 'Verificação concluída' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  async verificarNovasMedalhas(@Param('garcomId') garcomId: string) {
    return this.medalhaService.verificarNovasMedalhas(garcomId);
  }
}
