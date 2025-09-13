// Caminho: backend/src/modulos/produto/produto.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { Produto } from './entities/produto.entity';
import { Ambiente } from '../ambiente/entities/ambiente.entity';

// --- ADIÇÃO: Módulos nativos do Node.js para manipular arquivos ---
import { promises as fs } from 'fs';
import { join } from 'path';
// --- FIM DA ADIÇÃO ---

@Injectable()
export class ProdutoService {
  constructor(
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,

    @InjectRepository(Ambiente)
    private readonly ambienteRepository: Repository<Ambiente>,
  ) {}

  async create(createProdutoDto: CreateProdutoDto): Promise<Produto> {
    const ambiente = await this.ambienteRepository.findOne({
      where: { id: createProdutoDto.ambienteId },
    });

    if (!ambiente) {
      throw new NotFoundException(
        `Ambiente com ID ${createProdutoDto.ambienteId} não encontrado.`,
      );
    }

    const produto = this.produtoRepository.create({
      ...createProdutoDto,
      ambiente: ambiente,
    });

    return this.produtoRepository.save(produto);
  }

  findAll() {
    return this.produtoRepository.find({ relations: ['ambiente'] });
  }

  async findOne(id: string) {
    const produto = await this.produtoRepository.findOne({
      where: { id },
      relations: ['ambiente'],
    });
    if (!produto) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado.`);
    }
    return produto;
  }

  async update(
    id: string,
    updateProdutoDto: UpdateProdutoDto,
  ): Promise<Produto> {
    if (updateProdutoDto.ambienteId) {
      const ambiente = await this.ambienteRepository.findOne({
        where: { id: updateProdutoDto.ambienteId },
      });
      if (!ambiente) {
        throw new NotFoundException(
          `Ambiente com ID ${updateProdutoDto.ambienteId} não encontrado.`,
        );
      }
    }

    const produto = await this.produtoRepository.preload({
      id: id,
      ...updateProdutoDto,
      ambiente: updateProdutoDto.ambienteId
        ? { id: updateProdutoDto.ambienteId }
        : undefined,
    });

    if (!produto) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado.`);
    }

    await this.produtoRepository.save(produto);
    return this.findOne(id);
  }

  // --- MÉTODO REMOVE ATUALIZADO ---
  async remove(id: string) {
    const produto = await this.findOne(id);

    // --- ADIÇÃO: Lógica para deletar o arquivo de imagem ---
    if (produto.urlImagem) {
      const imagePath = join(process.cwd(), 'public', produto.urlImagem);
      try {
        await fs.unlink(imagePath);
      } catch (error) {
        // Se o arquivo não existir, apenas loga um aviso mas não impede a remoção do DB
        console.warn(
          `Não foi possível remover o arquivo de imagem: ${imagePath}. O arquivo pode já ter sido removido.`,
        );
      }
    }
    // --- FIM DA ADIÇÃO ---

    await this.produtoRepository.remove(produto);
    return { message: `Produto com ID ${id} removido com sucesso.` };
  }
}