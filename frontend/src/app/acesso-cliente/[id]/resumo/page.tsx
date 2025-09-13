// Caminho: frontend/src/app/acesso-cliente/[id]/resumo/page.tsx

import ResumoPedidoClientPage from "./ResumoPedidoClientPage";

// Este é um Server Component simples que renderiza nosso componente de cliente.
// Isso segue as melhores práticas do Next.js App Router.
export default function ResumoPedidoPage() {
    return <ResumoPedidoClientPage />;
}