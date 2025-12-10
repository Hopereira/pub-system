import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoggerService } from '../common/logger/logger.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BackupCheckJob {
  private readonly backupDir: string;
  private readonly maxAgeHours: number;

  constructor(private readonly logger: LoggerService) {
    this.backupDir = process.env.BACKUP_DIR || path.join(__dirname, '../../..', 'backups');
    this.maxAgeHours = parseInt(process.env.BACKUP_MAX_AGE_HOURS || '24', 10);
  }

  // Executa todos os dias às 8h
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkBackups() {
    this.logger.log('Iniciando verificação de backups...', 'BackupCheckJob');

    try {
      // Verificar se diretório existe
      if (!fs.existsSync(this.backupDir)) {
        this.logger.critical(
          `Diretório de backup não existe: ${this.backupDir}`,
          new Error('BACKUP_DIR_NOT_FOUND'),
          'BackupCheckJob',
        );
        return;
      }

      // Listar arquivos de backup
      const files = fs.readdirSync(this.backupDir).filter((f) => f.endsWith('.sql') || f.endsWith('.sql.gz'));

      if (files.length === 0) {
        this.logger.critical('Nenhum arquivo de backup encontrado!', new Error('NO_BACKUPS'), 'BackupCheckJob');
        return;
      }

      // Verificar backup mais recente
      const latestBackup = files
        .map((f) => ({
          name: f,
          path: path.join(this.backupDir, f),
          mtime: fs.statSync(path.join(this.backupDir, f)).mtime,
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())[0];

      const ageHours = (Date.now() - latestBackup.mtime.getTime()) / (1000 * 60 * 60);

      if (ageHours > this.maxAgeHours) {
        this.logger.critical(
          `Backup mais recente tem ${ageHours.toFixed(1)} horas (máximo: ${this.maxAgeHours}h)`,
          new Error('BACKUP_TOO_OLD'),
          'BackupCheckJob',
        );
      } else {
        this.logger.log(
          `Backup OK: ${latestBackup.name} (${ageHours.toFixed(1)} horas atrás)`,
          'BackupCheckJob',
        );
      }

      // Estatísticas
      const totalSize = files.reduce((sum, f) => {
        return sum + fs.statSync(path.join(this.backupDir, f)).size;
      }, 0);

      this.logger.log(
        `Total de backups: ${files.length}, Tamanho total: ${(totalSize / 1024 / 1024).toFixed(2)} MB`,
        'BackupCheckJob',
      );
    } catch (error) {
      this.logger.critical('Erro ao verificar backups', error as Error, 'BackupCheckJob');
    }
  }

  // Método para verificação manual
  async runManualCheck(): Promise<{
    status: 'ok' | 'warning' | 'critical';
    message: string;
    latestBackup?: string;
    ageHours?: number;
    totalBackups?: number;
  }> {
    try {
      if (!fs.existsSync(this.backupDir)) {
        return { status: 'critical', message: 'Diretório de backup não existe' };
      }

      const files = fs.readdirSync(this.backupDir).filter((f) => f.endsWith('.sql') || f.endsWith('.sql.gz'));

      if (files.length === 0) {
        return { status: 'critical', message: 'Nenhum backup encontrado' };
      }

      const latestBackup = files
        .map((f) => ({
          name: f,
          mtime: fs.statSync(path.join(this.backupDir, f)).mtime,
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())[0];

      const ageHours = (Date.now() - latestBackup.mtime.getTime()) / (1000 * 60 * 60);

      if (ageHours > this.maxAgeHours) {
        return {
          status: 'warning',
          message: `Backup desatualizado (${ageHours.toFixed(1)}h)`,
          latestBackup: latestBackup.name,
          ageHours,
          totalBackups: files.length,
        };
      }

      return {
        status: 'ok',
        message: 'Backup atualizado',
        latestBackup: latestBackup.name,
        ageHours,
        totalBackups: files.length,
      };
    } catch (error) {
      return { status: 'critical', message: (error as Error).message };
    }
  }
}
