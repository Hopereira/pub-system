import AgendaEventosClientPage from "./AgendaEventosClientPage";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { FeatureGate, Feature } from "@/hooks/usePlanFeatures";

// Esta página renderiza a estrutura e passa a responsabilidade para o componente cliente.
export default function AgendaEventosPage() {
  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Agenda de Eventos</h1>
          <p className="text-muted-foreground">Crie e gira a programação do seu estabelecimento.</p>
        </div>
      </div>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Agenda de Eventos</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <FeatureGate feature={Feature.EVENTOS}>
        <AgendaEventosClientPage />
      </FeatureGate>
    </div>
  );
}