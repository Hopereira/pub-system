// Caminho: backend/src/database/seeder.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ambiente } from '../modulos/ambiente/entities/ambiente.entity';
import { Mesa } from '../modulos/mesa/entities/mesa.entity';
import { Produto } from '../modulos/produto/entities/produto.entity';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(Ambiente)
    private readonly ambienteRepository: Repository<Ambiente>,
    @InjectRepository(Mesa)
    private readonly mesaRepository: Repository<Mesa>,
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
  ) {}

  async seed() {
    // 1. Verifica se o banco já tem ambientes para evitar duplicatas
    const countAmbientes = await this.ambienteRepository.count();
    if (countAmbientes > 0) {
      this.logger.log('O banco de dados já contém dados. Seeding não será executado.');
      return;
    }

    this.logger.log('Iniciando o processo de seeding...');

    // 2. Criar Ambientes
    const cozinha = await this.ambienteRepository.save({ nome: 'Cozinha' });
    const bar = await this.ambienteRepository.save({ nome: 'Bar' });
    const salao = await this.ambienteRepository.save({ nome: 'Salão Principal' });
    const varanda = await this.ambienteRepository.save({ nome: 'Varanda' });
    this.logger.log('Ambientes criados com sucesso.');

    // 3. Criar Mesas (12 no total)
    for (let i = 1; i <= 6; i++) {
      await this.mesaRepository.save({ numero: i, ambiente: salao });
    }
    for (let i = 7; i <= 12; i++) {
      await this.mesaRepository.save({ numero: i, ambiente: varanda });
    }
    this.logger.log('Mesas criadas com sucesso.');

    // 4. Criar Produtos (15 no total)
    const produtos = [
      // Bebidas (Bar)
      { nome: 'Chopp Pilsen 300ml', descricao: 'Chopp cremoso e refrescante', preco: 8.0, categoria: 'Bebidas', ambiente: bar },
      { nome: 'Caipirinha de Limão', descricao: 'Cachaça, limão, açúcar e gelo', preco: 15.0, categoria: 'Drinks', ambiente: bar },
      { nome: 'Suco de Laranja 500ml', descricao: 'Suco natural feito na hora', preco: 10.0, categoria: 'Bebidas', ambiente: bar },
      { nome: 'Água com Gás', descricao: 'Garrafa 300ml', preco: 5.0, categoria: 'Bebidas', ambiente: bar },
      { nome: 'Coca-Cola Lata', descricao: 'Lata 350ml', preco: 6.0, categoria: 'Bebidas', ambiente: bar },
      // Porções (Cozinha)
      { nome: 'Batata Frita com Cheddar e Bacon', descricao: 'Porção generosa para 2 pessoas', preco: 35.0, categoria: 'Porções', ambiente: cozinha },
      { nome: 'Frango a Passarinho', descricao: 'Pedaços de frango fritos com alho e salsinha', preco: 40.0, categoria: 'Porções', ambiente: cozinha },
      { nome: 'Mandioca Frita', descricao: 'Acompanha maionese da casa', preco: 25.0, categoria: 'Porções', ambiente: cozinha },
      { nome: 'Anéis de Cebola', descricao: 'Anéis de cebola empanados e fritos', preco: 28.0, categoria: 'Porções', ambiente: cozinha },
      { nome: 'Tábua de Frios', descricao: 'Seleção de queijos e embutidos', preco: 55.0, categoria: 'Porções', ambiente: cozinha },
      // Pratos (Cozinha)
      { nome: 'Picanha na Chapa', descricao: 'Acompanha arroz, farofa e vinagrete', preco: 95.0, categoria: 'Pratos Principais', ambiente: cozinha },
      { nome: 'Hambúrguer da Casa', descricao: 'Pão brioche, blend de 180g, queijo, bacon e salada', preco: 42.0, categoria: 'Lanches', ambiente: cozinha },
      // Sobremesas (Cozinha)
      { nome: 'Pudim de Leite', descricao: 'Pudim de leite condensado cremoso', preco: 12.0, categoria: 'Sobremesas', ambiente: cozinha },
      { nome: 'Petit Gâteau', descricao: 'Bolo de chocolate com recheio cremoso e sorvete', preco: 22.0, categoria: 'Sobremesas', ambiente: cozinha },
      { nome: 'Torta Holandesa', descricao: 'Fatia generosa de torta holandesa', preco: 18.0, categoria: 'Sobremesas', ambiente: cozinha },
    ];
    await this.produtoRepository.save(produtos);
    this.logger.log('Produtos criados com sucesso.');

    this.logger.log('Seeding concluído com sucesso!');
  }
}