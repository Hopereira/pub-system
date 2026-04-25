import { NextRequest, NextResponse } from 'next/server';

// HARDCODE: URL do backend em produção
const API_URL = 'https://api.pubsystem.com.br';

/**
 * BFF Proxy for POST /auth/refresh
 * 
 * Bypasses CORS/Cloudflare issues by proxying the refresh request server-side.
 * Sends httpOnly cookies (refresh_token) to backend and forwards new tokens.
 */
export async function POST(request: NextRequest) {
  try {
    // Get cookies from the browser request
    const cookieHeader = request.headers.get('cookie') || '';

    console.log('[BFF Refresh] Calling backend:', `${API_URL}/auth/refresh`);
    
    const backendResponse = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
      },
      body: JSON.stringify({}),
    });

    console.log('[BFF Refresh] Backend status:', backendResponse.status);
    
    const data = await backendResponse.json();

    // Create response with the same status
    const response = NextResponse.json(data, { status: backendResponse.status });

    // Forward Set-Cookie headers from backend to browser
    const setCookieHeaders = backendResponse.headers.getSetCookie?.() || [];
    for (const cookie of setCookieHeaders) {
      // Remove Domain= directive so cookie is set for current origin
      let rewritten = cookie.replace(/;\s*Domain=[^;]*/gi, '');
      // Rewrite Path=/auth to Path=/api/auth for refresh_token
      rewritten = rewritten.replace(/;\s*Path=\/auth\b/gi, '; Path=/api/auth');
      response.headers.append('Set-Cookie', rewritten);
    }

    // SECURITY: Ensure access_token is set as httpOnly cookie for middleware
    if (data.access_token && !setCookieHeaders.some(c => c.includes('access_token'))) {
      response.headers.append('Set-Cookie', `access_token=${data.access_token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`);
    }

    return response;
  } catch (error: any) {
    console.error('[BFF /api/auth/refresh] Proxy error:', error);
    return NextResponse.json(
      { statusCode: 500, message: 'Erro interno ao processar refresh.', error: error.message },
      { status: 500 },
    );
  }
}
