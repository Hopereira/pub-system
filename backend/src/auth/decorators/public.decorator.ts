import { SetMetadata, applyDecorators } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const REQUIRES_TENANT_KEY = 'requiresTenant';

/**
 * @Public - Marca uma rota como pública (não requer autenticação JWT)
 * 
 * Use para rotas que podem ser acessadas sem login:
 * - Landing pages
 * - Cadastro de clientes
 * - Consulta de cardápio público
 * 
 * @example
 * ```typescript
 * @Public()
 * @Get('cardapio')
 * getCardapioPublico() { ... }
 * ```
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * @PublicWithTenant - Rota pública que REQUER identificação do tenant
 * 
 * Use para rotas públicas que precisam saber qual bar está sendo acessado:
 * - Cardápio de um bar específico
 * - Página de eventos de um bar
 * - Criação de comanda em um bar
 * 
 * O tenant é resolvido via:
 * 1. Header `X-Tenant-ID` (UUID ou slug)
 * 2. Query param `tenant` ou `bar`
 * 3. Subdomínio (bar-do-ze.pubsystem.com.br)
 * 
 * Se o tenant não puder ser resolvido, retorna 400 Bad Request.
 * 
 * @example
 * ```typescript
 * @PublicWithTenant()
 * @Get('cardapio/:barSlug')
 * getCardapio(@Param('barSlug') slug: string) { ... }
 * ```
 * 
 * @see TenantInterceptor para lógica de resolução de tenant
 */
export const PublicWithTenant = () =>
  applyDecorators(
    SetMetadata(IS_PUBLIC_KEY, true),
    SetMetadata(REQUIRES_TENANT_KEY, true),
  );
