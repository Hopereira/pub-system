import { getPaginasEvento } from "@/services/paginaEventoService";
import { PaginasEventoClientPage } from "./PaginasEventoClientPage";
import { toast } from "sonner";

export default async function PaginaEventoPage() {
  try {
    // Buscamos os dados no lado do servidor
    const paginas = await getPaginasEvento();

    // Passamos os dados para o componente cliente renderizar
    return <PaginasEventoClientPage paginasIniciais={paginas} />;
  } catch (error) {
    console.error("Falha ao buscar páginas de evento:", error);
    // Idealmente, renderizaríamos um componente de erro aqui
    return (
      <div className="p-6 text-red-500">
        Erro ao carregar os dados das páginas de evento. Tente novamente mais tarde.
      </div>
    );
  }
}