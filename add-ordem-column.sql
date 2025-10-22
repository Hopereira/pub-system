-- Adicionar coluna ordem se não existir
ALTER TABLE comanda_agregados 
ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 1;
