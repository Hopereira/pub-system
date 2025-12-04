import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';

describe('Caixa (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
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

    // Fazer login para obter token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'caixa@test.com',
        senha: 'senha123',
      });

    authToken = loginResponse.body.access_token;
    
    // Criar turno para os testes
    const turnoResponse = await request(app.getHttpServer())
      .post('/turnos')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        funcionarioId: loginResponse.body.user.id,
        dataInicio: new Date(),
      });

    turnoFuncionarioId = turnoResponse.body.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (dataSource) {
      await dataSource.query('DELETE FROM sangrias WHERE abertura_caixa_id = $1', [aberturaCaixaId]);
      await dataSource.query('DELETE FROM movimentacoes_caixa WHERE abertura_caixa_id = $1', [aberturaCaixaId]);
      await dataSource.query('DELETE FROM fechamentos_caixa WHERE abertura_caixa_id = $1', [aberturaCaixaId]);
      await dataSource.query('DELETE FROM aberturas_caixa WHERE id = $1', [aberturaCaixaId]);
    }
    await app.close();
  });

  describe('POST /caixa/abertura', () => {
    it('deve abrir um caixa com valor inicial', () => {
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

    it('deve retornar 400 se tentar abrir caixa já aberto', () => {
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
    it('deve retornar caixa aberto por turno', () => {
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

    it('deve retornar 400 se valor for negativo', () => {
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
    it('deve registrar uma sangria', () => {
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

    it('deve retornar 400 se valor for zero', () => {
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

    it('deve retornar 400 se motivo for muito curto', () => {
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
    it('deve retornar resumo completo do caixa', () => {
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
    it('deve retornar movimentações do caixa', () => {
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
    it('deve retornar sangrias do caixa', () => {
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
    it('deve fechar o caixa com cálculo de diferenças', () => {
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

    it('deve retornar 400 se tentar fechar caixa já fechado', () => {
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
});
