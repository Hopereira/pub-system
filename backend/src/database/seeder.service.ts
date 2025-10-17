// Caminho: backend/src/database/seeder.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ambiente, TipoAmbiente } from '../modulos/ambiente/entities/ambiente.entity';
import { Mesa } from '../modulos/mesa/entities/mesa.entity';
import { Produto } from '../modulos/produto/entities/produto.entity';
import { Cliente } from '../modulos/cliente/entities/cliente.entity';
import { Comanda, ComandaStatus } from '../modulos/comanda/entities/comanda.entity';

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
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Comanda)
    private readonly comandaRepository: Repository<Comanda>,
  ) {}

  async seed() {
    // 1. Verifica se o banco já tem ambientes para evitar duplicatas
    const countAmbientes = await this.ambienteRepository.count();
    if (countAmbientes > 0) {
      this.logger.log('O banco de dados já contém dados. Seeding não será executado.');
      return;
    }

    this.logger.log('Iniciando o processo de seeding...');

    // 2. Criar Ambientes (diversos tipos para demonstrar o sistema dinâmico)
    const cozinhaQuente = await this.ambienteRepository.save({ 
      nome: 'Cozinha Quente',
      descricao: 'Preparo de pratos quentes, grelhados e frituras',
      tipo: TipoAmbiente.PREPARO
    });
    const cozinhaFria = await this.ambienteRepository.save({ 
      nome: 'Cozinha Fria',
      descricao: 'Preparo de saladas, frios e sobremesas',
      tipo: TipoAmbiente.PREPARO
    });
    const bar = await this.ambienteRepository.save({ 
      nome: 'Bar Principal',
      descricao: 'Preparo de bebidas e drinks',
      tipo: TipoAmbiente.PREPARO
    });
    const churrasqueira = await this.ambienteRepository.save({ 
      nome: 'Churrasqueira',
      descricao: 'Preparo de carnes na brasa',
      tipo: TipoAmbiente.PREPARO
    });
    const confeitaria = await this.ambienteRepository.save({ 
      nome: 'Confeitaria',
      descricao: 'Preparo de doces e bolos',
      tipo: TipoAmbiente.PREPARO
    });
    const salao = await this.ambienteRepository.save({ 
      nome: 'Salão Principal',
      descricao: 'Área de atendimento principal',
      tipo: TipoAmbiente.ATENDIMENTO
    });
    const varanda = await this.ambienteRepository.save({ 
      nome: 'Varanda',
      descricao: 'Área externa coberta',
      tipo: TipoAmbiente.ATENDIMENTO
    });
    const vip = await this.ambienteRepository.save({ 
      nome: 'Área VIP',
      descricao: 'Espaço reservado premium',
      tipo: TipoAmbiente.ATENDIMENTO
    });
    this.logger.log('✅ 8 Ambientes criados (5 de preparo + 3 de atendimento).');

    // 3. Criar Mesas (distribuídas pelos ambientes de atendimento)
    // Salão Principal: Mesas 1-10
    for (let i = 1; i <= 10; i++) {
      await this.mesaRepository.save({ numero: i, ambiente: salao });
    }
    // Varanda: Mesas 11-18
    for (let i = 11; i <= 18; i++) {
      await this.mesaRepository.save({ numero: i, ambiente: varanda });
    }
    // Área VIP: Mesas 19-22
    for (let i = 19; i <= 22; i++) {
      await this.mesaRepository.save({ numero: i, ambiente: vip });
    }
    this.logger.log('✅ 22 Mesas criadas (10 no salão + 8 na varanda + 4 VIP).');

    // 4. Criar Produtos (distribuídos pelos ambientes de preparo)
    const produtos = [
      // ===== BAR PRINCIPAL (Bebidas e Drinks) =====
      { nome: 'Chopp Pilsen 300ml', descricao: 'Chopp cremoso e refrescante', preco: 8.0, categoria: 'Bebidas', ambiente: bar },
      { nome: 'Chopp Pilsen 500ml', descricao: 'Chopp cremoso e refrescante', preco: 12.0, categoria: 'Bebidas', ambiente: bar },
      { nome: 'Caipirinha de Limão', descricao: 'Cachaça, limão, açúcar e gelo', preco: 15.0, categoria: 'Drinks', ambiente: bar },
      { nome: 'Caipirinha de Morango', descricao: 'Cachaça, morango, açúcar e gelo', preco: 16.0, categoria: 'Drinks', ambiente: bar },
      { nome: 'Mojito', descricao: 'Rum, hortelã, limão e água com gás', preco: 18.0, categoria: 'Drinks', ambiente: bar },
      { nome: 'Gin Tônica', descricao: 'Gin, tônica e limão siciliano', preco: 22.0, categoria: 'Drinks', ambiente: bar },
      { nome: 'Suco de Laranja 500ml', descricao: 'Suco natural feito na hora', preco: 10.0, categoria: 'Bebidas', ambiente: bar },
      { nome: 'Suco de Abacaxi 500ml', descricao: 'Suco natural feito na hora', preco: 10.0, categoria: 'Bebidas', ambiente: bar },
      { nome: 'Água com Gás 300ml', descricao: 'Garrafa', preco: 5.0, categoria: 'Bebidas', ambiente: bar },
      { nome: 'Água sem Gás 300ml', descricao: 'Garrafa', preco: 5.0, categoria: 'Bebidas', ambiente: bar },
      { nome: 'Coca-Cola Lata 350ml', descricao: 'Gelada', preco: 6.0, categoria: 'Bebidas', ambiente: bar },
      { nome: 'Guaraná Lata 350ml', descricao: 'Gelado', preco: 6.0, categoria: 'Bebidas', ambiente: bar },
      
      // ===== COZINHA QUENTE (Porções quentes, frituras, grelhados) =====
      { nome: 'Batata Frita com Cheddar e Bacon', descricao: 'Porção generosa para 2 pessoas', preco: 35.0, categoria: 'Porções', ambiente: cozinhaQuente },
      { nome: 'Frango a Passarinho', descricao: 'Pedaços de frango fritos com alho e salsinha', preco: 40.0, categoria: 'Porções', ambiente: cozinhaQuente },
      { nome: 'Mandioca Frita', descricao: 'Acompanha maionese da casa', preco: 25.0, categoria: 'Porções', ambiente: cozinhaQuente },
      { nome: 'Anéis de Cebola', descricao: 'Anéis de cebola empanados e fritos', preco: 28.0, categoria: 'Porções', ambiente: cozinhaQuente },
      { nome: 'Hambúrguer da Casa', descricao: 'Pão brioche, blend de 180g, queijo, bacon e salada', preco: 42.0, categoria: 'Lanches', ambiente: cozinhaQuente },
      { nome: 'Picanha na Chapa', descricao: 'Acompanha arroz, farofa e vinagrete', preco: 95.0, categoria: 'Pratos Principais', ambiente: cozinhaQuente },
      { nome: 'File de Frango Grelhado', descricao: 'Com legumes e arroz integral', preco: 48.0, categoria: 'Pratos Principais', ambiente: cozinhaQuente },
      { nome: 'Batata Rústica', descricao: 'Batata em gomos assada', preco: 22.0, categoria: 'Porções', ambiente: cozinhaQuente },
      
      // ===== COZINHA FRIA (Saladas, frios, sobremesas geladas) =====
      { nome: 'Tábua de Frios', descricao: 'Seleção de queijos e embutidos', preco: 55.0, categoria: 'Porções', ambiente: cozinhaFria },
      { nome: 'Salada Caesar', descricao: 'Alface romana, croutons, parmesão e molho caesar', preco: 32.0, categoria: 'Saladas', ambiente: cozinhaFria },
      { nome: 'Salada Caprese', descricao: 'Tomate, mussarela de búfala, manjericão e azeite', preco: 35.0, categoria: 'Saladas', ambiente: cozinhaFria },
      { nome: 'Carpaccio de Salmão', descricao: 'Lâminas de salmão com alcaparras e molho especial', preco: 65.0, categoria: 'Entradas', ambiente: cozinhaFria },
      { nome: 'Sorvete de Creme 3 Bolas', descricao: 'Escolha os sabores', preco: 15.0, categoria: 'Sobremesas', ambiente: cozinhaFria },
      
      // ===== CHURRASQUEIRA (Carnes na brasa) =====
      { nome: 'Picanha na Brasa 400g', descricao: 'Picanha mal passada com alho e sal grosso', preco: 110.0, categoria: 'Carnes', ambiente: churrasqueira },
      { nome: 'Costela BBQ', descricao: 'Costela suína glaceada com molho barbecue', preco: 85.0, categoria: 'Carnes', ambiente: churrasqueira },
      { nome: 'Linguiça Artesanal', descricao: 'Linguiça toscana defumada', preco: 38.0, categoria: 'Carnes', ambiente: churrasqueira },
      { nome: 'Espetinho Misto', descricao: '3 espetos de carne, frango e linguiça', preco: 45.0, categoria: 'Carnes', ambiente: churrasqueira },
      { nome: 'Fraldinha na Brasa', descricao: 'Acompanha farofa e vinagrete', preco: 95.0, categoria: 'Carnes', ambiente: churrasqueira },
      
      // ===== CONFEITARIA (Doces e bolos) =====
      { nome: 'Pudim de Leite', descricao: 'Pudim de leite condensado cremoso', preco: 12.0, categoria: 'Sobremesas', ambiente: confeitaria },
      { nome: 'Petit Gâteau', descricao: 'Bolo de chocolate com recheio cremoso e sorvete', preco: 22.0, categoria: 'Sobremesas', ambiente: confeitaria },
      { nome: 'Torta Holandesa', descricao: 'Fatia generosa de torta holandesa', preco: 18.0, categoria: 'Sobremesas', ambiente: confeitaria },
      { nome: 'Brownie com Sorvete', descricao: 'Brownie quente com sorvete de creme', preco: 20.0, categoria: 'Sobremesas', ambiente: confeitaria },
      { nome: 'Cheesecake de Frutas Vermelhas', descricao: 'Fatia cremosa com calda', preco: 24.0, categoria: 'Sobremesas', ambiente: confeitaria },
      { nome: 'Bolo de Cenoura com Chocolate', descricao: 'Fatia do bolo tradicional', preco: 15.0, categoria: 'Sobremesas', ambiente: confeitaria },
      { nome: 'Tiramisu', descricao: 'Sobremesa italiana clássica', preco: 26.0, categoria: 'Sobremesas', ambiente: confeitaria },
    ];
    
    await this.produtoRepository.save(produtos);
    this.logger.log('✅ 42 Produtos criados (distribuídos por 5 ambientes de preparo).');

    // 5. Criar Clientes de teste
    const cliente1 = await this.clienteRepository.save({
      cpf: '12345678900',
      nome: 'João Silva',
      email: 'joao.silva@email.com',
      celular: '11987654321'
    });

    const cliente2 = await this.clienteRepository.save({
      cpf: '98765432100',
      nome: 'Maria Santos',
      email: 'maria.santos@email.com',
      celular: '11976543210'
    });

    const cliente3 = await this.clienteRepository.save({
      cpf: '11122233344',
      nome: 'Pedro Oliveira',
      email: 'pedro.oliveira@email.com',
      celular: '11965432109'
    });

    const cliente4 = await this.clienteRepository.save({
      cpf: '55566677788',
      nome: 'Ana Costa',
      email: 'ana.costa@email.com',
      celular: '11954321098'
    });

    const cliente5 = await this.clienteRepository.save({
      cpf: '99988877766',
      nome: 'Carlos Pereira',
      email: 'carlos.pereira@email.com',
      celular: '11943210987'
    });

    this.logger.log('✅ 5 Clientes criados.');

    // 6. Criar Comandas abertas de teste
    // Buscar algumas mesas para associar
    const mesasDisponiveis = await this.mesaRepository.find({ take: 5 });

    // Comanda 1: João Silva na Mesa 1
    await this.comandaRepository.save({
      status: ComandaStatus.ABERTA,
      cliente: cliente1,
      mesa: mesasDisponiveis[0],
    });

    // Comanda 2: Maria Santos na Mesa 5
    await this.comandaRepository.save({
      status: ComandaStatus.ABERTA,
      cliente: cliente2,
      mesa: mesasDisponiveis[1],
    });

    // Comanda 3: Pedro Oliveira na Mesa 10 (Mesa do Salão)
    await this.comandaRepository.save({
      status: ComandaStatus.ABERTA,
      cliente: cliente3,
      mesa: mesasDisponiveis[2],
    });

    // Comanda 4: Ana Costa sem mesa (Balcão)
    await this.comandaRepository.save({
      status: ComandaStatus.ABERTA,
      cliente: cliente4,
      mesa: null, // Comanda sem mesa (balcão/delivery)
    });

    // Comanda 5: Carlos Pereira na Mesa 15 (Varanda)
    await this.comandaRepository.save({
      status: ComandaStatus.ABERTA,
      cliente: cliente5,
      mesa: mesasDisponiveis[3],
    });

    this.logger.log('✅ 5 Comandas ABERTAS criadas (4 com mesa + 1 no balcão).');

    this.logger.log('🎉 Seeding concluído com sucesso!');
    this.logger.log('📊 Resumo: 8 ambientes | 22 mesas | 42 produtos | 5 clientes | 5 comandas');
  }
}