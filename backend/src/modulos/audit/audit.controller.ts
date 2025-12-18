import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuditService } from './audit.service';
import { AuditAction } from './entities/audit-log.entity';

@ApiTags('Auditoria')
@Controller('audit')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Listar registros de auditoria' })
  @ApiQuery({ name: 'funcionarioId', required: false })
  @ApiQuery({ name: 'entityName', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @Query('funcionarioId') funcionarioId?: string,
    @Query('entityName') entityName?: string,
    @Query('entityId') entityId?: string,
    @Query('action') action?: AuditAction,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.findAll({
      funcionarioId,
      entityName,
      entityId,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('entity/:entityName/:entityId')
  @ApiOperation({ summary: 'Histórico de alterações de uma entidade' })
  async getEntityHistory(
    @Param('entityName') entityName: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.getEntityHistory(entityName, entityId);
  }

  @Get('user/:funcionarioId')
  @ApiOperation({ summary: 'Atividades recentes de um usuário' })
  @ApiQuery({ name: 'limit', required: false })
  async getUserActivity(
    @Param('funcionarioId') funcionarioId: string,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.getUserActivity(
      funcionarioId,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('report')
  @ApiOperation({ summary: 'Gerar relatório de auditoria' })
  @ApiQuery({ name: 'funcionarioId', required: false })
  @ApiQuery({ name: 'entityName', required: false })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async generateReport(
    @Query('funcionarioId') funcionarioId?: string,
    @Query('entityName') entityName?: string,
    @Query('action') action?: AuditAction,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditService.generateReport({
      funcionarioId,
      entityName,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Estatísticas de auditoria' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditService.getStatistics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('failed-logins')
  @ApiOperation({ summary: 'Tentativas de login falhadas' })
  @ApiQuery({ name: 'limit', required: false })
  async getFailedLogins(@Query('limit') limit?: number) {
    return this.auditService.getFailedLogins(limit ? Number(limit) : undefined);
  }
}
