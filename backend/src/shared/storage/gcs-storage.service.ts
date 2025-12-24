// Caminho: backend/src/shared/storage/gcs-storage.service.ts
import { Injectable, Logger, Scope, Inject, Optional } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { ConfigService } from '@nestjs/config';
import { Express } from 'express';
import { TenantContextService } from '../../common/tenant/tenant-context.service';

/**
 * Módulos suportados para organização de arquivos por tenant
 */
export type StorageModule = 'produtos' | 'eventos' | 'funcionarios' | 'empresas' | 'geral';

/**
 * GcsStorageService - Serviço de Storage com Isolamento por Tenant
 * 
 * Estrutura de pastas:
 * - tenants/{tenant_id}/produtos/{filename}
 * - tenants/{tenant_id}/eventos/{filename}
 * - tenants/{tenant_id}/funcionarios/{filename}
 * - tenants/{tenant_id}/empresas/{filename}
 * 
 * Isso facilita:
 * - Organização de arquivos por cliente
 * - Exclusão de dados por tenant (LGPD)
 * - Auditoria de uso de storage
 */
@Injectable({ scope: Scope.REQUEST })
export class GcsStorageService {
  private storage: Storage;
  private bucket: string;
  private readonly logger = new Logger(GcsStorageService.name);

  constructor(
    private configService: ConfigService,
    @Optional() @Inject(TenantContextService) 
    private tenantContext?: TenantContextService,
  ) {
    this.storage = new Storage({
      keyFilename: this.configService.get<string>(
        'GOOGLE_APPLICATION_CREDENTIALS',
      ),
    });
    this.bucket = this.configService.get<string>('GCS_BUCKET_NAME');
  }

