// Caminho: frontend/src/app/(protected)/dashboard/admin/paginas-evento/page.tsx

import { PaginasEventoClientPage } from "./PaginasEventoClientPage";
import { FeatureGate } from "@/hooks/usePlanFeatures";

// Este componente de servidor agora é o mais simples possível.
// Usamos string literal 'cardapio_digital' por segurança — evita ser undefined
// caso o enum Feature esteja em versão antiga sem CARDAPIO_DIGITAL.
export default function PaginaEventoPage() {
  return (
    <FeatureGate feature="cardapio_digital">
      <PaginasEventoClientPage />
    </FeatureGate>
  );
}