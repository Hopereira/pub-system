// Caminho: frontend/src/lib/server-logger-example.ts
/**
 * TEMPLATE DE SERVER COMPONENT COM LOGS
 * 
 * Exemplo de como implementar logs em Server Components do Next.js
 * Server Components rodam apenas no servidor (SSR)
 */

import { logger } from '@/lib/logger';

interface DataFetchResult {
  data: any;
  error?: string;
}

/**
 * Exemplo de função que busca dados no servidor
 * Use em Server Components (async components sem 'use client')
 */
export async function fetchDataWithLogs(url: string): Promise<DataFetchResult> {
  const startTime = Date.now();

  try {
    logger.log(`🔍 [SSR] Buscando dados de: ${url}`, {
      module: 'ServerComponent',
    });

    const response = await fetch(url, {
      cache: 'no-store', // Força sempre buscar dados frescos
    });

    if (!response.ok) {
      const duration = Date.now() - startTime;
      logger.error(`❌ [SSR] Falha ao buscar dados (${duration}ms)`, {
        module: 'ServerComponent',
        data: { url, status: response.status },
      });

      return {
        data: null,
        error: `Erro ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    const duration = Date.now() - startTime;

    logger.log(`✅ [SSR] Dados carregados com sucesso (${duration}ms)`, {
      module: 'ServerComponent',
      data: { url, itemCount: Array.isArray(data) ? data.length : 'N/A' },
    });

    return { data };

  } catch (error) {
    const duration = Date.now() - startTime;

    // Tratamento de erro de rede
    if (error instanceof TypeError && error.message.includes('fetch')) {
      logger.error(`🔥 [SSR] Erro de rede ao buscar dados (${duration}ms)`, {
        module: 'ServerComponent',
        error: error as Error,
        data: { url },
      });

      return {
        data: null,
        error: 'Erro de conexão com o servidor',
      };
    }

    // Erro genérico
    logger.error(`❌ [SSR] Erro desconhecido (${duration}ms)`, {
      module: 'ServerComponent',
      error: error as Error,
      data: { url },
    });

    return {
      data: null,
      error: 'Erro ao processar dados',
    };
  }
}

/**
 * Exemplo de Server Component usando logs
 */
/*
// Uso em um arquivo page.tsx:

export default async function ExamplePage() {
  const apiUrl = process.env.API_URL_SERVER || 'http://localhost:3000';
  
  logger.log('🎬 [SSR] Iniciando renderização da página', {
    module: 'ServerComponent',
    data: { page: 'ExamplePage' },
  });

  const { data, error } = await fetchDataWithLogs(`${apiUrl}/api/produtos`);

  if (error) {
    logger.warn('⚠️ [SSR] Página renderizada com erro', {
      module: 'ServerComponent',
      data: { error },
    });

    return <div>Erro: {error}</div>;
  }

  logger.log('✅ [SSR] Página renderizada com sucesso', {
    module: 'ServerComponent',
  });

  return (
    <div>
      <h1>Produtos</h1>
      {data.map((item: any) => (
        <div key={item.id}>{item.nome}</div>
      ))}
    </div>
  );
}
*/
