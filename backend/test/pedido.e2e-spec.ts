import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

const ADMIN_EMAIL = process.env.CI_ADMIN_EMAIL || 'admin@admin.com';
const ADMIN_PASSWORD = process.env.CI_ADMIN_PASSWORD || 'admin123';

describe('Pedido (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let garcomToken: string;
  let cozinhaToken: string;
  let comandaId: string;
  let pedidoId: string;
  let itemPedidoId: string;
  let produtoId: string;
  let ambienteId: string;

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

    // Login como admin
    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: ADMIN_EMAIL,
        senha: ADMIN_PASSWORD,
      });

    authToken = adminLoginResponse.body.access_token;

    // Buscar um produto existente para os testes
    const produtosResponse = await request(app.getHttpServer())
      .get('/produtos')
      .set('Authorization', `Bearer ${authToken}`);

    if (produtosResponse.body.length > 0) {
      produtoId = produtosResponse.body[0].id;
      ambienteId = produtosResponse.body[0].ambiente?.id;
    }

    // Buscar uma comanda aberta ou criar uma nova
    const comandasResponse = await request(app.getHttpServer())
      .get('/comandas?status=ABERTA')
      .set('Authorization', `Bearer ${authToken}`);

    if (comandasResponse.body.length > 0) {
      comandaId = comandasResponse.body[0].id;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  // ============================================
  // TESTES: POST /pedidos
  // ============================================
  describe('POST /pedidos', () => {
    it('deve criar um pedido com sucesso', async () => {
      if (!comandaId || !produtoId) {
        console.log('Skipping: Comanda ou Produto não disponível');
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/pedidos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          comandaId: comandaId,
          itens: [
            {
              produtoId: produtoId,
              quantidade: 2,
              observacao: 'Teste E2E',
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('itens');
      expect(response.body.itens.length).toBeGreaterThan(0);

      pedidoId = response.body.id;
      itemPedidoId = response.body.itens[0].id;
    });

    it('deve retornar 400 se pedido não tiver itens', async () => {
      if (!comandaId) {
        console.log('Skipping: Comanda não disponível');
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/pedidos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          comandaId: comandaId,
          itens: [],
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar 404 se comanda não existir', async () => {
      const response = await request(app.getHttpServer())
        .post('/pedidos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          comandaId: '00000000-0000-0000-0000-000000000000',
          itens: [
            {
              produtoId: produtoId || '00000000-0000-0000-0000-000000000000',
              quantidade: 1,
            },
          ],
        });

      expect(response.status).toBe(404);
    });

    it('deve retornar 401 se não autenticado', async () => {
      const response = await request(app.getHttpServer())
        .post('/pedidos')
        .send({
          comandaId: comandaId,
          itens: [{ produtoId: produtoId, quantidade: 1 }],
        });

      expect(response.status).toBe(401);
    });
  });

  // ============================================
  // TESTES: GET /pedidos
  // ============================================
  describe('GET /pedidos', () => {
    it('deve listar pedidos', async () => {
      const response = await request(app.getHttpServer())
        .get('/pedidos')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve filtrar pedidos por ambiente', async () => {
      if (!ambienteId) {
        console.log('Skipping: Ambiente não disponível');
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/pedidos?ambienteId=${ambienteId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve filtrar pedidos por status', async () => {
      const response = await request(app.getHttpServer())
        .get('/pedidos?status=FEITO')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve retornar 401 se não autenticado', async () => {
      const response = await request(app.getHttpServer()).get('/pedidos');

      expect(response.status).toBe(401);
    });
  });

  // ============================================
  // TESTES: GET /pedidos/:id
  // ============================================
  describe('GET /pedidos/:id', () => {
    it('deve retornar um pedido por ID', async () => {
      if (!pedidoId) {
        console.log('Skipping: Pedido não criado');
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/pedidos/${pedidoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(pedidoId);
      expect(response.body).toHaveProperty('itens');
      expect(response.body).toHaveProperty('comanda');
    });

    it('deve retornar 404 se pedido não existir', async () => {
      const response = await request(app.getHttpServer())
        .get('/pedidos/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // TESTES: PATCH /pedidos/item/:id/status
  // ============================================
  describe('PATCH /pedidos/item/:id/status', () => {
    it('deve atualizar status do item para EM_PREPARO', async () => {
      if (!itemPedidoId) {
        console.log('Skipping: Item de pedido não disponível');
        return;
      }

      const response = await request(app.getHttpServer())
        .patch(`/pedidos/item/${itemPedidoId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'EM_PREPARO',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('EM_PREPARO');
      expect(response.body.iniciadoEm).toBeDefined();
    });

    it('deve atualizar status do item para PRONTO', async () => {
      if (!itemPedidoId) {
        console.log('Skipping: Item de pedido não disponível');
        return;
      }

      const response = await request(app.getHttpServer())
        .patch(`/pedidos/item/${itemPedidoId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'PRONTO',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('PRONTO');
      expect(response.body.prontoEm).toBeDefined();
    });

    it('deve retornar 404 se item não existir', async () => {
      const response = await request(app.getHttpServer())
        .patch('/pedidos/item/00000000-0000-0000-0000-000000000000/status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'EM_PREPARO',
        });

      expect(response.status).toBe(404);
    });

    it('deve retornar 400 se status for inválido', async () => {
      if (!itemPedidoId) {
        console.log('Skipping: Item de pedido não disponível');
        return;
      }

      const response = await request(app.getHttpServer())
        .patch(`/pedidos/item/${itemPedidoId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'STATUS_INVALIDO',
        });

      expect(response.status).toBe(400);
    });
  });

  // ============================================
  // TESTES: GET /pedidos/prontos
  // ============================================
  describe('GET /pedidos/prontos', () => {
    it('deve listar pedidos prontos', async () => {
      const response = await request(app.getHttpServer())
        .get('/pedidos/prontos')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve filtrar pedidos prontos por ambiente', async () => {
      if (!ambienteId) {
        console.log('Skipping: Ambiente não disponível');
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/pedidos/prontos?ambienteId=${ambienteId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // ============================================
  // TESTES: Fluxo Completo de Pedido
  // ============================================
  describe('Fluxo Completo de Pedido', () => {
    let novoItemId: string;

    it('deve completar fluxo: FEITO → EM_PREPARO → PRONTO → ENTREGUE', async () => {
      if (!comandaId || !produtoId) {
        console.log('Skipping: Comanda ou Produto não disponível');
        return;
      }

      // 1. Criar pedido
      const criarResponse = await request(app.getHttpServer())
        .post('/pedidos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          comandaId: comandaId,
          itens: [
            {
              produtoId: produtoId,
              quantidade: 1,
              observacao: 'Teste fluxo completo',
            },
          ],
        });

      expect(criarResponse.status).toBe(201);
      novoItemId = criarResponse.body.itens[0].id;
      expect(criarResponse.body.itens[0].status).toBe('FEITO');

      // 2. Iniciar preparo
      const emPreparoResponse = await request(app.getHttpServer())
        .patch(`/pedidos/item/${novoItemId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'EM_PREPARO' });

      expect(emPreparoResponse.status).toBe(200);
      expect(emPreparoResponse.body.status).toBe('EM_PREPARO');
      expect(emPreparoResponse.body.iniciadoEm).toBeDefined();

      // 3. Marcar como pronto
      const prontoResponse = await request(app.getHttpServer())
        .patch(`/pedidos/item/${novoItemId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'PRONTO' });

      expect(prontoResponse.status).toBe(200);
      expect(prontoResponse.body.status).toBe('PRONTO');
      expect(prontoResponse.body.prontoEm).toBeDefined();

      // 4. Marcar como entregue
      const entregueResponse = await request(app.getHttpServer())
        .patch(`/pedidos/item/${novoItemId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'ENTREGUE' });

      expect(entregueResponse.status).toBe(200);
      expect(entregueResponse.body.status).toBe('ENTREGUE');
      expect(entregueResponse.body.entregueEm).toBeDefined();
    });
  });

  // ============================================
  // TESTES: Cancelamento de Pedido
  // ============================================
  describe('Cancelamento de Pedido', () => {
    it('deve cancelar um item com motivo', async () => {
      if (!comandaId || !produtoId) {
        console.log('Skipping: Comanda ou Produto não disponível');
        return;
      }

      // Criar pedido para cancelar
      const criarResponse = await request(app.getHttpServer())
        .post('/pedidos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          comandaId: comandaId,
          itens: [
            {
              produtoId: produtoId,
              quantidade: 1,
              observacao: 'Para cancelar',
            },
          ],
        });

      const itemParaCancelar = criarResponse.body.itens[0].id;

      // Cancelar item
      const cancelarResponse = await request(app.getHttpServer())
        .patch(`/pedidos/item/${itemParaCancelar}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'CANCELADO',
          motivoCancelamento: 'Cliente desistiu do pedido',
        });

      expect(cancelarResponse.status).toBe(200);
      expect(cancelarResponse.body.status).toBe('CANCELADO');
      expect(cancelarResponse.body.motivoCancelamento).toBe(
        'Cliente desistiu do pedido',
      );
    });
  });

  // ============================================
  // TESTES: Validações
  // ============================================
  describe('Validações', () => {
    it('deve rejeitar quantidade maior que 100', async () => {
      if (!comandaId || !produtoId) {
        console.log('Skipping: Comanda ou Produto não disponível');
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/pedidos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          comandaId: comandaId,
          itens: [
            {
              produtoId: produtoId,
              quantidade: 101, // Excede limite
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('100');
    });

    it('deve rejeitar quantidade zero ou negativa', async () => {
      if (!comandaId || !produtoId) {
        console.log('Skipping: Comanda ou Produto não disponível');
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/pedidos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          comandaId: comandaId,
          itens: [
            {
              produtoId: produtoId,
              quantidade: 0,
            },
          ],
        });

      expect(response.status).toBe(400);
    });

    it('deve rejeitar produtoId inválido (não UUID)', async () => {
      if (!comandaId) {
        console.log('Skipping: Comanda não disponível');
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/pedidos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          comandaId: comandaId,
          itens: [
            {
              produtoId: 'id-invalido',
              quantidade: 1,
            },
          ],
        });

      expect(response.status).toBe(400);
    });
  });
});
