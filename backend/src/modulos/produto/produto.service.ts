import { Injectable, Logger, NotFoundException, Inject, Optional, Scope } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { REQUEST } from '@nestjs/core';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { Produto } from './entities/produto.entity';
import { GcsStorageService } from 'src/shared/storage/gcs-storage.service';
import { CacheInvalidationService } from '../../cache/cache-invalidation.service';
import { Express } from 'express';
import { PaginationDto, PaginatedResponse, createPaginatedResponse } from 'src/common/dto/pagination.dto';
import { ProdutoRepository } from './produto.repository';
import { AmbienteRepository } from '../ambiente/ambiente.repository';
import { PlanFeaturesService } from '../../common/tenant/services/plan-features.service';

@Injectable({ scope: Scope.REQUEST })
export class ProdutoService {
  private readonly logger = new Logger(ProdutoService.name);

  constructor(
    private readonly produtoRepository: ProdutoRepository,
    private readonly ambienteRepository: AmbienteRepository,
    private readonly storageService: GcsStorageService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private readonly cacheInvalidationService: CacheInvalidationService,
    @Optional() private readonly tenantContext?: TenantContextService,
    @Optional() @Inject(REQUEST) private readonly request?: any,
    @Optional() private readonly planFeaturesService?: PlanFeaturesService,
  ) {}

  /**
   * Obtém o tenantId do contexto atual para namespace de cache
   */
  private getTenantId(): string | null {
    try {
      if (this.tenantContext?.hasTenant?.()) {
        return this.tenantContext.getTenantId();
      }
    } catch {
      // Ignorar
    }
    const userTenantId = this.request?.user?.tenantId;
    if (userTenantId) return userTenantId;
    return this.request?.headers?.['x-tenant-id'] || null;
  }

  /**
   * Gera chave de cache com namespace do tenant
   */
  private getCacheKey(params: string): string | null {
    const tenantId = this.getTenantId();
    if (!tenantId) return null;
    return `produtos:${tenantId}:${params}`;
  }

  // --- 3. MÉTODO 'CREATE' ATUALIZADO ---
  async create(
    createProdutoDto: CreateProdutoDto,
    imagemFile?: Express.Multer.File,
  ): Promise<Produto> {
    // Verificar limite do plano
    const tenantId = this.getTenantId();
    if (tenantId && this.planFeaturesService) {
      const currentCount = await this.produtoRepository.count();
      await this.planFeaturesService.requireLimitForTenant(tenantId, 'maxProdutos', currentCount);
    }

    const { ambienteId, ...restoDoDto } = createProdutoDto;
    const ambiente = await this.ambienteRepository.findOne({
      where: { id: ambienteId },
    });

    if (!ambiente) {
      throw new NotFoundException(
        `Ambiente com ID ${ambienteId} não encontrado.`,
      );
    }

    const produto = this.produtoRepository.create({
      ...restoDoDto,
      ambiente,
    });

    // Se uma imagem foi enviada, faz o upload para o GCS e salva a URL
    if (imagemFile) {
      produto.urlImagem = await this.storageService.uploadFile(imagemFile);
      this.logger.log(`Upload para GCS concluído. URL: ${produto.urlImagem}`);
    }

    const savedProduto = await this.produtoRepository.save(produto);
    
    // Invalidar cache após criar produto
    await this.invalidateProductCache();
    
    return savedProduto;
  }

  // --- 4. MÉTODO 'UPDATE' ATUALIZADO ---
  async update(
    id: string,
    updateProdutoDto: UpdateProdutoDto,
    imagemFile?: Express.Multer.File,
  ): Promise<Produto> {
    const produto = await this.produtoRepository.preload({
      id: id,
      ...updateProdutoDto,
    });

    if (!produto) {
      throw new NotFoundException(`Produto com ID "${id}" não encontrado.`);
    }

    // Se uma NOVA imagem foi enviada no update
    if (imagemFile) {
      // Deleta a imagem antiga do GCS, se ela existir
      if (produto.urlImagem) {
        try {
          await this.storageService.deleteFile(produto.urlImagem);
          this.logger.log(
            `Imagem antiga deletada do GCS: ${produto.urlImagem}`,
          );
        } catch (error) {
          this.logger.error(
            `Falha ao deletar imagem antiga do GCS: ${produto.urlImagem}`,
            error,
          );
        }
      }
      // Faz o upload da nova imagem e atualiza a URL
      produto.urlImagem = await this.storageService.uploadFile(imagemFile);
      this.logger.log(`Nova URL de imagem do GCS: ${produto.urlImagem}`);
    }

    if (updateProdutoDto.ambienteId) {
      const ambiente = await this.ambienteRepository.findOne({
        where: { id: updateProdutoDto.ambienteId },
      });
      if (!ambiente) {
        throw new NotFoundException(
          `Ambiente com ID "${updateProdutoDto.ambienteId}" não encontrado.`,
        );
      }
      produto.ambiente = ambiente;
    }

    const updatedProduto = await this.produtoRepository.save(produto);
    
    // Invalidar cache após atualizar produto
    await this.invalidateProductCache();
    
    return updatedProduto;
  }

