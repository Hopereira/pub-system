// Caminho: frontend/src/app/(protected)/dashboard/admin/paginas-evento/page.tsx

import { PaginasEventoClientPage } from "./PaginasEventoClientPage";
import { FeatureGate, Feature } from "@/hooks/usePlanFeatures";

// Este componente de servidor agora é o mais simples possível.
export default function PaginaEventoPage() {
  return (
    <FeatureGate feature={Feature.EVENTOS}>
      <PaginasEventoClientPage />
    </FeatureGate>
  );
}