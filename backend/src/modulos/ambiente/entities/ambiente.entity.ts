// Caminho: backend/src/modulos/ambiente/entities/ambiente.entity.ts

import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Mesa } from '../../mesa/entities/mesa.entity';
import { Produto } from '../../produto/entities/produto.entity';

// --- 1. DEFINIÇÃO DO ENUM ---
// Define os tipos possíveis para um ambiente. Isso garante consistência no banco de dados.
export enum TipoAmbiente {
  PREPARO = 'PREPARO', // Ex: Cozinha, Bar (onde os itens são feitos)
  ATENDIMENTO = 'ATENDIMENTO', // Ex: Salão, Varanda (onde os clientes ficam e as mesas estão)
}
// --- FIM DA DEFINIÇÃO ---

@Entity('ambientes')
@Index('idx_ambiente_nome_tenant', ['nome', 'tenantId'], { unique: true })
export class Ambiente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  // --- 2. ADIÇÃO DOS NOVOS CAMPOS ---
  @Column({
    type: 'enum',
    enum: TipoAmbiente,
    default: TipoAmbiente.ATENDIMENTO, // Por padrão, um novo ambiente é de atendimento
  })
  tipo: TipoAmbiente;

  @Column({
    type: 'boolean',
    default: false, // Por padrão, um ambiente não é um ponto de retirada
    name: 'is_ponto_de_retirada', // Nome da coluna no banco de dados (padrão snake_case)
  })
  isPontoDeRetirada: boolean;

  // --- FIM DA ADIÇÃO ---

  // ✅ Multi-tenancy: tenant_id para isolamento de dados
  @Index('idx_ambiente_tenant_id')
  @Column({ type: 'uuid', nullable: true, name: 'tenant_id' })
  tenantId: string;

  @OneToMany(() => Mesa, (mesa) => mesa.ambiente)
  mesas: Mesa[];

  @OneToMany(() => Produto, (produto) => produto.ambiente)
  produtos: Produto[];
}
