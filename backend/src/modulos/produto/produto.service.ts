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
    const userTenantId = this.request?.user?.tenantId || this.request?.user?.empresaId;
    if (userTenantId) return userTenantId;
    return this.request?.headers?.['x-tenant-id'] || null;
  }

  /**
   * Gera chave de cache com namespace do tenant
   * Para produtos, usa 'global' quando não há tenant (rotas públicas de cardápio)
   */
  private getCacheKey(params: string): string {
    const tenantId = this.getTenantId();
    return tenantId ? `produtos:${tenantId}:${params}` : `produtos:global:${params}`;
  }

  // --- 3. MÉTODO 'CREATE' ATUALIZADO ---
  async create(
    createProdutoDto: CreateProdutoDto,
    imagemFile?: Express.Multer.File,
  ): Promise<Produto> {
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
    await this.cacheInvalidationService.invalidateProdutos();
    
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
    await this.cacheInvalidationService.invalidateProdutos();
    
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
    await this.cacheInvalidationService.invalidateProdutos();
    
    return removedProduto;
  }

  // ✅ ATUALIZADO: findAll com paginação e cache (filtra por tenant quando disponível)
  async findAll(paginationDto?: PaginationDto): Promise<PaginatedResponse<Produto>> {
    const { page = 1, limit = 20, sortBy = 'nome', sortOrder = 'ASC' } = paginationDto || {};

    // Criar chave de cache única baseada nos parâmetros com namespace do tenant
    const cacheKey = this.getCacheKey(`page:${page}:limit:${limit}:sort:${sortBy}:${sortOrder}`);
    
    // Tentar buscar do cache
    const cached = await this.cacheManager.get<PaginatedResponse<Produto>>(cacheKey);
    if (cached) {
      this.logger.debug(`🎯 Cache HIT: ${cacheKey}`);
      return cached;
    }
    
    this.logger.debug(`❌ Cache MISS: ${cacheKey}`);

    // Obter tenantId do contexto
    const tenantId = this.getTenantId();
    
    // Construir where clause com filtro de tenant quando disponível
    const whereClause: any = { ativo: true };
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const [data, total] = await this.produtoRepository.findAndCountWithoutTenant({
      where: whereClause,
      relations: ['ambiente'],
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    this.logger.log(`📋 Listando produtos | Tenant: ${tenantId || 'global'} | Página: ${page}/${Math.ceil(total / limit)} | Total: ${total}`);

    const response = createPaginatedResponse(data, total, page, limit);
    
    // Armazenar no cache por 1 hora (3600000 ms)
    await this.cacheManager.set(cacheKey, response, 3600000);

    return response;
  }

  // Método para buscar todos sem paginação (uso interno) com cache
  async findAllNoPagination(): Promise<Produto[]> {
    const cacheKey = this.getCacheKey('all:ativos');
    
    // Tentar buscar do cache
    const cached = await this.cacheManager.get<Produto[]>(cacheKey);
    if (cached) {
      this.logger.debug('🎯 Cache HIT: produtos:all:ativos');
      return cached;
    }
    
    this.logger.debug('❌ Cache MISS: produtos:all:ativos');
    
    // Obter tenantId do contexto
    const tenantId = this.getTenantId();
    
    // Construir where clause com filtro de tenant quando disponível
    const whereClause: any = { ativo: true };
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }
    
    const produtos = await this.produtoRepository.findWithoutTenant({
      where: whereClause,
      relations: ['ambiente'],
      order: { nome: 'ASC' },
    });
    
    // Armazenar no cache por 1 hora (3600000 ms)
    await this.cacheManager.set(cacheKey, produtos, 3600000);
    
    return produtos;
  }

  // Método privado para invalidar cache de produtos
  private async invalidateProductCache(): Promise<void> {
    try {
      // Invalidar chaves específicas conhecidas
      await this.cacheManager.del('produtos:all:ativos');
      // Invalidar páginas mais comuns (1-10)
      for (let page = 1; page <= 10; page++) {
        await this.cacheManager.del(`produtos:page:${page}:limit:20:sort:nome:ASC`);
        await this.cacheManager.del(`produtos:page:${page}:limit:20:sort:nome:DESC`);
      }
      this.logger.log(`🗑️ Cache de produtos invalidado`);
    } catch (error) {
      this.logger.warn(`⚠️ Erro ao invalidar cache: ${error.message}`);
    }
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
