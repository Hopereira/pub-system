import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Between } from 'typeorm';
import { TurnoFuncionario } from './entities/turno-funcionario.entity';
import { Funcionario } from '../funcionario/entities/funcionario.entity';
import { FuncionarioStatus } from '../funcionario/enums/funcionario-status.enum';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import {
  TurnoResponseDto,
  FuncionarioAtivoDto,
  EstatisticasTurnoDto,
} from './dto/turno-response.dto';

@Injectable()
export class TurnoService {
  private readonly logger = new Logger(TurnoService.name);

  constructor(
    @InjectRepository(TurnoFuncionario)
    private turnoRepository: Repository<TurnoFuncionario>,
    @InjectRepository(Funcionario)
    private funcionarioRepository: Repository<Funcionario>,
  ) {}

  async checkIn(checkInDto: CheckInDto): Promise<TurnoResponseDto> {
    const { funcionarioId, eventoId } = checkInDto;

    // Verifica se funcionário existe
    const funcionario = await this.funcionarioRepository.findOne({
      where: { id: funcionarioId },
    });

    if (!funcionario) {
      throw new NotFoundException('Funcionário não encontrado');
    }

    // Verifica se já existe check-in ativo
    const turnoAtivo = await this.turnoRepository.findOne({
      where: {
        funcionarioId,
        ativo: true,
        checkOut: IsNull(),
      },
    });

    if (turnoAtivo) {
      throw new BadRequestException(
        'Funcionário já possui um check-in ativo. Faça check-out primeiro.',
      );
    }

    // Cria novo turno
    const turno = this.turnoRepository.create({
      funcionarioId,
      eventoId,
      checkIn: new Date(),
      ativo: true,
    });

    const turnoSalvo = await this.turnoRepository.save(turno);

    // Atualiza status do funcionário para ATIVO
    funcionario.status = FuncionarioStatus.ATIVO;
    await this.funcionarioRepository.save(funcionario);

    this.logger.log(
      `✅ Check-in realizado | Funcionário: ${funcionario.nome} | Status: ATIVO | ${new Date().toLocaleTimeString('pt-BR')}`,
    );

    return turnoSalvo;
  }

  async checkOut(checkOutDto: CheckOutDto): Promise<TurnoResponseDto> {
    const { funcionarioId } = checkOutDto;

    // Busca turno ativo
    const turno = await this.turnoRepository.findOne({
      where: {
        funcionarioId,
        ativo: true,
        checkOut: IsNull(),
      },
      relations: ['funcionario'],
    });

    if (!turno) {
      throw new BadRequestException(
        'Nenhum check-in ativo encontrado para este funcionário',
      );
    }

    // Calcula horas trabalhadas
    const checkOutTime = new Date();
    const horasTrabalhadas = Math.round(
      (checkOutTime.getTime() - turno.checkIn.getTime()) / 60000,
    ); // minutos

    // Atualiza turno
    turno.checkOut = checkOutTime;
    turno.horasTrabalhadas = horasTrabalhadas;
    turno.ativo = false;

    const turnoAtualizado = await this.turnoRepository.save(turno);

    // Atualiza status do funcionário para INATIVO
    turno.funcionario.status = FuncionarioStatus.INATIVO;
    await this.funcionarioRepository.save(turno.funcionario);

    this.logger.log(
      `⏹️ Check-out realizado | Funcionário: ${turno.funcionario.nome} | Status: INATIVO | Tempo: ${this.formatarTempo(horasTrabalhadas)}`,
    );

    return turnoAtualizado;
  }

  async getFuncionariosAtivos(): Promise<FuncionarioAtivoDto[]> {
    const turnosAtivos = await this.turnoRepository.find({
      where: {
        ativo: true,
        checkOut: IsNull(),
      },
      relations: ['funcionario', 'evento'],
      order: {
        checkIn: 'ASC',
      },
    });

    return turnosAtivos.map((turno) => {
      const tempoTrabalhado = Math.round(
        (new Date().getTime() - turno.checkIn.getTime()) / 60000,
      );

      return {
        id: turno.funcionario.id,
        nome: turno.funcionario.nome,
        email: turno.funcionario.email,
        cargo: turno.funcionario.cargo,
        checkIn: turno.checkIn,
        tempoTrabalhado,
        evento: turno.evento
          ? {
              id: turno.evento.id,
              nome: turno.evento.titulo,
            }
          : undefined,
      };
    });
  }

  async getTurnosFuncionario(
    funcionarioId: string,
    dataInicio?: Date,
    dataFim?: Date,
  ): Promise<TurnoResponseDto[]> {
    const where: any = { funcionarioId };

    if (dataInicio && dataFim) {
      where.checkIn = Between(dataInicio, dataFim);
    }

    const turnos = await this.turnoRepository.find({
      where,
      order: {
        checkIn: 'DESC',
      },
    });

    return turnos;
  }

  async getEstatisticasFuncionario(
    funcionarioId: string,
    dataInicio?: Date,
    dataFim?: Date,
  ): Promise<EstatisticasTurnoDto> {
    const turnos = await this.getTurnosFuncionario(
      funcionarioId,
      dataInicio,
      dataFim,
    );

    const turnosFinalizados = turnos.filter((t) => t.horasTrabalhadas);

    if (turnosFinalizados.length === 0) {
      return {
        totalTurnos: 0,
        horasTotais: 0,
        horasMedia: 0,
        turnoMaisLongo: 0,
        turnoMaisCurto: 0,
      };
    }

    const horasTotais = turnosFinalizados.reduce(
      (sum, t) => sum + (t.horasTrabalhadas || 0),
      0,
    );
    const horasMedia = Math.round(horasTotais / turnosFinalizados.length);
    const turnoMaisLongo = Math.max(
      ...turnosFinalizados.map((t) => t.horasTrabalhadas || 0),
    );
    const turnoMaisCurto = Math.min(
      ...turnosFinalizados.map((t) => t.horasTrabalhadas || 0),
    );

    return {
      totalTurnos: turnosFinalizados.length,
      horasTotais,
      horasMedia,
      turnoMaisLongo,
      turnoMaisCurto,
    };
  }

  // Método auxiliar para fechar turnos automaticamente após 12h
  async fecharTurnosExpirados(): Promise<void> {
    const dozeHorasAtras = new Date();
    dozeHorasAtras.setHours(dozeHorasAtras.getHours() - 12);

    const turnosExpirados = await this.turnoRepository.find({
      where: {
        ativo: true,
        checkOut: IsNull(),
      },
      relations: ['funcionario'],
    });

    const turnosParaFechar = turnosExpirados.filter(
      (t) => t.checkIn < dozeHorasAtras,
    );

    for (const turno of turnosParaFechar) {
      const horasTrabalhadas = Math.round(
        (new Date().getTime() - turno.checkIn.getTime()) / 60000,
      );

      turno.checkOut = new Date();
      turno.horasTrabalhadas = horasTrabalhadas;
      turno.ativo = false;

      await this.turnoRepository.save(turno);

      this.logger.warn(
        `⚠️ Turno fechado automaticamente (>12h) | Funcionário: ${turno.funcionario.nome}`,
      );
    }
  }

  /**
   * Busca o turno ativo de um funcionário específico
   */
  async getTurnoAtivo(funcionarioId: string): Promise<TurnoFuncionario | null> {
    return await this.turnoRepository.findOne({
      where: {
        funcionarioId,
        ativo: true,
        checkOut: IsNull(),
      },
      relations: ['funcionario', 'evento'],
    });
  }

  private formatarTempo(minutos: number): string {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}min`;
  }
}
