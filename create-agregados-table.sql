-- Criar tabela comandas_agregados se não existir
CREATE TABLE IF NOT EXISTS comandas_agregados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comanda_id UUID NOT NULL,
  nome VARCHAR(100) NOT NULL,
  cpf VARCHAR(11),
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT FK_agregado_comanda FOREIGN KEY (comanda_id) 
    REFERENCES comandas(id) ON DELETE CASCADE
);
