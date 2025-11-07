-- Teste 1: Distribuição de status
SELECT status, COUNT(*) as quantidade 
FROM itens_pedido 
GROUP BY status 
ORDER BY quantidade DESC;

-- Teste 2: Itens que passaram por QUASE_PRONTO
SELECT 
  ip.id, 
  p.nome as produto, 
  ip.status, 
  ip.iniciado_em, 
  ip.quase_pronto_em, 
  ip.pronto_em,
  ip.tempo_preparo_minutos
FROM itens_pedido ip 
LEFT JOIN produtos p ON ip."produtoId" = p.id 
WHERE ip.quase_pronto_em IS NOT NULL 
ORDER BY ip.quase_pronto_em DESC 
LIMIT 10;

-- Teste 3: Pedidos em preparo ou aguardando
SELECT 
  ip.id, 
  p.nome as produto, 
  a.nome as ambiente, 
  ip.status,
  ip.iniciado_em,
  ip.quase_pronto_em
FROM itens_pedido ip 
LEFT JOIN produtos p ON ip."produtoId" = p.id 
LEFT JOIN ambientes a ON p."ambienteId" = a.id 
WHERE ip.status IN ('FEITO', 'EM_PREPARO', 'QUASE_PRONTO', 'PRONTO') 
ORDER BY ip.id DESC
LIMIT 10;
