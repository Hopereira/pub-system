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

  @Column({ type: 'timestamp' }) // Já armazena a data e o horário de início
  dataEvento: Date;

  @Column({ nullable: true })
  urlImagem: string;

  // ==================== NOVO CAMPO ====================
  @Column({ 
    type: 'decimal',    // Tipo ideal para dinheiro
    precision: 10,      // Total de dígitos
    scale: 2,           // Dígitos após a vírgula
    default: 0          // Padrão é gratuito
  })
  valor: number;
  // ====================================================

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;

  @UpdateDateColumn({ name: 'atualizado_em' })
  atualizadoEm: Date;
}