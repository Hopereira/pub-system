// Caminho: backend/src/modulos/produto/produto.service.ts

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { Produto } from './entities/produto.entity';
import { Ambiente } from '../ambiente/entities/ambiente.entity';
// ALTERAÇÃO: Corrigido o caminho para remover a pasta "providers" que não existe.
import { GcsStorageService } from '../../shared/storage/gcs-storage.service';

@Injectable()
export class ProdutoService {
  private readonly logger = new Logger(ProdutoService.name);

  constructor(
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(Ambiente)
    private readonly ambienteRepository: Repository<Ambiente>,
    private readonly gcsStorage: GcsStorageService,
  ) {}

  async create(createProdutoDto: CreateProdutoDto): Promise<Produto> {
    const { ambienteId, ...restoDoDto } = createProdutoDto;
    const ambiente = await this.ambienteRepository.findOne({ where: { id: ambienteId } });
    
    if (!ambiente) {
      throw new NotFoundException(`Ambiente com ID ${ambienteId} não encontrado.`);
    }

    const produto = this.produtoRepository.create({
      ...restoDoDto,
      ambiente,
    });

    return this.produtoRepository.save(produto);
  }

  async findAll(): Promise<Produto[]> {
    return this.produtoRepository.find({
      where: { ativo: true },
      relations: ['ambiente'],
      order: { nome: 'ASC' },
    });
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

  async update(id: string, updateProdutoDto: UpdateProdutoDto): Promise<Produto> {
    const produto = await this.produtoRepository.preload({
      id: id,
      ...updateProdutoDto,
    });

    if (!produto) {
      throw new NotFoundException(`Produto com ID "${id}" não encontrado.`);
    }
    
    if (updateProdutoDto.ambienteId) {
      const ambiente = await this.ambienteRepository.findOne({ where: { id: updateProdutoDto.ambienteId } });
      if (!ambiente) {
        throw new NotFoundException(`Ambiente com ID "${updateProdutoDto.ambienteId}" não encontrado.`);
      }
      produto.ambiente = ambiente;
    }

    return this.produtoRepository.save(produto);
  }

  async remove(id: string): Promise<Produto> {
    const produto = await this.findOne(id);
    
    produto.ativo = false;
    this.logger.log(`Inativando produto: ${produto.nome}`);

    return this.produtoRepository.save(produto);
  }

  async updateUrlImagem(id: string, file: Express.Multer.File): Promise<Produto> {
    const produto = await this.findOne(id);

    if (produto.urlImagem) {
      try {
        await this.gcsStorage.deleteFile(produto.urlImagem);
        this.logger.log(`Imagem antiga do produto ${id} deletada: ${produto.urlImagem}`);
      } catch (error) {
        this.logger.error(`Falha ao deletar imagem antiga do produto ${id}. Continuando...`, error);
      }
    }

    const novaUrl = await this.gcsStorage.uploadFile(file, 'produtos');
    this.logger.log(`Nova imagem do produto ${id} carregada: ${novaUrl}`);

    produto.urlImagem = novaUrl;
    return this.produtoRepository.save(produto);
  }
}