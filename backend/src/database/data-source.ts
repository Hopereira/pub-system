// Caminho: backend/src/database/data-source.ts
import 'dotenv/config'; // Garante que as variáveis de ambiente sejam carregadas primeiro
import { DataSource, DataSourceOptions } from 'typeorm';

// --- Importação de todas as entidades do projeto ---
// A CLI do TypeORM precisa de uma lista explícita para encontrar as entidades.
import { Ambiente } from '../modulos/ambiente/entities/ambiente.entity';
import { Cliente } from '../modulos/cliente/entities/cliente.entity';
import { Comanda } from '../modulos/comanda/entities/comanda.entity';
import { Empresa } from '../modulos/empresa/entities/empresa.entity';
import { Funcionario } from '../modulos/funcionario/entities/funcionario.entity';
import { Mesa } from '../modulos/mesa/entities/mesa.entity';
import { ItemPedido } from '../modulos/pedido/entities/item-pedido.entity';
import { Pedido } from '../modulos/pedido/entities/pedido.entity';
import { Produto } from '../modulos/produto/entities/produto.entity';

// --- Verificação de Segurança (Blindagem) ---
// Este bloco verifica se as variáveis de ambiente essenciais foram carregadas.
// Se alguma estiver em falta, o processo falhará com uma mensagem de erro clara.
const requiredEnv = [
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_DATABASE',
];
for (const v of requiredEnv) {
  if (!process.env[v]) {
    throw new Error(
      `Erro Crítico: A variável de ambiente ${v} não está definida. Verifique o seu ficheiro .env.`,
    );
  }
}
// --- Fim da Verificação ---

// Configuração da conexão com o banco de dados, lendo as variáveis de ambiente.
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
  ],
  migrations: [__dirname + '/migrations/*{.ts,.js}'], // Localização dos arquivos de migração
  synchronize: false, // synchronize: true NUNCA deve ser usado em produção.
};

// Criação e exportação da instância do DataSource para a CLI do TypeORM usar.
const dataSource = new DataSource(dataSourceOptions);
export default dataSource;