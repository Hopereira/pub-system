// importamos as ferramentas do TypeORM
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// @Entity diz que esta classe é uma tabela no banco de dados chamada 'empresas'
@Entity('empresas')
export class Empresa {
  // @PrimaryGeneratedColumn diz que 'id' é a chave primária, única para cada registro
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // @Column diz que 'cnpj' é uma coluna normal, do tipo texto
  @Column({ unique: true }) // unique: true garante que não haja dois CNPJs iguais
  cnpj: string;

  @Column()
  nomeFantasia: string;

  @Column()
  razaoSocial: string;

  @Column({ nullable: true }) // nullable: true significa que este campo é opcional
  telefone: string;

  @Column({ nullable: true })
  endereco: string;
}
