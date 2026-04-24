import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * SECURITY: Valida o access_token JWT no Edge Runtime.
 * Retorna o payload se válido, null caso contrário.
 */
async function verifyAccessToken(token: string): Promise<any | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // SECURITY: Proteção de rotas autenticadas via JWT real (não mais authSession=1)
  if (url.pathname.startsWith('/dashboard')) {
    const accessToken = request.cookies.get('access_token')?.value;
    // MIGRATION FALLBACK: Aceitar authSession legado enquanto frontend migra
    const legacySession = request.cookies.get('authSession')?.value;

    if (accessToken) {
      // Validar JWT real no Edge
      const payload = await verifyAccessToken(accessToken);
      if (!payload) {
        // Token expirado ou inválido — redirecionar para login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('access_token');
        return response;
      }
      // Token válido — continuar
    } else if (legacySession) {
      // MIGRATION: Aceitar cookie legado temporariamente
      // O AuthContext vai fazer refresh e migrar para o novo cookie
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Tentar pegar o host original do header X-Original-Host (enviado pelo Cloudflare Worker)
  // ou usar o host padrão
  const originalHost = request.headers.get('x-original-host') || 
                       request.headers.get('x-forwarded-host') || 
                       request.headers.get('host') || '';
  
  // Domínios que devem ser ignorados (não são subdomínios de tenant)
  const excludedHosts = [
    'localhost',
    '127.0.0.1',
    'pubsystem.com.br',
    'www.pubsystem.com.br',
    'pub-system.vercel.app',
  ];
  
  // Verificar se é um domínio de preview do Vercel (pub-system-*.vercel.app)
  const isVercelPreview = originalHost.includes('.vercel.app');

  // Verificar se é um host excluído ou preview do Vercel
  const isExcluded = excludedHosts.some(h => 
    originalHost === h || originalHost.startsWith(`${h}:`)
  );

  if (isExcluded || isVercelPreview) {
    return NextResponse.next();
  }

  // Extrair subdomínio (ex: casarao-pub-423.pubsystem.com.br -> casarao-pub-423)
  const subdomain = originalHost
    .replace('.pubsystem.com.br', '')
    .replace('.pub-system.vercel.app', '');

  // Se tiver subdomínio válido, reescrever para /t/[slug]
  if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
    // Rotas que NÃO devem ser reescritas (já funcionam diretamente)
    const directRoutes = ['/dashboard', '/api', '/_next', '/favicon.ico'];
    const shouldNotRewrite = directRoutes.some(route => url.pathname.startsWith(route));
    
    if (shouldNotRewrite) {
      // Apenas salvar o slug no header para o contexto saber qual tenant é
      const response = NextResponse.next();
      response.headers.set('x-tenant-slug', subdomain);
      return response;
    }
    
    // Se o path já começa com /t/, não reescrever novamente (evita duplicação)
    if (url.pathname.startsWith('/t/')) {
      return NextResponse.next();
    }
    
    // Reescrever internamente para a rota /t/[slug] apenas para rotas públicas do tenant
    // (login, página inicial, etc)
    const newPath = `/t/${subdomain}${url.pathname === '/' ? '' : url.pathname}`;
    
    console.log(`[Middleware] Rewriting ${originalHost}${url.pathname} -> ${newPath}`);
    
    return NextResponse.rewrite(new URL(newPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match only specific paths that need tenant rewriting:
     * - Root path (/)
     * - /t/[slug] paths
     * - /login paths
     * Exclude all static assets and API routes
     */
    '/',
    '/t/:path*',
    '/login',
    '/dashboard/:path*',
  ],
};
