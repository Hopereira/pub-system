import { NextResponse } from 'next/server';

const API_URL = 'http://134.65.248.235:3000';

/**
 * Health check endpoint para debugar conectividade Vercel → Oracle VM
 */
export async function GET() {
  try {
    console.log('[Health] Testing connection to:', `${API_URL}/health`);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const backendResponse = await fetch(`${API_URL}/health`, {
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    const data = await backendResponse.text();
    
    return NextResponse.json({
      status: 'ok',
      backendStatus: backendResponse.status,
      backendResponse: data,
      apiUrl: API_URL,
    });
  } catch (error: any) {
    console.error('[Health] Connection failed:', error);
    return NextResponse.json({
      status: 'error',
      error: error.message,
      apiUrl: API_URL,
    }, { status: 500 });
  }
}
