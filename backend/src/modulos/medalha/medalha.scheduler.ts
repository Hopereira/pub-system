import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Funcionario } from '../funcionario/entities/funcionario.entity';
import { TipoFuncionario } from '../funcionario/enums/tipo-funcionario.enum';
import { MedalhaService } from '../medalha/medalha.service';

@Injectable()
export class MedalhaScheduler {
  private readonly logger = new Logger(MedalhaScheduler.name);

  constructor(
    @InjectRepository(Funcionario)
    private funcionarioRepository: Repository<Funcionario>,
    private medalhaService: MedalhaService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async verificarMedalhasGarcons() {
    this.logger.log('🔄 Iniciando verificação automática de medalhas...');

    try {
      // Buscar todos os garçons ativos
      const garcons = await this.funcionarioRepository.find({
        where: {
          tipo: TipoFuncionario.GARCOM,
          ativo: true,
        },
      });

      this.logger.log(`📋 Verificando ${garcons.length} garçons`);

      let totalNovasMedalhas = 0;

      for (const garcom of garcons) {
        try {
          const novasMedalhas = await this.medalhaService.verificarNovasMedalhas(
            garcom.id
          );

          if (novasMedalhas.length > 0) {
            totalNovasMedalhas += novasMedalhas.length;
            this.logger.log(
              `🏆 ${garcom.nome} conquistou ${novasMedalhas.length} nova(s) medalha(s)!`
            );
          }
        } catch (error) {
          this.logger.error(
            `❌ Erro ao verificar medalhas de ${garcom.nome}:`,
            error.message
          );
        }
      }

      this.logger.log(
        `✅ Verificação concluída: ${totalNovasMedalhas} nova(s) medalha(s) conquistada(s)`
      );
    } catch (error) {
      this.logger.error('❌ Erro na verificação de medalhas:', error.message);
    }
  }

  // Job diário para resetar conquistas de MVP do dia
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetarMedalhasDiarias() {
    this.logger.log('🌙 Resetando medalhas diárias (MVP do Dia)...');
    // TODO: Implementar lógica de reset quando necessário
  }
}
