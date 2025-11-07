SELECT 
  p.nome as produto, 
  a.nome as ambiente, 
  ip.status 
FROM itens_pedido ip 
JOIN produtos p ON ip."produtoId" = p.id 
JOIN pedidos ped ON ip."pedidoId" = ped.id 
JOIN comandas c ON ped."comandaId" = c.id 
JOIN ambientes a ON p."ambienteId" = a.id 
WHERE c.id = 'ffeb85b5-0ac9-46f7-b6a3-7423bc960c36';
