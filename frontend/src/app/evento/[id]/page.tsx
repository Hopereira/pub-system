// Caminho: frontend/src/app/(protected)/dashboard/admin/paginas-evento/page.tsx

// ✅ MUDANÇA: Removemos toda a lógica de busca de dados daqui.
// Este componente agora é simples e não faz chamadas de API.
import { PaginasEventoClientPage } from "./PaginasEventoClientPage";

export default function PaginaEventoPage() {
  // A única responsabilidade deste componente de servidor é renderizar o
  // componente de cliente. O componente de cliente cuidará de buscar seus próprios dados.
  // Isso evita o uso de 'cookies()' aqui e previne o crash do servidor.
  return <PaginasEventoClientPage />;
}