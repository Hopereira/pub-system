// Caminho: backend/src/database/data-source.ts
import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

// --- Importação de todas as entidades do projeto ---
import { Ambiente } from '../modulos/ambiente/entities/ambiente.entity';
import { Cliente } from '../modulos/cliente/entities/cliente.entity';
import { Comanda } from '../modulos/comanda/entities/comanda.entity';
import { Empresa } from '../modulos/empresa/entities/empresa.entity';
import { Funcionario } from '../modulos/funcionario/entities/funcionario.entity';
import { Mesa } from '../modulos/mesa/entities/mesa.entity';
import { ItemPedido } from '../modulos/pedido/entities/item-pedido.entity';
import { Pedido } from '../modulos/pedido/entities/pedido.entity';
import { Produto } from '../modulos/produto/entities/produto.entity';
import { PaginaEvento } from '../modulos/pagina-evento/entities/pagina-evento.entity'; // <-- 1. IMPORTAR A NOVA ENTIDADE

// ... (Verificação de Segurança - Blindagem) ...
const requiredEnv = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'];
for (const v of requiredEnv) {
  if (!process.env[v]) {
    throw new Error(`Erro Crítico: A variável de ambiente ${v} não está definida. Verifique o seu ficheiro .env.`);
  }
}

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [
    Ambiente,
    Cliente,
    Comanda,
    Empresa,
    Funcionario,
    Mesa,
    ItemPedido,
    Pedido,
    Produto,
    PaginaEvento, // <-- 2. ADICIONAR À LISTA
  ],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;