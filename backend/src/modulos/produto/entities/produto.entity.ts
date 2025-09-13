// Caminho: backend/src/modulos/produto/entities/produto.entity.ts

// --- CORREÇÃO AQUI: Voltamos a usar 'Ambiente' e o caminho original ---
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

  // --- CORREÇÃO AQUI: Voltamos a usar 'Ambiente' ---
  @ManyToOne(() => Ambiente, (ambiente) => ambiente.produtos) // Assumindo que a entidade Ambiente tem uma propriedade 'produtos'
  @JoinColumn({ name: 'ambienteId' })
  ambiente: Ambiente;
}