import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { Produto } from './entities/produto.entity';
import { Ambiente } from '../ambiente/entities/ambiente.entity';
// ALTERAÇÃO: Importar o nosso serviço de GCS que já existe e funciona
import { GcsStorageService } from 'src/shared/providers/storage/gcs-storage.service';

@Injectable()
export class ProdutoService {
  private readonly logger = new Logger(ProdutoService.name);

  constructor(
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(Ambiente)
    private readonly ambienteRepository: Repository<Ambiente>,
    // ALTERAÇÃO: Injetar o GcsStorageService no construtor
    private readonly gcsStorage: GcsStorageService,
  ) {}

  // O método create() continua exatamente igual
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

  // O método findAll() continua exatamente igual
  async findAll(): Promise<Produto[]> {
    return this.produtoRepository.find({
      where: { ativo: true },
      relations: ['ambiente'],
      order: { nome: 'ASC' },
    });
  }

  // O método findOne() continua exatamente igual
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
  
  // O método update() continua exatamente igual
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

  // O método remove() continua exatamente igual
  async remove(id: string): Promise<Produto> {
    const produto = await this.findOne(id);
    
    produto.ativo = false;
    this.logger.log(`Inativando produto: ${produto.nome}`);

    return this.produtoRepository.save(produto);
  }

  // ALTERAÇÃO: Adicionar o novo método para o upload da imagem
  async updateUrlImagem(id: string, file: Express.Multer.File): Promise<Produto> {
    const produto = await this.findOne(id);

    // Se já existe uma imagem, apaga a antiga do GCS para não acumular lixo
    if (produto.urlImagem) {
      try {
        await this.gcsStorage.deleteFile(produto.urlImagem);
        this.logger.log(`Imagem antiga do produto ${id} deletada: ${produto.urlImagem}`);
      } catch (error) {
        this.logger.error(`Falha ao deletar imagem antiga do produto ${id}. Continuando...`, error);
      }
    }

    // Faz o upload da nova imagem para a pasta 'produtos' no bucket
    const novaUrl = await this.gcsStorage.uploadFile(file, 'produtos');
    this.logger.log(`Nova imagem do produto ${id} carregada: ${novaUrl}`);

    // Salva a nova URL no banco de dados
    produto.urlImagem = novaUrl;
    return this.produtoRepository.save(produto);
  }
}