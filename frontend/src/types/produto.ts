export interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  categoria: string;
  urlImagem: string | null;
  ativo: boolean;
  ambiente: {
    id: string;
    nome: string;
  };
}