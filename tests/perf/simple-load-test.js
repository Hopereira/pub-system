import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Métricas customizadas
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const mesasDuration = new Trend('mesas_duration');
const produtosDuration = new Trend('produtos_duration');

// Configuração do teste - versão simplificada
export const options = {
  vus: 10,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://pub_system_backend:3000';

export default function () {
  // Health Check (sem autenticação)
  group('Health Check', function () {
    const res = http.get(`${BASE_URL}/health`);
    const success = check(res, {
      'health status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });

  sleep(0.2);

  // Produtos (endpoint público)
  group('Produtos', function () {
    const res = http.get(`${BASE_URL}/produtos`);
    produtosDuration.add(res.timings.duration);
    const success = check(res, {
      'produtos status 200': (r) => r.status === 200,
    });
    errorRate.add(!success);
  });

  sleep(0.2);

  // Login
  group('Login', function () {
    const payload = JSON.stringify({
      email: 'admin@admin.com',
      senha: 'admin123',
    });
    const params = {
      headers: { 'Content-Type': 'application/json' },
    };
    const res = http.post(`${BASE_URL}/auth/login`, payload, params);
    loginDuration.add(res.timings.duration);
    
    const success = check(res, {
      'login status ok': (r) => r.status === 200 || r.status === 201,
    });
    errorRate.add(!success);

    if (res.status === 200 || res.status === 201) {
      try {
        const body = JSON.parse(res.body);
        const token = body.access_token;
        
        if (token) {
          // Testar endpoint autenticado
          const authHeaders = {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          };
          
          // Mesas
          const mesasRes = http.get(`${BASE_URL}/mesas`, authHeaders);
          mesasDuration.add(mesasRes.timings.duration);
          check(mesasRes, {
            'mesas status 200': (r) => r.status === 200,
          });
          
          sleep(0.1);
          
          // Comandas
          const comandasRes = http.get(`${BASE_URL}/comandas`, authHeaders);
          check(comandasRes, {
            'comandas status 200': (r) => r.status === 200,
          });
          
          sleep(0.1);
          
          // Pedidos
          const pedidosRes = http.get(`${BASE_URL}/pedidos`, authHeaders);
          check(pedidosRes, {
            'pedidos status 200': (r) => r.status === 200,
          });
        }
      } catch (e) {
        console.error('Erro ao parsear resposta do login');
      }
    }
  });

  sleep(0.5);
}
