import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TurnoService } from './turno.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import {
  TurnoResponseDto,
  FuncionarioAtivoDto,
  EstatisticasTurnoDto,
} from './dto/turno-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Cargo } from '../funcionario/enums/cargo.enum';

@ApiTags('Turnos')
@Controller('turnos')
export class TurnoController {
  constructor(private readonly turnoService: TurnoService) {}

  // ✅ CORREÇÃO DE SEGURANÇA: Adicionado autenticação JWT
  @Post('check-in')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.COZINHA, Cargo.CAIXA)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fazer check-in (iniciar turno)' })
  @ApiResponse({
    status: 201,
    description: 'Check-in realizado com sucesso',
    type: TurnoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Já existe check-in ativo' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado' })
  async checkIn(@Body() checkInDto: CheckInDto): Promise<TurnoResponseDto> {
    return this.turnoService.checkIn(checkInDto);
  }

  // ✅ CORREÇÃO DE SEGURANÇA: Adicionado autenticação JWT
  @Post('check-out')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.COZINHA, Cargo.CAIXA)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fazer check-out (finalizar turno)' })
  @ApiResponse({
    status: 200,
    description: 'Check-out realizado com sucesso',
    type: TurnoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Nenhum check-in ativo encontrado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async checkOut(@Body() checkOutDto: CheckOutDto): Promise<TurnoResponseDto> {
    return this.turnoService.checkOut(checkOutDto);
  }

  @Get('ativos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Cargo.ADMIN, Cargo.CAIXA)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar funcionários ativos (com check-in)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de funcionários ativos',
    type: [FuncionarioAtivoDto],
  })
  async getFuncionariosAtivos(): Promise<FuncionarioAtivoDto[]> {
    return this.turnoService.getFuncionariosAtivos();
  }

  @Get('funcionario/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar turnos de um funcionário' })
  @ApiQuery({ name: 'dataInicio', required: false, type: Date })
  @ApiQuery({ name: 'dataFim', required: false, type: Date })
  @ApiResponse({
    status: 200,
    description: 'Lista de turnos',
    type: [TurnoResponseDto],
  })
  async getTurnosFuncionario(
    @Param('id') id: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ): Promise<TurnoResponseDto[]> {
    const inicio = dataInicio ? new Date(dataInicio) : undefined;
    const fim = dataFim ? new Date(dataFim) : undefined;
    return this.turnoService.getTurnosFuncionario(id, inicio, fim);
  }

  @Get('funcionario/:id/estatisticas')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter estatísticas de turnos de um funcionário' })
  @ApiQuery({ name: 'dataInicio', required: false, type: Date })
  @ApiQuery({ name: 'dataFim', required: false, type: Date })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas de turnos',
    type: EstatisticasTurnoDto,
  })
  async getEstatisticasFuncionario(
    @Param('id') id: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ): Promise<EstatisticasTurnoDto> {
    const inicio = dataInicio ? new Date(dataInicio) : undefined;
    const fim = dataFim ? new Date(dataFim) : undefined;
    return this.turnoService.getEstatisticasFuncionario(id, inicio, fim);
  }

  @Get('funcionario/:id/ativo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar se funcionário tem turno ativo' })
  @ApiResponse({
    status: 200,
    description: 'Turno ativo do funcionário ou null',
    type: TurnoResponseDto,
  })
  async getTurnoAtivo(
    @Param('id') id: string,
  ): Promise<TurnoResponseDto | null> {
    return this.turnoService.getTurnoAtivo(id);
  }
}