  // --- 5. MÉTODO 'REMOVE' ATUALIZADO ---
  async remove(id: string): Promise<Produto> {
    const produto = await this.findOne(id);

    // Se o produto que está a ser inativado tem uma imagem, deleta-a do GCS
    if (produto.urlImagem) {
      try {
        await this.storageService.deleteFile(produto.urlImagem);
        this.logger.log(
          `Imagem do produto inativado deletada do GCS: ${produto.urlImagem}`,
        );
      } catch (error) {
        this.logger.error(
          `Falha ao deletar imagem do GCS: ${produto.urlImagem}`,
          error,
        );
      }
    }

    produto.ativo = false; // Soft delete
    this.logger.log(`Inativando produto: ${produto.nome}`);

    const removedProduto = await this.produtoRepository.save(produto);
    
    // Invalidar cache após remover produto
    await this.invalidateProductCache();
    
    return removedProduto;
  }

  // ✅ Rota pública: sem filtro de tenant, usa rawRepository
  async findAllPublic(paginationDto?: PaginationDto): Promise<PaginatedResponse<Produto>> {
    const { page = 1, limit = 20, sortBy = 'nome', sortOrder = 'ASC' } = paginationDto || {};

    const [data, total] = await this.produtoRepository.rawRepository.findAndCount({
      where: { ativo: true },
      relations: ['ambiente'],
      order: { [sortBy]: sortOrder } as any,
      skip: (page - 1) * limit,
      take: limit,
    });

    this.logger.log(`📋 [PUBLIC] Listando produtos | Página: ${page}/${Math.ceil(total / limit)} | Total: ${total}`);
    return createPaginatedResponse(data, total, page, limit);
  }

  // ✅ ATUALIZADO: findAll com paginação e cache (rota pública - sem filtro de tenant)
  async findAll(paginationDto?: PaginationDto): Promise<PaginatedResponse<Produto>> {
    const { page = 1, limit = 20, sortBy = 'nome', sortOrder = 'ASC' } = paginationDto || {};

    // Criar chave de cache única baseada nos parâmetros com namespace do tenant
    const cacheKey = this.getCacheKey(`page:${page}:limit:${limit}:sort:${sortBy}:${sortOrder}`);
    
    // Tentar buscar do cache (apenas se tenant disponível)
    if (cacheKey) {
      const cached = await this.cacheManager.get<PaginatedResponse<Produto>>(cacheKey);
      if (cached) {
        this.logger.debug(`🎯 Cache HIT: ${cacheKey}`);
        return cached;
      }
      this.logger.debug(`❌ Cache MISS: ${cacheKey}`);
    }

    const [data, total] = await this.produtoRepository.findAndCount({
      where: { ativo: true } as any,
      relations: ['ambiente'],
      order: { [sortBy]: sortOrder } as any,
      skip: (page - 1) * limit,
      take: limit,
    });

    this.logger.log(`📋 Listando produtos | Página: ${page}/${Math.ceil(total / limit)} | Total: ${total}`);

    const response = createPaginatedResponse(data, total, page, limit);
    
    // Armazenar no cache (apenas se tenant disponível)
    if (cacheKey) {
      await this.cacheManager.set(cacheKey, response, 3600000);
      CacheInvalidationService.trackKey(cacheKey);
    }

    return response;
  }

  // Método para buscar todos sem paginação (uso interno) com cache
  async findAllNoPagination(): Promise<Produto[]> {
    const cacheKey = this.getCacheKey('all:ativos');
    
    // Tentar buscar do cache (apenas se tenant disponível)
    if (cacheKey) {
      const cached = await this.cacheManager.get<Produto[]>(cacheKey);
      if (cached) {
        this.logger.debug(`🎯 Cache HIT: ${cacheKey}`);
        return cached;
      }
      this.logger.debug(`❌ Cache MISS: ${cacheKey}`);
    }
    
    const produtos = await this.produtoRepository.find({
      where: { ativo: true } as any,
      relations: ['ambiente'],
      order: { nome: 'ASC' } as any,
    });
    
    // Armazenar no cache (apenas se tenant disponível)
    if (cacheKey) {
      await this.cacheManager.set(cacheKey, produtos, 3600000);
      CacheInvalidationService.trackKey(cacheKey);
    }
    
    return produtos;
  }

  // Método privado para invalidar cache de produtos
  // cache-manager v7 (keyv) não suporta keys() — deleta chaves exatas conhecidas
  private async invalidateProductCache(): Promise<void> {
    const tenantId = this.getTenantId();
    if (!tenantId) {
      this.logger.warn('⚠️ Sem tenantId — cache de produtos não invalidado');
      return;
    }
    // Chaves usadas pelo frontend (limit=100 é o padrão do produtoService.ts)
    const keysToDelete = [
      `produtos:${tenantId}:page:1:limit:100:sort:nome:ASC`,
      `produtos:${tenantId}:page:1:limit:20:sort:nome:ASC`,
      `produtos:${tenantId}:page:1:limit:50:sort:nome:ASC`,
      `produtos:${tenantId}:all:ativos`,
    ];
    let deleted = 0;
    for (const key of keysToDelete) {
      await this.cacheManager.del(key);
      deleted++;
    }
    this.logger.log(`🗑️ Cache de produtos invalidado: ${deleted} chaves removidas (tenant: ${tenantId})`);
  }

  async findOne(id: string): Promise<Produto> {
    const produto = await this.produtoRepository.findOne({
      where: { id },
      relations: ['ambiente'],
    });
    if (!produto) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado.`);
    }
    return produto;
  }
}
