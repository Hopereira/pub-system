import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { Produto } from './entities/produto.entity';
import { Ambiente } from '../ambiente/entities/ambiente.entity';
// --- 1. IMPORTAÇÕES ADICIONADAS ---
import { GcsStorageService } from 'src/shared/storage/gcs-storage.service';
import { Express } from 'express';

@Injectable()
export class ProdutoService {
  private readonly logger = new Logger(ProdutoService.name);

  constructor(
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(Ambiente)
    private readonly ambienteRepository: Repository<Ambiente>,
    // --- 2. INJEÇÃO DO SERVIÇO DE STORAGE ---
    private readonly storageService: GcsStorageService,
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

    return this.produtoRepository.save(produto);
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

    return this.produtoRepository.save(produto);
  }

  // Métodos findAll e findOne continuam iguais
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
}
