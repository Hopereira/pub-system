import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL_SERVER || 'https://api.pubsystem.com.br';

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

    const backendResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await backendResponse.json();

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

    return response;
  } catch (error) {
    console.error('[BFF /api/auth/login] Proxy error:', error);
    return NextResponse.json(
      { statusCode: 500, message: 'Erro interno ao processar login.' },
      { status: 500 },
    );
  }
}
