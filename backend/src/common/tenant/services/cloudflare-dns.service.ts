import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Resultado da criação de DNS
 */
export interface DnsRecordResult {
  success: boolean;
  recordId?: string;
  subdomain: string;
  fullDomain: string;
  error?: string;
}

/**
 * CloudflareDnsService - Gerencia registros DNS automaticamente
 * 
 * Cria subdomínios no Cloudflare quando um novo tenant é provisionado.
 * Exemplo: casaraopub423.pubsystem.com.br
 */
@Injectable()
export class CloudflareDnsService {
  private readonly logger = new Logger(CloudflareDnsService.name);
  
  private readonly apiToken: string;
  private readonly zoneId: string;
  private readonly baseDomain: string;
  private readonly targetIp: string;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.apiToken = this.configService.get<string>('CLOUDFLARE_API_TOKEN', '');
    this.zoneId = this.configService.get<string>('CLOUDFLARE_ZONE_ID', '');
    this.baseDomain = this.configService.get<string>('CLOUDFLARE_BASE_DOMAIN', 'pubsystem.com.br');
    this.targetIp = this.configService.get<string>('CLOUDFLARE_TARGET_IP', '134.65.248.235');
    
    // Só habilita se tiver as credenciais configuradas
    this.enabled = !!(this.apiToken && this.zoneId);
    
    if (this.enabled) {
      this.logger.log('✅ Cloudflare DNS Service habilitado');
    } else {
      this.logger.warn('⚠️ Cloudflare DNS Service desabilitado (credenciais não configuradas)');
    }
  }

  /**
   * Verifica se o serviço está habilitado
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Cria um registro DNS A para o subdomínio do tenant
   * 
   * @param slug - Slug do tenant (ex: casaraopub423)
   * @returns Resultado da operação
   */
  async createSubdomain(slug: string): Promise<DnsRecordResult> {
    const fullDomain = `${slug}.${this.baseDomain}`;
    
    if (!this.enabled) {
      this.logger.warn(`⚠️ DNS não criado para ${fullDomain} - Cloudflare não configurado`);
      return {
        success: false,
        subdomain: slug,
        fullDomain,
        error: 'Cloudflare não configurado. Configure CLOUDFLARE_API_TOKEN e CLOUDFLARE_ZONE_ID.',
      };
    }

    this.logger.log(`🌐 Criando registro DNS: ${fullDomain} → ${this.targetIp}`);

    try {
      // Primeiro, verifica se o registro já existe
      const existingRecord = await this.findRecord(slug);
      
      if (existingRecord) {
        this.logger.log(`ℹ️ Registro DNS já existe: ${fullDomain}`);
        return {
          success: true,
          recordId: existingRecord.id,
          subdomain: slug,
          fullDomain,
        };
      }

      // Cria o registro A
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'A',
            name: slug, // Cloudflare adiciona o domínio base automaticamente
            content: this.targetIp,
            ttl: 1, // Auto TTL
            proxied: true, // Passa pelo proxy Cloudflare (SSL + CDN)
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        this.logger.log(`✅ Registro DNS criado: ${fullDomain} (ID: ${data.result.id})`);
        return {
          success: true,
          recordId: data.result.id,
          subdomain: slug,
          fullDomain,
        };
      } else {
        const errorMsg = data.errors?.map((e: any) => e.message).join(', ') || 'Erro desconhecido';
        this.logger.error(`❌ Falha ao criar DNS: ${errorMsg}`);
        return {
          success: false,
          subdomain: slug,
          fullDomain,
          error: errorMsg,
        };
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao criar DNS: ${error.message}`, error.stack);
      return {
        success: false,
        subdomain: slug,
        fullDomain,
        error: error.message,
      };
    }
  }

  /**
   * Remove um registro DNS
   * 
   * @param slug - Slug do tenant
   */
  async deleteSubdomain(slug: string): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    const record = await this.findRecord(slug);
    
    if (!record) {
      this.logger.warn(`⚠️ Registro DNS não encontrado para: ${slug}`);
      return false;
    }

    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records/${record.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        this.logger.log(`🗑️ Registro DNS removido: ${slug}.${this.baseDomain}`);
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.error(`❌ Erro ao remover DNS: ${error.message}`);
      return false;
    }
  }

  /**
   * Busca um registro DNS existente
   */
  private async findRecord(slug: string): Promise<{ id: string } | null> {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records?name=${slug}.${this.baseDomain}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
          },
        }
      );

      const data = await response.json();

      if (data.success && data.result?.length > 0) {
        return { id: data.result[0].id };
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Lista todos os registros DNS do domínio
   */
  async listRecords(): Promise<any[]> {
    if (!this.enabled) {
      return [];
    }

    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records?per_page=100`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
          },
        }
      );

      const data = await response.json();
      return data.success ? data.result : [];
    } catch {
      return [];
    }
  }
}
