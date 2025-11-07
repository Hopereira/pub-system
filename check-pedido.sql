SELECT 
  ip.id, 
  ip.status, 
  p.nome, 
  ip.quantidade,
  ip.iniciado_em,
  ip.pronto_em,
  ip.quase_pronto_em,
  ip.retirado_em,
  ip.entregue_em
FROM itens_pedido ip 
JOIN produtos p ON ip."produtoId" = p.id 
JOIN pedidos ped ON ip."pedidoId" = ped.id 
JOIN comandas c ON ped."comandaId" = c.id 
WHERE c.id = 'ffeb85b5-0ac9-46f7-b6a3-7423bc960c36' 
ORDER BY ip.iniciado_em DESC;
