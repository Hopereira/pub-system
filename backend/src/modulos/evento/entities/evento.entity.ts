import { 
  Column, 
  CreateDateColumn, 
  Entity, 
  PrimaryGeneratedColumn, 
  UpdateDateColumn 
} from 'typeorm';

@Entity('eventos')
export class Evento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  // ✅ AJUSTE AQUI: Mudado para 'timestamptz' para incluir o fuso horário
  @Column({ type: 'timestamptz' }) 
  dataEvento: Date;

  // ✅ AJUSTE AQUI: Especificamos o tipo e o comprimento para otimização
  @Column({ type: 'varchar', length: 512, nullable: true })
  urlImagem: string;

  @Column({ 
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0
  })
  valor: number;

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}