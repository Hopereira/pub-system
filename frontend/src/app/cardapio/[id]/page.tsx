// Caminho: frontend/src/app/cardapio/[id]/page.tsx

// Esta página irá receber o ID da comanda criada no passo anterior.
type CardapioPageProps = {
  params: {
    id: string; // ID da Comanda
  };
};

export default function CardapioPage({ params }: CardapioPageProps) {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold">Nosso Cardápio</h1>
      <p className="text-muted-foreground">
        Comanda ID: {params.id}. Escolha os seus itens abaixo.
      </p>
      <div className="mt-4 border rounded-md p-4">
        <p>A lista de produtos e o carrinho de compras serão implementados aqui.</p>
        <p>(Esta página corresponde à Issue #116 que você encontrou antes)</p>
      </div>
    </div>
  );
}