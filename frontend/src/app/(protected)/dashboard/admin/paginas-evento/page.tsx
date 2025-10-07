// Caminho: frontend/src/app/(protected)/dashboard/admin/paginas-evento/page.tsx

import { getPaginasEvento } from "@/services/paginaEventoService";
import { PaginasEventoClientPage } from "./PaginasEventoClientPage";

export default async function PaginaEventoPage() {
  try {
    // CORREÇÃO: Adicionamos `|| []` como uma camada extra de segurança.
    // Se `getPaginasEvento` retornar `undefined` ou `null`, `paginas` se tornará `[]`.
    const paginas = (await getPaginasEvento()) || [];

    return <PaginasEventoClientPage paginasIniciais={paginas} />;
  } catch (error) {
    console.error("Falha ao buscar páginas de evento:", error);
    // Em caso de erro na busca, também passamos um array vazio para não quebrar.
    return <PaginasEventoClientPage paginasIniciais={[]} />;
  }
}