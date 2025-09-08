// Caminho: backend/src/modulos/ambiente/entities/ambiente.entity.ts

import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Mesa } from '../../mesa/entities/mesa.entity';
import { Produto } from '../../produto/entities/produto.entity'; // 1. IMPORTAMOS A ENTIDADE PRODUTO

@Entity('ambientes')
export class Ambiente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @OneToMany(() => Mesa, (mesa) => mesa.ambiente)
  mesas: Mesa[];

  // --- 2. ADICIONAMOS A RELAÇÃO QUE FALTAVA ---
  @OneToMany(() => Produto, (produto) => produto.ambiente)
  produtos: Produto[]; // Um ambiente pode ter um array de produtos
  // --- FIM DA ADIÇÃO ---
}