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

  // --- MÉTODO UPDATE CORRIGIDO ---
  async update(id: string, updateProdutoDto: UpdateProdutoDto): Promise<Produto> {
    // Se um novo ambienteId for fornecido, verifica se ele existe
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

    // O 'preload' carrega a entidade existente e mescla os novos dados do DTO.
    const produto = await this.produtoRepository.preload({
      id: id,
      ...updateProdutoDto,
      // Se um novo ambienteId foi passado, formatamos para o TypeORM entender a relação
      ambiente: updateProdutoDto.ambienteId
        ? { id: updateProdutoDto.ambienteId }
        : undefined,
    });

    // Se o produto com o ID fornecido não existir, o preload retorna undefined.
    if (!produto) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado.`);
    }

    // Salva a entidade atualizada no banco de dados.
    await this.produtoRepository.save(produto);

    // Usa o método findOne para buscar e retornar a entidade COMPLETA com a relação carregada.
    return this.findOne(id);
  }

  async remove(id: string) {
    const produto = await this.findOne(id);
    await this.produtoRepository.remove(produto);
    return { message: `Produto com ID ${id} removido com sucesso.` };
  }
}