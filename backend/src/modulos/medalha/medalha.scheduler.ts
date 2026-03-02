import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Funcionario } from '../funcionario/entities/funcionario.entity';
import { Cargo } from '../funcionario/enums/cargo.enum';
import { MedalhaService } from '../medalha/medalha.service';

@Injectable()
export class MedalhaScheduler {
  private readonly logger = new Logger(MedalhaScheduler.name);
  
  // ✅ Controle de erros consecutivos para evitar spam de logs
  private errosConsecutivos = 0;
  private readonly MAX_ERROS_LOG = 3;

  constructor(
    @InjectRepository(Funcionario)
    private funcionarioRepository: Repository<Funcionario>,
    private medalhaService: MedalhaService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async verificarMedalhasGarcons() {
    try {
      // Buscar todos os garçons ativos
      const garcons = await this.funcionarioRepository.find({
        where: {
          cargo: Cargo.GARCOM,
        },
      });

      // ✅ Reset contador de erros após sucesso
      if (this.errosConsecutivos > 0) {
        this.logger.log('✅ Conexão com banco restaurada');
        this.errosConsecutivos = 0;
      }

      if (garcons.length === 0) {
        return;
      }

      this.logger.debug(`📋 Verificando ${garcons.length} garçons`);

      let totalNovasMedalhas = 0;

      for (const garcom of garcons) {
        try {
          const novasMedalhas =
            await this.medalhaService.verificarNovasMedalhas(garcom.id);

          if (novasMedalhas.length > 0) {
            totalNovasMedalhas += novasMedalhas.length;
            this.logger.log(
              `🏆 ${garcom.nome} conquistou ${novasMedalhas.length} nova(s) medalha(s)!`,
            );
          }
        } catch (error) {
          // Erro específico de um garçom, continua com os outros
          this.logger.warn(`⚠️ Erro ao verificar medalhas de ${garcom.nome}`);
        }
      }

      if (totalNovasMedalhas > 0) {
        this.logger.log(
          `✅ Verificação concluída: ${totalNovasMedalhas} nova(s) medalha(s) conquistada(s)`,
        );
      }
    } catch (error) {
      this.errosConsecutivos++;
      
      // ✅ Só loga os primeiros erros para evitar spam de logs
      if (this.errosConsecutivos <= this.MAX_ERROS_LOG) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes('EAI_AGAIN') || errorMessage.includes('ECONNRESET') || errorMessage.includes('terminated unexpectedly')) {
          this.logger.warn(`⚠️ Erro de conexão com banco (tentativa ${this.errosConsecutivos}/${this.MAX_ERROS_LOG})`);
        } else {
          this.logger.error(`❌ Erro na verificação de medalhas: ${errorMessage}`);
        }
      } else if (this.errosConsecutivos === this.MAX_ERROS_LOG + 1) {
        this.logger.warn('⚠️ Suprimindo logs de erro até conexão ser restaurada...');
      }
    }
  }

  // Job diário para resetar conquistas de MVP do dia
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetarMedalhasDiarias() {
    this.logger.log('🌙 Resetando medalhas diárias (MVP do Dia)...');
    // TODO: Implementar lógica de reset quando necessário
  }
}