  /**
   * Upload de arquivo com isolamento por tenant
   * 
   * @param file - Arquivo do Multer
   * @param module - Módulo para organização (produtos, eventos, etc)
   * @param tenantId - ID do tenant (opcional, usa contexto se não informado)
   * @returns URL pública do arquivo
   */
  async uploadFile(
    file: Express.Multer.File,
    module: StorageModule = 'geral',
    tenantId?: string,
  ): Promise<string> {
    const bucket = this.storage.bucket(this.bucket);
    const targetTenantId = tenantId || this.getTenantIdFromContext();

    // Gera nome único para o arquivo
    const uniqueFileName = this.generateUniqueFileName(file.originalname);
    
    // Monta o path com isolamento por tenant
    const filePath = this.buildTenantPath(targetTenantId, module, uniqueFileName);

    const blob = bucket.file(filePath);

    return new Promise((resolve, reject) => {
      const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: file.mimetype,
        metadata: {
          // Metadados para rastreabilidade
          tenantId: targetTenantId || 'unknown',
          module: module,
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      });

      blobStream.on('error', (err) => {
        this.logger.error(`🔴 GCS Upload Error [${module}]:`, err);
        reject(`Não foi possível fazer o upload do ficheiro: ${err.message}`);
      });

      blobStream.on('finish', async () => {
        const publicUrl = `https://storage.googleapis.com/${this.bucket}/${blob.name}`;
        this.logger.log(
          `🟢 Upload bem-sucedido | Tenant: ${targetTenantId || 'global'} | Módulo: ${module} | URL: ${publicUrl}`,
        );
        resolve(publicUrl);
      });

      blobStream.end(file.buffer);
    });
  }

  /**
   * Upload legado (compatibilidade com código existente)
   * @deprecated Use uploadFile(file, module) ao invés
   */
  async uploadFileLegacy(
    file: Express.Multer.File,
    folderPath: string = '',
  ): Promise<string> {
    const bucket = this.storage.bucket(this.bucket);
    const uniqueFileName = this.generateUniqueFileName(file.originalname);
    const filePath = folderPath ? `${folderPath}/${uniqueFileName}` : uniqueFileName;

    const blob = bucket.file(filePath);

    return new Promise((resolve, reject) => {
      const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: file.mimetype,
      });

      blobStream.on('error', (err) => {
        this.logger.error('GCS Upload Error:', err);
        reject(`Não foi possível fazer o upload do ficheiro: ${err.message}`);
      });

      blobStream.on('finish', async () => {
        const publicUrl = `https://storage.googleapis.com/${this.bucket}/${blob.name}`;
        this.logger.log(`Upload bem-sucedido. URL Pública: ${publicUrl}`);
        resolve(publicUrl);
      });

      blobStream.end(file.buffer);
    });
  }

  /**
   * Gera nome de arquivo único
   */
  private generateUniqueFileName(originalName: string): string {
    const sanitized = originalName.replace(/ /g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    return `${Date.now()}-${sanitized}`;
  }

  /**
   * Monta o path com isolamento por tenant
   * Estrutura: tenants/{tenant_id}/{module}/{filename}
   */
  private buildTenantPath(tenantId: string | null, module: StorageModule, fileName: string): string {
    if (tenantId) {
      return `tenants/${tenantId}/${module}/${fileName}`;
    }
    // Fallback para arquivos globais (sem tenant)
    return `global/${module}/${fileName}`;
  }

  /**
   * Obtém tenant_id do contexto da requisição
   */
  private getTenantIdFromContext(): string | null {
    try {
      if (this.tenantContext?.hasTenant()) {
        return this.tenantContext.getTenantId();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Deleta arquivo do GCS
   */
  async deleteFile(publicUrl: string): Promise<void> {
    try {
      // Extrai o nome do ficheiro da URL completa
      const fileName = publicUrl.split(
        `https://storage.googleapis.com/${this.bucket}/`,
      )[1];
      if (!fileName) {
        this.logger.warn(`URL inválida para exclusão: ${publicUrl}`);
        return;
      }

      await this.storage.bucket(this.bucket).file(fileName).delete();
      this.logger.log(`🗑️ Ficheiro ${fileName} apagado com sucesso do GCS.`);
    } catch (error) {
      // Não lança um erro se o ficheiro não existir, apenas regista o aviso
      if (error.code === 404) {
        this.logger.warn(
          `Tentativa de apagar um ficheiro que não existe no GCS: ${publicUrl}`,
        );
      } else {
        this.logger.error(
          `Falha ao apagar dos ficheiro do GCS: ${publicUrl}`,
          error,
        );
      }
    }
  }

  /**
   * Lista arquivos de um tenant por módulo
   * Útil para auditoria e gestão de storage
   */
  async listTenantFiles(tenantId: string, module?: StorageModule): Promise<string[]> {
    try {
      const prefix = module 
        ? `tenants/${tenantId}/${module}/`
        : `tenants/${tenantId}/`;
      
      const [files] = await this.storage.bucket(this.bucket).getFiles({ prefix });
      
      return files.map(file => `https://storage.googleapis.com/${this.bucket}/${file.name}`);
    } catch (error) {
      this.logger.error(`Erro ao listar arquivos do tenant ${tenantId}:`, error);
      return [];
    }
  }

  /**
   * Deleta todos os arquivos de um tenant
   * Útil para LGPD (direito ao esquecimento) e exclusão de conta
   * 
   * ⚠️ CUIDADO: Esta operação é irreversível!
   */
  async deleteAllTenantFiles(tenantId: string): Promise<{ deleted: number; errors: number }> {
    const prefix = `tenants/${tenantId}/`;
    let deleted = 0;
    let errors = 0;

    try {
      const [files] = await this.storage.bucket(this.bucket).getFiles({ prefix });
      
      this.logger.warn(`🗑️ Iniciando exclusão de ${files.length} arquivos do tenant ${tenantId}`);

      for (const file of files) {
        try {
          await file.delete();
          deleted++;
        } catch (err) {
          errors++;
          this.logger.error(`Erro ao deletar ${file.name}:`, err);
        }
      }

      this.logger.log(`✅ Exclusão concluída | Tenant: ${tenantId} | Deletados: ${deleted} | Erros: ${errors}`);
      return { deleted, errors };
    } catch (error) {
      this.logger.error(`Erro ao deletar arquivos do tenant ${tenantId}:`, error);
      return { deleted, errors: 1 };
    }
  }

  /**
   * Calcula o uso de storage de um tenant em bytes
   * Útil para billing e limites de plano
   */
  async getTenantStorageUsage(tenantId: string): Promise<{ totalBytes: number; fileCount: number }> {
    try {
      const prefix = `tenants/${tenantId}/`;
      const [files] = await this.storage.bucket(this.bucket).getFiles({ prefix });
      
      let totalBytes = 0;
      for (const file of files) {
        const [metadata] = await file.getMetadata();
        totalBytes += parseInt(metadata.size as string, 10) || 0;
      }

      return { totalBytes, fileCount: files.length };
    } catch (error) {
      this.logger.error(`Erro ao calcular storage do tenant ${tenantId}:`, error);
      return { totalBytes: 0, fileCount: 0 };
    }
  }
}
