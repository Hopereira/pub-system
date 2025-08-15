// Lembre-se de importar o Ambiente e os novos decoradores
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Ambiente } from '../../ambiente/entities/ambiente.entity';

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

  @ManyToOne(() => Ambiente)
  @JoinColumn({ name: 'ambienteId' }) // Especifica o nome da coluna no banco
  ambiente: Ambiente;
}