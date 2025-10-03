import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('eventos')
export class Evento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({ type: 'timestamp' })
  dataEvento: Date;

  @Column({ nullable: true })
  urlImagem: string;

  // Adicionei esta coluna para manter o padrão, é uma boa prática
  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;
}