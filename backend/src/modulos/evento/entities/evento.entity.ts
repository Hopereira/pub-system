import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('eventos')
export class Evento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({ type: 'timestamp' }) // 'timestamp' é ideal para guardar data e hora
  dataEvento: Date;

  @Column({ nullable: true })
  urlImagem: string;
}