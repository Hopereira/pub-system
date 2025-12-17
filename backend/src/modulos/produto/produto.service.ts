import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// import { CACHE_MANAGER } from '@nestjs/cache-manager';
// import { Cache } from 'cache-manager';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { Produto } from './entities/produto.entity';
import { Ambiente } from '../ambiente/entities/ambiente.entity';
import { GcsStorageService } from 'src/shared/storage/gcs-storage.service';
import { Express } from 'express';
import { PaginationDto, PaginatedResponse, createPaginatedResponse } from 'src/common/dto/pagination.dto';

@Injectable()
export class ProdutoService {
  private readonly logger = new Logger(ProdutoService.name);

  constructor(
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(Ambiente)
    private readonly ambienteRepository: Repository<Ambiente>,
    private readonly storageService: GcsStorageService,
    // @Inject(CACHE_MANAGER)
    // private cacheManager: Cache,
  ) {}

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

    return this.produtoRepository.save(produto);
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
    
    // Invalidar cache ao atualizar produto
    // await this.invalidateProductCache();
    
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
    
    // Invalidar cache ao remover produto
    // await this.invalidateProductCache();
    
    return removedProduto;
  }

  // ✅ ATUALIZADO: findAll com paginação e cache
  async findAll(paginationDto?: PaginationDto): Promise<PaginatedResponse<Produto>> {
    const { page = 1, limit = 20, sortBy = 'nome', sortOrder = 'ASC' } = paginationDto || {};

    // Criar chave de cache única baseada nos parâmetros
    // const cacheKey = `produtos:page:${page}:limit:${limit}:sort:${sortBy}:${sortOrder}`;
    
    // Tentar buscar do cache
    // const cached = await this.cacheManager.get<PaginatedResponse<Produto>>(cacheKey);
    // if (cached) {
    //   this.logger.debug(`🎯 Cache HIT: ${cacheKey}`);
    //   return cached;
    // }
    
    // this.logger.debug(`❌ Cache MISS: ${cacheKey}`);

    const [data, total] = await this.produtoRepository.findAndCount({
      where: { ativo: true },
      relations: ['ambiente'],
      order: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    this.logger.log(`📋 Listando produtos | Página: ${page}/${Math.ceil(total / limit)} | Total: ${total}`);

    const response = createPaginatedResponse(data, total, page, limit);
    
    // Armazenar no cache por 1 hora
    // await this.cacheManager.set(cacheKey, response, 3600);

    return response;
  }

  // Método para buscar todos sem paginação (uso interno) com cache
  async findAllNoPagination(): Promise<Produto[]> {
    // const cacheKey = 'produtos:all:ativos';
    
    // Tentar buscar do cache
    // const cached = await this.cacheManager.get<Produto[]>(cacheKey);
    // if (cached) {
    //   this.logger.debug('🎯 Cache HIT: produtos:all:ativos');
    //   return cached;
    // }
    
    // this.logger.debug('❌ Cache MISS: produtos:all:ativos');
    
    const produtos = await this.produtoRepository.find({
      where: { ativo: true },
      relations: ['ambiente'],
      order: { nome: 'ASC' },
    });
    
    // Armazenar no cache por 1 hora
    // await this.cacheManager.set(cacheKey, produtos, 3600);
    
    return produtos;
  }

  // Método privado para invalidar cache de produtos
  // private async invalidateProductCache(): Promise<void> {
  //   const keys = await this.cacheManager.store.keys('produtos:*');
  //   if (keys && keys.length > 0) {
  //     await Promise.all(keys.map(key => this.cacheManager.del(key)));
  //     this.logger.log(`🗑️ Cache invalidado: ${keys.length} chaves de produtos`);
  //   }
  // }

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
