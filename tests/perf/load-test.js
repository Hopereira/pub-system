import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Métricas customizadas
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const mesasDuration = new Trend('mesas_duration');
const produtosDuration = new Trend('produtos_duration');
const comandasDuration = new Trend('comandas_duration');
const pedidosDuration = new Trend('pedidos_duration');

// Configuração do teste
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up para 10 usuários
    { duration: '1m', target: 10 },   // Mantém 10 usuários por 1 minuto
    { duration: '30s', target: 20 },  // Ramp up para 20 usuários
    { duration: '1m', target: 20 },   // Mantém 20 usuários por 1 minuto
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% das requisições < 500ms
    errors: ['rate<0.1'],               // Taxa de erro < 10%
    login_duration: ['p(95)<1000'],     // Login < 1s
    mesas_duration: ['p(95)<300'],      // Mesas < 300ms
    produtos_duration: ['p(95)<300'],   // Produtos < 300ms
    comandas_duration: ['p(95)<500'],   // Comandas < 500ms
    pedidos_duration: ['p(95)<500'],    // Pedidos < 500ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://host.docker.internal:3000';

// Função para fazer login e obter token
function login() {
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
    'login has token': (r) => {
      try {
        return r.json('access_token') !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  errorRate.add(!success);

  if (success) {
    return res.json('access_token');
  }
  return null;
}

// Função principal do teste
export default function () {
  // Login
  const token = login();
  if (!token) {
    console.error('Falha no login');
    return;
  }

  const authHeaders = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  // Grupo: Health Check
  group('Health Check', function () {
    const res = http.get(`${BASE_URL}/health`);
    check(res, {
      'health status 200': (r) => r.status === 200,
      'health is ok': (r) => r.json('status') === 'ok',
    });
  });

  sleep(0.5);

  // Grupo: Mesas
  group('Mesas', function () {
    const res = http.get(`${BASE_URL}/mesas`, authHeaders);
    mesasDuration.add(res.timings.duration);
    
    const success = check(res, {
      'mesas status 200': (r) => r.status === 200,
      'mesas is array': (r) => Array.isArray(r.json()),
    });
    errorRate.add(!success);
  });

  sleep(0.5);

  // Grupo: Produtos (público)
  group('Produtos', function () {
    const res = http.get(`${BASE_URL}/produtos`);
    produtosDuration.add(res.timings.duration);
    
    const success = check(res, {
      'produtos status 200': (r) => r.status === 200,
      'produtos is array': (r) => Array.isArray(r.json()),
    });
    errorRate.add(!success);
  });

  sleep(0.5);

  // Grupo: Ambientes
  group('Ambientes', function () {
    const res = http.get(`${BASE_URL}/ambientes`, authHeaders);
    
    const success = check(res, {
      'ambientes status 200': (r) => r.status === 200,
      'ambientes is array': (r) => Array.isArray(r.json()),
    });
    errorRate.add(!success);
  });

  sleep(0.5);

  // Grupo: Comandas
  group('Comandas', function () {
    const res = http.get(`${BASE_URL}/comandas`, authHeaders);
    comandasDuration.add(res.timings.duration);
    
    const success = check(res, {
      'comandas status 200': (r) => r.status === 200,
      'comandas is array': (r) => Array.isArray(r.json()),
    });
    errorRate.add(!success);
  });

  sleep(0.5);

  // Grupo: Pedidos
  group('Pedidos', function () {
    const res = http.get(`${BASE_URL}/pedidos`, authHeaders);
    pedidosDuration.add(res.timings.duration);
    
    const success = check(res, {
      'pedidos status 200': (r) => r.status === 200,
      'pedidos is array': (r) => Array.isArray(r.json()),
    });
    errorRate.add(!success);
  });

  sleep(0.5);

  // Grupo: Analytics
  group('Analytics', function () {
    const res = http.get(`${BASE_URL}/analytics/pedidos/relatorio-geral`, authHeaders);
    
    const success = check(res, {
      'analytics status 200': (r) => r.status === 200,
      'analytics has resumo': (r) => r.json('resumo') !== undefined,
    });
    errorRate.add(!success);
  });

  sleep(1);
}

// Resumo do teste
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'tests/perf/results/summary.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data, options) {
  const { metrics } = data;
  
  let summary = '\n========== RESUMO DO TESTE DE PERFORMANCE ==========\n\n';
  
  summary += '📊 MÉTRICAS GERAIS:\n';
  summary += `   Requisições totais: ${metrics.http_reqs?.values?.count || 0}\n`;
  summary += `   Taxa de erro: ${((metrics.errors?.values?.rate || 0) * 100).toFixed(2)}%\n`;
  summary += `   Duração média: ${(metrics.http_req_duration?.values?.avg || 0).toFixed(2)}ms\n`;
  summary += `   P95: ${(metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(2)}ms\n`;
  summary += `   P99: ${(metrics.http_req_duration?.values?.['p(99)'] || 0).toFixed(2)}ms\n\n`;
  
  summary += '⏱️ TEMPOS POR ENDPOINT:\n';
  summary += `   Login: ${(metrics.login_duration?.values?.avg || 0).toFixed(2)}ms (P95: ${(metrics.login_duration?.values?.['p(95)'] || 0).toFixed(2)}ms)\n`;
  summary += `   Mesas: ${(metrics.mesas_duration?.values?.avg || 0).toFixed(2)}ms (P95: ${(metrics.mesas_duration?.values?.['p(95)'] || 0).toFixed(2)}ms)\n`;
  summary += `   Produtos: ${(metrics.produtos_duration?.values?.avg || 0).toFixed(2)}ms (P95: ${(metrics.produtos_duration?.values?.['p(95)'] || 0).toFixed(2)}ms)\n`;
  summary += `   Comandas: ${(metrics.comandas_duration?.values?.avg || 0).toFixed(2)}ms (P95: ${(metrics.comandas_duration?.values?.['p(95)'] || 0).toFixed(2)}ms)\n`;
  summary += `   Pedidos: ${(metrics.pedidos_duration?.values?.avg || 0).toFixed(2)}ms (P95: ${(metrics.pedidos_duration?.values?.['p(95)'] || 0).toFixed(2)}ms)\n\n`;
  
  summary += '✅ THRESHOLDS:\n';
  for (const [name, threshold] of Object.entries(data.thresholds || {})) {
    const status = threshold.ok ? '✅' : '❌';
    summary += `   ${status} ${name}\n`;
  }
  
  summary += '\n=====================================================\n';
  
  return summary;
}
