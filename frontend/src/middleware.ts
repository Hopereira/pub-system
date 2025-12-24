import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  
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

  // Verificar se é um host excluído
  const isExcluded = excludedHosts.some(h => 
    originalHost === h || originalHost.startsWith(`${h}:`)
  );

  if (isExcluded) {
    return NextResponse.next();
  }

  // Extrair subdomínio (ex: casarao-pub-423.pubsystem.com.br -> casarao-pub-423)
  const subdomain = originalHost
    .replace('.pubsystem.com.br', '')
    .replace('.pub-system.vercel.app', '');

  // Se tiver subdomínio válido, reescrever para /t/[slug]
  if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
    // Reescrever internamente para a rota /t/[slug]
    const newPath = `/t/${subdomain}${url.pathname === '/' ? '' : url.pathname}`;
    
    console.log(`[Middleware] Rewriting ${originalHost}${url.pathname} -> ${newPath}`);
    
    return NextResponse.rewrite(new URL(newPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};
