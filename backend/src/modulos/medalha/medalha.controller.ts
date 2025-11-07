import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { MedalhaService } from './medalha.service';

@Controller('medalhas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MedalhaController {
  constructor(private readonly medalhaService: MedalhaService) {}

  @Get('garcom/:garcomId')
  async getMedalhasGarcom(@Param('garcomId') garcomId: string) {
    return this.medalhaService.getMedalhasGarcom(garcomId);
  }

  @Get('garcom/:garcomId/progresso')
  async getProgressoMedalhas(@Param('garcomId') garcomId: string) {
    return this.medalhaService.getProgressoMedalhas(garcomId);
  }

  @Get('garcom/:garcomId/verificar')
  async verificarNovasMedalhas(@Param('garcomId') garcomId: string) {
    return this.medalhaService.verificarNovasMedalhas(garcomId);
  }
}
