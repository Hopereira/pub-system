// Caminho: backend/src/modulos/produto/produto.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { Produto } from './entities/produto.entity';
import { Ambiente } from '../ambiente/entities/ambiente.entity';

import { promises as fs } from 'fs';
import { join } from 'path';

// --- ADIÇÃO ---
// Importamos o tipo do Multer para que o TypeScript entenda o que é 'file'
import { Express } from 'express';

@Injectable()
export class ProdutoService {
  constructor(
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,

    @InjectRepository(Ambiente)
    private readonly ambienteRepository: Repository<Ambiente>,
  ) {}

  // --- MÉTODO CREATE ATUALIZADO ---
  // Agora ele recebe o 'file' opcionalmente vindo do controller
  async create(
    createProdutoDto: CreateProdutoDto,
    file?: Express.Multer.File, // <-- MUDANÇA NA ASSINATURA
  ): Promise<Produto> {
    const ambiente = await this.ambienteRepository.findOne({
      where: { id: createProdutoDto.ambienteId },
    });

    if (!ambiente) {
      throw new NotFoundException(
        `Ambiente com ID ${createProdutoDto.ambienteId} não encontrado.`,
      );
    }

    // --- LÓGICA ADICIONADA ---
    // Se um arquivo foi enviado, associamos o nome dele ao DTO
    if (file) {
      // O nome do arquivo salvo pelo Multer é 'file.filename'
      createProdutoDto.urlImagem = file.filename;
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
    // Nota: A lógica de update de imagem pode ser adicionada aqui no futuro
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

  async remove(id: string) {
    const produto = await this.findOne(id);

    if (produto.urlImagem) {
      // Usamos process.cwd() para obter a raiz do projeto
      const imagePath = join(process.cwd(), 'public', produto.urlImagem);
      try {
        await fs.unlink(imagePath);
      } catch (error) {
        console.warn(
          `Não foi possível remover o arquivo de imagem: ${imagePath}. O arquivo pode já ter sido removido.`,
        );
      }
    }

    await this.produtoRepository.remove(produto);
    return { message: `Produto com ID ${id} removido com sucesso.` };
  }
}