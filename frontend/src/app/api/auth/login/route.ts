import { NextRequest, NextResponse } from 'next/server';

// HARDCODE: URL do backend em produção
// Usando IP direto do Oracle VM para evitar problemas de DNS/Cloudflare no Vercel
const API_URL = 'http://134.65.248.235:3000';

/**
 * BFF Proxy for POST /auth/login
 * 
 * Bypasses CORS/Cloudflare issues by proxying the login request server-side.
 * The browser calls this same-origin route, and the Vercel server calls the backend directly.
 * Set-Cookie headers from the backend are forwarded to the browser.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward relevant headers from the original request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const tenantSlug = request.headers.get('x-tenant-slug');
    if (tenantSlug) {
      headers['x-tenant-slug'] = tenantSlug;
    }

    const tenantId = request.headers.get('x-tenant-id');
    if (tenantId) {
      headers['x-tenant-id'] = tenantId;
    }

    // Forward client IP
    const forwardedFor = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    if (forwardedFor) {
      headers['x-forwarded-for'] = forwardedFor;
    }

    // Forward user-agent
    const userAgent = request.headers.get('user-agent');
    if (userAgent) {
      headers['user-agent'] = userAgent;
    }

    console.log('[BFF] Calling backend:', `${API_URL}/auth/login`);
    
    const backendResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    console.log('[BFF] Backend response status:', backendResponse.status);
    
    const data = await backendResponse.json();
    console.log('[BFF] Backend response data:', { status: backendResponse.status, hasAccessToken: !!data.access_token });

    // Create response with the same status
    const response = NextResponse.json(data, { status: backendResponse.status });

    // Forward Set-Cookie headers from backend to browser.
    // Rewrite: remove Domain (let browser use current origin) and
    // adjust Path for refresh_token to match our BFF routes.
    const setCookieHeaders = backendResponse.headers.getSetCookie?.() || [];
    for (const cookie of setCookieHeaders) {
      // Remove Domain= directive so cookie is set for current origin
      let rewritten = cookie.replace(/;\s*Domain=[^;]*/gi, '');
      // Rewrite Path=/auth to Path=/api/auth for refresh_token
      rewritten = rewritten.replace(/;\s*Path=\/auth\b/gi, '; Path=/api/auth');
      response.headers.append('Set-Cookie', rewritten);
    }

    // SECURITY: Ensure access_token is set as httpOnly cookie for middleware
    // This is needed for the Edge middleware to validate the session
    if (data.access_token && !setCookieHeaders.some(c => c.includes('access_token'))) {
      // Backend didn't set the cookie, set it manually
      response.headers.append('Set-Cookie', `access_token=${data.access_token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`);
    }

    return response;
  } catch (error: any) {
    console.error('[BFF /api/auth/login] Proxy error:', error);
    return NextResponse.json(
      { statusCode: 500, message: 'Erro interno ao processar login.', error: error.message },
      { status: 500 },
    );
  }
}
