import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ambiente } from '../ambiente/entities/ambiente.entity';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { Produto } from './entities/produto.entity';

@Injectable()
export class ProdutoService {
  constructor(
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,

    @InjectRepository(Ambiente)
    private readonly ambienteRepository: Repository<Ambiente>,
  ) {}

  async create(createProdutoDto: CreateProdutoDto): Promise<Produto> {
    const { ambienteId, ...dadosProduto } = createProdutoDto;

    const ambiente = await this.ambienteRepository.findOne({
      where: { id: ambienteId },
    });

    if (!ambiente) {
      throw new NotFoundException(
        `Ambiente com ID "${ambienteId}" não encontrado.`,
      );
    }

    const produto = this.produtoRepository.create({
      ...dadosProduto,
      ambiente,
    });

    return this.produtoRepository.save(produto);
  }

  findAll(): Promise<Produto[]> {
    // A opção "relations" garante que os dados do ambiente venham junto
    return this.produtoRepository.find({ relations: ['ambiente'] });
  }

  async findOne(id: string): Promise<Produto> {
    const produto = await this.produtoRepository.findOne({
      where: { id },
      relations: ['ambiente'],
    });
    if (!produto) {
      throw new NotFoundException(`Produto com ID "${id}" não encontrado.`);
    }
    return produto;
  }

  async update(
    id: string,
    updateProdutoDto: UpdateProdutoDto,
  ): Promise<Produto> {
    const produto = await this.produtoRepository.preload({
      id,
      ...updateProdutoDto,
    });

    if (!produto) {
      throw new NotFoundException(`Produto com ID "${id}" não encontrado.`);
    }
    return this.produtoRepository.save(produto);
  }

  async remove(id: string): Promise<void> {
    const produto = await this.findOne(id);
    await this.produtoRepository.remove(produto);
  }
}