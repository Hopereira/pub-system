import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { Produto } from './entities/produto.entity';
import { Ambiente } from '../ambiente/entities/ambiente.entity';

@Injectable()
export class ProdutoService {
  private readonly logger = new Logger(ProdutoService.name);

  constructor(
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(Ambiente)
    private readonly ambienteRepository: Repository<Ambiente>,
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
}