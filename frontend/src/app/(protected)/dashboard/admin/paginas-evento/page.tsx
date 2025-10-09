// Caminho: frontend/src/app/(protected)/dashboard/admin/paginas-evento/page.tsx

import { PaginasEventoClientPage } from "./PaginasEventoClientPage";

// Este componente de servidor agora é o mais simples possível.
export default function PaginaEventoPage() {
  // A única responsabilidade dele é renderizar o componente de cliente.
  // Isso evita o uso de 'cookies()' aqui e previne o crash do servidor
  // que estava causando o loop de logout.
  return <PaginasEventoClientPage />;
}