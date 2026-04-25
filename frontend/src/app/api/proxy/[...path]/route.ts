import { NextRequest, NextResponse } from 'next/server';

// HARDCODE: URL do backend em produção
const API_URL = 'http://134.65.248.235:3000';

/**
 * BFF Proxy genérico para todas as chamadas de API
 * /api/proxy/funcionarios → http://backend/funcionarios
 */
export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxy(request, params.path, 'GET');
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxy(request, params.path, 'POST');
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxy(request, params.path, 'PUT');
}

export async function PATCH(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxy(request, params.path, 'PATCH');
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxy(request, params.path, 'DELETE');
}

async function handleProxy(request: NextRequest, pathSegments: string[], method: string) {
  try {
    const path = pathSegments.join('/');
    const queryString = request.url.split('?')[1] || '';
    const targetUrl = `${API_URL}/${path}${queryString ? '?' + queryString : ''}`;

    // Forward headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      if (key !== 'host' && key !== 'cookie') {
        headers[key] = value;
      }
    });

    // Forward cookies
    const cookie = request.headers.get('cookie');
    if (cookie) {
      headers['cookie'] = cookie;
    }

    // Get body for non-GET requests
    let body: string | undefined;
    if (method !== 'GET') {
      const contentType = request.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const jsonBody = await request.json();
        body = JSON.stringify(jsonBody);
        headers['content-type'] = 'application/json';
      } else if (contentType?.includes('multipart/form-data')) {
        // For multipart, we need to forward the FormData
        const formData = await request.formData();
        // Convert FormData to buffer for fetch
        const entries = Array.from(formData.entries());
        const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
        const chunks: Buffer[] = [];
        
        for (const [key, value] of entries) {
          chunks.push(Buffer.from(`--${boundary}\r\n`));
          if (value instanceof Blob) {
            chunks.push(Buffer.from(`Content-Disposition: form-data; name="${key}"; filename="${(value as File).name || 'file'}"\r\n`));
            chunks.push(Buffer.from(`Content-Type: ${value.type || 'application/octet-stream'}\r\n\r\n`));
            chunks.push(Buffer.from(await value.arrayBuffer()));
            chunks.push(Buffer.from('\r\n'));
          } else {
            chunks.push(Buffer.from(`Content-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`));
          }
        }
        chunks.push(Buffer.from(`--${boundary}--\r\n`));
        
        body = Buffer.concat(chunks).toString();
        headers['content-type'] = `multipart/form-data; boundary=${boundary}`;
      }
    }

    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
    });

    // Create response
    const responseData = await response.text();
    const nextResponse = new NextResponse(responseData, {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') || 'application/json',
      },
    });

    // Forward Set-Cookie headers
    const setCookieHeaders = response.headers.getSetCookie?.() || [];
    for (const cookie of setCookieHeaders) {
      let rewritten = cookie.replace(/;\s*Domain=[^;]*/gi, '');
      rewritten = rewritten.replace(/;\s*Path=\/auth\b/gi, '; Path=/api/auth');
      nextResponse.headers.append('Set-Cookie', rewritten);
    }

    return nextResponse;
  } catch (error: any) {
    console.error(`[BFF Proxy ${method}] Error:`, error);
    return NextResponse.json(
      { statusCode: 500, message: 'Proxy error', error: error.message },
      { status: 500 }
    );
  }
}
