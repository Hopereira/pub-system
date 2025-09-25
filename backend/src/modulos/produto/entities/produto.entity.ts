// Caminho: backend/src/modulos/produto/entities/produto.entity.ts

import { Ambiente } from '../../ambiente/entities/ambiente.entity';
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('produtos')
export class Produto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column({ nullable: true })
  descricao: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  preco: number;

  @Column()
  categoria: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  urlImagem: string;

  // --- ADIÇÃO CRUCIAL PARA O SOFT DELETE ---
  // Esta coluna vai controlar se o produto está visível ou "apagado"
  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @ManyToOne(() => Ambiente, (ambiente) => ambiente.produtos)
  @JoinColumn({ name: 'ambienteId' }) // Seu @JoinColumn está correto
  ambiente: Ambiente;
}