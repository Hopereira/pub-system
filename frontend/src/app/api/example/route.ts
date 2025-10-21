// Caminho: frontend/src/app/api/example/route.ts
/**
 * TEMPLATE DE API ROUTE COM LOGS
 * 
 * Este é um exemplo de como implementar logs em API Routes do Next.js
 * Use como referência para criar suas próprias rotas
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// GET /api/example
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');

  try {
    logger.log('🔍 Processando requisição GET', {
      module: 'API Route',
      data: { path: '/api/example', query },
    });

    // Sua lógica aqui
    const result = {
      message: 'Exemplo de resposta',
      query,
      timestamp: new Date().toISOString(),
    };

    const duration = Date.now() - startTime;
    logger.log(`✅ Requisição concluída (${duration}ms)`, {
      module: 'API Route',
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('❌ Erro ao processar requisição', {
      module: 'API Route',
      error: error as Error,
      data: { duration },
    });

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/example
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();

    logger.log('📝 Processando requisição POST', {
      module: 'API Route',
      data: { path: '/api/example', bodyKeys: Object.keys(body) },
    });

    // Validação de dados
    if (!body.name || !body.email) {
      logger.warn('⚠️ Dados inválidos recebidos', {
        module: 'API Route',
        data: { receivedKeys: Object.keys(body) },
      });

      return NextResponse.json(
        { error: 'Nome e email são obrigatórios' },
        { status: 400 }
      );
    }

    // Sua lógica aqui
    const result = {
      success: true,
      data: body,
    };

    const duration = Date.now() - startTime;
    logger.log(`✅ Dados processados com sucesso (${duration}ms)`, {
      module: 'API Route',
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    const duration = Date.now() - startTime;

    // Tratamento de erro de JSON parsing
    if (error instanceof SyntaxError) {
      logger.error('❌ JSON inválido recebido', {
        module: 'API Route',
        error: error as Error,
      });

      return NextResponse.json(
        { error: 'JSON inválido' },
        { status: 400 }
      );
    }

    logger.error('❌ Erro ao processar requisição POST', {
      module: 'API Route',
      error: error as Error,
      data: { duration },
    });

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
