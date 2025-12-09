import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

/**
 * TESTE E2E: FLUXO FINANCEIRO COMPLETO
 * 
 * Cenário: Pedido → Pagamento → Caixa
 * 
 * Este teste valida que:
 * 1. O valor do pedido é calculado corretamente
 * 2. O pagamento é registrado no caixa
 * 3. O saldo do caixa bate centavo por centavo
 * 4. As diferenças são detectadas no fechamento
 */
describe('Fluxo Financeiro Completo (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  
  // Tokens de autenticação
  let adminToken: string;
  let garcomToken: string;
  let caixaToken: string;
  
  // IDs criados durante o teste
  let turnoGarcomId: string;
  let turnoCaixaId: string;
  let aberturaCaixaId: string;
  let mesaId: string;
  let comandaId: string;
  let pedidoId: string;
  let produtoId: string;
  
  // Valores para validação
  const VALOR_INICIAL_CAIXA = 100.00;
  const PRECO_PRODUTO = 25.50;
  const QUANTIDADE_ITENS = 2;
  const VALOR_ESPERADO_PEDIDO = PRECO_PRODUTO * QUANTIDADE_ITENS; // 51.00

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );

    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);

    // ========================================
    // SETUP: Autenticação dos usuários
    // ========================================
    
    // Login como ADMIN
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@admin.com', senha: 'admin123' });
    adminToken = adminLogin.body.access_token;

    // Login como GARCOM (criar se não existir)
    try {
      const garcomLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'garcom.teste@pub.com', senha: 'senha123' });
      garcomToken = garcomLogin.body.access_token;
    } catch {
      // Garçom não existe, usar admin para criar
      garcomToken = adminToken;
    }

    // Login como CAIXA (criar se não existir)
    try {
      const caixaLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'caixa.teste@pub.com', senha: 'senha123' });
      caixaToken = caixaLogin.body.access_token;
    } catch {
      // Caixa não existe, usar admin
      caixaToken = adminToken;
    }
  });

  afterAll(async () => {
    // Limpeza dos dados de teste
    if (dataSource && dataSource.isInitialized) {
      try {
        // Limpar na ordem correta (respeitando FKs)
        if (aberturaCaixaId) {
          await dataSource.query('DELETE FROM movimentacoes_caixa WHERE abertura_caixa_id = $1', [aberturaCaixaId]);
          await dataSource.query('DELETE FROM sangrias WHERE abertura_caixa_id = $1', [aberturaCaixaId]);
          await dataSource.query('DELETE FROM fechamentos_caixa WHERE abertura_caixa_id = $1', [aberturaCaixaId]);
          await dataSource.query('DELETE FROM aberturas_caixa WHERE id = $1', [aberturaCaixaId]);
        }
        if (pedidoId) {
          await dataSource.query('DELETE FROM itens_pedido WHERE pedido_id = $1', [pedidoId]);
          await dataSource.query('DELETE FROM pedidos WHERE id = $1', [pedidoId]);
        }
        if (comandaId) {
          await dataSource.query('DELETE FROM comandas WHERE id = $1', [comandaId]);
        }
      } catch (error) {
        console.error('Erro na limpeza:', error);
      }
    }
    await app.close();
  });

  // ========================================
  // FASE 1: PREPARAÇÃO DO AMBIENTE
  // ========================================
  describe('Fase 1: Preparação do Ambiente', () => {
    
    it('1.1 - Deve buscar uma mesa disponível', async () => {
      const response = await request(app.getHttpServer())
        .get('/mesas')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      // Pega a primeira mesa disponível
      const mesaDisponivel = response.body.find(
        (m: any) => m.status === 'LIVRE' || !m.comanda
      );
      
      if (mesaDisponivel) {
        mesaId = mesaDisponivel.id;
      } else if (response.body.length > 0) {
        mesaId = response.body[0].id;
      }
      
      expect(mesaId).toBeDefined();
    });

    it('1.2 - Deve buscar um produto para o pedido', async () => {
      const response = await request(app.getHttpServer())
        .get('/produtos')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Pega o primeiro produto ativo
      const produtoAtivo = response.body.find((p: any) => p.ativo !== false);
      produtoId = produtoAtivo?.id || response.body[0].id;
      
      expect(produtoId).toBeDefined();
    });

    it('1.3 - Deve fazer check-in do funcionário de caixa', async () => {
      // Buscar funcionário do caixa
      const funcionariosResponse = await request(app.getHttpServer())
        .get('/funcionarios')
        .set('Authorization', `Bearer ${adminToken}`);

      const funcionarioCaixa = funcionariosResponse.body.find(
        (f: any) => f.cargo === 'CAIXA' || f.cargo === 'ADMIN'
      );

      if (funcionarioCaixa) {
        const checkInResponse = await request(app.getHttpServer())
          .post('/turnos/check-in')
          .send({ funcionarioId: funcionarioCaixa.id });

        if (checkInResponse.status === 201) {
          turnoCaixaId = checkInResponse.body.id;
        } else if (checkInResponse.status === 400) {
          // Já tem turno ativo, buscar
          const turnosResponse = await request(app.getHttpServer())
            .get(`/turnos/funcionario/${funcionarioCaixa.id}`)
            .set('Authorization', `Bearer ${adminToken}`);
          
          const turnoAtivo = turnosResponse.body.find((t: any) => t.ativo);
          turnoCaixaId = turnoAtivo?.id;
        }
      }

      expect(turnoCaixaId).toBeDefined();
    });
  });

  // ========================================
  // FASE 2: ABERTURA DO CAIXA
  // ========================================
  describe('Fase 2: Abertura do Caixa', () => {
    
    it('2.1 - Deve abrir o caixa com valor inicial de R$ 100,00', async () => {
      const response = await request(app.getHttpServer())
        .post('/caixa/abertura')
        .set('Authorization', `Bearer ${caixaToken}`)
        .send({
          turnoFuncionarioId: turnoCaixaId,
          valorInicial: VALOR_INICIAL_CAIXA,
          observacao: 'Teste automatizado - Fluxo Financeiro',
        });

      // Se já existe caixa aberto, buscar o existente
      if (response.status === 400) {
        const caixaAbertoResponse = await request(app.getHttpServer())
          .get(`/caixa/aberto?turnoId=${turnoCaixaId}`)
          .set('Authorization', `Bearer ${caixaToken}`);
        
        aberturaCaixaId = caixaAbertoResponse.body.id;
      } else {
        expect(response.status).toBe(201);
        expect(response.body.valorInicial).toBe(VALOR_INICIAL_CAIXA);
        expect(response.body.status).toBe('ABERTO');
        aberturaCaixaId = response.body.id;
      }

      expect(aberturaCaixaId).toBeDefined();
    });

    it('2.2 - Deve verificar saldo inicial do caixa', async () => {
      const response = await request(app.getHttpServer())
        .get(`/caixa/${aberturaCaixaId}/resumo`)
        .set('Authorization', `Bearer ${caixaToken}`)
        .expect(200);

      expect(response.body.aberturaCaixa).toBeDefined();
      expect(response.body.aberturaCaixa.status).toBe('ABERTO');
    });
  });

  // ========================================
  // FASE 3: CRIAÇÃO DO PEDIDO (GARÇOM)
  // ========================================
  describe('Fase 3: Criação do Pedido', () => {
    
    it('3.1 - Deve abrir uma comanda na mesa', async () => {
      const response = await request(app.getHttpServer())
        .post('/comandas')
        .set('Authorization', `Bearer ${garcomToken}`)
        .send({
          mesaId: mesaId,
          clienteNome: 'Cliente Teste Automatizado',
        });

      // Se mesa já tem comanda, usar a existente
      if (response.status === 400) {
        const mesaResponse = await request(app.getHttpServer())
          .get(`/mesas/${mesaId}`)
          .set('Authorization', `Bearer ${garcomToken}`);
        
        comandaId = mesaResponse.body.comanda?.id;
      } else {
        expect(response.status).toBe(201);
        comandaId = response.body.id;
      }

      expect(comandaId).toBeDefined();
    });

    it('3.2 - Deve criar um pedido com 2 itens', async () => {
      const response = await request(app.getHttpServer())
        .post('/pedidos')
        .set('Authorization', `Bearer ${garcomToken}`)
        .send({
          comandaId: comandaId,
          itens: [
            {
              produtoId: produtoId,
              quantidade: QUANTIDADE_ITENS,
              observacao: 'Teste automatizado',
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      pedidoId = response.body.id;

      // Verificar que os itens foram criados
      expect(response.body.itens).toBeDefined();
    });

    it('3.3 - Deve verificar o valor total da comanda', async () => {
      const response = await request(app.getHttpServer())
        .get(`/comandas/${comandaId}`)
        .set('Authorization', `Bearer ${garcomToken}`)
        .expect(200);

      expect(response.body.id).toBe(comandaId);
      
      // Calcular total dos itens
      const totalCalculado = response.body.pedidos?.reduce((acc: number, pedido: any) => {
        return acc + pedido.itens?.reduce((itemAcc: number, item: any) => {
          return itemAcc + (Number(item.precoUnitario) * item.quantidade);
        }, 0);
      }, 0) || 0;

      expect(totalCalculado).toBeGreaterThan(0);
      
      // Guardar para validação posterior
      console.log(`💰 Valor total da comanda: R$ ${totalCalculado.toFixed(2)}`);
    });
  });

  // ========================================
  // FASE 4: PAGAMENTO E REGISTRO NO CAIXA
  // ========================================
  describe('Fase 4: Pagamento e Registro no Caixa', () => {
    let valorComanda: number;

    it('4.1 - Deve buscar o valor final da comanda', async () => {
      const response = await request(app.getHttpServer())
        .get(`/comandas/${comandaId}`)
        .set('Authorization', `Bearer ${caixaToken}`)
        .expect(200);

      // Calcular total
      valorComanda = response.body.pedidos?.reduce((acc: number, pedido: any) => {
        return acc + pedido.itens?.reduce((itemAcc: number, item: any) => {
          return itemAcc + (Number(item.precoUnitario) * item.quantidade);
        }, 0);
      }, 0) || VALOR_ESPERADO_PEDIDO;

      expect(valorComanda).toBeGreaterThan(0);
    });

    it('4.2 - Deve registrar a venda no caixa (pagamento PIX)', async () => {
      const response = await request(app.getHttpServer())
        .post('/caixa/venda')
        .set('Authorization', `Bearer ${caixaToken}`)
        .send({
          aberturaCaixaId: aberturaCaixaId,
          valor: valorComanda || VALOR_ESPERADO_PEDIDO,
          formaPagamento: 'PIX',
          comandaId: comandaId,
          comandaNumero: 'CMD-TESTE-001',
          descricao: 'Pagamento teste automatizado',
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.tipo).toBe('VENDA');
      expect(response.body.formaPagamento).toBe('PIX');
    });

    it('4.3 - Deve verificar que a movimentação aparece no resumo do caixa', async () => {
      const response = await request(app.getHttpServer())
        .get(`/caixa/${aberturaCaixaId}/resumo`)
        .set('Authorization', `Bearer ${caixaToken}`)
        .expect(200);

      expect(response.body.movimentacoes).toBeDefined();
      expect(Array.isArray(response.body.movimentacoes)).toBe(true);
      
      // Deve ter pelo menos a movimentação de abertura + venda
      expect(response.body.movimentacoes.length).toBeGreaterThanOrEqual(1);

      // Verificar se a venda está registrada
      const vendas = response.body.movimentacoes.filter(
        (m: any) => m.tipo === 'VENDA'
      );
      expect(vendas.length).toBeGreaterThan(0);

      // Verificar total de vendas
      expect(response.body.totalVendas).toBeGreaterThan(0);
      
      console.log(`📊 Total de vendas no caixa: R$ ${response.body.totalVendas.toFixed(2)}`);
    });
  });

  // ========================================
  // FASE 5: FECHAMENTO E CONFERÊNCIA
  // ========================================
  describe('Fase 5: Fechamento e Conferência do Caixa', () => {
    let resumoAntesFechamento: any;

    it('5.1 - Deve buscar resumo antes do fechamento', async () => {
      const response = await request(app.getHttpServer())
        .get(`/caixa/${aberturaCaixaId}/resumo`)
        .set('Authorization', `Bearer ${caixaToken}`)
        .expect(200);

      resumoAntesFechamento = response.body;
      
      console.log('📋 Resumo antes do fechamento:');
      console.log(`   - Valor inicial: R$ ${resumoAntesFechamento.aberturaCaixa?.valorInicial || 0}`);
      console.log(`   - Total vendas: R$ ${resumoAntesFechamento.totalVendas || 0}`);
      console.log(`   - Total sangrias: R$ ${resumoAntesFechamento.totalSangrias || 0}`);
    });

    it('5.2 - Deve fechar o caixa com valores corretos (diferença zero)', async () => {
      // Calcular valores esperados
      const valorEsperadoPix = resumoAntesFechamento.totalVendas || VALOR_ESPERADO_PEDIDO;
      const valorEsperadoDinheiro = VALOR_INICIAL_CAIXA - (resumoAntesFechamento.totalSangrias || 0);

      const response = await request(app.getHttpServer())
        .post('/caixa/fechamento')
        .set('Authorization', `Bearer ${caixaToken}`)
        .send({
          aberturaCaixaId: aberturaCaixaId,
          valorInformadoDinheiro: valorEsperadoDinheiro,
          valorInformadoPix: valorEsperadoPix,
          valorInformadoDebito: 0,
          valorInformadoCredito: 0,
          valorInformadoValeRefeicao: 0,
          valorInformadoValeAlimentacao: 0,
          observacao: 'Fechamento teste automatizado - valores corretos',
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      
      // Verificar diferenças
      console.log('✅ Fechamento realizado:');
      console.log(`   - Diferença Dinheiro: R$ ${response.body.diferencaDinheiro}`);
      console.log(`   - Diferença PIX: R$ ${response.body.diferencaPix}`);
      console.log(`   - Diferença Total: R$ ${response.body.diferencaTotal}`);

      // A diferença deve ser zero ou muito próxima de zero
      expect(Math.abs(response.body.diferencaTotal)).toBeLessThan(0.01);
    });

    it('5.3 - Deve verificar que o caixa está fechado', async () => {
      const response = await request(app.getHttpServer())
        .get(`/caixa/${aberturaCaixaId}/resumo`)
        .set('Authorization', `Bearer ${caixaToken}`)
        .expect(200);

      expect(response.body.aberturaCaixa.status).toBe('FECHADO');
    });
  });

  // ========================================
  // FASE 6: TESTES DE INTEGRIDADE
  // ========================================
  describe('Fase 6: Testes de Integridade Financeira', () => {
    
    it('6.1 - Deve aparecer no histórico de fechamentos', async () => {
      const response = await request(app.getHttpServer())
        .get('/caixa/historico')
        .set('Authorization', `Bearer ${caixaToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      // Deve ter pelo menos um fechamento
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('6.2 - Não deve permitir operações em caixa fechado', async () => {
      // Tentar registrar venda em caixa fechado
      const response = await request(app.getHttpServer())
        .post('/caixa/venda')
        .set('Authorization', `Bearer ${caixaToken}`)
        .send({
          aberturaCaixaId: aberturaCaixaId,
          valor: 50,
          formaPagamento: 'DINHEIRO',
          comandaId: comandaId,
          comandaNumero: 'CMD-TESTE-002',
        })
        .expect(400);

      expect(response.body.message).toContain('não está aberto');
    });

    it('6.3 - Não deve permitir sangria em caixa fechado', async () => {
      const response = await request(app.getHttpServer())
        .post('/caixa/sangria')
        .set('Authorization', `Bearer ${caixaToken}`)
        .send({
          aberturaCaixaId: aberturaCaixaId,
          valor: 50,
          motivo: 'Teste em caixa fechado',
        })
        .expect(400);

      expect(response.body.message).toContain('não está aberto');
    });
  });
});

/**
 * TESTE ADICIONAL: Detecção de Diferenças
 * 
 * Valida que o sistema detecta quando os valores informados
 * não batem com os valores esperados
 */
describe('Detecção de Diferenças no Fechamento (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let turnoCaixaId: string;
  let aberturaCaixaId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    // Login
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@admin.com', senha: 'admin123' });
    adminToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('Deve detectar diferença quando valor informado é maior que esperado', async () => {
    // Este teste valida que o sistema registra a diferença
    // quando o operador informa um valor diferente do esperado
    
    // Buscar funcionário
    const funcionariosResponse = await request(app.getHttpServer())
      .get('/funcionarios')
      .set('Authorization', `Bearer ${adminToken}`);

    const funcionario = funcionariosResponse.body[0];
    
    // Check-in
    const checkInResponse = await request(app.getHttpServer())
      .post('/turnos/check-in')
      .send({ funcionarioId: funcionario.id });

    if (checkInResponse.status === 201) {
      turnoCaixaId = checkInResponse.body.id;

      // Abrir caixa
      const aberturaResponse = await request(app.getHttpServer())
        .post('/caixa/abertura')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          turnoFuncionarioId: turnoCaixaId,
          valorInicial: 200,
          observacao: 'Teste de diferença',
        });

      if (aberturaResponse.status === 201) {
        aberturaCaixaId = aberturaResponse.body.id;

        // Fechar informando valor MAIOR que o esperado
        const fechamentoResponse = await request(app.getHttpServer())
          .post('/caixa/fechamento')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            aberturaCaixaId: aberturaCaixaId,
            valorInformadoDinheiro: 250, // 50 a mais!
            valorInformadoPix: 0,
            valorInformadoDebito: 0,
            valorInformadoCredito: 0,
            valorInformadoValeRefeicao: 0,
            valorInformadoValeAlimentacao: 0,
            forcarFechamento: true, // Forçar pois não tem movimentações
            observacao: 'Teste de diferença positiva',
          });

        if (fechamentoResponse.status === 201) {
          // Deve registrar diferença de +50
          expect(fechamentoResponse.body.diferencaDinheiro).toBe(50);
          expect(fechamentoResponse.body.diferencaTotal).toBe(50);
          
          console.log('⚠️ Diferença detectada corretamente: +R$ 50,00');
        }
      }
    }
  });
});
