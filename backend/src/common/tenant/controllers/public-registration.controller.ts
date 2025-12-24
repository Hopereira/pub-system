import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, IsOptional, Matches } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantProvisioningService } from '../services/tenant-provisioning.service';
import { SkipTenantGuard } from '../guards/tenant.guard';
import { Tenant } from '../entities/tenant.entity';

/**
 * DTO para registro público de novo pub
 */
export class PublicRegistrationDto {
  @IsString()
  @MinLength(3)
  nomeEstabelecimento: string;

  @IsString()
  @Matches(/^[a-z][a-z0-9-]{2,49}$/, {
    message: 'Slug deve conter apenas letras minúsculas, números e hífens, começar com letra e ter 3-50 caracteres',
  })
  @IsOptional()
  slug?: string;

  @IsString()
  @MinLength(3)
  nomeAdmin: string;

  @IsEmail()
  emailAdmin: string;

  @IsString()
  @MinLength(6)
  senhaAdmin: string;

  @IsString()
  @IsOptional()
  telefone?: string;

  @IsString()
  @IsOptional()
  cnpj?: string;
}

/**
 * PublicRegistrationController - Endpoints públicos para registro de novos pubs
 * 
 * Permite que novos clientes se cadastrem na plataforma sem autenticação.
 * Usa o TenantProvisioningService para criar toda a infraestrutura.
 */
@ApiTags('Registro Público')
@Controller('registro')
@SkipTenantGuard()
export class PublicRegistrationController {
  private readonly logger = new Logger(PublicRegistrationController.name);

  constructor(
    private readonly provisioningService: TenantProvisioningService,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  /**
   * Verifica se um slug está disponível
   */
  @Get('verificar-slug')
  @ApiOperation({ summary: 'Verifica se um slug está disponível' })
  @ApiQuery({ name: 'slug', required: true })
  @ApiResponse({ status: 200, description: 'Resultado da verificação' })
  async verificarSlug(@Query('slug') slug: string) {
    const disponivel = await this.provisioningService.isSlugAvailable(slug);
    
    if (!disponivel) {
      const sugestoes = await this.provisioningService.suggestSlugs(slug);
      return { disponivel: false, sugestoes };
    }
    
    return { disponivel: true };
  }

  /**
   * Gera um slug a partir do nome
   */
  @Get('gerar-slug')
  @ApiOperation({ summary: 'Gera um slug a partir do nome do estabelecimento' })
  @ApiQuery({ name: 'nome', required: true })
  @ApiResponse({ status: 200, description: 'Slug gerado' })
  async gerarSlug(@Query('nome') nome: string) {
    const slug = this.provisioningService.generateSlug(nome);
    const disponivel = await this.provisioningService.isSlugAvailable(slug);
    
    return { 
      slug, 
      disponivel,
      sugestoes: disponivel ? [] : await this.provisioningService.suggestSlugs(slug),
    };
  }

  /**
   * Registra um novo pub na plataforma
   */
  @Post()
  @ApiOperation({ 
    summary: 'Registra um novo pub na plataforma',
    description: 'Cria tenant, empresa, ambientes padrão, mesas e usuário admin em uma única operação.',
  })
  @ApiResponse({ status: 201, description: 'Pub registrado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Slug ou email já existe' })
  async registrar(@Body() dto: PublicRegistrationDto) {
    this.logger.log(`📝 Nova solicitação de registro: ${dto.nomeEstabelecimento}`);

    // Gerar slug se não fornecido
    const slug = dto.slug || this.provisioningService.generateSlug(dto.nomeEstabelecimento);

    // Provisionar tenant completo
    const result = await this.provisioningService.provisionTenant({
      nome: dto.nomeEstabelecimento,
      slug,
      cnpj: dto.cnpj,
      nomeFantasia: dto.nomeEstabelecimento,
      telefone: dto.telefone,
      email: dto.emailAdmin,
      adminNome: dto.nomeAdmin,
      adminEmail: dto.emailAdmin,
      adminSenha: dto.senhaAdmin,
    });

    this.logger.log(`✅ Pub registrado com sucesso: ${slug}`);

    // Retornar dados relevantes (sem expor senha)
    return {
      success: true,
      message: 'Pub registrado com sucesso! Você já pode fazer login.',
      dados: {
        slug: result.tenant.slug,
        urlAcesso: `https://www.pubsystem.com.br/t/${result.tenant.slug}`,
        urlLogin: `https://www.pubsystem.com.br/t/${result.tenant.slug}`,
        email: result.credenciais.email,
        plano: result.tenant.plano,
        ambientesCriados: result.ambientes.map(a => a.nome),
        mesasCriadas: result.mesas.length,
      },
    };
  }

  /**
   * Busca informações públicas de um tenant pelo slug
   */
  @Get('tenant/:slug')
  @ApiOperation({ summary: 'Busca informações públicas de um tenant pelo slug' })
  @ApiParam({ name: 'slug', description: 'Slug do estabelecimento' })
  @ApiResponse({ status: 200, description: 'Tenant encontrado' })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
  async getTenantBySlug(@Param('slug') slug: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { slug },
      select: ['id', 'nome', 'slug', 'status', 'plano'],
    });

    if (!tenant) {
      throw new NotFoundException(`Estabelecimento "${slug}" não encontrado`);
    }

    return {
      id: tenant.id,
      nome: tenant.nome,
      slug: tenant.slug,
      status: tenant.status,
      plano: tenant.plano,
    };
  }
}
