# Relatório Técnico – 07/01/2026

## Contexto Geral
- Usuários continuavam relatando mistura de cardápios (Casarão x Pub Demo) nas rotas públicas. Investigação mostrou que o header `X-Tenant-ID` traz o slug (ex.: `casarao-pub-423`), mas vários serviços e repositórios aguardavam UUID.
- Fluxos públicos (cardápio, criação de comanda, seleção de mesa/ponto de entrega, atualização de local e criação de pedido) estavam sendo barrados pelo `TenantGuard` ou por repositórios tenant-aware.

## Principais Correções Backend
1. **Resolução de Slugs**
   - `TenantResolverService.resolveBySlug()` agora tenta correspondência exata e, em seguida, remove sufixos numéricos (`casarao-pub-423` → `casarao-pub`).
   - Logs adicionais mostram quando o slug é resolvido ou quando não é possível identificar o tenant.

2. **Serviços Públicos com UUID**
   - `ProdutoService`, `MesaService` e `PontoEntregaService` passaram a injetar `TenantResolverService` e a validar o header `X-Tenant-ID`; se for slug, convertem para UUID antes de filtrar consultas.
   - Rotas públicas `/mesas/publicas/livres`, `/pontos-entrega/publicos/ativos` e `/produtos/publicos/cardapio` agora dependem de métodos `findPublic/findAtivosPublic` usando `rawRepository` para evitar guards de tenant.

3. **Controllers com Bypass de Guard/Rate Limit**
   - Adicionados `@SkipTenantGuard()` e `@SkipRateLimit()` às rotas públicas de `ComandaController` (POST, GET :id/public, PATCH :id/local), `MesaController`, `PontoEntregaController` e `PedidoController` (POST /pedidos/cliente).

4. **Novos Métodos Públicos nos Services**
   - `ComandaService.findOnePublic()` e `PedidoService.findOnePublic()` usam `rawRepository` para carregar registros completos sem exigir tenant corrente.
   - `PedidoService.create()` passou a usar `rawRepository` para buscar comanda/produtos quando a requisição vem de rota pública, evitando o erro "Tenant não identificado".

5. **Fluxos Complementares**
   - `updateLocal`, `findMesasLivres`, `findAllAtivos` e invalidação de cache foram ajustados para funcionar tanto com UUID quanto com slug resolvido.

## Ajustes Frontend
- A página pública do cardápio (`app/(cliente)/cardapio/[comandaId]/page.tsx`) agora busca apenas a comanda no server component e delega a carga de produtos ao client component (`CardapioClientPage`). Dessa forma o `publicApi` consegue detectar o slug via `window.location.hostname` e enviar `X-Tenant-ID` corretamente.
- Mantidos os logs no console para rastrear cada requisição (clientes/by-cpf, clientes, comandas, mesas, pontos de entrega, pedidos e sockets) e facilitar futuras auditorias.

## Pendências e Próximos Passos
1. **Deploy**: necessário recriar a imagem do backend na VM Oracle e copiar novamente o `gcs-credentials.json` após `docker run`, conforme fluxo documentado.
2. **Teste Focado**: reexecutar o fluxo público completo (criar cliente → abrir comanda → definir local → enviar pedido). Falta validar especificamente o POST `/pedidos/cliente` depois da adoção de `findOnePublic`.
3. **Monitoramento**: acompanhar os logs do `TenantResolverService` para confirmar que todos os subdomínios em produção possuem slug compatível na base.

> Após validação em produção, atualizar novamente este documento e o `00-RESUMO-ATUALIZACOES-DEV-TEST.md` com o status dos testes.
