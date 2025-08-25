// backend/src/modulos/produto/produto.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { Produto } from './entities/produto.entity';
import { Ambiente } from '../ambiente/entities/ambiente.entity';

@Injectable()
export class ProdutoService {
  constructor(
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,

    @InjectRepository(Ambiente)
    private readonly ambienteRepository: Repository<Ambiente>,
  ) {}

  async create(createProdutoDto: CreateProdutoDto): Promise<Produto> {
    // Passo 1: Verificar se o ambienteId fornecido existe
    const ambiente = await this.ambienteRepository.findOne({
      where: { id: createProdutoDto.ambienteId },
    });

    if (!ambiente) {
      throw new NotFoundException(
        `Ambiente com ID ${createProdutoDto.ambienteId} não encontrado.`,
      );
    }

    // Passo 2: Criar a nova instância do produto
    const produto = this.produtoRepository.create({
      ...createProdutoDto,
      ambiente: ambiente, // Associa a entidade ambiente encontrada
    });

    // Passo 3: Salvar o produto no banco de dados
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

  async update(id: string, updateProdutoDto: UpdateProdutoDto) {
    // Lógica de atualização (pode ser implementada depois)
    return `This action updates a #${id} produto`;
  }

  async remove(id: string) {
    const produto = await this.findOne(id);
    await this.produtoRepository.remove(produto);
    return { message: `Produto com ID ${id} removido com sucesso.` };
  }
}