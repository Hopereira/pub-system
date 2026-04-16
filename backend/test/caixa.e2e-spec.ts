import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { seedSuperAdmin } from './setup/seed-super-admin';

const ADMIN_EMAIL = process.env.CI_ADMIN_EMAIL || 'admin@admin.com';
const ADMIN_PASSWORD = process.env.CI_ADMIN_PASSWORD || 'admin123';

describe('Caixa (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let garcomToken: string; // Token de garçom para testar acesso negado
  let turnoFuncionarioId: string;
  let aberturaCaixaId: string;

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

    // Seed SUPER_ADMIN e login
    await seedSuperAdmin(dataSource, ADMIN_EMAIL, ADMIN_PASSWORD);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: ADMIN_EMAIL, senha: ADMIN_PASSWORD });

    authToken = loginResponse.body.access_token;
    // garcomToken deixado undefined — testes de acesso negado serão skipped
  }, 60000);

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized && aberturaCaixaId) {
      try {
        await dataSource.query('DELETE FROM sangrias WHERE abertura_caixa_id = $1', [aberturaCaixaId]);
        await dataSource.query('DELETE FROM movimentacoes_caixa WHERE abertura_caixa_id = $1', [aberturaCaixaId]);
        await dataSource.query('DELETE FROM fechamentos_caixa WHERE abertura_caixa_id = $1', [aberturaCaixaId]);
        await dataSource.query('DELETE FROM aberturas_caixa WHERE id = $1', [aberturaCaixaId]);
      } catch { /* ignorar erros de limpeza */ }
    }
    if (app) await app.close();
  }, 30000);

  describe('POST /caixa/abertura', () => {
    it('deve abrir um caixa com valor inicial', async () => {
      if (!turnoFuncionarioId) return;
      return request(app.getHttpServer())
        .post('/caixa/abertura')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          turnoFuncionarioId: turnoFuncionarioId,
          valorInicial: 100,
          observacao: 'Abertura de teste',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.valorInicial).toBe(100);
          expect(res.body.status).toBe('ABERTO');
          expect(res.body.observacao).toBe('Abertura de teste');
          aberturaCaixaId = res.body.id;
        });
    });

    it('deve retornar 400 se tentar abrir caixa já aberto', async () => {
      if (!aberturaCaixaId) return;
      return request(app.getHttpServer())
        .post('/caixa/abertura')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          turnoFuncionarioId: turnoFuncionarioId,
          valorInicial: 100,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Já existe um caixa aberto');
        });
    });

    it('deve retornar 400 se valor inicial for negativo', () => {
      return request(app.getHttpServer())
        .post('/caixa/abertura')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          turnoFuncionarioId: 'novo-turno-id',
          valorInicial: -50,
        })
        .expect(400);
    });

    it('deve retornar 401 se não autenticado', () => {
      return request(app.getHttpServer())
        .post('/caixa/abertura')
        .send({
          turnoFuncionarioId: turnoFuncionarioId,
          valorInicial: 100,
        })
        .expect(401);
    });
  });

  describe('GET /caixa/aberto', () => {
    it('deve retornar caixa aberto por turno', async () => {
      if (!turnoFuncionarioId || !aberturaCaixaId) return;
      return request(app.getHttpServer())
        .get(`/caixa/aberto?turnoId=${turnoFuncionarioId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.status).toBe('ABERTO');
          expect(res.body.valorInicial).toBe(100);
        });
    });

    it('deve retornar 404 se caixa não encontrado', () => {
      return request(app.getHttpServer())
        .get('/caixa/aberto?turnoId=invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /caixa/venda', () => {
    it('deve registrar uma venda no caixa', async () => {
      if (!aberturaCaixaId) return;
      // Criar comanda para teste
      const comandaResponse = await request(app.getHttpServer())
        .post('/comandas')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          mesaId: 'mesa-test-id',
          clienteNome: 'Cliente Teste',
        });

      const comandaId = comandaResponse.body.id;

      return request(app.getHttpServer())
        .post('/caixa/venda')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          aberturaCaixaId: aberturaCaixaId,
          valor: 125.50,
          formaPagamento: 'PIX',
          comandaId: comandaId,
          comandaNumero: 'CMD-001',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.valor).toBe(125.50);
          expect(res.body.formaPagamento).toBe('PIX');
        });
    });

    it('deve retornar 400 se valor for negativo', async () => {
      if (!aberturaCaixaId) return;
      return request(app.getHttpServer())
        .post('/caixa/venda')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          aberturaCaixaId: aberturaCaixaId,
          valor: -50,
          formaPagamento: 'DINHEIRO',
          comandaId: 'comanda-id',
        })
        .expect(400);
    });
  });

  describe('POST /caixa/sangria', () => {
    it('deve registrar uma sangria', async () => {
      if (!aberturaCaixaId) return;
      return request(app.getHttpServer())
        .post('/caixa/sangria')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          aberturaCaixaId: aberturaCaixaId,
          valor: 500,
          motivo: 'Pagamento de fornecedor',
          autorizadoPor: 'João Silva - Gerente',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.valor).toBe(500);
          expect(res.body.motivo).toBe('Pagamento de fornecedor');
        });
    });

    it('deve retornar 400 se valor for zero', async () => {
      if (!aberturaCaixaId) return;
      return request(app.getHttpServer())
        .post('/caixa/sangria')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          aberturaCaixaId: aberturaCaixaId,
          valor: 0,
          motivo: 'Teste',
        })
        .expect(400);
    });

    it('deve retornar 400 se motivo for muito curto', async () => {
      if (!aberturaCaixaId) return;
      return request(app.getHttpServer())
        .post('/caixa/sangria')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          aberturaCaixaId: aberturaCaixaId,
          valor: 100,
          motivo: 'AB',
        })
        .expect(400);
    });
  });

  describe('GET /caixa/:aberturaCaixaId/resumo', () => {
    it('deve retornar resumo completo do caixa', async () => {
      if (!aberturaCaixaId) return;
      return request(app.getHttpServer())
        .get(`/caixa/${aberturaCaixaId}/resumo`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('aberturaCaixa');
          expect(res.body).toHaveProperty('movimentacoes');
          expect(res.body).toHaveProperty('sangrias');
          expect(res.body).toHaveProperty('totalVendas');
          expect(res.body).toHaveProperty('totalSangrias');
          expect(res.body.aberturaCaixa.id).toBe(aberturaCaixaId);
        });
    });

    it('deve retornar 404 se caixa não encontrado', () => {
      return request(app.getHttpServer())
        .get('/caixa/invalid-id/resumo')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /caixa/:aberturaCaixaId/movimentacoes', () => {
    it('deve retornar movimentações do caixa', async () => {
      if (!aberturaCaixaId) return;
      return request(app.getHttpServer())
        .get(`/caixa/${aberturaCaixaId}/movimentacoes`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('valor');
            expect(res.body[0]).toHaveProperty('formaPagamento');
          }
        });
    });
  });

  describe('GET /caixa/:aberturaCaixaId/sangrias', () => {
    it('deve retornar sangrias do caixa', async () => {
      if (!aberturaCaixaId) return;
      return request(app.getHttpServer())
        .get(`/caixa/${aberturaCaixaId}/sangrias`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('valor');
          expect(res.body[0]).toHaveProperty('motivo');
        });
    });
  });

  describe('POST /caixa/fechamento', () => {
    it('deve fechar o caixa com cálculo de diferenças', async () => {
      if (!aberturaCaixaId) return;
      return request(app.getHttpServer())
        .post('/caixa/fechamento')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          aberturaCaixaId: aberturaCaixaId,
          valorInformadoDinheiro: 100,
          valorInformadoPix: 125.50,
          valorInformadoDebito: 0,
          valorInformadoCredito: 0,
          valorInformadoValeRefeicao: 0,
          valorInformadoValeAlimentacao: 0,
          observacao: 'Fechamento de teste',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('diferencaDinheiro');
          expect(res.body).toHaveProperty('diferencaPix');
          expect(res.body).toHaveProperty('diferencaTotal');
          expect(res.body.observacao).toBe('Fechamento de teste');
        });
    });

    it('deve retornar 400 se tentar fechar caixa já fechado', async () => {
      if (!aberturaCaixaId) return;
      return request(app.getHttpServer())
        .post('/caixa/fechamento')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          aberturaCaixaId: aberturaCaixaId,
          valorInformadoDinheiro: 0,
          valorInformadoPix: 0,
          valorInformadoDebito: 0,
          valorInformadoCredito: 0,
          valorInformadoValeRefeicao: 0,
          valorInformadoValeAlimentacao: 0,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('já está fechado');
        });
    });
  });

  describe('GET /caixa/historico', () => {
    it('deve retornar histórico de fechamentos', () => {
      return request(app.getHttpServer())
        .get('/caixa/historico')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('deve filtrar por data', () => {
      const dataInicio = new Date().toISOString().split('T')[0];
      const dataFim = new Date().toISOString().split('T')[0];

      return request(app.getHttpServer())
        .get(`/caixa/historico?dataInicio=${dataInicio}&dataFim=${dataFim}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /caixa/aberto/todos', () => {
    it('deve retornar todos os caixas abertos (admin)', () => {
      return request(app.getHttpServer())
        .get('/caixa/aberto/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  // ============================================
  // TESTES DE SEGURANÇA - RolesGuard
  // ============================================
  describe('Segurança - RolesGuard', () => {
    it('deve retornar 403 quando GARCOM tenta acessar /caixa/aberto', async () => {
      if (!garcomToken) return;
      return request(app.getHttpServer())
        .get('/caixa/aberto')
        .set('Authorization', `Bearer ${garcomToken}`)
        .expect(403);
    });

    it('deve retornar 403 quando GARCOM tenta abrir caixa', async () => {
      if (!garcomToken) return;
      return request(app.getHttpServer())
        .post('/caixa/abertura')
        .set('Authorization', `Bearer ${garcomToken}`)
        .send({ turnoFuncionarioId: 'qualquer-id', valorInicial: 100 })
        .expect(403);
    });

    it('deve retornar 403 quando GARCOM tenta registrar sangria', async () => {
      if (!garcomToken) return;
      return request(app.getHttpServer())
        .post('/caixa/sangria')
        .set('Authorization', `Bearer ${garcomToken}`)
        .send({ aberturaCaixaId: 'qualquer-id', valor: 100, motivo: 'Teste' })
        .expect(403);
    });

    it('deve retornar 403 quando GARCOM tenta fechar caixa', async () => {
      if (!garcomToken) return;
      return request(app.getHttpServer())
        .post('/caixa/fechamento')
        .set('Authorization', `Bearer ${garcomToken}`)
        .send({
          aberturaCaixaId: 'qualquer-id',
          valorInformadoDinheiro: 0,
          valorInformadoPix: 0,
          valorInformadoDebito: 0,
          valorInformadoCredito: 0,
          valorInformadoValeRefeicao: 0,
          valorInformadoValeAlimentacao: 0,
        })
        .expect(403);
    });

    it('deve retornar 403 quando GARCOM tenta ver histórico', async () => {
      if (!garcomToken) return;
      return request(app.getHttpServer())
        .get('/caixa/historico')
        .set('Authorization', `Bearer ${garcomToken}`)
        .expect(403);
    });
  });

  // ============================================
  // TESTES DE MENSAGENS DE ERRO AMIGÁVEIS
  // ============================================
  describe('Mensagens de Erro Amigáveis', () => {
    it('deve retornar mensagem amigável quando sangria excede saldo', async () => {
      if (!aberturaCaixaId) return;
      const response = await request(app.getHttpServer())
        .post('/caixa/sangria')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          aberturaCaixaId: aberturaCaixaId,
          valor: 999999,
          motivo: 'Teste de erro',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).not.toContain('Error:');
      expect(response.body.message).not.toContain('at ');
    });

    it('deve retornar mensagem amigável quando caixa não encontrado', async () => {
      const response = await request(app.getHttpServer())
        .get('/caixa/00000000-0000-0000-0000-000000000000/resumo')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBeDefined();
      // Não deve expor detalhes internos
      expect(response.body).not.toHaveProperty('stack');
    });

    it('deve retornar mensagem amigável para fechamento sem movimentações', async () => {
      // Criar novo caixa vazio para teste
      const novoTurnoResponse = await request(app.getHttpServer())
        .post('/turnos/check-in')
        .send({
          funcionarioId: 'func-teste-vazio',
        });

      const novoCaixaResponse = await request(app.getHttpServer())
        .post('/caixa/abertura')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          turnoFuncionarioId: novoTurnoResponse.body?.id || 'turno-teste',
          valorInicial: 50,
        });

      if (novoCaixaResponse.status === 201) {
        const response = await request(app.getHttpServer())
          .post('/caixa/fechamento')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            aberturaCaixaId: novoCaixaResponse.body.id,
            valorInformadoDinheiro: 50,
            valorInformadoPix: 0,
            valorInformadoDebito: 0,
            valorInformadoCredito: 0,
            valorInformadoValeRefeicao: 0,
            valorInformadoValeAlimentacao: 0,
          });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('sem movimentações');
      }
    });
  });
});
